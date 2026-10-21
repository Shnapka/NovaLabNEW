import { STUDENT_DISLIKED, STUDENT_LIKED, avg, fmtAvg, ratingClass, tagCounts } from "@/lib/feedback";
import { plural } from "@/lib/plural";

export type AnonFeedback = {
  id: string;
  voterKey: string;
  rating: number;
  likedTags: string[];
  dislikedTags: string[];
  wish: string | null;
  liked: string | null;
  disliked: string | null;
};

// Сводка анонимных отзывов: распределение оценок, частота вариантов и пожелания — без имён и времени
export default function FeedbackSummary({ items }: { items: AnonFeedback[] }) {
  const n = items.length;
  const mean = avg(items.map((f) => f.rating));
  const byRating = Array.from({ length: 10 }, (_, k) => items.filter((f) => f.rating === k + 1).length);
  const peak = Math.max(1, ...byRating);
  const liked = tagCounts(items.map((f) => f.likedTags), STUDENT_LIKED);
  const disliked = tagCounts(items.map((f) => f.dislikedTags), STUDENT_DISLIKED);
  // Порядок по ключу отзыва — случайный: по нему не понять, кто и когда писал
  const texts = [...items]
    .sort((a, b) => a.voterKey.localeCompare(b.voterKey))
    .flatMap((f) => [
      ...(f.wish ? [{ id: f.id + "w", kind: "wish" as const, text: f.wish }] : []),
      ...(f.liked ? [{ id: f.id + "l", kind: "liked" as const, text: f.liked }] : []),
      ...(f.disliked ? [{ id: f.id + "d", kind: "disliked" as const, text: f.disliked }] : []),
    ]);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-6 p-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Средняя оценка</div>
          <div className={`mt-1 inline-block rounded-xl px-3 py-1 text-3xl font-extrabold ${ratingClass(mean)}`}>{fmtAvg(mean)}</div>
          <div className="mt-1 text-xs text-slate-500">{plural(n, ["отзыв", "отзыва", "отзывов"])}</div>
        </div>
        <div className="flex min-w-[240px] flex-1 items-end gap-1" aria-label="Сколько учеников поставили каждую оценку">
          {byRating.map((c, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[11px] text-slate-400">{c || ""}</span>
              <div className={`w-full rounded-t ${c ? ratingClass(i + 1) : "bg-mist-100"}`} style={{ height: `${8 + (c / peak) * 56}px` }} />
              <span className="text-xs font-semibold text-slate-500">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TagBars title="👍 Что понравилось" rows={liked} total={n} bar="bg-emerald-400" />
        <TagBars title="👎 Что не понравилось" rows={disliked} total={n} bar="bg-rose-400" />
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-ocean-900">💡 Что ученики хотели бы видеть</h3>
        {texts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Пожеланий пока нет</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {texts.map((t) => (
              <li
                key={t.id}
                className={`whitespace-pre-line rounded-xl px-3 py-2 text-sm ${
                  t.kind === "wish" ? "bg-aqua-100/50 text-ocean-900" : t.kind === "liked" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
                }`}
              >
                {t.kind !== "wish" && <span className="mr-1">{t.kind === "liked" ? "👍" : "👎"}</span>}
                {t.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TagBars({ title, rows, total, bar }: { title: string; rows: { id: string; label: string; count: number }[]; total: number; bar: string }) {
  return (
    <div className="card p-5">
      <h3 className="font-bold text-ocean-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">Ничего не отмечено</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-slate-700">{r.label}</span>
                <span className="font-semibold text-slate-500">{r.count}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-mist-100">
                <div className={`h-2 rounded-full ${bar}`} style={{ width: `${Math.round((r.count / Math.max(1, total)) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
