import { NextResponse } from "next/server";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { TEACHER_QUESTIONS, answerLabel, type ReviewAnswers } from "@/lib/feedback";

// Защита от формул в Excel: значения, начинающиеся с = + - @, экранируются апострофом
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");

// Выгрузка всех отзывов для администратора: ?type=students | teachers
export async function GET(req: Request) {
  if (!(await adminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type");

  let body: string;
  if (type === "teachers") {
    const items = await prisma.teacherReview.findMany({ orderBy: { updatedAt: "desc" } });
    body = csv([
      ["Дата", "Учитель", "Класс", "Урок", "Оценка", ...TEACHER_QUESTIONS.map((q) => q.title), "Комментарий"],
      ...items.map((r) => [
        r.updatedAt.toISOString(),
        r.teacherName,
        r.classroomName,
        r.lessonTitle,
        r.rating,
        ...TEACHER_QUESTIONS.map((q) => answerLabel(q, (r.answers as ReviewAnswers)[q.id])),
        r.comment,
      ]),
    ]);
  } else if (type === "students") {
    const items = await prisma.lessonFeedback.findMany({ orderBy: { updatedAt: "desc" } });
    body = csv([
      ["Дата", "Ученик", "Класс", "Урок", "Оценка", "Понравилось", "Не понравилось"],
      ...items.map((f) => [f.updatedAt.toISOString(), f.studentName, f.classroomName, f.lessonTitle, f.rating, f.liked, f.disliked]),
    ]);
  } else {
    return NextResponse.json({ error: "type: students | teachers" }, { status: 400 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="novalab-${type}-feedback.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
