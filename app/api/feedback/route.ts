import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStudentContext, resolveStudentForLesson } from "@/lib/student";
import { studentFeedbackSchema } from "@/lib/feedbackSchema";

// Отзыв ученика в конце урока. Один на урок: повторная отправка обновляет оценку и комментарии.
export async function POST(req: Request) {
  const parsed = studentFeedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Поставь оценку от 1 до 10" }, { status: 400 });
  const { lessonId, rating, liked, disliked } = parsed.data;

  const student = await resolveStudentForLesson(lessonId);
  if (!student) {
    const ctx = await getStudentContext();
    return ctx.mode
      ? NextResponse.json({ error: "Урок не назначен вашему классу" }, { status: 403 })
      : NextResponse.json({ error: "Войдите как ученик" }, { status: 401 });
  }
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true } });
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });

  const data = {
    rating,
    liked: liked || null,
    disliked: disliked || null,
    classroomId: student.classroomId,
    teacherId: student.classroom.ownerId,
    lessonTitle: lesson.title,
    classroomName: student.classroom.name,
    studentName: student.name,
  };
  await prisma.lessonFeedback.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
    update: data,
    create: { ...data, studentId: student.id, lessonId },
  });
  return NextResponse.json({ ok: true });
}
