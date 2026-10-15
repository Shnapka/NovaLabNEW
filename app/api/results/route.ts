import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStudentContext, resolveStudentForLesson } from "@/lib/student";
import { checkPractice } from "@/lib/practice";

const schema = z.object({
  lessonId: z.string(),
  moduleId: z.string(),
  event: z.object({ type: z.string(), data: z.any().optional() }),
});

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : NaN);

// Приём результата от модуля урока. Оценку считает сервер: для практики — заново решает задачу ученика.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad data" }, { status: 400 });
  const { lessonId, moduleId, event } = parsed.data;

  // Ученик с аккаунтом может состоять в нескольких классах — берём тот, которому назначен урок
  const student = await resolveStudentForLesson(lessonId);
  if (!student) {
    const ctx = await getStudentContext();
    return ctx.mode
      ? NextResponse.json({ error: "Урок не назначен вашему классу" }, { status: 403 })
      : NextResponse.json({ error: "Войдите как ученик" }, { status: 401 });
  }

  // Урок должен быть назначен классу ученика и содержать этот модуль
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, classrooms: { some: { id: student.classroomId } } },
    include: { blocks: { where: { moduleId }, include: { module: true } } },
  });
  const mod = lesson?.blocks[0]?.module;
  if (!lesson || !mod) return NextResponse.json({ error: "Урок не назначен вашему классу" }, { status: 403 });

  const d = (event.data ?? {}) as Record<string, unknown>;
  let kind: string;
  let score: number;
  let correct: boolean | null = null;
  let detail: Record<string, unknown> = {};
  let response: Record<string, unknown> = {};

  switch (event.type) {
    case "quiz-result": {
      const s = num(d.score);
      const total = num(d.total);
      if (!(total > 0) || !(s >= 0) || s > total) return NextResponse.json({ error: "bad quiz result" }, { status: 400 });
      kind = "quiz";
      score = s / total;
      detail = { score: s, total };
      break;
    }
    case "matching-result": {
      const pairs = num(d.pairs);
      const mistakes = num(d.mistakes);
      if (!(pairs > 0) || !(mistakes >= 0)) return NextResponse.json({ error: "bad matching result" }, { status: 400 });
      kind = "matching";
      score = pairs / (pairs + mistakes);
      detail = { pairs, mistakes };
      break;
    }
    case "challengeSummary": {
      const stars = num(d.stars);
      const max = num(d.maxStars);
      if (!(max > 0) || !(stars >= 0) || stars > max) return NextResponse.json({ error: "bad challenge summary" }, { status: 400 });
      kind = "challenge";
      score = stars / max;
      detail = { stars, maxStars: max };
      break;
    }
    case "taskResult": {
      // Тему берём из модуля в базе, а не из присланных данных
      const topic = String((mod.content as { topic?: string })?.topic ?? (mod.configSchema as { topic?: string })?.topic ?? "");
      const answer = typeof d.answer === "number" || typeof d.answer === "string" ? d.answer : NaN;
      const r = checkPractice(topic, d.task, answer);
      if (!r.ok) return NextResponse.json({ error: r.errors.join("; ") }, { status: 400 });
      kind = "practice";
      correct = r.correct;
      score = r.correct ? 1 : 0;
      detail = {
        task: d.task as Prisma.InputJsonValue,
        statement: r.statement,
        answer: r.answer,
        expected: r.expected,
        unit: r.unitLabel,
        difficulty: r.difficulty,
        solutionText: typeof d.solutionText === "string" ? d.solutionText.slice(0, 2000) : undefined,
      };
      response = { correct: r.correct, expected: r.expected };
      break;
    }
    default:
      // Неоцениваемые события (started, paramsChanged, …) не сохраняем
      return NextResponse.json({ ok: true, stored: false });
  }

  await prisma.result.create({
    data: {
      studentId: student.id,
      lessonId,
      moduleId,
      kind,
      score,
      correct,
      detail: detail as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ ok: true, stored: true, ...response });
}
