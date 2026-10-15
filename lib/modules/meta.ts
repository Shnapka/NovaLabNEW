export const MODULE_META: Record<string, { label: string; badge: string; hint: string }> = {
  simulation: {
    label: "Симуляция",
    badge: "bg-indigo-100 text-indigo-700",
    hint: "Интерактивный WebGL-эксперимент",
  },
  summary: { label: "Конспект", badge: "bg-amber-100 text-amber-800", hint: "Краткая теория, формулы, примеры" },
  graph: { label: "Графики", badge: "bg-emerald-100 text-emerald-700", hint: "Интерактивные графики зависимостей" },
  quiz: { label: "Квиз", badge: "bg-rose-100 text-rose-700", hint: "Вопросы и задачи на закрепление" },
  matching: { label: "Карточки", badge: "bg-sky-100 text-sky-700", hint: "Игра на сопоставление" },
};

export const TYPE_ORDER = ["simulation", "summary", "graph", "quiz", "matching"];

export const metaOf = (type: string) =>
  MODULE_META[type] ?? { label: type, badge: "bg-gray-100 text-gray-700", hint: "" };
