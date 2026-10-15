"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TEACHER = [
  { href: "/library", label: "Библиотека", match: ["/library"] },
  { href: "/dashboard", label: "Мои уроки", match: ["/dashboard", "/lessons", "/lesson/"] },
  { href: "/classes", label: "Классы", match: ["/classes"] },
];
const STUDENT = [
  { href: "/student", label: "Мои уроки", match: ["/student/lesson"], exact: "/student" },
  { href: "/student/progress", label: "Моя статистика", match: ["/student/progress"] },
];

export default function NavLinks({ role }: { role: "TEACHER" | "ADMIN" | "STUDENT" }) {
  const path = usePathname();
  const links = role === "STUDENT" ? STUDENT : TEACHER;
  return (
    <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
      {links.map((l) => {
        const active = ("exact" in l && path === l.exact) || l.match.some((m) => path.startsWith(m));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
              active ? "bg-white/15 text-white" : "text-aqua-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
