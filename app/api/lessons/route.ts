import { NextResponse } from "next/server";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { createLessonFromTopic } from "@/lib/lessons";

// POST {}            — пустой урок
// POST { topicId }   — урок со всеми модулями темы из библиотеки
export async function POST(req: Request) {
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const topicId = Number(body?.topicId);

  if (topicId) {
    const lesson = await createLessonFromTopic(session.user.id, topicId);
    if (!lesson) return NextResponse.json({ error: "topic not found" }, { status: 404 });
    return NextResponse.json({ id: lesson.id });
  }

  const lesson = await prisma.lesson.create({
    data: { title: "Новый урок", ownerId: session.user.id },
  });
  return NextResponse.json({ id: lesson.id });
}
