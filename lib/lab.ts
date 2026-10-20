// «Моя лаборатория» ученика: свободная работа с учебником без оценок.
// Доступны только модули для самостоятельного изучения; квизы и карточки остаются в уроках учителя.
export const LAB_TYPES = ["simulation", "summary", "graph", "practice"] as const;

export const isLabType = (t: string) => (LAB_TYPES as readonly string[]).includes(t);
