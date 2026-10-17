"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

export default function ClassTabs({ classId, counts }: { classId: string; counts: { students: number; lessons: number; feedback: number; toReview: number } }) {
  const path = usePathname();
  const base = `/classes/${classId}`;
  const tabs = [
    { href: base, label: "Журнал", icon: "chart", active: path === base },
    { href: `${base}/lessons`, label: "По уроку", icon: "layers", active: path.startsWith(`${base}/lessons`) },
    { href: `${base}/students`, label: `Ученики · ${counts.students}`, icon: "users", active: path.startsWith(`${base}/students`) },
    { href: `${base}/manage`, label: `Уроки класса · ${counts.lessons}`, icon: "book", active: path.startsWith(`${base}/manage`) },
    { href: `${base}/feedback`, label: `Отзывы учеников · ${counts.feedback}`, icon: "message", active: path.startsWith(`${base}/feedback`) },
    { href: `${base}/reviews`, label: "Оценить уроки", icon: "bell", active: path.startsWith(`${base}/reviews`), badge: counts.toReview },
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-mist-200">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            t.active ? "border-ocean-700 text-ocean-800" : "border-transparent text-slate-500 hover:text-ocean-700"
          }`}
        >
          <Icon name={t.icon} className="h-4 w-4" /> {t.label}
          {"badge" in t && t.badge ? (
            <span title="Уроки, которые вы ещё не оценили" className="ml-0.5 rounded-full bg-sun-400 px-1.5 text-xs font-extrabold text-ocean-950">{t.badge}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
