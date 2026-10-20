"use client";
import { useState } from "react";
import Link from "next/link";
import { metaOf } from "@/lib/modules/meta";
import { plural } from "@/lib/plural";
import Icon from "./Icon";

type T = { id: number; title: string; paragraph: string | null; types: string[] };
type S = { id: number; title: string; topics: T[] };

// topicHref — куда ведёт тема (библиотека учителя или «Моя лаборатория» ученика); notes — темы с заметкой ученика
export default function GradeView({ sections, topicHref = "/library/topic/", notes = [] }: { sections: S[]; topicHref?: string; notes?: number[] }) {
  const [query, setQuery] = useState("");
  const [onlyReady, setOnlyReady] = useState(false);
  const q = query.trim().toLowerCase();

  const filtered = sections
    .map((s) => ({
      ...s,
      topics: s.topics.filter(
        (t) => (!onlyReady || t.types.length > 0) && (!q || t.title.toLowerCase().includes(q) || t.paragraph?.includes(q))
      ),
    }))
    .filter((s) => s.topics.length > 0);
  const total = filtered.reduce((a, s) => a + s.topics.length, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Оглавление разделов */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <label className="relative block">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-300" />
          <input
            className="input pl-9"
            placeholder="Поиск темы или §"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-mist-200 bg-white px-3.5 py-2.5 text-sm">
          <span className="font-medium text-slate-700">Только готовые</span>
          <input type="checkbox" className="h-4 w-4 accent-ocean-700" checked={onlyReady} onChange={(e) => setOnlyReady(e.target.checked)} />
        </label>
        <nav className="hidden space-y-0.5 lg:block">
          {filtered.map((s) => (
            <a
              key={s.id}
              href={`#section-${s.id}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-ocean-800"
            >
              <span className="line-clamp-1">{s.title}</span>
              {s.topics.some((t) => t.types.length) && <span className="h-2 w-2 shrink-0 rounded-full bg-sun-400" />}
            </a>
          ))}
        </nav>
      </aside>

      <div className="space-y-5">
        {total === 0 && (
          <div className="card p-10 text-center text-slate-500">Ничего не найдено. Попробуйте другой запрос.</div>
        )}
        {filtered.map((s) => (
          <section key={s.id} id={`section-${s.id}`} className="card scroll-mt-20 overflow-hidden">
            <h2 className="flex items-baseline justify-between gap-3 border-b border-mist-100 bg-mist-50/60 px-5 py-4">
              <span className="text-lg font-bold text-ocean-900">{s.title}</span>
              <span className="shrink-0 text-xs font-medium text-slate-400">{plural(s.topics.length, ["тема", "темы", "тем"])}</span>
            </h2>
            <ul className="divide-y divide-mist-100">
              {s.topics.map((t) => {
                const ready = t.types.length > 0;
                return (
                  <li key={t.id}>
                    <Link
                      href={`${topicHref}${t.id}`}
                      className={`group flex flex-wrap items-center gap-3 border-l-4 px-5 py-3 transition ${
                        ready ? "border-sun-400 hover:bg-sun-50" : "border-transparent hover:bg-mist-50"
                      }`}
                    >
                      <span className="w-16 shrink-0 font-mono text-xs text-mist-300">{t.paragraph}</span>
                      <span className={`flex-1 ${ready ? "font-semibold text-ocean-900" : "text-slate-500"}`}>{t.title}</span>
                      {notes.includes(t.id) && (
                        <span title="Есть моя заметка" className="pill bg-aqua-100 text-ocean-800">
                          <Icon name="edit" className="h-3 w-3" /> заметка
                        </span>
                      )}
                      {ready ? (
                        <span className="flex items-center gap-1">
                          {t.types.map((ty) => (
                            <span key={ty} title={metaOf(ty).label} className={`flex h-7 w-7 items-center justify-center rounded-lg ${metaOf(ty).tile}`}>
                              <Icon name={ty} className="h-3.5 w-3.5" />
                            </span>
                          ))}
                          <Icon name="arrowRight" className="ml-1 h-4 w-4 text-ocean-700 transition group-hover:translate-x-0.5" />
                        </span>
                      ) : (
                        <span className="pill bg-mist-100 text-slate-400">скоро</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
