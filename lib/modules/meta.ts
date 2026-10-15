// badge — метка типа; tile — плитка с иконкой
export const MODULE_META: Record<string, { label: string; badge: string; tile: string; hint: string }> = {
  simulation: {
    label: "Симуляция",
    badge: "bg-ocean-700 text-white",
    tile: "bg-ocean-700 text-sun-400",
    hint: "Интерактивный WebGL-эксперимент",
  },
  summary: {
    label: "Конспект",
    badge: "bg-sun-100 text-sun-900",
    tile: "bg-sun-100 text-sun-600",
    hint: "Краткая теория, формулы, примеры",
  },
  graph: {
    label: "Графики",
    badge: "bg-lagoon-100 text-lagoon-800",
    tile: "bg-lagoon-100 text-lagoon-700",
    hint: "Интерактивные графики зависимостей",
  },
  practice: {
    label: "Практика",
    badge: "bg-ocean-100 text-ocean-800",
    tile: "bg-ocean-50 text-ocean-700",
    hint: "Ученик сам составляет задачу, решает её, а система проверяет ответ",
  },
  quiz: {
    label: "Квиз",
    badge: "bg-aqua-200 text-ocean-900",
    tile: "bg-aqua-200 text-ocean-700",
    hint: "Вопросы и задачи на закрепление",
  },
  matching: {
    label: "Карточки",
    badge: "bg-mist-100 text-ocean-800",
    tile: "bg-mist-100 text-ocean-600",
    hint: "Игра на сопоставление",
  },
};

export const TYPE_ORDER = ["simulation", "summary", "graph", "practice", "quiz", "matching"];

export const metaOf = (type: string) =>
  MODULE_META[type] ?? { label: type, badge: "bg-mist-100 text-slate-700", tile: "bg-mist-100 text-slate-600", hint: "" };
