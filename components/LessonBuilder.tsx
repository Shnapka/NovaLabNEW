"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { metaOf } from "@/lib/modules/meta";
import { EDITABLE_TYPES, validateOverride, type BlockOverride } from "@/lib/modules/overrides";
import { plural } from "@/lib/plural";
import Rich from "./modules/Rich";
import Icon from "./Icon";
import ContentEditorModal from "./editors/ContentEditorModal";

type Mod = {
  id: string;
  title: string;
  type: string;
  topic: string;
  topicId: number;
  section: string;
  grade: number;
  defaults: string;
  content?: unknown; // для квиза и карточек — стандартное содержимое (основа для своих вопросов)
};
type Block = { key: string; moduleId: string; config: string };
type Drag = { kind: "block"; index: number } | { kind: "module"; id: string } | null;

let keySeq = 0;
const newKey = () => `b${++keySeq}`;
const parseConfig = (s: string): BlockOverride => {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
};

export default function LessonBuilder(props: {
  lessonId: string;
  initialTitle: string;
  initialPublished: boolean;
  initialBlocks: { moduleId: string; config: string }[];
  modules: Mod[];
  usage: { classes: number; results: number }; // для предупреждения при удалении
}) {
  const router = useRouter();
  const [title, setTitle] = useState(props.initialTitle);
  const [published, setPublished] = useState(props.initialPublished);
  const [blocks, setBlocks] = useState<Block[]>(() => props.initialBlocks.map((b) => ({ ...b, key: newKey() })));
  const [grade, setGrade] = useState<number | "all">("all");
  const [section, setSection] = useState("all");
  const [topicId, setTopicId] = useState<number | "all">("all");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const savedRef = useRef(JSON.stringify({ t: props.initialTitle, p: props.initialPublished, b: props.initialBlocks }));

  const snapshot = JSON.stringify({ t: title, p: published, b: blocks.map(({ moduleId, config }) => ({ moduleId, config })) });
  const dirty = snapshot !== savedRef.current;

  // Не потерять несохранённые изменения при закрытии вкладки
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const byId = Object.fromEntries(props.modules.map((m) => [m.id, m]));
  const uniq = <T,>(xs: T[]) => [...new Set(xs)];
  const grades = uniq(props.modules.map((m) => m.grade)).sort((a, b) => a - b);
  const inGrade = props.modules.filter((m) => grade === "all" || m.grade === grade);
  const sections = uniq(inGrade.map((m) => m.section));
  const inSection = inGrade.filter((m) => section === "all" || m.section === section);
  const topics = uniq(inSection.map((m) => m.topicId)).map((id) => ({ id, title: inSection.find((m) => m.topicId === id)!.topic }));
  const visible = inSection.filter((m) => topicId === "all" || m.topicId === topicId);

  const blockFor = (m: Mod): Block => ({ key: newKey(), moduleId: m.id, config: m.type === "simulation" || m.type === "practice" ? m.defaults : "{}" });
  const insert = (m: Mod, at = blocks.length) => setBlocks((bs) => [...bs.slice(0, at), blockFor(m), ...bs.slice(at)]);
  const addTopic = (id: number) => setBlocks((bs) => [...bs, ...props.modules.filter((m) => m.topicId === id).map(blockFor)]);
  const remove = (i: number) => setBlocks((bs) => bs.filter((_, k) => k !== i));
  const moveTo = (from: number, to: number) =>
    setBlocks((bs) => {
      const c = [...bs];
      const [item] = c.splice(from, 1);
      c.splice(to > from ? to - 1 : to, 0, item);
      return c;
    });
  const setConfig = (i: number, config: string) => setBlocks((bs) => bs.map((b, k) => (k === i ? { ...b, config } : b)));

  // --- перетаскивание ---
  function onItemDragOver(e: React.DragEvent, i: number) {
    if (!drag) return;
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropAt(e.clientY < r.top + r.height / 2 ? i : i + 1);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (drag && dropAt !== null) {
      if (drag.kind === "block" && drag.index !== dropAt && drag.index + 1 !== dropAt) moveTo(drag.index, dropAt);
      if (drag.kind === "module") insert(byId[drag.id], dropAt);
    }
    setDrag(null);
    setDropAt(null);
  }
  const endDrag = () => {
    setDrag(null);
    setDropAt(null);
  };

  async function save() {
    let parsed;
    try {
      parsed = blocks.map((b) => ({ moduleId: b.moduleId, config: JSON.parse(b.config || "{}") }));
    } catch {
      return setStatus({ ok: false, text: "В настройках одной из симуляций некорректный JSON" });
    }
    for (const [i, b] of parsed.entries()) {
      const errs = validateOverride(byId[b.moduleId]?.type ?? "", b.config);
      if (errs.length) return setStatus({ ok: false, text: `Модуль ${i + 1}: ${errs[0]}` });
    }
    setStatus({ ok: true, text: "Сохраняю…" });
    const r = await fetch(`/api/lessons/${props.lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, isPublished: published, blocks: parsed }),
    });
    if (r.ok) {
      savedRef.current = snapshot;
      setStatus({ ok: true, text: "Сохранено ✓" });
    } else {
      const d = await r.json().catch(() => ({}));
      setStatus({ ok: false, text: d.error ?? "Ошибка сохранения" });
    }
  }

  async function deleteLesson() {
    const warn = [
      `Удалить урок «${title}» навсегда?`,
      props.usage.classes ? `Он исчезнет у ${plural(props.usage.classes, ["класса", "классов", "классов"])}.` : "",
      props.usage.results ? `Будут удалены и результаты учеников по нему: ${props.usage.results}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
    if (!confirm(warn)) return;
    const r = await fetch(`/api/lessons/${props.lessonId}`, { method: "DELETE" });
    if (r.ok) {
      savedRef.current = snapshot; // чтобы не спрашивать о несохранённых изменениях
      router.push("/dashboard");
      router.refresh();
    } else setStatus({ ok: false, text: "Не удалось удалить урок" });
  }

  const select = "input py-2 text-sm";
  const editingBlock = editing !== null ? blocks[editing] : null;
  const editingMod = editingBlock ? byId[editingBlock.moduleId] : null;

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[340px_1fr]">
      {/* Модули из библиотеки */}
      <aside className="card space-y-2 p-4 md:sticky md:top-20 md:self-start">
        <h2 className="font-bold text-ocean-900">Модули из библиотеки</h2>
        <p className="text-xs text-slate-500">Перетащите модуль в урок справа или нажмите «+ Добавить».</p>
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
        <select className={select} value={topicId} onChange={(e) => setTopicId(e.target.value === "all" ? "all" : Number(e.target.value))}>
          <option value="all">Все темы</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        {topicId !== "all" && (
          <button onClick={() => addTopic(topicId)} className="btn-ghost w-full">+ Добавить всю тему</button>
        )}
        <ul className="max-h-[55vh] space-y-2 overflow-y-auto pt-1">
          {visible.map((m) => (
            <li
              key={m.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", m.id);
                e.dataTransfer.effectAllowed = "copy";
                setDrag({ kind: "module", id: m.id });
              }}
              onDragEnd={endDrag}
              className="cursor-grab rounded-xl border border-mist-100 bg-white p-3 text-sm transition hover:border-lagoon-500 active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <span className="text-mist-300">⠿</span>
                <span className={`rounded px-1.5 py-0.5 text-xs ${metaOf(m.type).badge}`}>{metaOf(m.type).label}</span>
                <span className="font-medium"><Rich text={m.title} /></span>
              </div>
              <div className="mt-0.5 pl-5 text-xs text-slate-500">{m.grade} кл. · {m.topic}</div>
              <button onClick={() => insert(m)} className="mt-1.5 pl-5 text-sm font-semibold text-lagoon-700 hover:text-ocean-700">+ Добавить в урок</button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Урок */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input className="input flex-1 text-lg font-bold text-ocean-900" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-ocean-700" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Доступен по ссылке
          </label>
          <button onClick={save} className="btn-primary">
            Сохранить{dirty && <span className="h-2 w-2 rounded-full bg-sun-400" title="Есть несохранённые изменения" />}
          </button>
          <Link href={`/lesson/${props.lessonId}`} className="btn-ghost">Показать</Link>
        </div>
        {status && <p className={`mb-3 text-sm ${status.ok ? "text-slate-600" : "text-rose-600"}`}>{status.text}</p>}
        {dirty && !status && <p className="mb-3 text-sm text-sun-600">Есть несохранённые изменения</p>}

        <ol
          className={`space-y-2 rounded-2xl p-1 transition ${drag ? "bg-lagoon-50/60 outline-dashed outline-2 outline-lagoon-500" : ""}`}
          onDragOver={(e) => {
            if (!drag) return;
            e.preventDefault();
            if (blocks.length === 0) setDropAt(0);
          }}
          onDrop={onDrop}
        >
          {blocks.length === 0 && (
            <li className="rounded-xl border-2 border-dashed border-mist-200 p-8 text-center text-slate-500">
              Перетащите сюда модули из библиотеки слева
            </li>
          )}
          {blocks.map((b, i) => {
            const m = byId[b.moduleId];
            const o = parseConfig(b.config);
            const editable = m && EDITABLE_TYPES.includes(m.type);
            const custom = editable && !!o.content;
            const count = custom
              ? m.type === "quiz"
                ? plural((o.content as { questions: unknown[] }).questions.length, ["вопрос", "вопроса", "вопросов"])
                : plural((o.content as { pairs: unknown[] }).pairs.length, ["пара", "пары", "пар"])
              : null;
            return (
              <li key={b.key} onDragOver={(e) => onItemDragOver(e, i)} className="relative">
                {dropAt === i && <div className="absolute -top-1.5 left-2 right-2 h-1 rounded-full bg-lagoon-500" />}
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", b.key);
                    e.dataTransfer.effectAllowed = "move";
                    setDrag({ kind: "block", index: i });
                  }}
                  onDragEnd={endDrag}
                  className={`card p-4 transition ${drag?.kind === "block" && drag.index === i ? "opacity-40" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="cursor-grab select-none text-lg leading-none text-mist-300 active:cursor-grabbing" title="Перетащите, чтобы изменить порядок">⠿</span>
                      <span className="text-slate-400">{i + 1}.</span>
                      {m && <span className={`rounded px-1.5 py-0.5 text-xs ${metaOf(m.type).badge}`}>{metaOf(m.type).label}</span>}
                      <span className="truncate font-medium">{m ? <Rich text={o.title || m.title} /> : b.moduleId}</span>
                      {custom && <span className="pill bg-sun-100 text-sun-900">свои · {count}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {editable && (
                        <button onClick={() => setEditing(i)} className="btn-ghost px-2.5 py-1">
                          <Icon name="edit" className="h-3.5 w-3.5" /> {custom ? "Изменить" : "Свои вопросы"}
                        </button>
                      )}
                      <button onClick={() => i > 0 && moveTo(i, i - 1)} className="rounded px-2 py-1 hover:bg-mist-50" aria-label="Выше">↑</button>
                      <button onClick={() => i < blocks.length - 1 && moveTo(i, i + 2)} className="rounded px-2 py-1 hover:bg-mist-50" aria-label="Ниже">↓</button>
                      <button onClick={() => remove(i)} className="rounded px-2 py-1 text-rose-600 hover:bg-rose-50">Убрать</button>
                    </div>
                  </div>
                  {m?.type === "simulation" && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-slate-500">Настройки симуляции (JSON)</summary>
                      <textarea className="input mt-1 h-32 font-mono text-xs" value={b.config} onChange={(e) => setConfig(i, e.target.value)} />
                    </details>
                  )}
                </div>
                {dropAt === blocks.length && i === blocks.length - 1 && <div className="mt-1 h-1 rounded-full bg-lagoon-500" />}
              </li>
            );
          })}
        </ol>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 p-4">
          <div className="text-sm text-slate-500">
            Удаление урока нельзя отменить
            {props.usage.results > 0 && <> — вместе с ним удалятся результаты учеников ({props.usage.results})</>}.
          </div>
          <button onClick={deleteLesson} className="btn border border-rose-200 bg-white text-rose-600 hover:bg-rose-50">Удалить урок</button>
        </div>
      </section>

      {editing !== null && editingBlock && editingMod && (
        <ContentEditorModal
          type={editingMod.type as "quiz" | "matching"}
          libraryTitle={editingMod.title}
          libraryContent={editingMod.content}
          override={parseConfig(editingBlock.config)}
          onClose={() => setEditing(null)}
          onSave={(o) => {
            setConfig(editing, JSON.stringify(o ?? {}, null, 2));
            setEditing(null);
            setStatus({ ok: true, text: o ? "Свои вопросы применены — не забудьте сохранить урок" : "Вернули стандартные вопросы — сохраните урок" });
          }}
        />
      )}
    </main>
  );
}
