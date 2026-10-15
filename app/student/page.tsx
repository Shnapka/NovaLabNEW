import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStudentContext } from "@/lib/student";
import { GRADED_TYPES, computeLessonStats } from "@/lib/stats";
import { metaOf } from "@/lib/modules/meta";
import Icon, { Logo } from "@/components/Icon";
import StudentJoinForm from "@/components/StudentJoinForm";
import StudentLogout from "@/components/StudentLogout";

export const metadata = { title: "NovaLab — ученику" };

export default async function StudentPage() {
  const ctx = await getStudentContext();

  // Не вошёл: аккаунт или быстрый вход
  if (!ctx.mode) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Logo className="h-11 w-11" />
          <div>
            <h1 className="text-3xl font-extrabold text-ocean-900">Вход для ученика</h1>
            <p className="text-slate-500">Код класса даст учитель</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card flex flex-col p-7">
            <span className="pill w-fit bg-sun-100 text-sun-900">рекомендуем</span>
            <h2 className="mt-3 text-xl font-extrabold text-ocean-900">Аккаунт ученика</h2>
            <ul className="mt-3 flex-1 space-y-2 text-slate-600">
              <li className="flex gap-2"><Icon name="check" className="h-5 w-5 shrink-0 text-emerald-600" /> Вступай в классы по коду — сколько угодно</li>
              <li className="flex gap-2"><Icon name="check" className="h-5 w-5 shrink-0 text-emerald-600" /> Следи за своей статистикой и задачами</li>
              <li className="flex gap-2"><Icon name="check" className="h-5 w-5 shrink-0 text-emerald-600" /> Заходи с любого устройства по почте и паролю</li>
            </ul>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href="/login?mode=register&role=student" className="btn-accent py-3">Создать аккаунт</Link>
              <Link href="/login?next=/student" className="btn-ghost py-3">Войти</Link>
            </div>
          </section>
          <section className="card p-7">
            <h2 className="text-xl font-extrabold text-ocean-900">Быстрый вход без почты</h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">Код класса, имя и PIN-код. Аккаунт можно создать позже — результаты сохранятся.</p>
            <StudentJoinForm />
          </section>
        </div>
      </main>
    );
  }

  const classIds = ctx.students.map((s) => s.classroomId);
  const lessons = await prisma.lesson.findMany({
    where: { classrooms: { some: { id: { in: classIds } } } },
    orderBy: { updatedAt: "desc" },
    include: {
      classrooms: { where: { id: { in: classIds } }, select: { id: true, name: true } },
      blocks: { orderBy: { position: "asc" }, include: { module: { select: { type: true, title: true, content: true } } } },
    },
  });
  const results = await prisma.result.findMany({ where: { studentId: { in: ctx.students.map((s) => s.id) } } });
  const firstName = ctx.name.split(" ").slice(-1)[0];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lagoon-700">
            {ctx.students.length ? ctx.students.map((s) => s.classroom.name).join(" · ") : "Пока ни одного класса"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">Привет, {firstName}!</h1>
          <p className="mt-1 text-slate-500">Уроки твоих классов. Результаты сохраняются автоматически.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/progress" className="btn-primary">
            <Icon name="chart" className="h-4 w-4" /> Моя статистика
          </Link>
          {ctx.mode === "guest" && <StudentLogout className="btn-ghost" />}
        </div>
      </div>

      {ctx.mode === "guest" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sun-100 bg-sun-50 px-5 py-4">
          <p className="text-sm text-sun-900">
            Ты вошёл без аккаунта. Создай аккаунт — результаты перейдут в него, и ты сможешь заходить с любого устройства.
          </p>
          <Link href="/login?mode=register&role=student" className="btn-accent">Создать аккаунт</Link>
        </div>
      )}

      {ctx.mode === "account" && (
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ocean-900">
            <Icon name="key" className="h-5 w-5 text-sun-500" /> Вступить в класс по коду
          </h2>
          <StudentJoinForm account={{ name: ctx.name }} />
        </section>
      )}

      {lessons.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          {ctx.students.length ? "Учитель ещё не добавил уроков в твой класс. Загляни позже!" : "Вступи в класс по коду, который даст учитель, — и здесь появятся уроки."}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => {
            // «Выполнено» считается так же, как в статистике: практика — когда решено нужное число задач
            const graded = l.blocks
              .filter((b) => GRADED_TYPES.includes(b.module.type))
              .filter((b, i, arr) => arr.findIndex((x) => x.moduleId === b.moduleId) === i)
              .map((b) => ({ moduleId: b.moduleId, type: b.module.type, title: b.module.title, goal: Number((b.module.content as { goal?: number })?.goal ?? 1) }));
            const me = ctx.students.find((s) => l.classrooms.some((c) => c.id === s.classroomId))!;
            const row = computeLessonStats(graded, [{ id: me.id, name: me.name }], results.filter((r) => r.lessonId === l.id && r.studentId === me.id)).rows[0];
            const done = graded.filter((m) => row.cells[m.moduleId].done).length;
            return (
              <li key={l.id}>
                <Link href={`/student/lesson/${l.id}`} className="card group block h-full p-5 transition hover:-translate-y-0.5 hover:border-lagoon-500 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-lagoon-700">{l.classrooms.map((c) => c.name).join(", ")}</div>
                      <h2 className="text-lg font-bold text-ocean-900">{l.title}</h2>
                    </div>
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
