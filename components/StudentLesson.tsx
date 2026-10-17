"use client";
import { useState } from "react";
import LessonPlayer, { type PlayerBlock } from "./LessonPlayer";
import type { ModuleEvent } from "./ModuleFrame";
import PracticeLog, { type PracticeAttempt } from "./PracticeLog";
import StudentFeedback, { type MyFeedback } from "./feedback/StudentFeedback";

// События модулей, которые идут в статистику учителя
const GRADED_EVENTS = ["quiz-result", "matching-result", "taskResult", "challengeSummary"];

export default function StudentLesson({
  lessonId,
  title,
  studentLabel,
  blocks,
  initialDone,
  initialPractice,
  initialFeedback,
}: {
  lessonId: string;
  title: string;
  studentLabel: string;
  blocks: PlayerBlock[];
  initialDone: string[];
  initialPractice: Record<string, PracticeAttempt[]>; // moduleId → задачи ученика, новые сверху
  initialFeedback: MyFeedback;
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [done, setDone] = useState(initialDone);
  const [practice, setPractice] = useState(initialPractice);
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
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setDone((d) => (d.includes(moduleId) ? d : [...d, moduleId]));
      if (e.type === "taskResult" && data.statement) {
        const attempt: PracticeAttempt = {
          id: `new-${Date.now()}`,
          correct: !!data.correct,
          statement: data.statement,
          answer: data.answer,
          expected: data.expected,
          unit: data.unit,
          difficulty: data.difficulty ?? 1,
          at: new Date().toISOString(),
        };
        setPractice((p) => ({ ...p, [moduleId]: [attempt, ...(p[moduleId] ?? [])] }));
      }
      setToast({ ok: true, text: "Результат сохранён — он в твоей статистике, учитель его увидит" });
    } catch (err) {
      setToast({ ok: false, text: `Не удалось сохранить результат${err instanceof Error && err.message ? `: ${err.message}` : ""}` });
    }
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <>
      <LessonPlayer
        title={title}
        subtitle={studentLabel}
        blocks={blocks}
        backHref="/student"
        doneIds={done}
        onModuleEvent={report}
        finale={{
          label: "Оценка урока",
          done: !!feedback,
          content: <StudentFeedback lessonId={lessonId} initial={feedback} onSaved={setFeedback} />,
        }}
        renderBelow={(b) =>
          b.type === "practice" && b.moduleId ? (
            <PracticeLog
              attempts={practice[b.moduleId] ?? []}
              goal={Number((b.content as { goal?: number } | null)?.goal ?? 3)}
            />
          ) : null
        }
      />
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
