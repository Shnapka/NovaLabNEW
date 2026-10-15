import { NextResponse } from "next/server";
import { z } from "zod";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";

const schema = z.object({
  title: z.string().min(1).max(200),
  isPublished: z.boolean(),
  blocks: z.array(z.object({ moduleId: z.string(), config: z.any() })),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson || lesson.ownerId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad data" }, { status: 400 });
  const { title, isPublished, blocks } = parsed.data;

  await prisma.$transaction([
    prisma.lessonBlock.deleteMany({ where: { lessonId: id } }),
    prisma.lessonBlock.createMany({
      data: blocks.map((b, i) => ({
        lessonId: id,
        moduleId: b.moduleId,
        position: i,
        config: b.config ?? {},
      })),
    }),
    prisma.lesson.update({ where: { id }, data: { title, isPublished } }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.lesson.deleteMany({ where: { id, ownerId: session.user.id } });
  return NextResponse.json({ ok: true });
}
