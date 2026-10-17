import Link from "next/link";

// Фильтры списка отзывов одной строкой: урок, оценка, только с комментарием. Работают через адрес страницы (GET-форма).
export default function Filters({
  base,
  lessons,
  current,
  commentLabel,
}: {
  base: string;
  lessons: string[];
  current: { lesson?: string; rating?: string; comments?: string };
  commentLabel: string;
}) {
  const any = current.lesson || current.rating || current.comments;
  return (
    <form action={base} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <select name="lesson" defaultValue={current.lesson ?? ""} className="input w-auto max-w-xs py-2 text-sm">
        <option value="">Все уроки</option>
        {lessons.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      <select name="rating" defaultValue={current.rating ?? ""} className="input w-auto py-2 text-sm">
        <option value="">Любая оценка</option>
        <option value="low">Низкие (1–4)</option>
        <option value="mid">Средние (5–7)</option>
        <option value="high">Высокие (8–10)</option>
      </select>
      <label className="flex items-center gap-2 px-2 text-sm text-slate-700">
        <input type="checkbox" name="comments" value="1" defaultChecked={!!current.comments} className="h-4 w-4 accent-ocean-700" />
        {commentLabel}
      </label>
      <button className="btn bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">Показать</button>
      {any && <Link href={base} className="text-sm text-slate-500 hover:text-slate-800">Сбросить</Link>}
    </form>
  );
}

export const ratingRange = (r?: string) =>
  r === "low" ? { gte: 1, lte: 4 } : r === "mid" ? { gte: 5, lte: 7 } : r === "high" ? { gte: 8, lte: 10 } : undefined;
