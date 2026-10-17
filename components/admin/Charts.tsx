import { plural } from "@/lib/plural";

/**
 * Распределение оценок 1–10: один ряд, один цвет (порядковая шкала — цвет не нужен для смысла).
 * Подсказка при наведении на столбец, подписи только у оси; таблица значений — в title и в тексте подсказки.
 */
export function RatingHistogram({ ratings, label }: { ratings: number[]; label: string }) {
  const counts = Array.from({ length: 10 }, (_, k) => ratings.filter((r) => r === k + 1).length);
  const max = Math.max(1, ...counts);
  return (
    <figure>
      <figcaption className="sr-only">{label}: {counts.map((c, k) => `${k + 1} — ${c}`).join(", ")}</figcaption>
      <div className="flex h-32 items-end gap-[2px] border-b border-slate-200">
        {counts.map((c, k) => (
          <div key={k} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className="w-full max-w-9 rounded-t bg-ocean-600 transition group-hover:bg-ocean-800"
              style={{ height: c ? `${Math.max(4, (c / max) * 100)}%` : 0 }}
            />
            {/* увеличенная зона наведения — весь столбец */}
            <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow group-hover:block">
              Оценка {k + 1}: {plural(c, ["отзыв", "отзыва", "отзывов"])}
              {ratings.length ? ` · ${Math.round((c / ratings.length) * 100)}%` : ""}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[2px] text-center text-[11px] text-slate-500">
        {counts.map((_, k) => (
          <span key={k} className="flex-1">{k + 1}</span>
        ))}
      </div>
    </figure>
  );
}

/** Доли ответов на вопрос анкеты: горизонтальные полосы одного цвета, подпись и процент текстом */
export function AnswerBars({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => {
        const p = total ? r.count / total : 0;
        return (
          <li key={r.label} className="group text-sm" title={`${r.label}: ${r.count} из ${total}`}>
            <div className="flex justify-between gap-2">
              <span className="text-slate-700">{r.label}</span>
              <span className="tabular-nums text-slate-500">
                {r.count} · {Math.round(p * 100)}%
              </span>
            </div>
            <div className="mt-0.5 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-ocean-600 transition group-hover:bg-ocean-800" style={{ width: `${p * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Stat({ value, label, hint }: { value: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="text-3xl font-extrabold tabular-nums text-slate-900">{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-600">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
