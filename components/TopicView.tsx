"use client";
import { useState } from "react";
import { metaOf } from "@/lib/modules/meta";
import ModuleRenderer, { type RenderableModule } from "./modules/ModuleRenderer";
import Rich from "./modules/Rich";

export type TopicModule = RenderableModule & { id: string; description: string | null };

export default function TopicView({ modules }: { modules: TopicModule[] }) {
  const [selected, setSelected] = useState(
    () => modules.find((m) => m.type === "simulation")?.id ?? modules[0].id
  );
  const index = modules.findIndex((m) => m.id === selected);
  const m = modules[index];

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-2 lg:sticky lg:top-4 lg:self-start">
        {modules.map((mod) => {
          const meta = metaOf(mod.type);
          const active = mod.id === selected;
          const isSim = mod.type === "simulation";
          return (
            <button
              key={mod.id}
              onClick={() => setSelected(mod.id)}
              className={`w-full rounded-xl border-2 p-3 text-left transition ${
                active
                  ? isSim
                    ? "border-indigo-600 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg"
                    : "border-indigo-500 bg-indigo-50"
                  : isSim
                    ? "border-indigo-200 bg-indigo-50 hover:border-indigo-400"
                    : "border-transparent bg-white hover:border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${active && isSim ? "bg-white/20 text-white" : meta.badge}`}>
                  {meta.label}
                </span>
                {isSim && <span className={`text-xs font-semibold ${active ? "text-indigo-100" : "text-indigo-600"}`}>★ главное</span>}
              </div>
              <div className="mt-1 text-sm font-medium"><Rich text={mod.title} /></div>
              {mod.description && (
                <div className={`mt-0.5 text-xs ${active && isSim ? "text-indigo-100" : "text-gray-500"}`}>
                  <Rich text={mod.description} />
                </div>
              )}
            </button>
          );
        })}
      </aside>

      <section className="min-w-0 rounded-xl border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${metaOf(m.type).badge}`}>{metaOf(m.type).label}</span>
          <h2 className="text-xl font-semibold"><Rich text={m.title} /></h2>
        </div>
        {/* key пересоздаёт модуль при переключении: iframe с WebGL выгружается из памяти */}
        <ModuleRenderer key={m.id} module={m} />
        <div className="mt-6 flex justify-between border-t pt-4">
          <button
            disabled={index === 0}
            onClick={() => setSelected(modules[index - 1].id)}
            className="rounded border px-4 py-2 text-sm disabled:opacity-30"
          >
            ← {index > 0 ? metaOf(modules[index - 1].type).label : "Назад"}
          </button>
          <button
            disabled={index === modules.length - 1}
            onClick={() => setSelected(modules[index + 1].id)}
            className="rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-30"
          >
            {index < modules.length - 1 ? metaOf(modules[index + 1].type).label : "Далее"} →
          </button>
        </div>
      </section>
    </div>
  );
}
