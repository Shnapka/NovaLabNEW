"use client";
import type { QuizContent, QuizQuestion } from "@/lib/modules/types";
import Icon from "@/components/Icon";

const newSingle = (): QuizQuestion => ({ kind: "single", text: "", options: ["", ""], answer: 0, explain: "" });
const newNumber = (): QuizQuestion => ({ kind: "number", text: "", answer: 0, unit: "", explain: "" });

// Редактор вопросов квиза: выбор ответа или числовой ответ, пояснение после проверки
export default function QuizEditor({ value, onChange }: { value: QuizContent; onChange: (v: QuizContent) => void }) {
  const qs = value.questions;
  const set = (i: number, q: QuizQuestion) => onChange({ questions: qs.map((x, k) => (k === i ? q : x)) });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= qs.length) return;
    const c = [...qs];
    [c[i], c[j]] = [c[j], c[i]];
    onChange({ questions: c });
  };

  return (
    <div className="space-y-4">
      {qs.map((q, i) => (
        <div key={i} className="rounded-2xl border border-mist-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ocean-700 text-xs font-bold text-white">{i + 1}</span>
            <div className="flex rounded-lg bg-mist-50 p-0.5 text-xs font-semibold">
              {(
                [
                  ["single", "Выбор ответа"],
                  ["number", "Числовой ответ"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => q.kind !== k && set(i, { ...(k === "single" ? newSingle() : newNumber()), text: q.text, explain: q.explain })}
                  className={`rounded-md px-2.5 py-1 ${q.kind === k ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-1 text-sm">
              <button type="button" onClick={() => move(i, -1)} className="rounded px-2 py-1 hover:bg-mist-50" aria-label="Выше">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="rounded px-2 py-1 hover:bg-mist-50" aria-label="Ниже">↓</button>
              <button
                type="button"
                onClick={() => onChange({ questions: qs.filter((_, k) => k !== i) })}
                className="rounded px-2 py-1 text-rose-600 hover:bg-rose-50"
              >
                Удалить
              </button>
            </div>
          </div>

          <textarea
            className="input min-h-16 text-sm"
            placeholder="Текст вопроса, например: Какова единица скорости в СИ?"
            value={q.text}
            onChange={(e) => set(i, { ...q, text: e.target.value })}
          />

          {q.kind === "single" ? (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-semibold text-slate-500">Варианты ответа — отметьте правильный</div>
              {q.options.map((o, k) => (
                <div key={k} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q${i}`}
                    className="h-4 w-4 accent-emerald-600"
                    checked={q.answer === k}
                    onChange={() => set(i, { ...q, answer: k })}
                    title="Правильный ответ"
                  />
                  <input
                    className={`input py-1.5 text-sm ${q.answer === k ? "border-emerald-400 bg-emerald-50" : ""}`}
                    placeholder={`Вариант ${k + 1}`}
                    value={o}
                    onChange={(e) => set(i, { ...q, options: q.options.map((x, n) => (n === k ? e.target.value : x)) })}
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        set(i, { ...q, options: q.options.filter((_, n) => n !== k), answer: q.answer === k ? 0 : q.answer > k ? q.answer - 1 : q.answer })
                      }
                      className="px-1 text-slate-400 hover:text-rose-600"
                      aria-label="Убрать вариант"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <button type="button" onClick={() => set(i, { ...q, options: [...q.options, ""] })} className="text-sm font-semibold text-lagoon-700">
                  + вариант
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <label className="text-xs font-semibold text-slate-500">
                Правильный ответ
                <input
                  type="number"
                  step="any"
                  className="input mt-1 py-1.5 font-mono text-sm"
                  value={Number.isFinite(q.answer) ? q.answer : ""}
                  onChange={(e) => set(i, { ...q, answer: e.target.value === "" ? NaN : Number(e.target.value) })}
                />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Единицы
                <input className="input mt-1 py-1.5 text-sm" placeholder="м/с" value={q.unit} onChange={(e) => set(i, { ...q, unit: e.target.value })} />
              </label>
              <label className="text-xs font-semibold text-slate-500">
                Допуск (± ; пусто — 2 %)
                <input
                  type="number"
                  step="any"
                  min={0}
                  className="input mt-1 py-1.5 font-mono text-sm"
                  value={q.tolerance ?? ""}
                  onChange={(e) => set(i, { ...q, tolerance: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </label>
            </div>
          )}

          <input
            className="input mt-3 py-1.5 text-sm"
            placeholder="Пояснение после ответа (необязательно)"
            value={q.explain}
            onChange={(e) => set(i, { ...q, explain: e.target.value })}
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange({ questions: [...qs, newSingle()] })} className="btn-ghost">
          <Icon name="plus" className="h-4 w-4" /> Вопрос с выбором ответа
        </button>
        <button type="button" onClick={() => onChange({ questions: [...qs, newNumber()] })} className="btn-ghost">
          <Icon name="plus" className="h-4 w-4" /> Вопрос с числовым ответом
        </button>
      </div>
    </div>
  );
}
