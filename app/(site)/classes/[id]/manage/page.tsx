import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { lessonGroup } from "@/lib/classData";
import ClassLessons from "@/components/ClassLessons";

const withTopics = {
  blocks: { include: { module: { include: { topic: { include: { section: { include: { grade: true } } } } } } } },
} as const;

// Вкладка «Уроки класса»: уроки по разделам; добавить из библиотеки или своих, убрать урок
export default async function ClassManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) notFound();

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, deadlines: { select: { lessonId: true, dueAt: true } } },
  });
  if (!classroom) notFound();

  const [myLessons, readyTopics] = await Promise.all([
    prisma.lesson.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "asc" },
      include: { ...withTopics, classrooms: { where: { id }, select: { id: true } } },
    }),
    prisma.topic.findMany({
      where: { modules: { some: {} } },
      orderBy: [{ section: { grade: { number: "asc" } } }, { section: { order: "asc" } }, { order: "asc" }],
      include: { section: { include: { grade: true } } },
    }),
  ]);

  // Уроки — по разделам учебника, внутри раздела в порядке создания
  const lessons = myLessons
    .map((l, i) => ({ l, g: lessonGroup(l.blocks), i }))
    .sort((a, b) => a.g.order - b.g.order || a.i - b.i)
    .map(({ l, g }) => ({
      id: l.id,
      title: l.title,
      blocks: l.blocks.length,
      group: g.label,
      topic: g.topic,
      assigned: l.classrooms.length > 0,
      dueAt: classroom.deadlines.find((d) => d.lessonId === l.id)?.dueAt.toISOString() ?? null,
    }));

  return (
    <ClassLessons
      classId={classroom.id}
      assigned={lessons.filter((l) => l.assigned)}
      myOther={lessons.filter((l) => !l.assigned)}
      topics={readyTopics.map((t) => ({ id: t.id, title: t.title, grade: t.section.grade.number, paragraph: t.paragraph, section: t.section.title }))}
    />
  );
}
