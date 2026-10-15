"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/plural";

// Удаление своего урока с предупреждением, что пропадёт у классов и вместе с результатами учеников
export default function DeleteLessonButton({
  lessonId,
  title,
  classes,
  results,
  className = "",
}: {
  lessonId: string;
  title: string;
  classes: number;
  results: number;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const warn = [
      `Удалить урок «${title}» навсегда?`,
      classes ? `Он исчезнет у ${plural(classes, ["класса", "классов", "классов"])}.` : "",
      results ? `Будут удалены и результаты учеников по нему: ${results}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
    if (!confirm(warn)) return;
    setBusy(true);
    const r = await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) router.refresh();
    else alert("Не удалось удалить урок");
  }

  return (
    <button onClick={remove} disabled={busy} title="Удалить урок" className={`btn border border-mist-200 bg-white px-3 text-rose-600 hover:border-rose-200 hover:bg-rose-50 ${className}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
      </svg>
      <span className="sr-only">Удалить</span>
    </button>
  );
}
