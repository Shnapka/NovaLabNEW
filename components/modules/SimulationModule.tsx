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
      <div className="relative">
        {src ? (
          <ModuleFrame src={src} config={config} onEvent={onEvent} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg bg-ocean-950 text-slate-400">
            Билд симуляции не подключён
          </div>
        )}
        {isPlaceholder && (
          <span className="absolute right-3 top-3 rounded-full bg-sun-400 px-3 py-1 text-xs font-semibold text-ocean-950 shadow">
            WebGL-билд в разработке
          </span>
        )}
      </div>

      <div className="rounded-lg bg-lagoon-50 p-4 text-ocean-950">
        <span className="font-semibold">Цель: </span>
        <Rich text={content.goal} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <h3 className="mb-2 font-semibold">Задания для учеников</h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-slate-700">
            {content.tasks.map((t, i) => <li key={i}><Rich text={t} /></li>)}
          </ol>
        </section>
        <section>
          <h3 className="mb-2 font-semibold">На что обратить внимание</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
            {content.observe.map((t, i) => <li key={i}><Rich text={t} /></li>)}
          </ul>
        </section>
      </div>

      <details className="rounded-lg border bg-mist-50 p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-700">
          Описание сцены и техническое задание для WebGL (Unity)
        </summary>
        <div className="mt-3 space-y-3 text-slate-700">
          <p><Rich text={content.scene} /></p>
          <div>
            <div className="mb-1 font-medium">Управление в симуляции</div>
            <table className="w-full">
              <tbody>
                {content.controls.map((c) => (
                  <tr key={c.key} className="border-b last:border-0">
                    <td className="py-1 pr-3 font-mono text-xs text-ocean-700">{c.key}</td>
                    <td className="py-1 pr-3"><Rich text={c.label} /></td>
                    <td className="py-1 text-slate-500">
                      {c.kind === "slider" && `слайдер ${c.min}…${c.max} ${c.unit ?? ""}`}
                      {c.kind === "toggle" && "переключатель"}
                      {c.kind === "select" && c.options?.map((o) => o.label).join(" / ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="mb-1 font-medium">Настройки, которые сайт передаёт в Init(json)</div>
            <pre className="overflow-x-auto rounded bg-white p-2 text-xs">{JSON.stringify(config, null, 2)}</pre>
          </div>
          {content.events && (
            <div>
              <div className="mb-1 font-medium">События модуля → сайт (Emit)</div>
              <ul className="space-y-0.5">
                {content.events.map((e) => (
                  <li key={e.type}>
                    <span className="font-mono text-xs text-ocean-700">{e.type}</span> — {e.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
