import { teacherSession } from "@/lib/authz";
import { loadClassForTeacher } from "@/lib/classData";

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
const percent = (x: number | null) => (x === null ? "" : String(Math.round(x * 100)));

// Журнал класса в CSV для Excel: разделитель «;» и BOM, чтобы кириллица открылась без настроек
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return new Response("unauthorized", { status: 401 });
  const data = await loadClassForTeacher(id, session.user.id);
  if (!data) return new Response("not found", { status: 404 });

  const head = [
    "Ученик",
    "Вход",
    ...data.lessons.flatMap(({ lesson }, i) => [`${i + 1}. ${lesson.title}: балл, %`, `${i + 1}. ${lesson.title}: выполнено, %`]),
    "Средний балл, %",
    "Пройдено уроков",
    "Своих задач решено",
    "Попыток",
  ];
  const rows = data.journal.map((r) => [
    r.name,
    r.hasAccount ? "аккаунт" : `PIN ${r.pin}`,
    ...data.lessons.flatMap(({ lesson }) => [percent(r.cells[lesson.id].average), percent(r.cells[lesson.id].attempts ? r.cells[lesson.id].completion : null)]),
    percent(r.overall),
    String(r.lessonsDone),
    String(r.practiceSolved),
    String(r.attempts),
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  const filename = encodeURIComponent(`Журнал ${data.classroom.name} ${date}.csv`);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="journal.csv"; filename*=UTF-8''${filename}`,
    },
  });
}
