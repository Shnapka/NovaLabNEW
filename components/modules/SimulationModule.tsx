"use client";
import type { SimulationContent } from "@/lib/modules/types";
import ModuleFrame, { type ModuleEvent } from "@/components/ModuleFrame";
import Rich from "./Rich";

export default function SimulationModule({
  title,
  buildUrl,
  content,
  config,
  onEvent,
}: {
  title: string;
  buildUrl: string | null;
  content: SimulationContent;
  config: unknown;
  onEvent?: (e: ModuleEvent) => void;
}) {
  const isPlaceholder = !buildUrl || buildUrl.includes("/modules/placeholder/");
  const src = buildUrl ? `${buildUrl}?title=${encodeURIComponent(title)}` : null;

  return (
    <div className="space-y-5">
      {src ? (
        <ModuleFrame
          src={src}
          config={config}
          onEvent={onEvent}
          label={isPlaceholder ? "Заглушка: WebGL-билд в разработке" : "Интерактивная симуляция · можно открыть на весь экран"}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-ocean-950 text-slate-400">
          Билд симуляции не подключён
        </div>
      )}

      <div className="rounded-xl border border-sun-100 bg-sun-50 p-4 text-ocean-950">
        <span className="font-semibold">Цель: </span>
        <Rich text={content.goal} />
      </div>

      <section className="rounded-xl bg-mist-50 p-4 text-slate-700">
        <h3 className="mb-1 font-semibold text-ocean-900">Что в симуляции</h3>
        <p><Rich text={content.scene} /></p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <h3 className="mb-2 font-semibold text-ocean-900">Задания для учеников</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-slate-700">
            {content.tasks.map((t, i) => <li key={i}><Rich text={t} /></li>)}
          </ol>
        </section>
        <section>
          <h3 className="mb-2 font-semibold text-ocean-900">На что обратить внимание</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
            {content.observe.map((t, i) => <li key={i}><Rich text={t} /></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
