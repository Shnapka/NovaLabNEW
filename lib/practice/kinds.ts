// Типы задач практики: цель — составить и решить задачу каждого типа.
// value совпадает с task.unknown, который присылает симуляция и проверяет сервер.
export type PracticeKind = { value: string; label: string };

export const PRACTICE_KINDS: Record<string, PracticeKind[]> = {
  speed: [
    { value: "v", label: "Скорость" },
    { value: "t", label: "Время" },
    { value: "s", label: "Путь" },
    { value: "vavg", label: "Неравномерное движение" },
  ],
  archimedes: [
    { value: "FA", label: "Архимедова сила" },
    { value: "V", label: "Объём тела" },
    { value: "rho", label: "Плотность жидкости" },
    { value: "P1", label: "Вес в жидкости" },
    { value: "cargo", label: "Груз кораблика" },
  ],
  mass: [
    { value: "spring", label: "Пружинные весы" },
    { value: "lever", label: "Рычажные весы" },
    { value: "tare", label: "Масса без тары" },
    { value: "pieces", label: "Масса одного из многих" },
  ],
  interaction: [
    { value: "s2", label: "Путь второй тележки" },
    { value: "v2", label: "Скорость второй тележки" },
    { value: "m2", label: "Масса второй тележки" },
  ],
};

export const kindsOf = (topic: string | undefined | null): PracticeKind[] => PRACTICE_KINDS[topic ?? ""] ?? [];

/** Тип задачи из сохранённой попытки (detail.task.unknown) */
export const kindOf = (detail: unknown): string | null => {
  const k = (detail as { task?: { unknown?: unknown } } | null)?.task?.unknown;
  return typeof k === "string" ? k : null;
};

export const kindLabel = (topic: string | undefined | null, kind: string | null) =>
  kindsOf(topic).find((k) => k.value === kind)?.label ?? kind ?? "—";

/** Типы, решённые верно хотя бы раз (в порядке справочника) */
export function solvedKinds(kinds: string[], attempts: { correct: boolean | null; detail: unknown }[]) {
  const ok = new Set(attempts.filter((a) => a.correct).map((a) => kindOf(a.detail)));
  return kinds.filter((k) => ok.has(k));
}
