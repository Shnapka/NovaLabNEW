import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStudentContext } from "@/lib/student";
import { SOLUTION_MAX } from "@/lib/practice/common";

const schema = z.object({ solutionText: z.string().max(SOLUTION_MAX) });

// Ученик дописывает или исправляет решение своей задачи из практики. Ответ и оценка при этом не меняются.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: `Решение — не длиннее ${SOLUTION_MAX} символов` }, { status: 400 });

  const ctx = await getStudentContext();
  if (!ctx.mode) return NextResponse.json({ error: "Войдите как ученик" }, { status: 401 });
  const result = await prisma.result.findFirst({
    where: { id, kind: "practice", studentId: { in: ctx.students.map((s) => s.id) } },
  });
  if (!result) return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });

  const text = parsed.data.solutionText.trim();
  const detail = { ...((result.detail ?? {}) as Record<string, unknown>) };
  if (text) detail.solutionText = text;
  else delete detail.solutionText;
  await prisma.result.update({ where: { id }, data: { detail: detail as Prisma.InputJsonValue } });
  return NextResponse.json({ ok: true });
}
