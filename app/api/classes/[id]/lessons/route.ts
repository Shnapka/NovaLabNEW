import { NextResponse } from "next/server";
import { z } from "zod";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { createLessonFromTopic } from "@/lib/lessons";

const toggleSchema = z.object({ lessonId: z.string(), assigned: z.boolean() });
const addSchema = z.object({ topicId: z.number().int().positive() });

async function ownClassroom(id: string, ownerId: string) {
  return prisma.classroom.findFirst({ where: { id, ownerId } });
}

// Назначить классу существующий урок учителя или снять назначение
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = toggleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad data" }, { status: 400 });

  const [classroom, lesson] = await Promise.all([
    ownClassroom(id, session.user.id),
    prisma.lesson.findFirst({ where: { id: parsed.data.lessonId, ownerId: session.user.id } }),
  ]);
  if (!classroom || !lesson) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.classroom.update({
    where: { id },
    data: { lessons: parsed.data.assigned ? { connect: { id: lesson.id } } : { disconnect: { id: lesson.id } } },
  });
  return NextResponse.json({ ok: true });
}

// Добавить в класс урок прямо из библиотеки: создаётся урок учителя по теме и сразу назначается
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad data" }, { status: 400 });

  const classroom = await ownClassroom(id, session.user.id);
  if (!classroom) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const lesson = await createLessonFromTopic(session.user.id, parsed.data.topicId);
  if (!lesson) return NextResponse.json({ error: "В этой теме пока нет модулей" }, { status: 404 });
  await prisma.classroom.update({ where: { id }, data: { lessons: { connect: { id: lesson.id } } } });
  return NextResponse.json({ ok: true, lessonId: lesson.id });
}
