import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentContext, resolveStudentForLesson } from "@/lib/student";
import StudentLesson from "@/components/StudentLesson";
import type { PracticeAttempt } from "@/components/PracticeLog";
import { applyOverride } from "@/lib/modules/overrides";

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

  const [results, feedback] = await Promise.all([
    prisma.result.findMany({ where: { studentId: student.id, lessonId: lesson.id }, orderBy: { createdAt: "desc" } }),
    prisma.lessonFeedback.findUnique({ where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } } }),
  ]);

  // Задачи практики ученика по модулям — показываются под практикой и передаются в симуляцию как прогресс
  const practice: Record<string, PracticeAttempt[]> = {};
  for (const r of results.filter((x) => x.kind === "practice")) {
    const d = (r.detail ?? {}) as Record<string, unknown>;
    (practice[r.moduleId] ??= []).push({
      id: r.id,
      correct: !!r.correct,
      statement: String(d.statement ?? ""),
      answer: Number(d.answer),
      expected: Number(d.expected),
      unit: String(d.unit ?? ""),
      difficulty: Number(d.difficulty ?? 1),
      solution: typeof d.solutionText === "string" ? d.solutionText : "",
      at: r.createdAt.toISOString(),
    });
  }

  return (
    <StudentLesson
      lessonId={lesson.id}
      title={lesson.title}
      studentLabel={`${student.name} · ${student.classroom.name}`}
      initialDone={[...new Set(results.map((r) => r.moduleId))]}
      initialPractice={practice}
      initialFeedback={feedback ? { rating: feedback.rating, liked: feedback.liked ?? "", disliked: feedback.disliked ?? "" } : null}
      blocks={lesson.blocks.map((b) => {
        const mine = practice[b.moduleId] ?? [];
        return {
          id: b.id,
          moduleId: b.moduleId,
          type: b.module.type,
          title: applyOverride(b.module, b.config).title,
          content: applyOverride(b.module, b.config).content,
          buildUrl: b.module.buildUrl,
          // Практике передаём прогресс ученика: симуляция может продолжить счёт «2 из 3», а не начинать с нуля
          config:
            b.module.type === "practice"
              ? { ...((b.config as object) ?? {}), progress: { solved: mine.filter((a) => a.correct).length, attempts: mine.length } }
              : b.config,
        };
      })}
    />
  );
}
