import { resolveTerm, visibleSectionKeys, type PlanRow, type TermView } from "@/lib/terms";

type Grouped = { group: { key: string; label: string; order: number } };

/**
 * Фильтр уроков ученика — как у учителя: по плану четвертей его классов (текущая четверть и раздел по умолчанию).
 * Если учитель план не задал, остаётся выбор раздела учебника (?s=…).
 */
export function filterStudentLessons<L extends Grouped>(plan: PlanRow[], lessons: L[], q?: string, s?: string) {
  // В нескольких классах один и тот же раздел может стоять в плане дважды — оставляем одну запись
  const uniq = [...new Map(plan.map((r) => [`${r.quarter}:${r.sectionId}`, r])).values()];
  const term: TermView = resolveTerm(uniq, new Date(), q, s);
  const sections = [...new Map(lessons.map((l) => [l.group.key, l.group])).values()].sort((a, b) => a.order - b.order);
  let visible: L[];
  let sectionKey: string | null = null;
  if (term.hasPlan) {
    const keys = visibleSectionKeys(term);
    visible = keys ? lessons.filter((l) => keys.has(l.group.key)) : lessons;
  } else {
    sectionKey = s && s !== "all" && sections.some((x) => x.key === s) ? s : null;
    visible = sectionKey ? lessons.filter((l) => l.group.key === sectionKey) : lessons;
  }
  // Уроки по разделам в порядке учебника
  const groups = sections
    .map((g) => ({ ...g, items: visible.filter((l) => l.group.key === g.key) }))
    .filter((g) => g.items.length);
  return { term, sections, sectionKey, visible, groups };
}
