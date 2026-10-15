import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStudent } from "@/lib/student";
import { GRADED_TYPES } from "@/lib/stats";
import { metaOf } from "@/lib/modules/meta";
import { Logo } from "@/components/Icon";
import Icon from "@/components/Icon";
import StudentJoinForm from "@/components/StudentJoinForm";
import StudentLogout from "@/components/StudentLogout";

export const metadata = { title: "NovaLab — ученику" };

export default async function StudentPage() {
  const student = await getStudent();

  if (!student) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-4 py-10">
        <div className="card w-full p-8">
          <div className="mb-6 flex items-center gap-3">
            <Logo className="h-11 w-11" />
            <div>
              <h1 className="text-2xl font-extrabold text-ocean-900">Вход для ученика</h1>
              <p className="text-sm text-slate-500">Код класса даст учитель</p>
            </div>
          </div>
          <StudentJoinForm />
        </div>
      </main>
    );
  }

  const lessons = await prisma.lesson.findMany({
    where: { classrooms: { some: { id: student.classroomId } } },
    orderBy: { updatedAt: "desc" },
    include: { blocks: { orderBy: { position: "asc" }, include: { module: { select: { type: true } } } } },
  });
  const results = await prisma.result.findMany({
    where: { studentId: student.id },
    select: { lessonId: true, moduleId: true },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lagoon-700">{student.classroom.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">Привет, {student.name.split(" ").slice(-1)[0]}!</h1>
          <p className="mt-1 text-slate-500">Уроки, которые назначил учитель. Результаты сохраняются автоматически.</p>
        </div>
        <StudentLogout className="btn-ghost" />
      </div>

      {lessons.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">Учитель ещё не назначил уроков. Загляни позже!</div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {lessons.map((l) => {
            const graded = [...new Set(l.blocks.filter((b) => GRADED_TYPES.includes(b.module.type)).map((b) => b.moduleId))];
            const done = graded.filter((m) => results.some((r) => r.lessonId === l.id && r.moduleId === m)).length;
            return (
              <li key={l.id}>
                <Link href={`/student/lesson/${l.id}`} className="card group block p-5 transition hover:-translate-y-0.5 hover:border-lagoon-500 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-ocean-900">{l.title}</h2>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sun-400 text-ocean-950 transition group-hover:scale-110">
                      <Icon name="play" className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {l.blocks.map((b) => (
                      <span key={b.id} title={metaOf(b.module.type).label} className={`flex h-7 w-7 items-center justify-center rounded-lg ${metaOf(b.module.type).tile}`}>
                        <Icon name={b.module.type} className="h-3.5 w-3.5" />
                      </span>
                    ))}
                  </div>
                  {graded.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Выполнено заданий</span>
                        <span className="text-ocean-700">{done} из {graded.length}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mist-100">
                        <div className="h-full rounded-full bg-sun-400" style={{ width: `${(done / graded.length) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
