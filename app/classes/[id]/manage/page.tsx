import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import ClassLessons from "@/components/ClassLessons";

// Вкладка «Уроки класса»: добавить урок из библиотеки или своих, убрать урок
export default async function ClassManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) notFound();

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id },
    include: { lessons: { orderBy: { createdAt: "asc" }, include: { _count: { select: { blocks: true } } } } },
  });
  if (!classroom) notFound();

  const [myLessons, readyTopics] = await Promise.all([
    prisma.lesson.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { blocks: true } } },
    }),
    prisma.topic.findMany({
      where: { modules: { some: {} } },
      orderBy: [{ section: { grade: { number: "asc" } } }, { order: "asc" }],
      include: { section: { include: { grade: true } } },
    }),
  ]);

  return (
    <ClassLessons
      classId={classroom.id}
      assigned={classroom.lessons.map((l) => ({ id: l.id, title: l.title, blocks: l._count.blocks }))}
      myOther={myLessons
        .filter((l) => !classroom.lessons.some((x) => x.id === l.id))
        .map((l) => ({ id: l.id, title: l.title, blocks: l._count.blocks }))}
      topics={readyTopics.map((t) => ({ id: t.id, title: t.title, grade: t.section.grade.number, paragraph: t.paragraph, section: t.section.title }))}
    />
  );
}
