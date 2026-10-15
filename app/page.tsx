import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { MODULE_META, TYPE_ORDER } from "@/lib/modules/meta";
import Icon from "@/components/Icon";

function HeroArt() {
  return (
    <svg viewBox="0 0 320 260" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2BA00" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F2BA00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="130" r="70" fill="url(#glow)" />
      <g fill="none" stroke="#99D8DE" strokeWidth="2" opacity="0.9">
        <ellipse cx="160" cy="130" rx="120" ry="42" />
        <ellipse cx="160" cy="130" rx="120" ry="42" transform="rotate(60 160 130)" />
        <ellipse cx="160" cy="130" rx="120" ry="42" transform="rotate(-60 160 130)" />
      </g>
      <circle cx="160" cy="130" r="16" fill="#F2BA00" />
      <circle cx="280" cy="130" r="7" fill="#E2E8ED" />
      <circle cx="100" cy="26" r="6" fill="#5DB3C1" />
      <circle cx="100" cy="234" r="6" fill="#99D8DE" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();
  const cta = session?.user ? "/library" : "/login?next=/library";
  const [grades, topics, ready] = await Promise.all([
    prisma.grade.count(),
    prisma.topic.count(),
    prisma.topic.findMany({
      where: { modules: { some: {} } },
      include: { section: { include: { grade: true } } },
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-16 px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-900 via-ocean-700 to-lagoon-600 px-6 py-12 text-white sm:px-12 lg:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <span className="pill bg-white/10 text-aqua-200 ring-1 ring-white/20">7–11 классы · по школьной программе</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Уроки физики, которые <span className="text-sun-400">можно потрогать</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-aqua-100/90">
              Общая библиотека для учителей: выберите класс и тему — и проведите урок с интерактивной
              симуляцией, конспектом, графиками и играми на закрепление.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cta} className="btn-accent px-6 py-3 text-base">
                Открыть библиотеку <Icon name="arrowRight" />
              </Link>
              <Link href="/student" className="btn border border-white/30 px-6 py-3 text-base text-white hover:bg-white/10">
                Я ученик — войти по коду класса
              </Link>
            </div>
            <dl className="mt-10 flex gap-8 text-sm">
              {[
                [grades, "классов"],
                [topics, "тем в программе"],
                [ready.length, "готовых урока"],
              ].map(([n, l]) => (
                <div key={String(l)}>
                  <dt className="text-3xl font-extrabold text-white">{n}</dt>
                  <dd className="text-aqua-200">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mx-auto hidden h-72 w-full max-w-sm lg:block">
            <HeroArt />
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section id="how" className="scroll-mt-20">
        <h2 className="text-center text-2xl font-extrabold text-ocean-900">Урок за три шага</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Выберите класс и тему", "Библиотека повторяет оглавление учебника: класс → раздел → тема с номером параграфа."],
            ["Откройте модули", "В центре — WebGL-симуляция. Рядом конспект, графики, квиз и карточки на закрепление."],
            ["Назначьте классу", "Ученики входят по коду класса, решают свои задачи, а вы видите успеваемость каждого в статистике."],
          ].map(([t, d], i) => (
            <div key={t} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-400 text-lg font-extrabold text-ocean-950">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ocean-900">{t}</h3>
              <p className="mt-1 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Типы модулей */}
      <section>
        <h2 className="text-center text-2xl font-extrabold text-ocean-900">Из чего состоит каждый урок</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TYPE_ORDER.map((t) => {
            const m = MODULE_META[t];
            const main = t === "simulation";
            return (
              <div
                key={t}
                className={
                  main
                    ? "relative overflow-hidden rounded-2xl bg-ocean-700 p-6 text-white sm:col-span-2 lg:col-span-3"
                    : "card p-5"
                }
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${main ? "bg-white/10 text-sun-400" : m.tile}`}>
                  <Icon name={t} className="h-6 w-6" />
                </span>
                <h3 className={`mt-4 text-lg font-bold ${main ? "" : "text-ocean-900"}`}>{m.label}</h3>
                <p className={main ? "mt-1 text-aqua-200" : "mt-1 text-sm text-slate-600"}>{m.hint}</p>
                {main && (
                  <>
                    <p className="mt-4 text-sm text-aqua-100/80">
                      Центр каждого урока: ученики сами меняют параметры и видят, как работает закон.
                    </p>
                    <span className="pill mt-6 bg-sun-400 text-ocean-950">
                      <Icon name="star" className="h-3.5 w-3.5" /> главное
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Готовые уроки */}
      {ready.length > 0 && (
        <section className="pb-8">
          <h2 className="text-center text-2xl font-extrabold text-ocean-900">Уже готовы</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ready.map((t) => (
              <Link key={t.id} href={session?.user ? `/library/topic/${t.id}` : cta} className="card group p-6 transition hover:-translate-y-0.5 hover:border-lagoon-500">
                <div className="text-sm font-medium text-lagoon-700">
                  {t.section.grade.number} класс · {t.paragraph}
                </div>
                <div className="mt-1 text-lg font-bold text-ocean-900">{t.title}</div>
                <div className="mt-4 flex gap-1.5">
                  {TYPE_ORDER.map((ty) => (
                    <span key={ty} className={`flex h-8 w-8 items-center justify-center rounded-lg ${MODULE_META[ty].tile}`}>
                      <Icon name={ty} className="h-4 w-4" />
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
