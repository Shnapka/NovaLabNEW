"use client";
import { useMemo, useState } from "react";
import type { ModuleEvent } from "@/components/ModuleFrame";
import { PRACTICE_TOPICS, checkPractice, type CheckResult } from "@/lib/practice";
import { fmt, type Field, type Quantity } from "@/lib/practice/common";
import Rich from "./Rich";
import Icon from "@/components/Icon";

export type PracticeContent = { topic: string; goal?: number; intro?: string };

type Task = Record<string, unknown> & { unknown: string; answerUnit: string };
type Done = { statement: string; correct: boolean };

function Illustration({ topic, task }: { topic: string; task: Task }) {
  if (topic === "speed") {
    const unknown = task.unknown;
    return (
      <svg viewBox="0 0 320 90" className="w-full max-w-sm" aria-hidden>
        <rect x="10" y="58" width="300" height="10" rx="5" fill="#E2E8ED" />
        {[...Array(11)].map((_, i) => <rect key={i} x={14 + i * 29} y="61" width="14" height="4" rx="2" fill="#fff" />)}
        <circle cx="40" cy="45" r="11" fill="#01597B" />
        <path d="M58 45h60" stroke="#F2BA00" strokeWidth="4" strokeLinecap="round" />
        <path d="m112 38 9 7-9 7" fill="none" stroke="#F2BA00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="84" y="33" fontSize="14" fontWeight="700" fill={unknown === "v" ? "#E0525B" : "#013E56"}>{unknown === "v" ? "v = ?" : "v"}</text>
        <path d="M40 80h250" stroke="#5DB3C1" strokeWidth="2" markerEnd="url(#a)" />
        <path d="M40 75v10M290 75v10" stroke="#5DB3C1" strokeWidth="2" />
        <text x="150" y="20" fontSize="14" fontWeight="700" fill={unknown === "t" ? "#E0525B" : "#013E56"}>{unknown === "t" ? "t = ?" : "t"}</text>
        <text x="270" y="50" fontSize="14" fontWeight="700" fill={unknown === "s" ? "#E0525B" : "#013E56"}>{unknown === "s" ? "s = ?" : "s"}</text>
      </svg>
    );
  }
  // Архимедова сила: сосуд с жидкостью, тело и стрелка выталкивающей силы
  const boat = task.unknown === "cargo";
  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[220px]" aria-hidden>
      <path d="M30 20v95a8 8 0 0 0 8 8h124a8 8 0 0 0 8-8V20" fill="none" stroke="#A9B7C2" strokeWidth="3" />
      <rect x="32" y="55" width="136" height="66" fill="#99D8DE" opacity="0.6" />
      {boat ? (
        <>
          <path d="M60 40h80l-8 26H68z" fill="#01597B" />
          <rect x="85" y="28" width="30" height="12" rx="2" fill="#F2BA00" />
        </>
      ) : (
        <rect x="80" y="68" width="40" height="34" rx="4" fill="#01597B" />
      )}
      <path d="M100 100V60" stroke="#5DB3C1" strokeWidth="4" strokeLinecap="round" opacity={boat ? 0 : 1} />
      <path d={boat ? "M150 62V28" : "M140 100V64"} stroke="#5DB3C1" strokeWidth="4" strokeLinecap="round" />
      <path d={boat ? "m143 36 7-9 7 9" : "m133 72 7-9 7 9"} fill="none" stroke="#5DB3C1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <text x={boat ? 158 : 148} y={boat ? 40 : 84} fontSize="13" fontWeight="700" fill={task.unknown === "FA" ? "#E0525B" : "#013E56"}>
        F<tspan fontSize="9" dy="3">A</tspan>
      </text>
    </svg>
  );
}

function FieldInput({ field, task, set }: { field: Field; task: Task; set: (k: string, v: unknown) => void }) {
  const label = <span className="mb-1 block text-sm font-semibold text-slate-700"><Rich text={field.label} /></span>;
  if (field.kind === "select") {
    return (
      <label className="block">
        {label}
        <select
          className="input py-2"
          value={String(task[field.key] ?? "")}
          onChange={(e) => set(field.key, field.numeric ? Number(e.target.value) : e.target.value)}
        >
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  if (field.kind === "number") {
    const v = task[field.key];
    return (
      <label className="block">
        {label}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={field.step ?? 1}
            className="input py-2 font-mono"
            value={typeof v === "number" && Number.isFinite(v) ? v : ""}
            onChange={(e) => set(field.key, e.target.value === "" ? NaN : Number(e.target.value))}
          />
          <span className="w-14 shrink-0 text-sm text-slate-500">{field.unitLabel}</span>
        </div>
      </label>
    );
  }
  const qv = (task[field.key] as Quantity | undefined) ?? { value: NaN, unit: Object.keys(field.units)[0] };
  return (
    <label className="block">
      {label}
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          step="any"
          className="input py-2 font-mono"
          value={Number.isFinite(qv.value) ? qv.value : ""}
          onChange={(e) => set(field.key, { ...qv, value: e.target.value === "" ? NaN : Number(e.target.value) })}
        />
        <select className="input w-28 shrink-0 py-2" value={qv.unit} onChange={(e) => set(field.key, { ...qv, unit: e.target.value })}>
          {Object.entries(field.units).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
        </select>
      </div>
    </label>
  );
}

function PracticeInner({
  content,
  onEvent,
}: {
  content: PracticeContent;
  onEvent?: (e: ModuleEvent) => void;
}) {
  const topic = PRACTICE_TOPICS[content.topic];
  const goal = content.goal ?? 3;
  const [task, setTask] = useState<Task>(() => topic.createTask(topic.unknowns[0].value));
  const [step, setStep] = useState<"build" | "solve" | "result">("build");
  const [answer, setAnswer] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [done, setDone] = useState<Done[]>([]);

  const validation = useMemo(() => topic.validate(task), [topic, task]);
  const statement = validation.task ? topic.describe(validation.task) : null;
  const solvedCount = done.filter((d) => d.correct).length;

  const set = (k: string, v: unknown) => setTask((t) => ({ ...t, [k]: v }));
  const chooseUnknown = (u: string) => setTask(topic.createTask(u));

  function check() {
    const r = checkPractice(content.topic, validation.task, answer);
    setResult(r);
    setStep("result");
    if (r.ok) {
      setDone((d) => [...d, { statement: r.statement, correct: r.correct }]);
      onEvent?.({ type: "taskResult", data: { topic: content.topic, task: validation.task, answer, solutionText } });
    }
  }

  function newTask() {
    setAnswer("");
    setSolutionText("");
    setResult(null);
    setStep("build");
  }

  return (
    <div className="space-y-5">
      {/* Прогресс */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mist-50 px-4 py-3">
        <p className="text-sm text-slate-600">
          {content.intro ?? "Составь свою задачу: выбери, что нужно найти, и задай данные. Потом реши её — ответ проверит система."}
        </p>
        <div className="flex items-center gap-2 text-sm font-semibold text-ocean-800">
          {Array.from({ length: goal }, (_, i) => (
            <span key={i} className={`flex h-7 w-7 items-center justify-center rounded-full ${i < solvedCount ? "bg-sun-400 text-ocean-950" : "bg-white text-mist-300 ring-1 ring-mist-200"}`}>
              <Icon name="check" className="h-4 w-4" />
            </span>
          ))}
          <span>{solvedCount} из {goal}</span>
        </div>
      </div>

      {/* Шаги */}
      <ol className="flex gap-2 text-xs font-semibold">
        {[
          ["build", "1. Составь условие"],
          ["solve", "2. Реши"],
          ["result", "3. Проверка"],
        ].map(([k, l]) => (
          <li key={k} className={`rounded-full px-3 py-1 ${step === k ? "bg-ocean-700 text-white" : "bg-mist-100 text-slate-500"}`}>{l}</li>
        ))}
      </ol>

      {step === "build" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Что нужно найти?</span>
              <div className="flex flex-wrap gap-2">
                {topic.unknowns.map((u) => (
                  <button
                    key={u.value}
                    onClick={() => chooseUnknown(u.value)}
                    className={`rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition ${
                      task.unknown === u.value ? "border-ocean-700 bg-ocean-700 text-white" : "border-mist-200 bg-white text-ocean-800 hover:border-lagoon-500"
                    }`}
                  >
                    <Rich text={u.label} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {topic.fields(task as never).map((f) => <FieldInput key={f.key} field={f} task={task} set={set} />)}
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">В каких единицах ответ</span>
                <select className="input py-2" value={task.answerUnit} onChange={(e) => set("answerUnit", e.target.value)}>
                  {Object.entries(topic.answerUnits(task as never)).map(([k, u]) => <option key={k} value={k}>{u.label}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-xl bg-lagoon-50 p-3">
            <Illustration topic={content.topic} task={task} />
          </div>

          <div className="space-y-3 lg:col-span-2">
            <div className="rounded-xl border-2 border-dashed border-lagoon-200 bg-white p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-lagoon-700">Условие твоей задачи</div>
              {statement ? <p className="text-lg text-ocean-950"><Rich text={statement} /></p> : <p className="text-slate-400">Заполни данные — здесь появится текст задачи.</p>}
            </div>
            {validation.errors.map((e) => <p key={e} className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{e}</p>)}
            {validation.warnings.map((w) => <p key={w} className="rounded-lg bg-sun-50 px-3 py-2 text-sm text-sun-900">{w}</p>)}
            <div className="flex justify-end">
              <button disabled={!validation.task || validation.errors.length > 0} onClick={() => setStep("solve")} className="btn-primary">
                Задача готова — решать <Icon name="arrowRight" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "solve" && statement && (
        <div className="space-y-4">
          <div className="rounded-xl border-l-4 border-sun-400 bg-sun-50 p-4 text-lg text-ocean-950"><Rich text={statement} /></div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Решение (необязательно — его увидит учитель)</span>
            <textarea
              className="input h-28 font-mono text-sm"
              placeholder={"Дано: …\nСИ: …\nРешение: …"}
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Ответ</span>
              <div className="flex items-center gap-2">
                <input
                  inputMode="decimal"
                  className="input w-44 font-mono text-lg"
                  placeholder="0"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && answer.trim() && check()}
                  autoFocus
                />
                <span className="font-semibold text-slate-600">{topic.answerUnits(task as never)[task.answerUnit]?.label}</span>
              </div>
            </label>
            <button disabled={!answer.trim()} onClick={check} className="btn-primary">Проверить</button>
            <button onClick={() => setStep("build")} className="btn-ghost">Изменить условие</button>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          {!result.ok ? (
            <div className="rounded-xl bg-rose-50 p-4 text-rose-800">{result.errors.join(" ")}</div>
          ) : (
            <>
              <div className={`rounded-xl p-4 ${result.correct ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}>
                <div className="text-lg font-bold">{result.correct ? "Верно! Задача решена." : "Пока неверно."}</div>
                <div className="mt-1">
                  Твой ответ: <b>{fmt(result.answer)} {result.unitLabel}</b>
                  {!result.correct && <> · правильный ответ: <b>{fmt(result.expected)} {result.unitLabel}</b></>}
                </div>
                <div className="mt-1 text-sm opacity-80">Сложность задачи: {"★".repeat(result.difficulty)}{"☆".repeat(3 - result.difficulty)}</div>
              </div>
              <div className="rounded-xl bg-mist-50 p-4">
                <div className="mb-2 font-semibold text-ocean-900">Решение</div>
                <ol className="list-decimal space-y-1 pl-5 font-serif text-ocean-950">
                  {result.steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}
                </ol>
                {result.note && <p className="mt-2 text-sm text-ocean-800">{result.note}</p>}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {result.ok && !result.correct && (
              <button onClick={() => { setAnswer(""); setStep("solve"); }} className="btn-ghost">Попробовать ещё раз</button>
            )}
            <button onClick={newTask} className="btn-accent">
              <Icon name="plus" className="h-4 w-4" /> Составить новую задачу
            </button>
          </div>
        </div>
      )}

      {done.length > 0 && (
        <details className="rounded-xl border border-mist-100 p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-ocean-800">Мои задачи на этом уроке ({done.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {done.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className={d.correct ? "text-emerald-600" : "text-rose-600"}>{d.correct ? "✓" : "✗"}</span>
                <span className="text-slate-600"><Rich text={d.statement} /></span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function PracticeModule(props: { content: PracticeContent; onEvent?: (e: ModuleEvent) => void }) {
  if (!PRACTICE_TOPICS[props.content?.topic]) return <p className="text-slate-500">Неизвестная тема практики: {props.content?.topic}</p>;
  return <PracticeInner {...props} />;
}
