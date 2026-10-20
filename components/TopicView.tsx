"use client";
import { useEffect, useState } from "react";
import { metaOf } from "@/lib/modules/meta";
import ModuleRenderer, { type RenderableModule } from "./modules/ModuleRenderer";
import Rich from "./modules/Rich";
import Icon from "./Icon";

// «Квиз: архимедова сила» → «Архимедова сила»: тип уже показан отдельной меткой
const shortTitle = (t: string) => {
  const s = t.replace(/^[^:]+:\s*/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export type TopicModule = RenderableModule & { id: string; description: string | null };

export default function TopicView({ modules }: { modules: TopicModule[] }) {
  const [selected, setSelected] = useState(
    () => modules.find((m) => m.type === "simulation")?.id ?? modules[0].id
  );
  const [visited, setVisited] = useState<string[]>([]);
  const index = modules.findIndex((m) => m.id === selected);
  const m = modules[index];

  useEffect(() => {
    setVisited((v) => (v.includes(selected) ? v : [...v, selected]));
  }, [selected]);

  // ← → переключают модули, если фокус не в поле ввода
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight" && index < modules.length - 1) setSelected(modules[index + 1].id);
      if (e.key === "ArrowLeft" && index > 0) setSelected(modules[index - 1].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, modules]);

  const go = (i: number) => {
    setSelected(modules[i].id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Телефон/планшет: компактная лента шагов */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
        {modules.map((mod, i) => {
          const active = mod.id === selected;
          return (
            <button
              key={mod.id}
              onClick={() => go(i)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
                active ? "bg-ocean-700 text-white" : "bg-white text-ocean-800 ring-1 ring-mist-200"
              }`}
            >
              <Icon name={mod.type} className={`h-4 w-4 ${active && mod.type === "simulation" ? "text-sun-400" : ""}`} />
              {metaOf(mod.type).label}
              {visited.includes(mod.id) && !active && <Icon name="check" className="h-3.5 w-3.5 text-emerald-600" />}
            </button>
          );
        })}
      </div>

      <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
        <div className="card p-3">
          <div className="px-2 pb-3 pt-1">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Прогресс по теме</span>
              <span className="text-ocean-700">{visited.length} из {modules.length}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist-100">
              <div className="h-full rounded-full bg-sun-400 transition-all" style={{ width: `${(visited.length / modules.length) * 100}%` }} />
            </div>
          </div>
          <ol className="space-y-1">
            {modules.map((mod, i) => {
              const meta = metaOf(mod.type);
              const active = mod.id === selected;
              const isSim = mod.type === "simulation";
              const seen = visited.includes(mod.id) && !active;
              return (
                <li key={mod.id}>
                  <button
                    onClick={() => go(i)}
                    className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition ${
                      active
                        ? isSim
                          ? "bg-ocean-700 text-white shadow-md"
                          : "bg-lagoon-50 ring-2 ring-lagoon-500"
                        : "hover:bg-mist-50"
                    }`}
                  >
                    <span
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        active && isSim ? "bg-white/15 text-sun-400" : meta.tile
                      }`}
                    >
                      <Icon name={mod.type} className="h-5 w-5" />
                      {seen && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                          <Icon name="check" className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-xs font-semibold">
                        <span className={active && isSim ? "text-aqua-200" : "text-slate-400"}>{i + 1}. {meta.label}</span>
                      </span>
                      <span className={`mt-0.5 block text-sm font-semibold leading-snug ${active && isSim ? "" : "text-ocean-900"}`}>
                        <Rich text={shortTitle(mod.title)} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-3 hidden px-2 text-xs text-slate-400 lg:block">
          Подсказка: модули можно листать стрелками ← → на клавиатуре
        </p>
      </aside>

      <section className="card min-w-0 p-5 sm:p-7">
        <header className="mb-5 flex items-start gap-3 border-b border-mist-100 pb-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${metaOf(m.type).tile}`}>
            <Icon name={m.type} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-ocean-900"><Rich text={m.title} /></h2>
            {m.description && <p className="text-sm text-slate-500"><Rich text={m.description} /></p>}
          </div>
        </header>

        {/* key пересоздаёт модуль при переключении: iframe с WebGL выгружается из памяти */}
        <ModuleRenderer key={m.id} module={m} />

        <footer className="mt-8 flex items-center justify-between gap-3 border-t border-mist-100 pt-5">
          <button disabled={index === 0} onClick={() => go(index - 1)} className="btn-ghost">
            <Icon name="arrowLeft" className="h-4 w-4" />
            {index > 0 ? metaOf(modules[index - 1].type).label : "Назад"}
          </button>
          <span className="hidden text-sm text-slate-400 sm:block">{index + 1} / {modules.length}</span>
          {index < modules.length - 1 ? (
            <button onClick={() => go(index + 1)} className="btn-primary">
              {metaOf(modules[index + 1].type).label}
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          ) : (
            <span className="pill bg-emerald-50 py-1.5 text-emerald-700">
              <Icon name="check" className="h-4 w-4" /> Последний модуль
            </span>
          )}
        </footer>
      </section>
    </div>
  );
}
