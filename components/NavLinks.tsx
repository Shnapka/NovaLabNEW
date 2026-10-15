"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/library", label: "Библиотека", match: ["/library"] },
  { href: "/dashboard", label: "Мои уроки", match: ["/dashboard", "/lessons", "/lesson/"] },
  { href: "/classes", label: "Классы", match: ["/classes"] },
];

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
      {LINKS.map((l) => {
        const active = l.match.some((m) => path.startsWith(m));
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
