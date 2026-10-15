"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/plural";

type L = { id: string; title: string; blocks: number; assigned: boolean };

// Назначение уроков классу: ученики видят только назначенные уроки
export default function AssignLessons({ classId, lessons }: { classId: string; lessons: L[] }) {
  const router = useRouter();
  const [state, setState] = useState(lessons);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(l: L) {
    setBusy(l.id);
    const r = await fetch(`/api/classes/${classId}/lessons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: l.id, assigned: !l.assigned }),
    });
    setBusy(null);
    if (r.ok) {
      setState((s) => s.map((x) => (x.id === l.id ? { ...x, assigned: !x.assigned } : x)));
      router.refresh();
    }
  }

  if (!state.length) {
    return <p className="text-sm text-slate-500">У вас пока нет уроков. Соберите урок в библиотеке кнопкой «Собрать свой урок».</p>;
  }
  return (
    <ul className="divide-y divide-mist-100">
      {state.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
          <div>
            <div className="font-semibold text-ocean-900">{l.title}</div>
            <div className="text-xs text-slate-500">{plural(l.blocks, ["модуль", "модуля", "модулей"])}</div>
          </div>
          <button
            disabled={busy === l.id}
            onClick={() => toggle(l)}
            className={l.assigned ? "btn border border-emerald-200 bg-emerald-50 py-1.5 text-emerald-700 hover:bg-emerald-100" : "btn-ghost py-1.5"}
          >
            {l.assigned ? "✓ Назначен" : "Назначить"}
          </button>
        </li>
      ))}
    </ul>
  );
}
