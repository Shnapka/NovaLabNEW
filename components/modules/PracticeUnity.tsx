"use client";
import { useRef, useState } from "react";
import type { PracticeContent } from "@/lib/modules/types";
import { SOLUTION_MAX } from "@/lib/practice/common";
import ModuleFrame, { type ModuleEvent } from "@/components/ModuleFrame";
import Rich from "./Rich";

// Практика «составь и реши» в виде Unity-симуляции + инструкция под ней
export default function PracticeUnity({
  buildUrl,
  content,
  config,
  onEvent,
}: {
  buildUrl: string;
  content: PracticeContent;
  config: unknown;
  onEvent?: (e: ModuleEvent) => void;
}) {
  const guide = content.guide;
  // Решение ученик пишет здесь, а ответ вводит в симуляции. Когда симуляция присылает результат задачи,
  // решение прикрепляется к нему и поле очищается для следующей задачи.
  const [solution, setSolution] = useState("");
  const solutionRef = useRef(solution);
  solutionRef.current = solution;
  const [attached, setAttached] = useState(false);

  function handle(e: ModuleEvent) {
    if (e.type === "taskResult") {
      const data = { ...((e.data ?? {}) as Record<string, unknown>) };
      const mine = solutionRef.current.trim();
      const fromSim = typeof data.solutionText === "string" ? data.solutionText.trim() : "";
      data.solutionText = [mine, fromSim && fromSim !== mine ? fromSim : ""].filter(Boolean).join("\n\n");
      if (mine) {
        setSolution("");
        setAttached(true);
        setTimeout(() => setAttached(false), 4000);
      }
      onEvent?.({ ...e, data });
      return;
    }
    onEvent?.(e);
  }

  return (
    <div className="space-y-5">
      <ModuleFrame
        src={buildUrl}
        config={{ ...(config as object), topic: content.topic, goal: content.goal ?? 3 }}
        onEvent={handle}
        label="Практическая симуляция · ответы проверяет система"
      />

      <label className="block rounded-xl border border-mist-100 bg-white p-4">
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold text-ocean-900">Моё решение</span>
          <span className="text-xs text-slate-500">прикрепится к задаче, когда ты нажмёшь «Проверить» в симуляции · его увидит учитель</span>
        </span>
        <textarea
          className="input mt-2 h-32 font-mono text-sm"
          maxLength={SOLUTION_MAX}
          placeholder={"Дано: …\nСИ: …\nРешение: …\nОтвет: …"}
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
        />
        {attached && <span className="mt-1 block text-sm font-semibold text-emerald-700">✓ Решение прикреплено к задаче</span>}
      </label>

      {content.intro && (
        <div className="rounded-xl border border-sun-100 bg-sun-50 p-4 text-ocean-950">
          <span className="font-semibold">Задание: </span>
          <Rich text={content.intro} />
        </div>
      )}

      {guide && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 font-semibold text-ocean-900">Как работать</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-slate-700">
              {guide.steps.map((t, i) => <li key={i}><Rich text={t} /></li>)}
            </ol>
          </section>
          <section>
            <h3 className="mb-2 font-semibold text-ocean-900">На что обратить внимание</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
              {guide.observe.map((t, i) => <li key={i}><Rich text={t} /></li>)}
            </ul>
          </section>
        </div>
      )}

      {guide?.tips && guide.tips.length > 0 && (
        <div className="rounded-xl bg-mist-50 p-4 text-sm text-slate-600">
          <div className="mb-1 font-semibold text-ocean-800">Советы</div>
          <ul className="list-disc space-y-1 pl-5">
            {guide.tips.map((t, i) => <li key={i}><Rich text={t} /></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
