import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { plural } from "@/lib/plural";
import { MODULE_META, TYPE_ORDER } from "@/lib/modules/meta";
import Icon from "@/components/Icon";

export default async function LibraryPage() {
  const session = await auth();
  const grades = await prisma.grade.findMany({
    orderBy: { number: "asc" },
    include: { sections: { include: { topics: { include: { _count: { select: { modules: true } } } } } } },
  });
  const ready = await prisma.topic.findMany({
    where: { modules: { some: {} } },
    orderBy: { id: "asc" },
    include: { section: { include: { grade: true } }, modules: { select: { type: true } } },
  });
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <header>
        <p className="text-sm font-semibold text-lagoon-700">Библиотека уроков</p>
        <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">
          {firstName ? `Здравствуйте, ${firstName}!` : "Здравствуйте!"} С какого класса начнём?
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {grades.map((g) => {
          const topics = g.sections.flatMap((s) => s.topics);
          const readyCount = topics.filter((t) => t._count.modules > 0).length;
          const pct = topics.length ? Math.max((readyCount / topics.length) * 100, readyCount ? 4 : 0) : 0;
          return (
            <Link
              key={g.id}
              href={`/library/${g.number}`}
              className="card group relative overflow-hidden p-5 transition hover:-translate-y-1 hover:border-lagoon-500 hover:shadow-lg"
            >
              <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-aqua-100 transition group-hover:bg-aqua-200" />
              <div className="relative">
                <div className="text-5xl font-extrabold text-ocean-700">{g.number}</div>
                <div className="font-bold text-ocean-900">класс</div>
                <div className="mt-4 text-sm text-slate-500">
                  {plural(g.sections.length, ["раздел", "раздела", "разделов"])} · {plural(topics.length, ["тема", "темы", "тем"])}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist-100">
                  <div className="h-full rounded-full bg-sun-400" style={{ width: `${pct}%` }} />
                </div>
                <div className={`mt-1.5 text-xs font-semibold ${readyCount ? "text-ocean-700" : "text-mist-300"}`}>
                  {readyCount ? `Готово: ${plural(readyCount, ["урок", "урока", "уроков"])}` : "Модули в разработке"}
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {ready.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-extrabold text-ocean-900">Готовые интерактивные уроки</h2>
            <span className="text-sm text-slate-500">с симуляцией и полным набором модулей</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {ready.map((t) => (
              <Link
                key={t.id}
                href={`/library/topic/${t.id}`}
                className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-28 bg-gradient-to-br from-ocean-800 via-ocean-700 to-lagoon-500 p-5 text-white">
                  <span className="pill bg-white/15 text-aqua-100">{t.section.grade.number} класс · {t.paragraph}</span>
                  <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sun-400 text-ocean-950 shadow-lg transition group-hover:scale-110">
                    <Icon name="play" />
                  </span>
                </div>
                <div className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-lagoon-700">{t.section.title}</div>
                  <div className="mt-1 text-lg font-bold text-ocean-900">{t.title}</div>
                  <div className="mt-4 flex gap-1.5">
                    {TYPE_ORDER.filter((ty) => t.modules.some((m) => m.type === ty)).map((ty) => (
                      <span key={ty} title={MODULE_META[ty].label} className={`flex h-8 w-8 items-center justify-center rounded-lg ${MODULE_META[ty].tile}`}>
                        <Icon name={ty} className="h-4 w-4" />
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
