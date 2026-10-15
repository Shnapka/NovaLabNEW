import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { metaOf, TYPE_ORDER } from "@/lib/modules/meta";
import { plural } from "@/lib/plural";

export default async function GradePage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade: gradeParam } = await params;
  const number = Number(gradeParam);
  if (!Number.isInteger(number)) notFound();

  const grade = await prisma.grade.findUnique({
    where: { number },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          topics: { orderBy: { order: "asc" }, include: { modules: { select: { type: true } } } },
        },
      },
    },
  });
  if (!grade) notFound();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <nav className="text-sm text-gray-500">
        <Link href="/library" className="hover:underline">Библиотека</Link> / {grade.number} класс
      </nav>
      <div>
        <h1 className="text-3xl font-bold">{grade.number} класс</h1>
        {grade.textbook && <p className="mt-1 text-sm text-gray-500">По учебнику: {grade.textbook}</p>}
      </div>

      {grade.sections.map((s, si) => (
        <details key={s.id} open={s.topics.some((t) => t.modules.length > 0) || si === 0} className="rounded-xl border bg-white">
          <summary className="cursor-pointer px-5 py-4 text-lg font-semibold">
            {s.title}
            <span className="ml-2 text-sm font-normal text-gray-400">{plural(s.topics.length, ["тема", "темы", "тем"])}</span>
          </summary>
          <ul className="divide-y border-t">
            {s.topics.map((t) => {
              const types = TYPE_ORDER.filter((ty) => t.modules.some((m) => m.type === ty));
              const isReady = types.length > 0;
              return (
                <li key={t.id}>
                  <Link
                    href={`/library/topic/${t.id}`}
                    className={`flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-gray-50 ${isReady ? "" : "text-gray-500"}`}
                  >
                    {t.paragraph && <span className="w-16 shrink-0 font-mono text-xs text-gray-400">{t.paragraph}</span>}
                    <span className={`flex-1 ${isReady ? "font-medium text-gray-900" : ""}`}>{t.title}</span>
                    {isReady ? (
                      <span className="flex flex-wrap gap-1">
                        {types.map((ty) => (
                          <span key={ty} className={`rounded px-2 py-0.5 text-xs ${metaOf(ty).badge}`}>{metaOf(ty).label}</span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">скоро</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </main>
  );
}
