"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { pct, scoreClass } from "@/lib/stats";
import Icon from "@/components/Icon";

export type JournalLesson = { id: string; title: string; group: string; topic: string | null; average: number | null; finished: number; active: number };
export type JournalRow = {
  id: string;
  name: string;
  hasAccount: boolean;
  overall: number | null;
  lessonsDone: number;
  attempts: number;
  cells: Record<string, { average: number | null; completion: number; attempts: number }>;
};

type Sort = "name" | "best" | "worst" | "progress";

// Журнал успеваемости: ученики × уроки. Клик по ячейке — разбор урока, по имени — профиль ученика.
export default function JournalTable({ classId, lessons, rows }: { classId: string; lessons: JournalLesson[]; rows: JournalRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [showCompletion, setShowCompletion] = useState(true);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => !q || r.name.toLowerCase().includes(q));
    const avg = (r: JournalRow) => r.overall ?? -1;
    return [...list].sort((a, b) =>
      sort === "best" ? avg(b) - avg(a) : sort === "worst" ? avg(a) - avg(b) : sort === "progress" ? b.lessonsDone - a.lessonsDone : a.name.localeCompare(b.name, "ru")
    );
  }, [rows, query, sort]);

  if (lessons.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        В классе пока нет уроков.{" "}
        <Link href={`/classes/${classId}/manage`} className="font-semibold text-ocean-700">Добавьте первый урок</Link>.
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="card p-8 text-center text-slate-500">В классе пока нет учеников — дайте им код класса.</div>;
  }

  // Разделы для верхней строки шапки: подряд идущие уроки одного раздела объединяются
  const groups = lessons.reduce<{ label: string; span: number }[]>((acc, l) => {
    const last = acc[acc.length - 1];
    if (last && last.label === l.group) last.span++;
    else acc.push({ label: l.group, span: 1 });
    return acc;
  }, []);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-mist-100 px-5 py-4">
        <h2 className="mr-auto text-lg font-bold text-ocean-900">Журнал успеваемости</h2>
        <label className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
          <input className="input w-48 py-1.5 pl-9 text-sm" placeholder="Найти ученика" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="input w-auto py-1.5 text-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="name">По алфавиту</option>
          <option value="best">Сначала сильные</option>
          <option value="worst">Сначала отстающие</option>
          <option value="progress">По числу пройденных уроков</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="accent-ocean-700" checked={showCompletion} onChange={(e) => setShowCompletion(e.target.checked)} />
          % выполнения
        </label>
        <a href={`/api/classes/${classId}/export`} className="btn-ghost py-1.5">
          <Icon name="arrowRight" className="h-4 w-4 rotate-90" /> Excel (CSV)
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ocean-700 text-xs text-white">
              <th className="sticky left-0 z-10 bg-ocean-700 px-4 py-2 text-left font-semibold">Раздел</th>
              {groups.map((g, i) => (
                <th key={i} colSpan={g.span} className="border-l border-white/20 px-2 py-2 text-center font-semibold">{g.label}</th>
              ))}
              <th colSpan={2} className="border-l border-white/20" />
            </tr>
            <tr className="bg-mist-50 text-left text-xs text-slate-500">
              <th className="sticky left-0 z-10 min-w-48 bg-mist-50 px-4 py-3 font-semibold">Ученик</th>
              {lessons.map((l, i) => (
                <th key={l.id} className="min-w-32 px-2 py-3 text-center font-semibold">
                  <Link href={`/classes/${classId}/lessons?lesson=${l.id}`} className="block hover:text-ocean-700" title={l.title}>
                    <span className="text-mist-300">{i + 1}.</span> <span className="line-clamp-2">{l.title}</span>
                    {l.topic && l.topic !== l.title && <span className="block font-normal text-slate-400">{l.topic}</span>}
                  </Link>
                </th>
              ))}
              <th className="min-w-28 bg-lagoon-50 px-3 py-3 text-center font-semibold">Средний балл</th>
              <th className="min-w-28 px-3 py-3 text-center font-semibold">Пройдено уроков</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-100">
            {visible.map((r) => (
              <tr key={r.id} className="hover:bg-mist-50/60">
                <td className="sticky left-0 z-10 bg-white px-4 py-2">
                  <Link href={`/classes/${classId}/students/${r.id}`} className="font-semibold text-ocean-900 hover:text-lagoon-700">
                    {r.name}
                  </Link>
                  <div className="text-[11px] text-slate-400">{r.hasAccount ? "аккаунт" : "вход по PIN"} · попыток {r.attempts}</div>
                </td>
                {lessons.map((l) => {
                  const c = r.cells[l.id];
                  return (
                    <td key={l.id} className="px-2 py-2 text-center">
                      <Link
                        href={`/classes/${classId}/lessons?lesson=${l.id}#student-${r.id}`}
                        className={`inline-block min-w-16 rounded-lg px-2 py-1 font-semibold transition hover:ring-2 hover:ring-lagoon-500 ${scoreClass(c.average)}`}
                        title="Открыть разбор урока"
                      >
                        {pct(c.average)}
                      </Link>
                      {showCompletion && c.attempts > 0 && (
                        <div className="mx-auto mt-1 h-1 w-14 overflow-hidden rounded-full bg-mist-100" title={`выполнено ${pct(c.completion)}`}>
                          <div className="h-full rounded-full bg-sun-400" style={{ width: `${c.completion * 100}%` }} />
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="bg-lagoon-50/60 px-3 py-2 text-center">
                  <span className={`inline-block min-w-14 rounded-lg px-2 py-1 font-bold ${scoreClass(r.overall)}`}>{pct(r.overall)}</span>
                </td>
                <td className="px-3 py-2 text-center font-semibold text-slate-600">
                  {r.lessonsDone} / {lessons.length}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-mist-200 bg-mist-50 text-xs">
              <td className="sticky left-0 z-10 bg-mist-50 px-4 py-2 font-semibold text-slate-600">По классу</td>
              {lessons.map((l) => (
                <td key={l.id} className="px-2 py-2 text-center">
                  <div className={`mx-auto w-fit rounded-lg px-2 py-0.5 font-bold ${scoreClass(l.average)}`}>{pct(l.average)}</div>
                  <div className="mt-0.5 text-slate-400">работали {l.active} · прошли {l.finished}</div>
                </td>
              ))}
              <td className="bg-lagoon-50/60" />
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="border-t border-mist-100 px-5 py-3 text-xs text-slate-500">
        Ячейка — средний балл ученика по уроку (практика, квиз, карточки); полоска — доля выполненных заданий. Нажмите на
        ячейку, чтобы открыть разбор урока, или на имя — чтобы увидеть все работы ученика.
      </p>
    </section>
  );
}
