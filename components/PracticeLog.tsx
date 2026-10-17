"use client";
import { useState } from "react";
import { SOLUTION_MAX } from "@/lib/practice/common";
import Rich from "./modules/Rich";

export type PracticeAttempt = {
  id: string;
  correct: boolean;
  statement: string;
  answer: number;
  expected: number;
  unit: string;
  difficulty: number;
  solution: string; // ход решения, который записал ученик (видит учитель)
  at: string; // ISO
};

const num = (n: number) => n.toLocaleString("ru-RU", { maximumSignificantDigits: 6 });
const time = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Работа ученика в практике на этом уроке: прогресс и все задачи — то же, что видит учитель
export default function PracticeLog({
  attempts,
  goal,
  onSolution,
}: {
  attempts: PracticeAttempt[];
  goal: number;
  onSolution?: (id: string, text: string) => void; // решение сохранено на сервере
}) {
  const solved = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length ? Math.round((solved / attempts.length) * 100) : null;
  return (
    <section className="mt-6 rounded-2xl border border-mist-100 bg-mist-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-ocean-900">Моя работа на этом уроке</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`pill py-1 ${solved >= goal ? "bg-emerald-100 text-emerald-800" : "bg-sun-100 text-sun-900"}`}>
            решено верно {solved} из {goal}{solved >= goal ? " ✓" : ""}
          </span>
          {accuracy !== null && <span className="pill bg-white py-1 text-slate-600 ring-1 ring-mist-200">точность {accuracy}%</span>}
        </div>
      </div>
      {attempts.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Составь и реши задачу в симуляции — после проверки она появится здесь и в твоей статистике, а учитель увидит ответ и решение.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {attempts.map((a) => (
            <li key={a.id} className="rounded-xl bg-white p-3 ring-1 ring-mist-100">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={a.correct ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{a.correct ? "✓ Верно" : "✗ Неверно"}</span>
                <span className="text-sun-600">{"★".repeat(a.difficulty)}</span>
                <span className="ml-auto">{time(a.at)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-700"><Rich text={a.statement} /></p>
              <p className="mt-0.5 text-sm text-slate-600">
                Мой ответ: <b>{num(a.answer)} {a.unit}</b>
                {!a.correct && <> · правильный: <b>{num(a.expected)} {a.unit}</b></>}
              </p>
              <Solution attempt={a} onSaved={onSolution} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Solution({ attempt, onSaved }: { attempt: PracticeAttempt; onSaved?: (id: string, text: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(attempt.solution);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Только что решённая задача ещё не получила id с сервера — редактировать её решение пока нельзя
  const editable = !!onSaved && !attempt.id.startsWith("new-");

  async function save() {
    setBusy(true);
    setError("");
    const r = await fetch(`/api/results/${attempt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solutionText: text }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(data.error ?? "Не удалось сохранить решение");
    onSaved?.(attempt.id, text.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          autoFocus
          className="input h-28 font-mono text-sm"
          maxLength={SOLUTION_MAX}
          placeholder={"Дано: …\nСИ: …\nРешение: …\nОтвет: …"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error && <p className="mt-1 text-sm text-rose-700">{error}</p>}
        <div className="mt-2 flex gap-2">
          <button onClick={save} disabled={busy} className="btn-primary py-1.5 text-sm">{busy ? "Сохраняю…" : "Сохранить решение"}</button>
          <button onClick={() => { setEditing(false); setText(attempt.solution); }} className="btn-ghost py-1.5 text-sm">Отмена</button>
        </div>
      </div>
    );
  }

  return attempt.solution ? (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
        Моё решение
        {editable && <button onClick={() => setEditing(true)} className="font-semibold text-ocean-700 hover:underline">Изменить</button>}
      </div>
      <pre className="whitespace-pre-wrap rounded-lg bg-mist-50 p-2 font-mono text-xs text-slate-700">{attempt.solution}</pre>
    </div>
  ) : editable ? (
    <button onClick={() => setEditing(true)} className="mt-2 text-sm font-semibold text-ocean-700 hover:underline">
      + Добавить решение — его увидит учитель
    </button>
  ) : null;
}
