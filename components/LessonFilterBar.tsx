import Link from "next/link";
import Icon from "./Icon";

type Opt = { value: string; label: string };

// Лёгкий фильтр уроков одной строкой: поиск, раздел учебника, класс. Обычная GET-форма — работает без JS.
export default function LessonFilterBar({
  action,
  q,
  section,
  sections,
  klass,
  classes,
  shown,
  total,
}: {
  action: string;
  q?: string;
  section?: string;
  sections: Opt[];
  klass?: string;
  classes?: Opt[];
  shown: number;
  total: number;
}) {
  const active = !!(q || section || klass);
  return (
    <form action={action} className="mb-5 flex flex-wrap items-center gap-2">
      <label className="relative min-w-52 flex-1 sm:max-w-xs">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
        <input name="q" defaultValue={q} placeholder="Найти урок" className="input py-2 pl-9 text-sm" />
      </label>
      {sections.length > 1 && (
        <select name="section" defaultValue={section ?? ""} className="input w-auto max-w-64 py-2 text-sm">
          <option value="">Все разделы</option>
          {sections.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      )}
      {classes && classes.length > 0 && (
        <select name="class" defaultValue={klass ?? ""} className="input w-auto py-2 text-sm">
          <option value="">Все классы</option>
          {classes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          <option value="none">Не назначены классу</option>
        </select>
      )}
      <button className="btn-ghost py-2 text-sm">Показать</button>
      {active && (
        <Link href={action} className="text-sm text-slate-500 hover:text-ocean-700">Сбросить</Link>
      )}
      {active && <span className="ml-auto text-xs text-slate-400">найдено {shown} из {total}</span>}
    </form>
  );
}
