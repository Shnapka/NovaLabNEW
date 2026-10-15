"use client";
import { useState } from "react";
import type { QuizContent, QuizQuestion } from "@/lib/modules/types";
import type { ModuleEvent } from "@/components/ModuleFrame";
import Rich from "./Rich";

function isCorrect(q: QuizQuestion, answer: string | number | null) {
  if (answer === null) return false;
  if (q.kind === "single") return answer === q.answer;
  const v = Number(String(answer).replace(",", ".").replace(/\s/g, ""));
  const tol = q.tolerance ?? Math.max(Math.abs(q.answer) * 0.02, 1e-9);
  return Number.isFinite(v) && Math.abs(v - q.answer) <= tol;
}

export default function QuizModule({
  content,
  onEvent,
}: {
  content: QuizContent;
  onEvent?: (e: ModuleEvent) => void;
}) {
  const qs = content.questions;
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const done = results.length === qs.length;
  const score = results.filter(Boolean).length;

  function check() {
    if (answer === null || answer === "") return;
    setChecked(true);
    const next = [...results, isCorrect(qs[i], answer)];
    setResults(next);
    if (next.length === qs.length) {
      onEvent?.({ type: "quiz-result", data: { score: next.filter(Boolean).length, total: qs.length } });
    }
  }

  function next() {
    setI(i + 1);
    setAnswer(null);
    setChecked(false);
  }

  function restart() {
    setI(0);
    setAnswer(null);
    setChecked(false);
    setResults([]);
  }

  if (done && !checked) {
    const pct = Math.round((score / qs.length) * 100);
    return (
      <div className="space-y-4 py-6 text-center">
        <div className="text-5xl font-bold text-indigo-600">{score} / {qs.length}</div>
        <p className="text-gray-700">
          {pct >= 85 ? "Отлично! Тема усвоена." : pct >= 60 ? "Хорошо, но есть что повторить." : "Стоит ещё раз прочитать конспект и поработать с симуляцией."}
        </p>
        <div className="mx-auto flex max-w-md flex-wrap justify-center gap-1">
          {results.map((r, k) => (
            <span key={k} className={`h-3 w-8 rounded ${r ? "bg-emerald-500" : "bg-rose-400"}`} title={`Вопрос ${k + 1}`} />
          ))}
        </div>
        <button onClick={restart} className="rounded bg-indigo-600 px-5 py-2 text-white">Пройти ещё раз</button>
      </div>
    );
  }

  const q = qs[i];
  const ok = checked && results[i];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {qs.map((_, k) => (
          <span
            key={k}
            className={`h-2 flex-1 rounded ${
              k < results.length ? (results[k] ? "bg-emerald-500" : "bg-rose-400") : k === i ? "bg-indigo-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="text-sm text-gray-500">Вопрос {i + 1} из {qs.length}</div>
      <h3 className="text-lg font-medium"><Rich text={q.text} /></h3>

      {q.kind === "single" ? (
        <div className="grid gap-2">
          {q.options.map((opt, k) => {
            const picked = answer === k;
            let cls = "border-gray-200 hover:border-indigo-400";
            if (checked && k === q.answer) cls = "border-emerald-500 bg-emerald-50";
            else if (checked && picked) cls = "border-rose-400 bg-rose-50";
            else if (picked) cls = "border-indigo-500 bg-indigo-50";
            return (
              <button
                key={k}
                disabled={checked}
                onClick={() => setAnswer(k)}
                className={`rounded-lg border-2 px-4 py-2 text-left transition ${cls}`}
              >
                <Rich text={opt} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            disabled={checked}
            className="w-40 rounded-lg border-2 px-3 py-2 font-mono"
            placeholder="Ответ"
            value={answer ?? ""}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !checked && check()}
          />
          <span className="text-gray-600">{q.unit}</span>
        </div>
      )}

      {checked && (
        <div className={`rounded-lg p-3 text-sm ${ok ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
          <div className="font-semibold">
            {ok ? "Верно!" : q.kind === "number" ? `Неверно. Правильный ответ: ${q.answer.toLocaleString("ru-RU")} ${q.unit}` : "Неверно."}
          </div>
          <Rich text={q.explain} />
        </div>
      )}

      <div className="flex justify-end">
        {!checked ? (
          <button
            onClick={check}
            disabled={answer === null || answer === ""}
            className="rounded bg-indigo-600 px-5 py-2 text-white disabled:opacity-40"
          >
            Проверить
          </button>
        ) : i < qs.length - 1 ? (
          <button onClick={next} className="rounded bg-indigo-600 px-5 py-2 text-white">Следующий вопрос →</button>
        ) : (
          <button onClick={() => setChecked(false)} className="rounded bg-indigo-600 px-5 py-2 text-white">Результаты</button>
        )}
      </div>
    </div>
  );
}
