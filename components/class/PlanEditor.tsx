"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon";

type Item = { quarter: number; sectionId: number; start: string; end: string };
type Grade = { number: number; sections: { id: number; title: string }[] };
type Quarter = { n: number; start: string; end: string };

const DAY = 86_400_000;
const toDay = (s: string) => Date.parse(`${s}T00:00:00Z`);
const fromDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Делит даты четверти поровну между её разделами (по порядку) */
function split(q: Quarter, sectionIds: number[]): Item[] {
  const a = toDay(q.start), b = toDay(q.end);
  const n = sectionIds.length;
  return sectionIds.map((sectionId, i) => {
    const s = a + Math.round(((b - a + DAY) * i) / n);
    const e = a + Math.round(((b - a + DAY) * (i + 1)) / n) - DAY;
    return { quarter: q.n, sectionId, start: fromDay(s), end: fromDay(e) };
  });
}

// Редактор плана четвертей: разделы учебника по четвертям с датами
export default function PlanEditor({
  classId,
  year,
  currentQuarter,
  quarters,
  grades,
  defaultGrade,
  initial,
}: {
  classId: string;
  year: number;
  currentQuarter: number;
  quarters: Quarter[];
  grades: Grade[];
  defaultGrade: number;
  initial: Item[];
}) {
  const router = useRouter();
  const [grade, setGrade] = useState(defaultGrade);
  const [items, setItems] = useState<Item[]>(initial);
  const [adding, setAdding] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const sections = useMemo(() => grades.find((g) => g.number === grade)?.sections ?? [], [grades, grade]);
  const titleOf = (id: number) => grades.flatMap((g) => g.sections.map((s) => ({ ...s, g: g.number }))).find((s) => s.id === id);

  const inQuarter = (n: number) => items.filter((i) => i.quarter === n).sort((a, b) => a.start.localeCompare(b.start));
  const touch = (next: Item[]) => {
    setItems(next);
    setStatus(null);
  };

  function add(n: number) {
    const id = Number(adding[n]);
    if (!id) return;
    const q = quarters[n - 1];
    const ids = [...inQuarter(n).map((i) => i.sectionId), id];
    touch([...items.filter((i) => i.quarter !== n), ...split(q, ids)]);
    setAdding((a) => ({ ...a, [n]: "" }));
  }

  function remove(n: number, sectionId: number) {
    const q = quarters[n - 1];
    const ids = inQuarter(n).map((i) => i.sectionId).filter((x) => x !== sectionId);
    touch([...items.filter((i) => i.quarter !== n), ...split(q, ids)]);
  }

  function setDate(n: number, sectionId: number, key: "start" | "end", value: string) {
    touch(items.map((i) => (i.quarter === n && i.sectionId === sectionId ? { ...i, [key]: value } : i)));
  }

  // Разделы учебника по порядку — почти поровну на 4 четверти (6 разделов → 2, 2, 1, 1)
  function autofill() {
    const ids = sections.map((s) => s.id);
    const per = quarters.map((_, qi) => Math.floor(ids.length / 4) + (qi < ids.length % 4 ? 1 : 0));
    let k = 0;
    touch(quarters.flatMap((q, qi) => split(q, ids.slice(k, (k += per[qi])))));
  }

  async function save() {
    setBusy(true);
    const r = await fetch(`/api/classes/${classId}/plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setStatus({ ok: false, text: data.error ?? "Не удалось сохранить" });
    setStatus({ ok: true, text: "План сохранён — журнал откроется на текущем разделе" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="card flex flex-wrap items-center gap-3 p-5">
        <div className="mr-auto">
          <h2 className="text-lg font-bold text-ocean-900">План четвертей · {year}/{year + 1} учебный год</h2>
          <p className="text-sm text-slate-500">
            Укажите, какой раздел учебника класс проходит в каждую четверть. Журнал и «По уроку» будут открываться на текущем разделе.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Учебник
          <select className="input w-auto py-2" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
            {grades.map((g) => <option key={g.number} value={g.number}>{g.number} класс</option>)}
          </select>
        </label>
        <button onClick={autofill} className="btn-ghost">
          <Icon name="layers" className="h-4 w-4" /> Распределить разделы по четвертям
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {quarters.map((q) => {
          const list = inQuarter(q.n);
          const free = sections.filter((s) => !list.some((i) => i.sectionId === s.id));
          return (
            <section key={q.n} className={`card p-5 ${q.n === currentQuarter ? "ring-2 ring-sun-400" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-ocean-900">{q.n} четверть</h3>
                {q.n === currentQuarter && <span className="pill bg-sun-400 text-ocean-950">идёт сейчас</span>}
              </div>
              <p className="text-xs text-slate-400">примерно {new Date(q.start).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} — {new Date(q.end).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</p>

              <ul className="mt-3 space-y-2">
                {list.length === 0 && <li className="rounded-xl border-2 border-dashed border-mist-200 p-3 text-center text-sm text-slate-400">Разделы не добавлены</li>}
                {list.map((i) => {
                  const s = titleOf(i.sectionId);
                  return (
                    <li key={i.sectionId} className="rounded-xl bg-mist-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ocean-900">{s ? `${s.g} кл. · ${s.title}` : "Раздел"}</span>
                        <button onClick={() => remove(q.n, i.sectionId)} title="Убрать из четверти" className="rounded-lg px-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">×</button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        с <input type="date" className="input w-auto py-1.5" value={i.start} onChange={(e) => setDate(q.n, i.sectionId, "start", e.target.value)} />
                        по <input type="date" className="input w-auto py-1.5" value={i.end} onChange={(e) => setDate(q.n, i.sectionId, "end", e.target.value)} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {free.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <select className="input py-2 text-sm" value={adding[q.n] ?? ""} onChange={(e) => setAdding((a) => ({ ...a, [q.n]: e.target.value }))}>
                    <option value="">+ Добавить раздел…</option>
                    {free.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                  <button onClick={() => add(q.n)} disabled={!adding[q.n]} className="btn-primary shrink-0 py-2 disabled:opacity-50">Добавить</button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={busy} className="btn-primary px-6 py-2.5 disabled:opacity-60">{busy ? "Сохраняю…" : "Сохранить план"}</button>
        {status && <span className={`text-sm font-semibold ${status.ok ? "text-emerald-700" : "text-rose-700"}`}>{status.text}</span>}
        <span className="text-xs text-slate-400">Добавленные разделы делят даты четверти поровну — даты можно поправить вручную.</span>
      </div>
    </div>
  );
}
