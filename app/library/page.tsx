import Link from "next/link";
import { prisma } from "@/lib/db";
import { plural } from "@/lib/plural";

export default async function LibraryPage() {
  const grades = await prisma.grade.findMany({
    orderBy: { number: "asc" },
    include: { sections: { include: { topics: { include: { _count: { select: { modules: true } } } } } } },
  });
  const ready = await prisma.topic.findMany({
    where: { modules: { some: {} } },
    include: { section: { include: { grade: true } }, modules: { select: { type: true } } },
  });

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6">
      <div>
        <h1 className="text-3xl font-bold">Библиотека уроков</h1>
        <p className="mt-1 text-gray-600">Выберите класс, раздел и тему. В каждой теме — симуляция, конспект, графики и игры на закрепление.</p>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Классы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {grades.map((g) => {
            const topics = g.sections.flatMap((s) => s.topics);
            const readyCount = topics.filter((t) => t._count.modules > 0).length;
            return (
              <Link
                key={g.id}
                href={`/library/${g.number}`}
                className="group rounded-xl border bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md"
              >
                <div className="text-4xl font-bold text-indigo-600">{g.number}</div>
                <div className="font-medium">класс</div>
                <div className="mt-3 text-sm text-gray-500">
                  {plural(g.sections.length, ["раздел", "раздела", "разделов"])} · {plural(topics.length, ["тема", "темы", "тем"])}
                </div>
                <div className={`mt-1 text-sm ${readyCount ? "font-medium text-emerald-600" : "text-gray-400"}`}>
                  {readyCount ? `Готово уроков: ${readyCount}` : "Модули в разработке"}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {ready.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Готовые интерактивные уроки</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ready.map((t) => (
              <Link
                key={t.id}
                href={`/library/topic/${t.id}`}
                className="rounded-xl border bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white transition hover:shadow-lg"
              >
                <div className="text-sm text-indigo-100">
                  {t.section.grade.number} класс · {t.section.title}
                </div>
                <div className="mt-1 text-lg font-semibold">{t.title}</div>
                <div className="mt-1 text-sm text-indigo-100">{t.paragraph}</div>
                <div className="mt-3 text-sm">Модулей: {t.modules.length} · симуляция, конспект, графики, квиз, карточки</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
