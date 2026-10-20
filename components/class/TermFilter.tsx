import Link from "next/link";
import Icon from "@/components/Icon";
import { fmtDate, type TermView } from "@/lib/terms";

// Фильтр «четверть → раздел»: по умолчанию выбраны текущая четверть и раздел, который класс проходит сейчас.
// planHref — ссылка на редактирование плана (только у учителя); без неё и без плана фильтр не показывается.
export default function TermFilter({ base, term, planHref }: { base: string; term: TermView; planHref?: string }) {
  if (!term.hasPlan) {
    if (!planHref) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-mist-200 bg-white px-4 py-3 text-sm text-slate-600">
        <Icon name="layers" className="h-5 w-5 text-lagoon-600" />
        <span className="mr-auto">
          План четвертей не настроен — показаны все уроки. Укажите, какой раздел класс проходит в каждую четверть, и журнал будет открываться на текущем.
        </span>
        <Link href={planHref} className="btn-primary py-1.5 text-sm">Настроить план</Link>
      </div>
    );
  }
  const q = term.quarter;
  const tab = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
      active ? "bg-ocean-700 text-white" : "bg-white text-ocean-800 ring-1 ring-mist-200 hover:ring-lagoon-500"
    }`;
  const sections = q === "all" ? [] : term.quarters[q - 1].sections;

  return (
    <div className="card space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {term.quarters.map((x) => (
          <Link key={x.n} href={`${base}?q=${x.n}`} className={tab(q === x.n)}>
            {x.n} четверть
            {x.current && <span className={`h-2 w-2 rounded-full ${q === x.n ? "bg-sun-400" : "bg-emerald-500"}`} title="Текущая четверть" />}
          </Link>
        ))}
        <Link href={`${base}?q=all`} className={tab(q === "all")}>Весь год</Link>
        {planHref && (
          <Link href={planHref} className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-ocean-700">
            <Icon name="edit" className="h-3.5 w-3.5" /> План четвертей
          </Link>
        )}
      </div>
      {q !== "all" &&
        (sections.length === 0 ? (
          <p className="text-sm text-slate-500">
            На {q} четверть разделы не запланированы.
            {planHref && <> <Link href={planHref} className="font-semibold text-ocean-700">Добавить в план</Link></>}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 border-t border-mist-100 pt-3">
            <Link href={`${base}?q=${q}&s=all`} className={tab(!term.sectionKey)}>Вся четверть</Link>
            {sections.map((x) => (
              <Link key={x.key} href={`${base}?q=${q}&s=${x.key}`} className={tab(term.sectionKey === x.key)}>
                {x.label}
                <span className={`text-xs font-normal ${term.sectionKey === x.key ? "text-aqua-200" : "text-slate-400"}`}>
                  {fmtDate(x.start)} – {fmtDate(x.end)}
                </span>
                {x.current && <span className="rounded bg-sun-400 px-1.5 text-[11px] font-bold text-ocean-950">сейчас</span>}
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
