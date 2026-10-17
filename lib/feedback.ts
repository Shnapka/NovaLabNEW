/**
 * Мини-анкета учителя после урока. Только отметки — каждый вопрос в один клик,
 * а свободный текст — один необязательный комментарий в конце.
 * id вопросов и вариантов хранятся в базе (TeacherReview.answers): менять подписи можно, id — нет.
 */
export type ReviewQuestion = {
  id: string;
  title: string;
  multi?: boolean; // можно отметить несколько
  options: { id: string; label: string }[];
};

export const TEACHER_QUESTIONS: ReviewQuestion[] = [
  {
    id: "pace",
    title: "Как прошёл урок по времени?",
    options: [
      { id: "plan", label: "Всё по плану" },
      { id: "short", label: "Не успели всё" },
      { id: "early", label: "Закончили раньше" },
    ],
  },
  {
    id: "engagement",
    title: "Вовлечённость учеников",
    options: [
      { id: "high", label: "Высокая" },
      { id: "mid", label: "Средняя" },
      { id: "low", label: "Низкая" },
    ],
  },
  {
    id: "level",
    title: "Сложность для класса",
    options: [
      { id: "easy", label: "Легко" },
      { id: "ok", label: "В самый раз" },
      { id: "hard", label: "Сложно" },
    ],
  },
  {
    id: "best",
    title: "Что сработало лучше всего?",
    multi: true,
    options: [
      { id: "simulation", label: "Симуляция" },
      { id: "summary", label: "Конспект" },
      { id: "graph", label: "Графики" },
      { id: "practice", label: "Практика" },
      { id: "quiz", label: "Квиз" },
      { id: "matching", label: "Карточки" },
    ],
  },
  {
    id: "issues",
    title: "Что мешало?",
    multi: true,
    options: [
      { id: "none", label: "Ничего" },
      { id: "loading", label: "Долгая загрузка" },
      { id: "bugs", label: "Сбои и ошибки" },
      { id: "devices", label: "Не у всех работало устройство" },
      { id: "control", label: "Неудобно вести урок" },
      { id: "content", label: "Неточности в материале" },
    ],
  },
  {
    id: "again",
    title: "Проведёте этот урок снова?",
    options: [
      { id: "yes", label: "Да" },
      { id: "changes", label: "С доработками" },
      { id: "no", label: "Нет" },
    ],
  },
];

export type ReviewAnswers = Record<string, string | string[]>;

/** Оставить только известные вопросы и варианты; «Ничего» в «Что мешало» исключает остальные */
export function cleanAnswers(raw: ReviewAnswers): ReviewAnswers {
  const out: ReviewAnswers = {};
  for (const q of TEACHER_QUESTIONS) {
    const ids = new Set(q.options.map((o) => o.id));
    const v = raw[q.id];
    if (q.multi) {
      let list = [...new Set(Array.isArray(v) ? v : typeof v === "string" ? [v] : [])].filter((x) => ids.has(x));
      if (q.id === "issues" && list.includes("none")) list = ["none"];
      if (list.length) out[q.id] = list;
    } else if (typeof v === "string" && ids.has(v)) {
      out[q.id] = v;
    }
  }
  return out;
}

/** Подпись ответа для показа: «Высокая», «Симуляция, Графики» */
export function answerLabel(q: ReviewQuestion, v: string | string[] | undefined) {
  const list = Array.isArray(v) ? v : v ? [v] : [];
  return list.map((id) => q.options.find((o) => o.id === id)?.label ?? id).join(", ");
}

/** Цвет оценки 1–10 */
export function ratingClass(r: number | null | undefined) {
  if (r == null) return "bg-mist-100 text-slate-400";
  if (r >= 8) return "bg-emerald-100 text-emerald-800";
  if (r >= 5) return "bg-sun-100 text-sun-900";
  return "bg-rose-100 text-rose-800";
}

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const fmtAvg = (x: number | null) => (x == null ? "—" : x.toFixed(1).replace(".", ","));
