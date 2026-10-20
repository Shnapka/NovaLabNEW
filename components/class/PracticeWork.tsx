import Rich from "@/components/modules/Rich";
import type { ResultRow } from "@/lib/stats";
import { kindOf, kindsOf } from "@/lib/practice/kinds";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const num = (n: unknown) => (typeof n === "number" ? n.toLocaleString("ru-RU", { maximumSignificantDigits: 6 }) : "—");

// Работа ученика в практике «составь и реши»: какие типы задач решены и все задачи, которые он сам составил
export default function PracticeWork({ title, topic, attempts }: { title: string; topic: string | undefined; attempts: ResultRow[] }) {
  const kinds = kindsOf(topic);
  const byKind = (k: string | null) => attempts.filter((a) => kindOf(a.detail) === k);
  const groups = [...kinds.map((k) => ({ key: k.value, label: k.label })), { key: null as string | null, label: "Другие задачи" }]
    .map((g) => ({ ...g, items: byKind(g.key) }))
    .filter((g) => g.items.length);

  return (
    <div className="rounded-xl border border-mist-100 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-mist-100 px-4 py-3">
        <span className="mr-auto font-semibold text-ocean-900"><Rich text={title} /></span>
        {kinds.map((k) => {
          const mine = byKind(k.value);
          const ok = mine.some((a) => a.correct);
          const tried = mine.length > 0;
          return (
            <span
              key={k.value}
              title={ok ? "Решена верно" : tried ? "Пробовал, пока без верного ответа" : "Ещё не составлял"}
              className={`pill py-1 ${ok ? "bg-emerald-100 text-emerald-800" : tried ? "bg-rose-50 text-rose-700" : "bg-mist-50 text-slate-400"}`}
            >
              {ok ? "✓" : tried ? "✗" : "○"} {k.label}
            </span>
          );
        })}
      </div>
      {attempts.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-400">Ученик ещё не составил ни одной задачи.</p>
      ) : (
        <div className="divide-y divide-mist-100">
          {groups.map((g) => (
            <details key={g.key ?? "other"} className="group px-4 py-2.5" open={g.items.length <= 3}>
              <summary className="cursor-pointer text-sm font-semibold text-ocean-800">
                {g.label} <span className="font-normal text-slate-400">· задач: {g.items.length}, верно: {g.items.filter((a) => a.correct).length}</span>
              </summary>
              <ol className="mt-2 space-y-2">
                {g.items.map((a) => {
                  const d = (a.detail ?? {}) as Record<string, unknown>;
                  const solution = typeof d.solutionText === "string" ? d.solutionText.trim() : "";
                  return (
                    <li key={a.id} className="rounded-lg bg-mist-50 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className={a.correct ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{a.correct ? "✓ Верно" : "✗ Неверно"}</span>
                        <span className="text-sun-600">{"★".repeat(Number(d.difficulty ?? 1))}</span>
                        <span className="ml-auto">{time(a.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-slate-800"><Rich text={String(d.statement ?? "")} /></p>
                      <p className="mt-1 text-slate-600">
                        Ответ ученика: <b>{num(d.answer)} {String(d.unit ?? "")}</b>
                        {!a.correct && <> · правильный: <b>{num(d.expected)} {String(d.unit ?? "")}</b></>}
                      </p>
                      {solution ? (
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg border-l-4 border-lagoon-500 bg-white p-2 font-mono text-xs text-slate-700">{solution}</pre>
                      ) : (
                        <p className="mt-1 text-xs italic text-slate-400">Решение в окне практики не записано — только ответ</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
