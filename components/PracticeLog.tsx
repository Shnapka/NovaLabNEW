import Rich from "./modules/Rich";
import { kindLabel, kindsOf } from "@/lib/practice/kinds";

export type PracticeAttempt = {
  id: string;
  correct: boolean;
  statement: string;
  answer: number;
  expected: number;
  unit: string;
  difficulty: number;
  solution: string; // решение, записанное в окне практики (его видит учитель)
  kind: string | null; // тип задачи: что нужно было найти
  at: string; // ISO
};

const num = (n: number) => n.toLocaleString("ru-RU", { maximumSignificantDigits: 6 });
const time = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Работа ученика в практике на этом уроке: какие типы задач уже решены и все задачи — то же, что видит учитель
export default function PracticeLog({ attempts, topic }: { attempts: PracticeAttempt[]; topic: string | undefined }) {
  const kinds = kindsOf(topic);
  const solved = new Set(attempts.filter((a) => a.correct).map((a) => a.kind));
  const solvedCount = kinds.filter((k) => solved.has(k.value)).length;
  const all = kinds.length > 0 && solvedCount === kinds.length;

  return (
    <section className="mt-6 rounded-2xl border border-mist-100 bg-mist-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-ocean-900">Моя работа на этом уроке</h3>
        {kinds.length > 0 && (
          <span className={`pill py-1 ${all ? "bg-emerald-100 text-emerald-800" : "bg-sun-100 text-sun-900"}`}>
            решено типов задач: {solvedCount} из {kinds.length}{all ? " ✓" : ""}
          </span>
        )}
      </div>
      {kinds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {kinds.map((k) => (
            <span key={k.value} className={`pill py-1 ${solved.has(k.value) ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-500 ring-1 ring-mist-200"}`}>
              {solved.has(k.value) ? "✓" : "○"} {k.label}
            </span>
          ))}
        </div>
      )}
      {attempts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Составь и реши в симуляции задачу каждого типа. Решение записывай в окне практики — его увидит учитель.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {attempts.map((a) => (
            <li key={a.id} className="rounded-xl bg-white p-3 ring-1 ring-mist-100">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={a.correct ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{a.correct ? "✓ Верно" : "✗ Неверно"}</span>
                {a.kind && <span className="pill bg-mist-50 py-0.5 text-ocean-800">{kindLabel(topic, a.kind)}</span>}
                <span className="text-sun-600">{"★".repeat(a.difficulty)}</span>
                <span className="ml-auto">{time(a.at)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-700"><Rich text={a.statement} /></p>
              <p className="mt-0.5 text-sm text-slate-600">
                Мой ответ: <b>{num(a.answer)} {a.unit}</b>
                {!a.correct && <> · правильный: <b>{num(a.expected)} {a.unit}</b></>}
              </p>
              {a.solution && (
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-mist-50 p-2 font-mono text-xs text-slate-700">{a.solution}</pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
