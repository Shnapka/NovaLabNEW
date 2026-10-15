"use client";
import { useState } from "react";
import Link from "next/link";
import { metaOf } from "@/lib/modules/meta";
import Rich from "./modules/Rich";

type Mod = {
  id: string;
  title: string;
  type: string;
  topic: string;
  topicId: number;
  section: string;
  grade: number;
  defaults: string;
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
  const [section, setSection] = useState("all");
  const [topicId, setTopicId] = useState<number | "all">("all");
  const [status, setStatus] = useState("");

  const byId = Object.fromEntries(props.modules.map((m) => [m.id, m]));
  const uniq = <T,>(xs: T[]) => [...new Set(xs)];
  const grades = uniq(props.modules.map((m) => m.grade)).sort((a, b) => a - b);
  const inGrade = props.modules.filter((m) => grade === "all" || m.grade === grade);
  const sections = uniq(inGrade.map((m) => m.section));
  const inSection = inGrade.filter((m) => section === "all" || m.section === section);
  const topics = uniq(inSection.map((m) => m.topicId)).map((id) => ({
    id,
    title: inSection.find((m) => m.topicId === id)!.topic,
  }));
  const visible = inSection.filter((m) => topicId === "all" || m.topicId === topicId);

  const add = (m: Mod) =>
    setBlocks([...blocks, { moduleId: m.id, config: m.type === "simulation" ? m.defaults : "{}" }]);
  const addTopic = (id: number) =>
    setBlocks([
      ...blocks,
      ...props.modules
        .filter((m) => m.topicId === id)
        .map((m) => ({ moduleId: m.id, config: m.type === "simulation" ? m.defaults : "{}" })),
    ]);
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
      return setStatus("Ошибка: в настройках одной из симуляций некорректный JSON");
    }
    setStatus("Сохраняю…");
    const r = await fetch(`/api/lessons/${props.lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, isPublished: published, blocks: parsed }),
    });
    setStatus(r.ok ? "Сохранено ✓" : "Ошибка сохранения");
  }

  const select = "input py-2 text-sm";

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-[340px_1fr]">
      {/* Модули из библиотеки */}
      <aside className="space-y-2 card p-4 md:self-start">
        <h2 className="font-bold text-ocean-900">Модули из библиотеки</h2>
        <select
          className={select}
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value === "all" ? "all" : Number(e.target.value));
            setSection("all");
            setTopicId("all");
          }}
        >
          <option value="all">Все классы</option>
          {grades.map((g) => <option key={g} value={g}>{g} класс</option>)}
        </select>
        <select
          className={select}
          value={section}
          onChange={(e) => {
            setSection(e.target.value);
            setTopicId("all");
          }}
        >
          <option value="all">Все разделы</option>
          {sections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className={select}
          value={topicId}
          onChange={(e) => setTopicId(e.target.value === "all" ? "all" : Number(e.target.value))}
        >
          <option value="all">Все темы</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        {topicId !== "all" && (
          <button onClick={() => addTopic(topicId)} className="w-full rounded bg-lagoon-50 py-1.5 text-sm text-ocean-700">
            + Добавить всю тему
          </button>
        )}
        <ul className="max-h-[60vh] space-y-2 overflow-y-auto pt-1">
          {visible.map((m) => (
            <li key={m.id} className="rounded-xl border border-mist-100 p-3 text-sm transition hover:border-lagoon-500">
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-xs ${metaOf(m.type).badge}`}>{metaOf(m.type).label}</span>
                <span className="font-medium"><Rich text={m.title} /></span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{m.grade} кл. · {m.topic}</div>
              <button onClick={() => add(m)} className="mt-1.5 text-sm font-semibold text-lagoon-700 hover:text-ocean-700">+ Добавить в урок</button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Урок */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            className="input flex-1 text-lg font-bold text-ocean-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Доступен ученикам по ссылке
          </label>
          <button onClick={save} className="btn-primary">Сохранить</button>
          <Link href={`/lesson/${props.lessonId}`} className="btn-ghost">Показать</Link>
        </div>
        {status && <p className="mb-3 text-sm text-slate-600">{status}</p>}

        {blocks.length === 0 && <p className="text-slate-500">Добавьте модули из списка слева.</p>}
        <ol className="space-y-3">
          {blocks.map((b, i) => {
            const m = byId[b.moduleId];
            return (
              <li key={i} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{i + 1}.</span>
                    {m && <span className={`rounded px-1.5 py-0.5 text-xs ${metaOf(m.type).badge}`}>{metaOf(m.type).label}</span>}
                    <span className="font-medium">{m ? <Rich text={m.title} /> : b.moduleId}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button onClick={() => move(i, -1)} aria-label="Выше">↑</button>
                    <button onClick={() => move(i, 1)} aria-label="Ниже">↓</button>
                    <button onClick={() => remove(i)} className="text-red-600">Удалить</button>
                  </div>
                </div>
                {m?.type === "simulation" && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-500">Настройки симуляции (JSON)</summary>
                    <textarea
                      className="input mt-1 h-32 font-mono text-xs"
                      value={b.config}
                      onChange={(e) => setConfig(i, e.target.value)}
                    />
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
