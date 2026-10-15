import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentContext, resolveStudentForLesson } from "@/lib/student";
import StudentLesson from "@/components/StudentLesson";

export default async function StudentLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await resolveStudentForLesson(id);
  if (!student) {
    const ctx = await getStudentContext();
    if (!ctx.mode) redirect("/student");
    notFound();
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { blocks: { orderBy: { position: "asc" }, include: { module: true } } },
  });
  if (!lesson) notFound();

  const done = await prisma.result.findMany({
    where: { studentId: student.id, lessonId: lesson.id },
    select: { moduleId: true },
    distinct: ["moduleId"],
  });

  return (
    <StudentLesson
      lessonId={lesson.id}
      title={lesson.title}
      studentLabel={`${student.name} · ${student.classroom.name}`}
      initialDone={done.map((d) => d.moduleId)}
      blocks={lesson.blocks.map((b) => ({
        id: b.id,
        moduleId: b.moduleId,
        type: b.module.type,
        title: b.module.title,
        content: b.module.content,
        buildUrl: b.module.buildUrl,
        config: b.config,
      }))}
    />
  );
}
