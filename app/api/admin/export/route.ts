import { NextResponse } from "next/server";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { STUDENT_DISLIKED, STUDENT_LIKED, TEACHER_QUESTIONS, answerLabel, type FeedbackOption, type ReviewAnswers } from "@/lib/feedback";

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
    // Отзывы учеников анонимные: только дата, класс и урок
    const items = await prisma.lessonFeedback.findMany({ orderBy: [{ day: "desc" }, { voterKey: "asc" }] });
    const labels = (ids: string[], options: FeedbackOption[]) => ids.map((id) => options.find((o) => o.id === id)?.label ?? id).join(", ");
    body = csv([
      ["Дата", "Класс", "Урок", "Оценка", "Понравилось", "Не понравилось", "Хотели бы видеть", "Комментарий (старый опрос): понравилось", "Комментарий (старый опрос): не понравилось"],
      ...items.map((f) => [
        f.day.toISOString().slice(0, 10),
        f.classroomName,
        f.lessonTitle,
        f.rating,
        labels(f.likedTags, STUDENT_LIKED),
        labels(f.dislikedTags, STUDENT_DISLIKED),
        f.wish,
        f.liked,
        f.disliked,
      ]),
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
