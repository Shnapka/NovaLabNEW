"use client";
import { useState } from "react";
import LessonPlayer, { type PlayerBlock } from "./LessonPlayer";
import type { ModuleEvent } from "./ModuleFrame";

// События модулей, которые идут в статистику учителя
const GRADED_EVENTS = ["quiz-result", "matching-result", "taskResult", "challengeSummary"];

export default function StudentLesson({
  lessonId,
  title,
  studentLabel,
  blocks,
  initialDone,
}: {
  lessonId: string;
  title: string;
  studentLabel: string;
  blocks: PlayerBlock[];
  initialDone: string[];
}) {
  const [done, setDone] = useState(initialDone);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  async function report(block: PlayerBlock, e: ModuleEvent) {
    if (!GRADED_EVENTS.includes(e.type) || !block.moduleId) return;
    const moduleId = block.moduleId;
    try {
      const r = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, moduleId, event: e }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setDone((d) => (d.includes(moduleId) ? d : [...d, moduleId]));
      setToast({ ok: true, text: "Результат сохранён — учитель его увидит" });
    } catch (err) {
      setToast({ ok: false, text: `Не удалось сохранить результат${err instanceof Error && err.message ? `: ${err.message}` : ""}` });
    }
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <>
      <LessonPlayer title={title} subtitle={studentLabel} blocks={blocks} backHref="/student" doneIds={done} onModuleEvent={report} />
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${
            toast.ok ? "bg-ocean-800 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.ok ? "✓ " : "⚠ "}
          {toast.text}
        </div>
      )}
    </>
  );
}
