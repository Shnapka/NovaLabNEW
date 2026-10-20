"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LessonPlayer, { type PlayerBlock } from "./LessonPlayer";
import Icon from "./Icon";

type Note = { text: string; updatedAt: string } | null;

const time = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Одна заметка по теме: сохраняется сама, пока ученик пишет
function NoteEditor({ topicId, initial }: { topicId: number; initial: Note }) {
  const [text, setText] = useState(initial?.text ?? "");
  const [saved, setSaved] = useState<string | null>(initial?.updatedAt ?? null);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const last = useRef(initial?.text ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  async function save(value: string) {
    if (value.trim() === last.current.trim()) return;
    setState("saving");
    const r = await fetch("/api/lab/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, text: value }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return setState("error");
    last.current = value;
    setSaved(data.updatedAt ?? null);
    setState("idle");
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <section className="card mx-auto max-w-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aqua-100 text-ocean-700">
          <Icon name="edit" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-extrabold text-ocean-900">Моя заметка по теме</h2>
          <p className="text-sm text-slate-500">Видна только тебе. Сохраняется автоматически.</p>
        </div>
      </div>
      <textarea
        value={text}
        maxLength={10_000}
        onChange={(e) => {
          setText(e.target.value);
          if (timer.current) clearTimeout(timer.current);
          const v = e.target.value;
          timer.current = setTimeout(() => save(v), 900);
        }}
        onBlur={() => save(text)}
        rows={10}
        className="input mt-5 resize-y leading-relaxed"
        placeholder={"Что важно запомнить, формулы, вопросы к учителю…"}
      />
      <p className={`mt-2 text-xs ${state === "error" ? "text-rose-600" : "text-slate-400"}`}>
        {state === "saving" ? "Сохраняю…" : state === "error" ? "Не удалось сохранить — проверь интернет" : saved ? `Сохранено ${time(saved)}` : "Заметки пока нет"}
      </p>
    </section>
  );
}

export default function LabTopic({
  topicId,
  title,
  subtitle,
  backHref,
  note,
  blocks,
}: {
  topicId: number;
  title: string;
  subtitle: string;
  backHref: string;
  note: Note;
  blocks: PlayerBlock[];
}) {
  // По теме ещё нет модулей — только заметка
  if (blocks.length === 0) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ocean-700">
          <Icon name="arrowLeft" className="h-4 w-4" /> Моя лаборатория
        </Link>
        <div>
          <p className="text-sm font-semibold text-lagoon-700">{subtitle}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">{title}</h1>
          <p className="mt-2 text-slate-500">Интерактивные модули по этой теме ещё готовятся. Пока можно вести заметку.</p>
        </div>
        <NoteEditor topicId={topicId} initial={note} />
      </main>
    );
  }
  return (
    <LessonPlayer
      title={title}
      subtitle={<>{subtitle} · <span className="text-sun-400">Моя лаборатория — без оценок, ответы не сохраняются</span></>}
      backHref={backHref}
      backLabel="К учебнику"
      blocks={blocks}
      // В лаборатории события модулей никуда не отправляются: ни оценок, ни сохранения решений
      onModuleEvent={() => {}}
      finale={{ label: "Моя заметка", done: !!note, content: <NoteEditor topicId={topicId} initial={note} /> }}
    />
  );
}
