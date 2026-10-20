"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDue, isOverdue } from "@/lib/deadlines";

// «2026-10-25T23:59» для input type=datetime-local — в местном времени браузера
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Срок сдачи урока в классе: после него ученики не смогут отправлять результаты
export default function DeadlineField({ classId, lessonId, dueAt }: { classId: string; lessonId: string; dueAt: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(dueAt ? toLocalInput(dueAt) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(v: string | null) {
    setBusy(true);
    setError("");
    const r = await fetch(`/api/classes/${classId}/deadlines`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, dueAt: v ? new Date(v).toISOString() : null }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(data.error ?? "Не удалось сохранить");
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true);
          if (!value) {
            const d = new Date(Date.now() + 7 * 86_400_000);
            d.setHours(23, 59, 0, 0);
            setValue(toLocalInput(d.toISOString()));
          }
        }}
        title="Срок сдачи: после него результаты не принимаются"
        className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition ${
          !dueAt ? "text-slate-400 hover:bg-mist-50 hover:text-ocean-700" : isOverdue(dueAt) ? "bg-rose-50 text-rose-700" : "bg-sun-50 text-sun-900"
        }`}
      >
        {!dueAt ? "+ срок" : isOverdue(dueAt) ? `срок истёк ${fmtDue(dueAt)}` : `до ${fmtDue(dueAt)}`}
      </button>
    );
  }
  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-mist-50 p-2 text-xs">
      <span className="font-semibold text-slate-600">Сдать до</span>
      <input type="datetime-local" className="input w-auto py-1 text-xs" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => save(value)} disabled={busy || !value} className="btn-primary py-1 text-xs disabled:opacity-50">Сохранить</button>
      {dueAt && <button onClick={() => save(null)} disabled={busy} className="font-semibold text-rose-600 hover:underline">Убрать срок</button>}
      <button onClick={() => setEditing(false)} className="text-slate-500 hover:underline">Отмена</button>
      {error && <span className="w-full text-rose-700">{error}</span>}
    </div>
  );
}
