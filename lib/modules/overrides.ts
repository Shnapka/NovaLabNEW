// Свои вопросы учителя для квиза и карточек хранятся в настройках блока урока:
// LessonBlock.config = { title?: string, content?: QuizContent | MatchingContent }.
// Библиотечный модуль при этом не меняется — правки живут только в уроке учителя.
import type { MatchingContent, QuizContent } from "./types";

export const EDITABLE_TYPES = ["quiz", "matching"];

export type BlockOverride = { title?: string; content?: unknown };

/** Что показывать в уроке: свои заголовок и содержимое, если учитель их задал */
export function applyOverride(module: { type: string; title: string; content: unknown }, config: unknown) {
  const o = (config && typeof config === "object" ? config : {}) as BlockOverride;
  const editable = EDITABLE_TYPES.includes(module.type);
  return {
    title: editable && typeof o.title === "string" && o.title.trim() ? o.title.trim() : module.title,
    content: editable && o.content ? o.content : module.content,
    custom: editable && !!o.content,
  };
}

const str = (x: unknown) => typeof x === "string" && x.trim().length > 0;

export function validateQuiz(c: unknown): string[] {
  const errors: string[] = [];
  const q = (c as QuizContent)?.questions;
  if (!Array.isArray(q) || q.length === 0) return ["Добавьте хотя бы один вопрос"];
  if (q.length > 40) errors.push("Не больше 40 вопросов");
  q.forEach((x, i) => {
    const n = `Вопрос ${i + 1}`;
    if (!x || typeof x !== "object") return void errors.push(`${n}: пустой`);
    if (!str(x.text)) errors.push(`${n}: нет текста вопроса`);
    if (x.kind === "single") {
      if (!Array.isArray(x.options) || x.options.length < 2) errors.push(`${n}: нужно минимум 2 варианта ответа`);
      else if (x.options.some((o) => !str(o))) errors.push(`${n}: есть пустой вариант ответа`);
      if (!Number.isInteger(x.answer) || x.answer < 0 || x.answer >= (x.options?.length ?? 0)) errors.push(`${n}: отметьте правильный вариант`);
    } else if (x.kind === "number") {
      if (typeof x.answer !== "number" || !Number.isFinite(x.answer)) errors.push(`${n}: правильный ответ должен быть числом`);
      if (x.tolerance !== undefined && (typeof x.tolerance !== "number" || x.tolerance < 0)) errors.push(`${n}: допуск должен быть неотрицательным числом`);
    } else errors.push(`${n}: неизвестный тип`);
  });
  return errors;
}

export function validateMatching(c: unknown): string[] {
  const errors: string[] = [];
  const p = (c as MatchingContent)?.pairs;
  if (!Array.isArray(p) || p.length < 2) return ["Нужно минимум 2 пары карточек"];
  if (p.length > 16) errors.push("Не больше 16 пар");
  p.forEach((x, i) => {
    if (!str(x?.left) || !str(x?.right)) errors.push(`Пара ${i + 1}: заполните обе карточки`);
  });
  const lefts = p.map((x) => x?.left?.trim());
  const rights = p.map((x) => x?.right?.trim());
  if (new Set(lefts).size !== lefts.length) errors.push("Левые карточки не должны повторяться");
  if (new Set(rights).size !== rights.length) errors.push("Правые карточки не должны повторяться — иначе пару не угадать");
  return errors;
}

export function validateOverride(type: string, config: unknown): string[] {
  const o = (config && typeof config === "object" ? config : {}) as BlockOverride;
  if (!o.content) return [];
  if (JSON.stringify(o).length > 60_000) return ["Слишком большой объём содержимого"];
  if (type === "quiz") return validateQuiz(o.content);
  if (type === "matching") return validateMatching(o.content);
  return [];
}
