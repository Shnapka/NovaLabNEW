import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStudentContext, resolveStudentForLesson } from "@/lib/student";
import { studentFeedbackSchema, voterKey } from "@/lib/feedbackSchema";
import { STUDENT_DISLIKED, STUDENT_LIKED, cleanTags } from "@/lib/feedback";

// Анонимный отзыв ученика в конце урока. Один на урок: повторная отправка обновляет его.
// В базу не попадают ни ученик, ни его имя, ни время — только ключ, по которому ученик находит свой отзыв.
export async function POST(req: Request) {
  const parsed = studentFeedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Поставь оценку от 1 до 10" }, { status: 400 });
  const { lessonId, rating, wish } = parsed.data;

  const student = await resolveStudentForLesson(lessonId);
  if (!student) {
    const ctx = await getStudentContext();
    return ctx.mode
      ? NextResponse.json({ error: "Урок не назначен вашему классу" }, { status: 403 })
      : NextResponse.json({ error: "Войдите как ученик" }, { status: 401 });
  }
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true } });
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });

  const key = voterKey(student.id, lessonId);
  const data = {
    rating,
    likedTags: cleanTags(parsed.data.likedTags, STUDENT_LIKED),
    dislikedTags: cleanTags(parsed.data.dislikedTags, STUDENT_DISLIKED, "nothing"),
    wish: wish || null,
    lessonId,
    classroomId: student.classroomId,
    teacherId: student.classroom.ownerId,
    lessonTitle: lesson.title,
    classroomName: student.classroom.name,
    day: new Date(),
  };
  await prisma.lessonFeedback.upsert({ where: { voterKey: key }, update: data, create: { ...data, voterKey: key } });
  return NextResponse.json({ ok: true });
}
