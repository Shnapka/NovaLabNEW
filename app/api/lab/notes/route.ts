import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStudentContext, labOwner } from "@/lib/student";

const schema = z.object({ topicId: z.number().int().positive(), text: z.string().max(10_000) });

// Заметка ученика по теме в «Моей лаборатории»: одна на тему, пустой текст — удалить
export async function PUT(req: Request) {
  const owner = labOwner(await getStudentContext());
  if (!owner) return NextResponse.json({ error: "Войдите как ученик" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Заметка — не длиннее 10 000 символов" }, { status: 400 });
  const { topicId } = parsed.data;
  const text = parsed.data.text.trim();

  if (!(await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Тема не найдена" }, { status: 404 });
  }
  if (!text) {
    await prisma.labNote.deleteMany({ where: { owner, topicId } });
    return NextResponse.json({ ok: true, updatedAt: null });
  }
  const note = await prisma.labNote.upsert({
    where: { owner_topicId: { owner, topicId } },
    update: { text },
    create: { owner, topicId, text },
  });
  return NextResponse.json({ ok: true, updatedAt: note.updatedAt.toISOString() });
}
