import { NextResponse } from "next/server";
import { z } from "zod";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";

const schema = z.object({ lessonId: z.string().min(1), dueAt: z.string().datetime().nullable() });

// Срок сдачи урока в классе: поставить, изменить или снять (dueAt: null)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Укажите дату и время срока" }, { status: 400 });
  const { lessonId, dueAt } = parsed.data;

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id, lessons: { some: { id: lessonId } } },
    select: { id: true },
  });
  if (!classroom) return NextResponse.json({ error: "Урок не назначен этому классу" }, { status: 403 });

  if (dueAt === null) {
    await prisma.lessonDeadline.deleteMany({ where: { classroomId: id, lessonId } });
  } else {
    const at = new Date(dueAt);
    await prisma.lessonDeadline.upsert({
      where: { classroomId_lessonId: { classroomId: id, lessonId } },
      update: { dueAt: at },
      create: { classroomId: id, lessonId, dueAt: at },
    });
  }
  return NextResponse.json({ ok: true });
}
