import { NextResponse } from "next/server";
import { z } from "zod";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  items: z
    .array(z.object({ quarter: z.number().int().min(1).max(4), sectionId: z.number().int().positive(), start: day, end: day }))
    .max(40),
});

// Сохранить план четвертей класса целиком: какие разделы в какую четверть и в какие даты
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Проверьте даты и разделы плана" }, { status: 400 });

  const classroom = await prisma.classroom.findFirst({ where: { id, ownerId: session.user.id }, select: { id: true } });
  if (!classroom) return NextResponse.json({ error: "Класс не найден" }, { status: 404 });

  const items = parsed.data.items;
  if (items.some((i) => i.start > i.end)) return NextResponse.json({ error: "Дата начала раздела позже даты окончания" }, { status: 400 });
  const keys = new Set(items.map((i) => `${i.quarter}:${i.sectionId}`));
  if (keys.size !== items.length) return NextResponse.json({ error: "Раздел указан в одной четверти дважды" }, { status: 400 });
  const known = await prisma.section.count({ where: { id: { in: [...new Set(items.map((i) => i.sectionId))] } } });
  if (known !== new Set(items.map((i) => i.sectionId)).size) return NextResponse.json({ error: "Неизвестный раздел" }, { status: 400 });

  await prisma.$transaction([
    prisma.classTerm.deleteMany({ where: { classroomId: id } }),
    prisma.classTerm.createMany({
      data: items.map((i) => ({
        classroomId: id,
        quarter: i.quarter,
        sectionId: i.sectionId,
        startDate: new Date(`${i.start}T00:00:00Z`),
        endDate: new Date(`${i.end}T00:00:00Z`),
      })),
    }),
  ]);
  return NextResponse.json({ ok: true });
}
