import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TYPE_ORDER } from "@/lib/modules/meta";
import GradeView from "@/components/GradeView";

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
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/library" className="hover:text-ocean-700">Библиотека</Link>
        <span className="mx-2 text-mist-300">/</span>
        <span className="text-ocean-800">{grade.number} класс</span>
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-ocean-900">{grade.number} класс</h1>
          {grade.textbook && (
            <p className="mt-1 text-sm text-slate-500">Программа по учебнику: {grade.textbook}</p>
          )}
        </div>
      </header>

      <GradeView
        sections={grade.sections.map((s) => ({
          id: s.id,
          title: s.title,
          topics: s.topics.map((t) => ({
            id: t.id,
            title: t.title,
            paragraph: t.paragraph,
            types: TYPE_ORDER.filter((ty) => t.modules.some((m) => m.type === ty)),
          })),
        }))}
      />
    </main>
  );
}
