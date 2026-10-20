"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Обзор", exact: true },
  { href: "/admin/lessons", label: "По урокам" },
  { href: "/admin/students", label: "Отзывы учеников" },
  { href: "/admin/teachers", label: "Анкеты учителей" },
  { href: "/admin/packages", label: "Пакеты тем" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex min-w-0 gap-0.5 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.exact ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
