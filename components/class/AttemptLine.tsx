import { metaOf } from "@/lib/modules/meta";
import { pct, type ResultRow } from "@/lib/stats";
import Rich from "@/components/modules/Rich";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const num = (n: unknown) => (typeof n === "number" ? n.toLocaleString("ru-RU", { maximumSignificantDigits: 6 }) : "—");

// Одна попытка ученика: текст своей задачи и ответы — для практики, баллы — для квиза и карточек
export default function AttemptLine({ r, title }: { r: ResultRow; title: string }) {
  const d = (r.detail ?? {}) as Record<string, unknown>;
  const meta = metaOf(r.kind === "challenge" ? "simulation" : r.kind);
  return (
    <li className="rounded-xl border border-mist-100 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className={`pill ${meta.badge}`}>{meta.label}</span>
        <span className="font-medium text-slate-700"><Rich text={title} /></span>
        <span className="ml-auto">{time(r.createdAt)}</span>
      </div>
      {r.kind === "practice" ? (
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-slate-700"><Rich text={String(d.statement ?? "")} /></p>
          <p>
            <span className={r.correct ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>{r.correct ? "✓ Верно" : "✗ Неверно"}</span>
            <span className="text-slate-600"> · ответ ученика: <b>{num(d.answer)} {String(d.unit ?? "")}</b></span>
            {!r.correct && <span className="text-slate-600"> · правильно: <b>{num(d.expected)} {String(d.unit ?? "")}</b></span>}
            <span className="text-sun-600"> · сложность {"★".repeat(Number(d.difficulty ?? 1))}</span>
          </p>
          {typeof d.solutionText === "string" && d.solutionText.trim() ? (
            <div>
              <div className="mt-1.5 text-xs font-semibold text-slate-500">Решение ученика</div>
              <pre className="mt-0.5 whitespace-pre-wrap rounded-lg border-l-4 border-lagoon-500 bg-mist-50 p-2 font-mono text-xs text-slate-700">{d.solutionText}</pre>
            </div>
          ) : (
            <p className="text-xs italic text-slate-400">Решение не записано — только ответ</p>
          )}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-700">
          {r.kind === "quiz" && <>Верных ответов: <b>{num(d.score)} из {num(d.total)}</b></>}
          {r.kind === "matching" && <>Пар: <b>{num(d.pairs)}</b>, ошибок: <b>{num(d.mistakes)}</b></>}
          {r.kind === "challenge" && <>Звёзд: <b>{num(d.stars)} из {num(d.maxStars)}</b></>}
          <span className="ml-2 font-semibold text-ocean-700">{pct(r.score)}</span>
        </p>
      )}
    </li>
  );
}
