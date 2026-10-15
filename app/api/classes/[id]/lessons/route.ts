import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const schema = z.object({ lessonId: z.string(), assigned: z.boolean() });

// Назначить урок классу или снять назначение
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad data" }, { status: 400 });

  const [classroom, lesson] = await Promise.all([
    prisma.classroom.findFirst({ where: { id, ownerId: session.user.id } }),
    prisma.lesson.findFirst({ where: { id: parsed.data.lessonId, ownerId: session.user.id } }),
  ]);
  if (!classroom || !lesson) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.classroom.update({
    where: { id },
    data: { lessons: parsed.data.assigned ? { connect: { id: lesson.id } } : { disconnect: { id: lesson.id } } },
  });
  return NextResponse.json({ ok: true });
}
