"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/plural";
import Icon from "./Icon";

type L = { id: string; title: string; blocks: number };
type T = { id: number; title: string; grade: number; paragraph: string | null; section: string };

// Уроки класса: один класс — много уроков. Учитель добавляет уроки из библиотеки или из своих.
export default function ClassLessons({
  classId,
  activeLessonId,
  assigned,
  myOther,
  topics,
}: {
  classId: string;
  activeLessonId?: string;
  assigned: L[];
  myOther: L[];
  topics: T[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"library" | "mine">("library");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function call(key: string, method: "POST" | "PUT", body: object, after?: (data: { lessonId?: string }) => void) {
    setBusy(key);
    setError("");
    const r = await fetch(`/api/classes/${classId}/lessons`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) return setError(data.error ?? "Ошибка");
    after?.(data);
    router.refresh();
  }

  const addTopic = (t: T) =>
    call(`t${t.id}`, "POST", { topicId: t.id });
  const addMine = (l: L) => call(l.id, "PUT", { lessonId: l.id, assigned: true });
  const remove = (l: L) => {
    if (confirm(`Убрать урок «${l.title}» из класса? Ученики перестанут его видеть, результаты сохранятся.`)) {
      call(l.id, "PUT", { lessonId: l.id, assigned: false });
    }
  };

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ocean-900">Уроки класса</h2>
          <p className="text-sm text-slate-500">Ученики класса видят все эти уроки в порядке добавления. Нажмите на урок, чтобы открыть его разбор; общая картина — во вкладке «Журнал».</p>
        </div>
        <button onClick={() => setOpen(!open)} className={open ? "btn-ghost" : "btn-accent"}>
          <Icon name={open ? "arrowLeft" : "plus"} className="h-4 w-4" /> {open ? "Свернуть" : "Добавить урок"}
        </button>
      </div>

      {assigned.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {assigned.map((l) => (
            <li
              key={l.id}
              className={`flex items-center gap-1 rounded-xl pl-3.5 text-sm font-semibold transition ${
                l.id === activeLessonId ? "bg-ocean-700 text-white" : "bg-mist-50 text-ocean-800 ring-1 ring-mist-200 hover:ring-lagoon-500"
              }`}
            >
              <Link href={`/classes/${classId}/lessons?lesson=${l.id}`} className="py-2">
                {l.title} <span className="font-normal opacity-70">· {plural(l.blocks, ["модуль", "модуля", "модулей"])}</span>
              </Link>
              <button
                onClick={() => remove(l)}
                disabled={busy === l.id}
                title="Убрать урок из класса"
                className={`ml-1 rounded-r-xl px-2.5 py-2 ${l.id === activeLessonId ? "hover:bg-white/15" : "text-slate-400 hover:bg-rose-50 hover:text-rose-600"}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-4 rounded-2xl bg-mist-50 p-4">
          <div className="mb-3 flex gap-2 text-sm font-semibold">
            {(
              [
                ["library", `Из библиотеки (${topics.length})`],
                ["mine", `Из моих уроков (${myOther.length})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full px-3.5 py-1.5 transition ${tab === k ? "bg-ocean-700 text-white" : "bg-white text-ocean-800 ring-1 ring-mist-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {error && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          {tab === "library" ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {topics.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-mist-100">
                  <div>
                    <div className="text-xs font-semibold text-lagoon-700">{t.grade} класс · {t.paragraph ?? t.section}</div>
                    <div className="font-semibold text-ocean-900">{t.title}</div>
                  </div>
                  <button onClick={() => addTopic(t)} disabled={busy !== null} className="btn-primary shrink-0 py-1.5">
                    {busy === `t${t.id}` ? "…" : "+ Добавить"}
                  </button>
                </li>
              ))}
            </ul>
          ) : myOther.length === 0 ? (
            <p className="text-sm text-slate-500">
              Все ваши уроки уже в этом классе. Соберите новый в <Link href="/dashboard" className="font-semibold text-ocean-700">«Мои уроки»</Link>.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {myOther.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-mist-100">
                  <div>
                    <div className="font-semibold text-ocean-900">{l.title}</div>
                    <div className="text-xs text-slate-500">{plural(l.blocks, ["модуль", "модуля", "модулей"])}</div>
                  </div>
                  <button onClick={() => addMine(l)} disabled={busy !== null} className="btn-primary shrink-0 py-1.5">
                    {busy === l.id ? "…" : "+ Добавить"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Урок из библиотеки копируется в «Мои уроки» — его можно изменить в конструкторе, и класс сразу увидит изменения.
          </p>
        </div>
      )}
    </section>
  );
}
