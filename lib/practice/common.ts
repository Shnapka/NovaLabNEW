// Общие типы и утилиты практических задач «составь и реши».
// Этот код выполняется и в браузере (мгновенная проверка), и на сервере (проверка для статистики),
// поэтому формат задачи — единый контракт и для веб-модуля, и для будущих Unity-симуляций.

/** Длина записанного решения ученика (Дано / СИ / Решение) */
export const SOLUTION_MAX = 4000;

export type Quantity = { value: number; unit: string };
export type Unit = { label: string; toSI: number };
export type UnitTable = Record<string, Unit>;

export type Field =
  | { kind: "quantity"; key: string; label: string; units: UnitTable }
  | { kind: "number"; key: string; label: string; unitLabel: string; step?: number }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[]; numeric?: boolean };

export type Solution = {
  value: number; // ответ в единицах answerUnit
  unitLabel: string;
  steps: string[]; // разметка Rich: x_{i}, [[a||b]], **жирный**
  note?: string;
};

export type Validation = { errors: string[]; warnings: string[] };

export interface PracticeTopic<T extends { unknown: string; answerUnit: string }> {
  id: string;
  unknowns: { value: string; label: string }[];
  createTask(unknown: string): T;
  fields(task: T): Field[]; // что ученик задаёт в условии
  answerUnits(task: T): UnitTable;
  describe(task: T): string; // текст условия
  validate(task: unknown): Validation & { task?: T }; // проверка присланной задачи (в т. ч. с сервера)
  solve(task: T): Solution;
  difficulty(task: T): number; // 1–3
}

export const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("ru-RU", { maximumSignificantDigits: 6, useGrouping: false }) : "—";

export const q = (x: Quantity, units: UnitTable) => `${fmt(x.value)} ${units[x.unit]?.label ?? x.unit}`;

export const toSI = (x: Quantity, units: UnitTable) => x.value * units[x.unit].toSI;

/** Строка перевода в СИ: «20 мин = 1200 с» (или просто «1200 с», если уже в СИ) */
export function siStep(symbol: string, x: Quantity, units: UnitTable, siLabel: string) {
  const si = toSI(x, units);
  return units[x.unit].toSI === 1 ? `${symbol} = ${q(x, units)}` : `${symbol} = ${q(x, units)} = ${fmt(si)} ${siLabel}`;
}

/** Проверка ответа: 1,5 % от правильного значения или 0,01 абсолютной погрешности (округление) */
export function isCorrect(answer: number, expected: number) {
  return Number.isFinite(answer) && Math.abs(answer - expected) <= Math.max(Math.abs(expected) * 0.015, 0.01);
}

export function parseAnswer(raw: string | number) {
  return typeof raw === "number" ? raw : Number(String(raw).replace(/\s/g, "").replace(",", "."));
}

export const isQuantity = (x: unknown, units: UnitTable): x is Quantity =>
  !!x &&
  typeof x === "object" &&
  typeof (x as Quantity).value === "number" &&
  Number.isFinite((x as Quantity).value) &&
  typeof (x as Quantity).unit === "string" &&
  (x as Quantity).unit in units;

export const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
