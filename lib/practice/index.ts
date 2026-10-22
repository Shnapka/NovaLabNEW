import type { PracticeTopic } from "./common";
import { speedTopic } from "./speed";
import { archimedesTopic } from "./archimedes";
import { massTopic } from "./mass";
import { isCorrect, parseAnswer } from "./common";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PRACTICE_TOPICS: Record<string, PracticeTopic<any>> = {
  speed: speedTopic,
  archimedes: archimedesTopic,
  mass: massTopic,
};

export type CheckResult =
  | { ok: false; errors: string[] }
  | {
      ok: true;
      statement: string;
      correct: boolean;
      answer: number;
      expected: number;
      unitLabel: string;
      steps: string[];
      note?: string;
      difficulty: number;
    };

/** Полная проверка задачи ученика: валидация условия → решение → сравнение ответа */
export function checkPractice(topicId: string, rawTask: unknown, rawAnswer: string | number): CheckResult {
  const topic = PRACTICE_TOPICS[topicId];
  if (!topic) return { ok: false, errors: [`Неизвестная тема практики: ${topicId}`] };
  const v = topic.validate(rawTask);
  if (!v.task || v.errors.length) return { ok: false, errors: v.errors };
  const answer = parseAnswer(rawAnswer);
  if (!Number.isFinite(answer)) return { ok: false, errors: ["Ответ должен быть числом"] };
  const sol = topic.solve(v.task);
  return {
    ok: true,
    statement: topic.describe(v.task),
    correct: isCorrect(answer, sol.value),
    answer,
    expected: sol.value,
    unitLabel: sol.unitLabel,
    steps: sol.steps,
    note: sol.note,
    difficulty: topic.difficulty(v.task),
  };
}
