import Link from "next/link";

// Выбор раздела учебника, когда план четвертей не задан
export default function SectionChips({ base, sections, active }: { base: string; sections: { key: string; label: string }[]; active: string | null }) {
  if (sections.length < 2) return null;
  const tab = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${on ? "bg-ocean-700 text-white" : "bg-white text-ocean-800 ring-1 ring-mist-200 hover:ring-lagoon-500"}`;
  return (
    <div className="card flex flex-wrap items-center gap-2 p-3 sm:p-4">
      <Link href={`${base}?s=all`} className={tab(!active)}>Все разделы</Link>
      {sections.map((s) => (
        <Link key={s.key} href={`${base}?s=${s.key}`} className={tab(active === s.key)}>{s.label}</Link>
      ))}
    </div>
  );
}
