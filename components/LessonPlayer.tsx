"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { metaOf } from "@/lib/modules/meta";
import ModuleRenderer, { type RenderableModule } from "./modules/ModuleRenderer";
import Rich from "./modules/Rich";
import Icon from "./Icon";

type B = RenderableModule & { id: string };

export default function LessonPlayer({
  title,
  blocks,
  backHref,
}: {
  title: string;
  blocks: B[];
  backHref?: string;
}) {
  const [i, setI] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const b = blocks[i];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, blocks.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocks.length]);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen();
  }

  if (!b) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="card p-10">
          <h1 className="text-xl font-bold text-ocean-900">В уроке пока нет модулей</h1>
          {backHref && <Link href={backHref} className="btn-primary mt-6">Добавить модули</Link>}
        </div>
      </main>
    );
  }

  return (
    <div ref={rootRef} className="min-h-[calc(100vh-3.5rem)] overflow-y-auto bg-mist-50">
      <div className="bg-gradient-to-r from-ocean-900 to-ocean-700 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <h1 className="mr-auto text-xl font-extrabold">{title}</h1>
          <button onClick={toggleFullscreen} className="btn border border-white/25 text-white hover:bg-white/10">
            <Icon name="expand" className="h-4 w-4" /> На весь экран
          </button>
          {backHref && (
            <Link href={backHref} className="btn text-aqua-200 hover:bg-white/10 hover:text-white">
              <Icon name="arrowLeft" className="h-4 w-4" /> Закрыть показ
            </Link>
          )}
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          {blocks.map((x, k) => (
            <button
              key={x.id}
              onClick={() => setI(k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                k === i ? "bg-sun-400 text-ocean-950" : k < i ? "bg-white/15 text-white" : "text-aqua-200 hover:bg-white/10"
              }`}
            >
              <Icon name={x.type} className="h-4 w-4" />
              {k + 1}. {metaOf(x.type).label}
            </button>
          ))}
        </div>
        <div className="h-1 bg-ocean-950/40">
          <div className="h-full bg-sun-400 transition-all" style={{ width: `${((i + 1) / blocks.length) * 100}%` }} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="card p-5 sm:p-7">
          <h2 className="mb-5 text-2xl font-extrabold text-ocean-900"><Rich text={b.title} /></h2>
          {/* key заставляет создать модуль заново: старый Unity-инстанс уничтожается */}
          <ModuleRenderer key={b.id} module={b} onEvent={(e) => console.log("событие модуля:", e)} />
        </section>

        <div className="mt-5 flex items-center justify-between">
          <button disabled={i === 0} onClick={() => setI(i - 1)} className="btn-ghost">
            <Icon name="arrowLeft" className="h-4 w-4" /> Назад
          </button>
          <span className="text-sm text-slate-500">Шаг {i + 1} из {blocks.length} · листайте стрелками ← →</span>
          <button disabled={i === blocks.length - 1} onClick={() => setI(i + 1)} className="btn-primary">
            Далее <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
