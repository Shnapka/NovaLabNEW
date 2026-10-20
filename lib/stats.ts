// Статистика урока для учителя: ученики × оцениваемые модули
export const GRADED_TYPES = ["practice", "quiz", "matching"];

import { solvedKinds } from "@/lib/practice/kinds";

// kinds — типы задач практики (цель: решить задачу каждого типа); пусто — старая цель «goal задач»
export type GradedModule = { moduleId: string; type: string; title: string; goal: number; kinds?: string[] };
export type ResultRow = {
  id: string;
  studentId: string;
  moduleId: string;
  kind: string;
  score: number;
  correct: boolean | null;
  detail: unknown;
  createdAt: Date;
};

export type Cell = {
  attempts: number;
  best: number; // лучший результат 0..1 (квиз, карточки)
  correct: number; // верно решённых задач (практика)
  score: number | null; // итог по модулю 0..1, null — не начинал
  done: boolean; // модуль выполнен
  kindsSolved: string[]; // практика: решённые типы задач
};

export type StudentRow = {
  id: string;
  name: string;
  cells: Record<string, Cell>;
  average: number | null; // средний балл по начатым модулям
  completion: number; // доля выполненных модулей 0..1
  lastActivity: Date | null;
  attempts: ResultRow[];
};

export function computeLessonStats(modules: GradedModule[], students: { id: string; name: string }[], results: ResultRow[]) {
  const rows: StudentRow[] = students.map((s) => {
    const mine = results.filter((r) => r.studentId === s.id);
    const cells: Record<string, Cell> = {};
    for (const m of modules) {
      const rs = mine.filter((r) => r.moduleId === m.moduleId);
      const attempts = rs.length;
      const best = rs.reduce((a, r) => Math.max(a, r.score), 0);
      const correct = rs.filter((r) => r.correct).length;
      let score: number | null = null;
      let done = false;
      let kindsSolved: string[] = [];
      if (attempts) {
        if (m.type === "practice" && m.kinds?.length) {
          // Практика: балл — доля решённых типов задач, выполнено — решён каждый тип
          kindsSolved = solvedKinds(m.kinds, rs);
          score = kindsSolved.length / m.kinds.length;
          done = kindsSolved.length === m.kinds.length;
        } else if (m.type === "practice") {
          score = correct / attempts;
          done = correct >= m.goal;
        } else {
          score = best;
          done = true;
        }
      }
      cells[m.moduleId] = { attempts, best, correct, score, done, kindsSolved };
    }
    const started = Object.values(cells).filter((c) => c.score !== null);
    return {
      id: s.id,
      name: s.name,
      cells,
      average: started.length ? started.reduce((a, c) => a + c.score!, 0) / started.length : null,
      completion: modules.length ? Object.values(cells).filter((c) => c.done).length / modules.length : 0,
      lastActivity: mine.length ? mine.reduce((a, r) => (r.createdAt > a ? r.createdAt : a), mine[0].createdAt) : null,
      attempts: [...mine].sort((a, b) => +b.createdAt - +a.createdAt),
    };
  });

  const moduleStats = modules.map((m) => {
    const scores = rows.map((r) => r.cells[m.moduleId].score).filter((x): x is number => x !== null);
    return {
      ...m,
      started: scores.length,
      done: rows.filter((r) => r.cells[m.moduleId].done).length,
      average: scores.length ? scores.reduce((a, x) => a + x, 0) / scores.length : null,
    };
  });

  const active = rows.filter((r) => r.average !== null);
  return {
    rows,
    moduleStats,
    kpi: {
      students: rows.length,
      active: active.length,
      finished: rows.filter((r) => modules.length > 0 && r.completion === 1).length,
      average: active.length ? active.reduce((a, r) => a + r.average!, 0) / active.length : null,
      attempts: results.length,
      practiceSolved: results.filter((r) => r.kind === "practice" && r.correct).length,
    },
  };
}

export const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

/** Цвет ячейки по баллу */
export const scoreClass = (x: number | null) =>
  x === null
    ? "bg-mist-50 text-mist-300"
    : x >= 0.85
      ? "bg-emerald-100 text-emerald-800"
      : x >= 0.6
        ? "bg-sun-100 text-sun-900"
        : "bg-rose-100 text-rose-800";

/** Подпись ячейки практики: «3 из 5 типов» (или «2 из 3» в старом режиме) */
export function practiceLabel(m: GradedModule, c: Cell) {
  if (!c.attempts) return "—";
  const text = m.kinds?.length ? `${c.kindsSolved.length} из ${m.kinds.length} типов` : `${c.correct} из ${m.goal}`;
  return text + (c.done ? " ✓" : "");
}
