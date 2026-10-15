"use client";
import type { PracticeContent } from "@/lib/modules/types";
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
  return (
    <div className="space-y-5">
      <ModuleFrame
        src={buildUrl}
        config={{ ...(config as object), topic: content.topic, goal: content.goal ?? 3 }}
        onEvent={onEvent}
        label="Практическая симуляция · ответы проверяет система"
      />

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
