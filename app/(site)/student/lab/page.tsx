import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentContext, labOwner } from "@/lib/student";
import { TYPE_ORDER } from "@/lib/modules/meta";
import { isLabType, studentGrades } from "@/lib/lab";
import GradeView from "@/components/GradeView";
import Icon from "@/components/Icon";

export const metadata = { title: "NovaLab — моя лаборатория" };

// «Моя лаборатория»: весь учебник по темам; работа здесь не оценивается и не сохраняется (кроме личных заметок)
export default async function StudentLabPage({ searchParams }: { searchParams: Promise<{ grade?: string }> }) {
  const ctx = await getStudentContext();
  const owner = labOwner(ctx);
  if (!ctx.mode || !owner) redirect("/student");
  const { grade: gradeParam } = await searchParams;

  // Только учебники классов, в которых учится ученик
  const grades = (await studentGrades(ctx.students.map((s) => s.classroomId))).map((n) => ({ number: n }));
  if (grades.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold text-ocean-900">Моя лаборатория</h1>
        <p className="mt-3 text-slate-500">
          {ctx.students.length
            ? "Учитель ещё не добавил в твой класс уроков, поэтому пока непонятно, учебник какого класса открыть. Загляни позже!"
            : "Вступи в класс по коду учителя — и здесь откроется учебник твоего класса."}
        </p>
        <Link href="/student" className="btn-primary mt-6">К моим урокам</Link>
      </main>
    );
  }
  const number = grades.some((g) => g.number === Number(gradeParam)) ? Number(gradeParam) : grades[0].number;
  const grade = await prisma.grade.findUnique({
    where: { number },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { topics: { orderBy: { order: "asc" }, include: { modules: { select: { type: true } } } } },
      },
    },
  });
  if (!grade) redirect("/student/lab");
  const notes = await prisma.labNote.findMany({ where: { owner, topic: { section: { gradeId: grade.id } } }, select: { topicId: true } });

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lagoon-700">Свободная работа с учебником</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">Моя лаборатория</h1>
          {grade.textbook && <p className="mt-1 text-sm text-slate-500">По учебнику: {grade.textbook}</p>}
        </div>
        {grades.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {grades.map((g) => (
            <Link
              key={g.number}
              href={`/student/lab?grade=${g.number}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                g.number === number ? "bg-ocean-700 text-white" : "bg-white text-ocean-800 ring-1 ring-mist-200 hover:ring-lagoon-500"
              }`}
            >
              {g.number} класс
            </Link>
          ))}
        </div>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-aqua-200 bg-aqua-100/40 px-5 py-3 text-sm text-ocean-900">
        <Icon name="star" className="h-5 w-5 text-sun-500" />
        <span>
          Здесь можно спокойно разбираться в любой теме: конспект, графики, симуляция и практика. <b>Оценки не ставятся</b>, ответы не сохраняются и не видны учителю. По каждой теме можно вести свою заметку.
        </span>
      </div>

      <GradeView
        topicHref="/student/lab/topic/"
        notes={notes.map((n) => n.topicId)}
        sections={grade.sections.map((s) => ({
          id: s.id,
          title: s.title,
          topics: s.topics.map((t) => ({
            id: t.id,
            title: t.title,
            paragraph: t.paragraph,
            types: TYPE_ORDER.filter((ty) => isLabType(ty) && t.modules.some((m) => m.type === ty)),
          })),
        }))}
      />
    </main>
  );
}
