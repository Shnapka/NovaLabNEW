"use client";
import { useState } from "react";
import ModuleFrame from "./ModuleFrame";

type B = { id: string; title: string; src: string; config: unknown };

export default function LessonPlayer({ title, blocks }: { title: string; blocks: B[] }) {
  const [i, setI] = useState(0);
  const b = blocks[i];

  if (!b) return <main className="p-10 text-center text-gray-500">В уроке пока нет модулей</main>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">{title}</h1>
      <p className="mb-4 text-sm text-gray-500">Шаг {i + 1} из {blocks.length}: {b.title}</p>

      {/* key заставляет создать новый iframe: старый Unity-инстанс уничтожается */}
      <ModuleFrame
        key={b.id}
        src={b.src}
        config={b.config}
        onEvent={(e) => console.log("событие модуля:", e)}
      />

      <div className="mt-4 flex justify-between">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded border px-4 py-2 disabled:opacity-40">
          ← Назад
        </button>
        <button disabled={i === blocks.length - 1} onClick={() => setI(i + 1)} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40">
          Далее →
        </button>
      </div>
    </main>
  );
}
