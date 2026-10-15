"use client";
import { useState } from "react";
import Link from "next/link";

type Mod = {
  id: string; title: string; type: string;
  topic: string; section: string; grade: number; schemaHint: string;
};
type Block = { moduleId: string; config: string };

export default function LessonBuilder(props: {
  lessonId: string;
  initialTitle: string;
  initialPublished: boolean;
  initialBlocks: Block[];
  modules: Mod[];
}) {
  const [title, setTitle] = useState(props.initialTitle);
  const [published, setPublished] = useState(props.initialPublished);
  const [blocks, setBlocks] = useState<Block[]>(props.initialBlocks);
  const [grade, setGrade] = useState<number | "all">("all");
  const [status, setStatus] = useState("");

  const byId = Object.fromEntries(props.modules.map((m) => [m.id, m]));
  const grades = [...new Set(props.modules.map((m) => m.grade))].sort((a, b) => a - b);
  const visible = props.modules.filter((m) => grade === "all" || m.grade === grade);

  const add = (m: Mod) => setBlocks([...blocks, { moduleId: m.id, config: "{}" }]);
  const remove = (i: number) => setBlocks(blocks.filter((_, idx) => idx !== i));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const copy = [...blocks];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setBlocks(copy);
  };
  const setConfig = (i: number, config: string) =>
    setBlocks(blocks.map((b, idx) => (idx === i ? { ...b, config } : b)));

  async function save() {
    let parsed;
    try {
      parsed = blocks.map((b) => ({ moduleId: b.moduleId, config: JSON.parse(b.config || "{}") }));
    } catch {
      return setStatus("Ошибка: в настройках одного из блоков некорректный JSON");
    }
    setStatus("Сохраняю…");
    const r = await fetch(`/api/lessons/${props.lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, isPublished: published, blocks: parsed }),
    });
    setStatus(r.ok ? "Сохранено ✓" : "Ошибка сохранения");
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-[320px_1fr]">
      {/* Каталог */}
      <aside className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold">Модули</h2>
        <select
          className="mb-3 w-full rounded border p-2 text-sm"
          value={grade}
          onChange={(e) => setGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
        >
          <option value="all">Все классы</option>
          {grades.map((g) => <option key={g} value={g}>{g} класс</option>)}
        </select>
        <ul className="space-y-2">
          {visible.map((m) => (
            <li key={m.id} className="rounded border p-2 text-sm">
              <div className="font-medium">{m.title}</div>
              <div className="text-xs text-gray-500">{m.grade} кл. · {m.section} · {m.topic} · {m.type}</div>
              <button onClick={() => add(m)} className="mt-1 text-blue-600">+ Добавить в урок</button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Урок */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            className="flex-1 rounded border px-3 py-2 text-lg font-semibold"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Доступен по ссылке
          </label>
          <button onClick={save} className="rounded bg-blue-600 px-4 py-2 text-white">Сохранить</button>
          <Link href={`/lesson/${props.lessonId}`} className="text-sm text-blue-600">Показать</Link>
        </div>
        {status && <p className="mb-3 text-sm text-gray-600">{status}</p>}

        {blocks.length === 0 && <p className="text-gray-500">Добавьте модули из списка слева.</p>}
        <ol className="space-y-3">
          {blocks.map((b, i) => {
            const m = byId[b.moduleId];
            return (
              <li key={i} className="rounded-lg border bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">{i + 1}. {m?.title ?? b.moduleId}</div>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => move(i, -1)}>↑</button>
                    <button onClick={() => move(i, 1)}>↓</button>
                    <button onClick={() => remove(i)} className="text-red-600">Удалить</button>
                  </div>
                </div>
                <div className="mb-1 text-xs text-gray-400">Доступные параметры: {m?.schemaHint}</div>
                <textarea
                  className="h-24 w-full rounded border p-2 font-mono text-xs"
                  value={b.config}
                  onChange={(e) => setConfig(i, e.target.value)}
                />
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
