import { NextResponse } from "next/server";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { cleanAnswers } from "@/lib/feedback";
import { teacherReviewSchema } from "@/lib/feedbackSchema";

// Анкета учителя об уроке в классе: одна на пару «урок × класс», повторная отправка обновляет её
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = teacherReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Поставьте оценку уроку от 1 до 10" }, { status: 400 });
  const { lessonId, rating, answers, comment } = parsed.data;

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id, lessons: { some: { id: lessonId } } },
    include: { lessons: { where: { id: lessonId }, select: { title: true } }, owner: { select: { name: true, email: true } } },
  });
  if (!classroom) return NextResponse.json({ error: "Урок не назначен этому классу" }, { status: 403 });

  const data = {
    rating,
    answers: cleanAnswers(answers),
    comment: comment || null,
    teacherId: session.user.id,
    lessonTitle: classroom.lessons[0].title,
    classroomName: classroom.name,
    teacherName: classroom.owner.name || classroom.owner.email,
  };
  await prisma.teacherReview.upsert({
    where: { lessonId_classroomId: { lessonId, classroomId: id } },
    update: data,
    create: { ...data, lessonId, classroomId: id },
  });
  return NextResponse.json({ ok: true });
}
