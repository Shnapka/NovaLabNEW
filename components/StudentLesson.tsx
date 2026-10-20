"use client";
import { useEffect, useState } from "react";
import { DEADLINE_MESSAGE, fmtDue, timeLeft } from "@/lib/deadlines";
import LessonPlayer, { type PlayerBlock } from "./LessonPlayer";
import type { ModuleEvent } from "./ModuleFrame";
import PracticeLog, { type PracticeAttempt } from "./PracticeLog";
import { kindOf } from "@/lib/practice/kinds";
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
  dueAt,
}: {
  lessonId: string;
  title: string;
  studentLabel: string;
  blocks: PlayerBlock[];
  initialDone: string[];
  initialPractice: Record<string, PracticeAttempt[]>; // moduleId → задачи ученика, новые сверху
  initialFeedback: MyFeedback;
  dueAt: string | null; // срок сдачи от учителя; после него результаты не принимаются
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const overdue = !!dueAt && new Date(dueAt).getTime() < now;
  const [feedback, setFeedback] = useState(initialFeedback);
  const [done, setDone] = useState(initialDone);
  const [practice, setPractice] = useState(initialPractice);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  async function report(block: PlayerBlock, e: ModuleEvent) {
    if (!GRADED_EVENTS.includes(e.type) || !block.moduleId) return;
    const moduleId = block.moduleId;
    if (dueAt && new Date(dueAt).getTime() < Date.now()) {
      setToast({ ok: false, text: DEADLINE_MESSAGE });
      setTimeout(() => setToast(null), 3500);
      return;
    }
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
          id: data.id ?? `new-${Date.now()}`,
          correct: !!data.correct,
          statement: data.statement,
          answer: data.answer,
          expected: data.expected,
          unit: data.unit,
          difficulty: data.difficulty ?? 1,
          solution: String((e.data as { solutionText?: unknown } | undefined)?.solutionText ?? "").trim(),
          kind: kindOf(e.data),
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
        subtitle={
          <>
            {studentLabel}
            {dueAt && (
              <span className={`ml-2 rounded-md px-2 py-0.5 text-xs font-bold ${overdue ? "bg-rose-500 text-white" : "bg-sun-400 text-ocean-950"}`}>
                {overdue ? `Срок сдачи истёк ${fmtDue(dueAt)} — результаты не сохраняются` : `Сдать до ${fmtDue(dueAt)} · осталось ${timeLeft(dueAt, new Date(now))}`}
              </span>
            )}
          </>
        }
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
              topic={(b.content as { topic?: string } | null)?.topic}
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
