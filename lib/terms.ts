// Четверти учебного года и план класса: какой раздел в какую четверть проходят.
// Журнал и «По уроку» открываются на текущей четверти и текущем разделе.

export const QUARTERS = [1, 2, 3, 4] as const;

/** Начало учебного года (1 сентября), к которому относится дата */
export const schoolYearOf = (d: Date) => (d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1);

/** Примерные даты четвертей в Казахстане; учитель уточняет даты разделов в плане класса */
export function quarterBounds(year: number): Record<number, { start: Date; end: Date }> {
  const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m - 1, day));
  return {
    1: { start: d(year, 9, 1), end: d(year, 10, 26) },
    2: { start: d(year, 11, 3), end: d(year, 12, 28) },
    3: { start: d(year + 1, 1, 8), end: d(year + 1, 3, 18) },
    4: { start: d(year + 1, 3, 30), end: d(year + 1, 5, 25) },
  };
}

/** Четверть, в которую попадает дата (в каникулы — ближайшая следующая, летом — 4-я) */
export function quarterOf(date: Date): number {
  const b = quarterBounds(schoolYearOf(date));
  for (const q of QUARTERS) if (date <= b[q].end) return q;
  return 4;
}

export type PlanRow = { quarter: number; sectionId: number; label: string; start: Date; end: Date };

export type TermView = {
  quarter: number | "all";
  sectionKey: string | null; // "s<id>" — ключ раздела, как у lessonGroup
  quarters: {
    n: number;
    current: boolean;
    sections: { key: string; label: string; start: Date; end: Date; current: boolean }[];
  }[];
  hasPlan: boolean;
};

const inRange = (d: Date, a: Date, b: Date) => d >= a && d <= new Date(b.getTime() + 86_399_999);

/**
 * Что показать: выбранные в адресе четверть/раздел или, по умолчанию, текущие по сегодняшней дате.
 * q — "1".."4" | "all"; s — ключ раздела | "all".
 */
export function resolveTerm(plan: PlanRow[], today: Date, q?: string, s?: string): TermView {
  const currentQ = quarterOf(today);
  const quarters = QUARTERS.map((n) => ({
    n,
    current: n === currentQ,
    sections: plan
      .filter((r) => r.quarter === n)
      .sort((a, b) => +a.start - +b.start)
      .map((r) => ({ key: `s${r.sectionId}`, label: r.label, start: r.start, end: r.end, current: inRange(today, r.start, r.end) })),
  }));
  const hasPlan = plan.length > 0;
  if (!hasPlan || q === "all") return { quarter: "all", sectionKey: null, quarters, hasPlan };

  const quarter = q && /^[1-4]$/.test(q) ? Number(q) : currentQ;
  const secs = quarters[quarter - 1].sections;
  let sectionKey: string | null = null;
  if (s && s !== "all" && secs.some((x) => x.key === s)) sectionKey = s;
  else if (!s && !q) sectionKey = secs.find((x) => x.current)?.key ?? null; // по умолчанию — раздел, который проходят сейчас
  return { quarter, sectionKey, quarters, hasPlan };
}

/** Ключи разделов, уроки которых показываются при выбранном фильтре; null — все уроки */
export function visibleSectionKeys(t: TermView): Set<string> | null {
  if (t.quarter === "all") return null;
  if (t.sectionKey) return new Set([t.sectionKey]);
  return new Set(t.quarters[t.quarter - 1].sections.map((x) => x.key));
}

export const fmtDate = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" });
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
