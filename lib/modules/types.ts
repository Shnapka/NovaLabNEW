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

// Сцена над графиком, синхронная с бегунком x. Строки — выражения от x и параметров графика.
export type GraphScene =
  | {
      kind: "race"; // участники на трассе: pos — путь, м
      length: number;
      bodies: { label: string; pos: string }[];
      markEvery?: number; // метки-«следы» через столько единиц x (секунд)
    }
  | {
      kind: "dive"; // тело на динамометре опускается в жидкость
      side: string; // ребро куба, см
      depth: string; // глубина нижней грани под поверхностью, см (может быть < 0 — над жидкостью)
      reading: string; // показание динамометра, Н
      buoyancy: string; // F_A, Н
      weight: string; // вес тела в воздухе, Н
    }
  | {
      kind: "boat"; // кораблик с грузом
      draft: string; // осадка, см
      height: string; // высота борта, см
      cargo: string; // масса груза, кг
    }
  | {
      kind: "float"; // сплошной брусок в жидкости
      fraction: string; // погружённая доля 0..1 (≥ 1 и тонет — лежит на дне)
      sinks: string; // 1 — тонет, 0 — плавает
    };

export type GraphCheck = { text: string; expr: string; unit: string; explain?: string };

export type GraphChart = {
  title: string;
  description?: string;
  x: { label: string; unit: string; min?: number; max: number };
  y: { label: string; unit: string; max: number };
  params: GraphParam[];
  // expr — выражение от x и параметров: + - * / ^ ( ) ? : < > =, sqrt, min, max, abs, pow, PI, NaN
  series: { label: string; expr: string; fill?: boolean; dashed?: boolean }[];
  readouts?: { label: string; expr: string; unit: string }[]; // могут зависеть от x (значение в точке бегунка)
  playhead?: { label: string; duration?: number }; // бегунок по оси x с кнопкой ▶ (duration — секунд на весь проход)
  scene?: GraphScene;
  checks?: GraphCheck[]; // «Найди по графику» — ответ проверяется сразу
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
  notes?: string[]; // упрощения модели — что учителю важно знать
  events?: { type: string; description: string }[];
};

// ---------- Практика «составь и реши» ----------
// topic — ключ из lib/practice (speed, archimedes), goal — сколько задач нужно решить верно
export type PracticeContent = {
  topic: string;
  goal?: number;
  intro?: string;
  // Подсказки под Unity-версией практики (веб-версия показывает свои шаги сама)
  guide?: { steps: string[]; observe: string[]; tips?: string[] };
};

export type ModuleSeed = {
  id: string;
  type: ModuleType;
  title: string;
  description?: string;
  buildUrl?: string;
  configSchema?: Record<string, unknown>; // для симуляций: настройки по умолчанию
  content: SummaryContent | GraphContent | QuizContent | MatchingContent | SimulationContent | PracticeContent;
};
