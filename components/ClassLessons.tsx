"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/plural";
import Icon from "./Icon";
import { useConfirm } from "./ConfirmDialog";
import DeadlineField from "./class/DeadlineField";

type L = { id: string; title: string; blocks: number; group: string; topic: string | null; dueAt?: string | null };
type T = { id: number; title: string; grade: number; paragraph: string | null; section: string };

// Группировка с сохранением порядка: [[раздел, элементы], ...]
function groupBy<X>(items: X[], key: (x: X) => string): [string, X[]][] {
  const m = new Map<string, X[]>();
  for (const x of items) m.set(key(x), [...(m.get(key(x)) ?? []), x]);
  return [...m.entries()];
}

// Уроки класса по разделам учебника. Добавить — из библиотеки (одной кнопкой) или из своих уроков.
export default function ClassLessons({ classId, assigned, myOther, topics }: { classId: string; assigned: L[]; myOther: L[]; topics: T[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"library" | "mine">("library");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ask, dialog] = useConfirm();

  async function call(key: string, method: "POST" | "PUT", body: object) {
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
    router.refresh();
  }

  const remove = async (l: L) => {
    const ok = await ask({
      title: `Убрать урок «${l.title}» из класса?`,
      text: (
        <>
          <p>Ученики перестанут видеть урок.</p>
          <p>Сам урок останется в «Моих уроках», а результаты учеников сохранятся — урок можно вернуть в класс в любой момент.</p>
        </>
      ),
      confirmLabel: "Убрать из класса",
    });
    if (ok) call(l.id, "PUT", { lessonId: l.id, assigned: false });
  };
  const addAgain = async (t: T) =>
    (await ask({
      title: "Этот урок уже есть в классе",
      text: "Добавить ещё одну копию урока по этой теме?",
      confirmLabel: "Добавить копию",
      danger: false,
    })) && call(`t${t.id}`, "POST", { topicId: t.id });
  // Тема уже есть в классе (урок собран из неё) — подсказываем, чтобы не создать копию случайно
  const assignedTopics = new Set(assigned.map((l) => l.topic).filter(Boolean));

  // Лёгкий фильтр: поиск, раздел, только уроки со сроком; в панели добавления — поиск по библиотеке
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("");
  const [onlyDue, setOnlyDue] = useState(false);
  const [libQuery, setLibQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const sectionsOfClass = [...new Set(assigned.map((l) => l.group))];
  const shown = assigned.filter(
    (l) => (!needle || l.title.toLowerCase().includes(needle)) && (!section || l.group === section) && (!onlyDue || !!l.dueAt),
  );
  const libNeedle = libQuery.trim().toLowerCase();
  const libTopics = libNeedle ? topics.filter((t) => `${t.paragraph ?? ""} ${t.title}`.toLowerCase().includes(libNeedle)) : topics;
  const myShown = libNeedle ? myOther.filter((l) => l.title.toLowerCase().includes(libNeedle)) : myOther;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      {dialog}
      <section className="card p-5">
        <h2 className="text-lg font-bold text-ocean-900">Уроки класса</h2>
        <p className="mb-4 text-sm text-slate-500">
          Ученики видят все эти уроки. «+ срок» — дата и время, после которых урок уже нельзя выполнить: результаты не принимаются.
        </p>
        {assigned.length > 3 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="relative min-w-44 flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти урок" className="input py-2 pl-9 text-sm" />
            </label>
            {sectionsOfClass.length > 1 && (
              <select value={section} onChange={(e) => setSection(e.target.value)} className="input w-auto max-w-56 py-2 text-sm">
                <option value="">Все разделы</option>
                {sectionsOfClass.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600">
              <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} className="h-4 w-4 accent-ocean-700" /> со сроком
            </label>
          </div>
        )}
        {assigned.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-mist-200 p-6 text-center text-slate-500">Добавьте первый урок справа</p>
        ) : shown.length === 0 ? (
          <p className="rounded-xl bg-mist-50 p-6 text-center text-sm text-slate-500">По этому фильтру уроков нет.</p>
        ) : (
          <div className="space-y-5">
            {groupBy(shown, (l) => l.group).map(([group, ls]) => (
              <div key={group}>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-lagoon-700">
                  <Icon name="book" className="h-4 w-4" /> {group}
                  <span className="font-normal normal-case text-slate-400">· {plural(ls.length, ["урок", "урока", "уроков"])}</span>
                </div>
                <ul className="divide-y divide-mist-100 rounded-xl border border-mist-100">
                  {ls.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <Link href={`/classes/${classId}/lessons?lesson=${l.id}`} className="min-w-0 flex-1 hover:text-lagoon-700">
                        <div className="truncate font-semibold text-ocean-900">{l.title}</div>
                        <div className="text-xs text-slate-500">
                          {l.topic && l.topic !== l.title ? `${l.topic} · ` : ""}
                          {plural(l.blocks, ["модуль", "модуля", "модулей"])}
                        </div>
                      </Link>
                      <DeadlineField classId={classId} lessonId={l.id} dueAt={l.dueAt ?? null} />
                      <Link href={`/lessons/${l.id}/edit`} className="text-xs font-semibold text-slate-500 hover:text-ocean-700">Изменить</Link>
                      <button
                        onClick={() => remove(l)}
                        disabled={busy === l.id}
                        title="Убрать урок из класса"
                        className="rounded-lg px-2 py-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5 lg:sticky lg:top-20 lg:self-start">
        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
          <h2 className="text-lg font-bold text-ocean-900">Добавить урок</h2>
          <span className="text-sm text-slate-400">{open ? "свернуть" : "развернуть"}</span>
        </button>
        {open && (
          <>
            <div className="my-3 flex gap-2 text-sm font-semibold">
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
            <label className="relative mb-3 block">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
              <input value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder="Тема или §" className="input py-2 pl-9 text-sm" />
            </label>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {tab === "library" ? (
                groupBy(libTopics, (t) => `${t.grade} кл. · ${t.section}`).map(([group, ts]) => (
                  <div key={group}>
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lagoon-700">{group}</div>
                    <ul className="space-y-1.5">
                      {ts.map((t) => {
                        const label = `${t.paragraph ? t.paragraph + " · " : ""}${t.title}`;
                        const already = assignedTopics.has(label);
                        return (
                          <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-mist-50 p-2.5">
                            <div className="min-w-0">
                              <div className="text-xs text-slate-500">{t.paragraph}</div>
                              <div className="font-semibold text-ocean-900">{t.title}</div>
                              {already && <div className="text-xs text-emerald-700">✓ уже есть в классе</div>}
                            </div>
                            <button
                              onClick={() => (already ? addAgain(t) : call(`t${t.id}`, "POST", { topicId: t.id }))}
                              disabled={busy !== null}
                              className={already ? "btn-ghost shrink-0 py-1.5" : "btn-primary shrink-0 py-1.5"}
                            >
                              {busy === `t${t.id}` ? "…" : "+ Добавить"}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              ) : myOther.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Все ваши уроки уже в этом классе. Соберите новый в <Link href="/dashboard" className="font-semibold text-ocean-700">«Мои уроки»</Link>.
                </p>
              ) : (
                groupBy(myShown, (l) => l.group).map(([group, ls]) => (
                  <div key={group}>
                    <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-lagoon-700">{group}</div>
                    <ul className="space-y-1.5">
                      {ls.map((l) => (
                        <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl bg-mist-50 p-2.5">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-ocean-900">{l.title}</div>
                            <div className="text-xs text-slate-500">{plural(l.blocks, ["модуль", "модуля", "модулей"])}</div>
                          </div>
                          <button onClick={() => call(l.id, "PUT", { lessonId: l.id, assigned: true })} disabled={busy !== null} className="btn-primary shrink-0 py-1.5">
                            {busy === l.id ? "…" : "+ Добавить"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Урок из библиотеки копируется в «Мои уроки» — его можно изменить в конструкторе (порядок модулей, свои вопросы), и класс сразу увидит изменения.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
