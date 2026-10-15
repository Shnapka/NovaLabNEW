import { prisma } from "@/lib/db";

const typeLabel: Record<string, string> = {
  simulation: "Симуляция", graph: "График", quiz: "Квиз", text: "Текст",
};

export default async function CatalogPage() {
  const grades = await prisma.grade.findMany({
    orderBy: { number: "asc" },
    include: { sections: { include: { topics: { include: { modules: true } } } } },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-3xl font-bold">Каталог модулей</h1>
      {grades.map((g) => (
        <section key={g.id}>
          <h2 className="mb-3 text-2xl font-semibold">{g.number} класс</h2>
          {g.sections.map((s) => (
            <div key={s.id} className="mb-4">
              <h3 className="mb-2 text-lg font-medium text-gray-700">{s.title}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {s.topics.map((t) => (
                  <div key={t.id} className="rounded-lg border bg-white p-4">
                    <h4 className="mb-2 font-semibold">{t.title}</h4>
                    <ul className="space-y-1 text-sm">
                      {t.modules.map((m) => (
                        <li key={m.id} className="flex justify-between">
                          <a href={`/preview/${m.id}`} className="text-blue-600 hover:underline">{m.title}</a>
                          <span className="text-gray-400">{typeLabel[m.type] ?? m.type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
