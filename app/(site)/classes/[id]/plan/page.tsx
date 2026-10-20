import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { isoDate, quarterBounds, quarterOf, schoolYearOf } from "@/lib/terms";
import PlanEditor from "@/components/class/PlanEditor";

// Вкладка «План четвертей»: какой раздел учебника класс проходит в какую четверть
export default async function ClassPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) notFound();

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      terms: { orderBy: [{ quarter: "asc" }, { startDate: "asc" }] },
      lessons: { include: { blocks: { include: { module: { include: { topic: { include: { section: { include: { grade: true } } } } } } } } } },
    },
  });
  if (!classroom) notFound();

  const grades = await prisma.grade.findMany({
    orderBy: { number: "asc" },
    include: { sections: { orderBy: { order: "asc" }, select: { id: true, title: true } } },
  });

  // Класс по умолчанию — тот, к которому относится больше всего модулей уроков класса (или 7)
  const count = new Map<number, number>();
  for (const l of classroom.lessons) for (const b of l.blocks) {
    const n = b.module.topic.section.grade.number;
    count.set(n, (count.get(n) ?? 0) + 1);
  }
  const planGrade = classroom.terms.length
    ? grades.find((g) => g.sections.some((s) => s.id === classroom.terms[0].sectionId))?.number
    : undefined;
  const defaultGrade = planGrade ?? [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 7;

  const today = new Date();
  const year = schoolYearOf(today);
  const bounds = quarterBounds(year);

  return (
    <PlanEditor
      classId={classroom.id}
      year={year}
      currentQuarter={quarterOf(today)}
      quarters={[1, 2, 3, 4].map((n) => ({ n, start: isoDate(bounds[n].start), end: isoDate(bounds[n].end) }))}
      grades={grades.map((g) => ({ number: g.number, sections: g.sections }))}
      defaultGrade={defaultGrade}
      initial={classroom.terms.map((t) => ({ quarter: t.quarter, sectionId: t.sectionId, start: isoDate(t.startDate), end: isoDate(t.endDate) }))}
    />
  );
}
