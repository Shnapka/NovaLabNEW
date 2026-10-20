import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { MODULE_META, TYPE_ORDER } from "@/lib/modules/meta";
import Icon from "@/components/Icon";

// Знак NovaLab на главной: буква N вырезана из звезды (сквозь неё видно фон), лёгкая анимация — парение, блик, искры
function HeroLogo() {
  return (
    <svg viewBox="0 0 512 512" className="nova-float h-full w-full overflow-visible" aria-label="NovaLab">
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2BA00" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F2BA00" stopOpacity="0" />
        </radialGradient>
        {/* маска: звезда видна везде, кроме буквы N — там «дырка» */}
        <mask id="hero-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#fff" />
          <path d="M168 322 196 190 252 322 280 190" fill="none" stroke="#000" strokeWidth="26" strokeMiterlimit="10" />
        </mask>
        <clipPath id="hero-star">
          <path d="M256 40Q286.24 225.76 472 256Q286.24 286.24 256 472Q225.76 286.24 40 256Q225.76 225.76 256 40Z" />
        </clipPath>
        <linearGradient id="hero-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle className="nova-glow" cx="256" cy="256" r="230" fill="url(#hero-glow)" />
      <g mask="url(#hero-cut)">
        <path d="M256 40Q286.24 225.76 472 256Q286.24 286.24 256 472Q225.76 286.24 40 256Q225.76 225.76 256 40Z" fill="#F2BA00" />
        <path d="M256 40Q286.24 225.76 472 256Q286.24 286.24 256 472Z" fill="#DBA800" />
        {/* блик пробегает по звезде */}
        <g clipPath="url(#hero-star)">
          <rect x="-200" y="0" width="140" height="512" fill="url(#hero-shine)" transform="skewX(-18)">
            <animate attributeName="x" values="-200;720;720" keyTimes="0;0.45;1" dur="5s" repeatCount="indefinite" />
          </rect>
        </g>
      </g>
      <path d="M308 190 284 322H346" fill="none" stroke="#FFFFFF" strokeWidth="26" strokeMiterlimit="10" />
      {/* искры */}
      <path className="nova-twinkle" d="M430 70q4 22 26 26q-22 4-26 26q-4-22-26-26q22-4 26-26Z" fill="#FFFFFF" />
      <path className="nova-twinkle nova-twinkle--late" d="M82 400q3 16 19 19q-16 3-19 19q-3-16-19-19q16-3 19-19Z" fill="#99D8DE" />
      <path className="nova-twinkle nova-twinkle--mid" d="M440 400q2 10 12 12q-10 2-12 12q-2-10-12-12q10-2 12-12Z" fill="#F2BA00" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();
  const isStudent = session?.user?.role === "STUDENT";
  const isAdmin = session?.user?.role === "ADMIN";
  const cta = isStudent ? "/student" : isAdmin ? "/admin" : session?.user ? "/library" : "/login?next=/library";
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
            {session?.user && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={cta} className="btn-accent px-6 py-3 text-base">
                  {isStudent ? "К моим урокам" : isAdmin ? "Панель администратора" : "Открыть библиотеку"} <Icon name="arrowRight" />
                </Link>
              </div>
            )}
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
          {session?.user ? (
            <div className="mx-auto hidden h-80 w-full max-w-sm lg:block">
              <HeroLogo />
            </div>
          ) : (
            // Первый выбор на сайте: кто вы
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="flex flex-col rounded-2xl bg-white p-6 text-slate-700 shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-700 text-sun-400">
                  <Icon name="book" className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-2xl font-extrabold text-ocean-900">Я учитель</h2>
                <ul className="mt-2 flex-1 space-y-1 text-sm">
                  <li>• Библиотека уроков 7–11 классов</li>
                  <li>• Свои уроки и вопросы</li>
                  <li>• Классы и журнал успеваемости</li>
                </ul>
                <div className="mt-5 grid gap-2">
                  <Link href="/login?role=teacher" className="btn-primary py-2.5">Войти</Link>
                  <Link href="/login?mode=register&role=teacher" className="btn-ghost py-2.5">Создать аккаунт учителя</Link>
                </div>
              </div>
              <div className="flex flex-col rounded-2xl bg-white p-6 text-slate-700 shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sun-400 text-ocean-950">
                  <Icon name="users" className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-2xl font-extrabold text-ocean-900">Я ученик</h2>
                <ul className="mt-2 flex-1 space-y-1 text-sm">
                  <li>• Уроки своего класса</li>
                  <li>• Симуляции и практика</li>
                  <li>• Своя статистика</li>
                </ul>
                <div className="mt-5 grid gap-2">
                  <Link href="/student" className="btn-accent py-2.5">Войти или зарегистрироваться</Link>
                  <span className="text-center text-xs text-slate-500">понадобится код класса от учителя</span>
                </div>
              </div>
            </div>
          )}
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
