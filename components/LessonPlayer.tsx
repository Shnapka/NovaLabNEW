"use client";
import { useState } from "react";
import Link from "next/link";
import { metaOf } from "@/lib/modules/meta";
import ModuleRenderer, { type RenderableModule } from "./modules/ModuleRenderer";
import Rich from "./modules/Rich";

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
  const b = blocks[i];

  if (!b) return <main className="p-10 text-center text-gray-500">В уроке пока нет модулей</main>;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {backHref && <Link href={backHref} className="text-sm text-indigo-600 hover:underline">← Выйти из режима показа</Link>}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {blocks.map((x, k) => (
          <button
            key={x.id}
            onClick={() => setI(k)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              k === i ? "border-indigo-600 bg-indigo-600 text-white" : "bg-white hover:border-indigo-400"
            }`}
          >
            {k + 1}. {metaOf(x.type).label}
          </button>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold"><Rich text={b.title} /></h2>
        {/* key заставляет создать модуль заново: старый Unity-инстанс уничтожается */}
        <ModuleRenderer key={b.id} module={b} onEvent={(e) => console.log("событие модуля:", e)} />
      </section>

      <div className="mt-4 flex justify-between">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded border bg-white px-4 py-2 disabled:opacity-40">
          ← Назад
        </button>
        <span className="self-center text-sm text-gray-500">Шаг {i + 1} из {blocks.length}</span>
        <button
          disabled={i === blocks.length - 1}
          onClick={() => setI(i + 1)}
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-40"
        >
          Далее →
        </button>
      </div>
    </main>
  );
}
