// Контент нативных модулей (конспект, графики, квиз, карточки) хранится в Module.content.
// В строках можно использовать разметку: **жирный**, x_{нижний}, x^{верхний}, [[числитель||знаменатель]].

export type ModuleType = "simulation" | "summary" | "graph" | "quiz" | "matching" | "practice";

// ---------- Конспект ----------
export type SummaryBlock =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "def"; term: string; text: string }
  | { kind: "formula"; expr: string; legend?: [string, string][] }
  | { kind: "list"; items: string[] }
  | { kind: "note"; text: string }
  | { kind: "table"; caption?: string; head: string[]; rows: string[][] }
  | { kind: "example"; problem: string; solution: string[]; answer: string };

export type SummaryContent = { blocks: SummaryBlock[] };

// ---------- Графики ----------
export type GraphParam = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
};

export type GraphChart = {
  title: string;
  description?: string;
  x: { label: string; unit: string; min?: number; max: number };
  y: { label: string; unit: string; max: number };
  params: GraphParam[];
  // expr — выражение от x и параметров: + - * / ^ ( ) ? : < > =, sqrt, min, max, abs, pow, PI, NaN
  series: { label: string; expr: string; fill?: boolean }[];
  readouts?: { label: string; expr: string; unit: string }[];
  question?: string;
};

export type GraphContent = { charts: GraphChart[] };

// ---------- Квиз ----------
export type QuizQuestion =
  | { kind: "single"; text: string; options: string[]; answer: number; explain: string }
  | { kind: "number"; text: string; answer: number; unit: string; tolerance?: number; explain: string };

export type QuizContent = { questions: QuizQuestion[] };

// ---------- Карточки на сопоставление ----------
export type MatchingContent = { instruction?: string; pairs: { left: string; right: string }[] };

// ---------- Симуляция (WebGL) ----------
// Это и описание для учителя, и техническое задание для Unity-разработчика.
export type SimulationControl = {
  key: string;
  label: string;
  kind: "slider" | "select" | "toggle";
  min?: number;
  max?: number;
  unit?: string;
  options?: { value: string; label: string }[];
};

export type SimulationContent = {
  goal: string;
  scene: string;
  controls: SimulationControl[];
  observe: string[];
  tasks: string[];
  events?: { type: string; description: string }[];
};

// ---------- Практика «составь и реши» ----------
// topic — ключ из lib/practice (speed, archimedes), goal — сколько задач нужно решить верно
export type PracticeContent = { topic: string; goal?: number; intro?: string };

export type ModuleSeed = {
  id: string;
  type: ModuleType;
  title: string;
  description?: string;
  buildUrl?: string;
  configSchema?: Record<string, unknown>; // для симуляций: настройки по умолчанию
  content: SummaryContent | GraphContent | QuizContent | MatchingContent | SimulationContent | PracticeContent;
};
