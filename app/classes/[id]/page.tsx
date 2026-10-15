import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { plural } from "@/lib/plural";
import { metaOf } from "@/lib/modules/meta";
import { GRADED_TYPES, computeLessonStats, pct, scoreClass, type ResultRow } from "@/lib/stats";
import Rich from "@/components/modules/Rich";
import Icon from "@/components/Icon";
import AssignLessons from "@/components/AssignLessons";

const shortTitle = (t: string) => {
  const s = t.replace(/^[^:]+:\s*/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const num = (n: unknown) => (typeof n === "number" ? n.toLocaleString("ru-RU", { maximumSignificantDigits: 6 }) : "—");

function AttemptLine({ r, title }: { r: ResultRow; title: string }) {
  const d = (r.detail ?? {}) as Record<string, unknown>;
  return (
    <li className="rounded-xl border border-mist-100 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className={`pill ${metaOf(r.kind === "challenge" ? "simulation" : r.kind).badge}`}>{metaOf(r.kind === "challenge" ? "simulation" : r.kind).label}</span>
        <span className="font-medium text-slate-700"><Rich text={title} /></span>
        <span className="ml-auto">{time(r.createdAt)}</span>
      </div>
      {r.kind === "practice" ? (
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-slate-700"><Rich text={String(d.statement ?? "")} /></p>
          <p>
            <span className={r.correct ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>{r.correct ? "✓ Верно" : "✗ Неверно"}</span>
            <span className="text-slate-600"> · ответ ученика: <b>{num(d.answer)} {String(d.unit ?? "")}</b></span>
            {!r.correct && <span className="text-slate-600"> · правильно: <b>{num(d.expected)} {String(d.unit ?? "")}</b></span>}
            <span className="text-sun-600"> · сложность {"★".repeat(Number(d.difficulty ?? 1))}</span>
          </p>
          {typeof d.solutionText === "string" && d.solutionText.trim() && (
            <pre className="whitespace-pre-wrap rounded-lg bg-mist-50 p-2 font-mono text-xs text-slate-700">{d.solutionText}</pre>
          )}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-700">
          {r.kind === "quiz" && <>Верных ответов: <b>{num(d.score)} из {num(d.total)}</b></>}
          {r.kind === "matching" && <>Пар: <b>{num(d.pairs)}</b>, ошибок: <b>{num(d.mistakes)}</b></>}
          {r.kind === "challenge" && <>Звёзд: <b>{num(d.stars)} из {num(d.maxStars)}</b></>}
          <span className="ml-2 font-semibold text-ocean-700">{pct(r.score)}</span>
        </p>
      )}
    </li>
  );
}

export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { id } = await params;
  const { lesson: lessonParam } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=/classes/${id}`);

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      students: { orderBy: { name: "asc" }, include: { _count: { select: { results: true } } } },
      lessons: {
        orderBy: { updatedAt: "desc" },
        include: { blocks: { orderBy: { position: "asc" }, include: { module: true } } },
      },
    },
  });
  if (!classroom) notFound();

  const myLessons = await prisma.lesson.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { blocks: true } } },
  });

  const lesson = classroom.lessons.find((l) => l.id === lessonParam) ?? classroom.lessons[0];
  const graded = (lesson?.blocks ?? [])
    .filter((b) => GRADED_TYPES.includes(b.module.type))
    // один модуль может стоять в уроке дважды — считаем его один раз
    .filter((b, i, arr) => arr.findIndex((x) => x.moduleId === b.moduleId) === i)
    .map((b) => ({
      moduleId: b.moduleId,
      type: b.module.type,
      title: b.module.title,
      goal: Number((b.module.content as { goal?: number })?.goal ?? 1),
    }));
  const results = lesson
    ? await prisma.result.findMany({
        where: { lessonId: lesson.id, student: { classroomId: classroom.id } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const stats = computeLessonStats(graded, classroom.students, results);
  const titleOf = Object.fromEntries(graded.map((m) => [m.moduleId, shortTitle(m.title)]));

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/classes" className="hover:text-ocean-700">Мои классы</Link>
        <span className="mx-2 text-mist-300">/</span>
        <span className="text-ocean-800">{classroom.name}</span>
      </nav>

      <header className="flex flex-wrap items-stretch justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-ocean-900">{classroom.name}</h1>
          <p className="mt-1 text-slate-500">
            {plural(classroom.students.length, ["ученик", "ученика", "учеников"])} ·{" "}
            {plural(classroom.lessons.length, ["урок назначен", "урока назначено", "уроков назначено"])}
          </p>
        </div>
        <div className="card flex items-center gap-4 px-5 py-3">
          <Icon name="key" className="h-6 w-6 text-sun-500" />
          <div>
            <div className="text-xs font-semibold text-slate-500">Код класса для учеников</div>
            <div className="font-mono text-3xl font-extrabold tracking-[0.2em] text-ocean-800">{classroom.code}</div>
          </div>
          <div className="max-w-48 border-l border-mist-100 pl-4 text-xs text-slate-500">
            Ученики открывают <b className="text-ocean-800">«Я ученик»</b> на сайте, вводят код и своё имя
          </div>
        </div>
      </header>

      {classroom.lessons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Урок:</span>
          {classroom.lessons.map((l) => (
            <Link
              key={l.id}
              href={`/classes/${classroom.id}?lesson=${l.id}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                l.id === lesson?.id ? "bg-ocean-700 text-white" : "bg-white text-ocean-800 ring-1 ring-mist-200 hover:ring-lagoon-500"
              }`}
            >
              {l.title}
            </Link>
          ))}
        </div>
      )}

      {lesson ? (
        <>
          {/* Сводка */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Средний балл", pct(stats.kpi.average), "по начатым модулям", "chart"],
              ["Работали на уроке", `${stats.kpi.active} из ${stats.kpi.students}`, "учеников", "users"],
              ["Прошли урок полностью", `${stats.kpi.finished}`, "учеников", "check"],
              ["Своих задач решено верно", `${stats.kpi.practiceSolved}`, `всего попыток: ${stats.kpi.attempts}`, "practice"],
            ].map(([label, value, hint, icon]) => (
              <div key={label} className="card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Icon name={icon} className="h-4 w-4 text-lagoon-600" /> {label}
                </div>
                <div className="mt-2 text-3xl font-extrabold text-ocean-900">{value}</div>
                <div className="text-xs text-slate-400">{hint}</div>
              </div>
            ))}
          </section>

          {/* Таблица успеваемости */}
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-mist-100 px-5 py-4">
              <h2 className="text-lg font-bold text-ocean-900">Успеваемость по модулям</h2>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-100" /> ≥ 85%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-sun-100" /> 60–84%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-100" /> &lt; 60%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-mist-50 ring-1 ring-mist-100" /> не начинал</span>
              </div>
            </div>
            {graded.length === 0 ? (
              <p className="p-5 text-slate-500">В этом уроке нет оцениваемых модулей (практика, квиз, карточки).</p>
            ) : stats.rows.length === 0 ? (
              <p className="p-5 text-slate-500">В классе пока нет учеников. Дайте им код <b>{classroom.code}</b>.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="bg-mist-50 text-left text-xs text-slate-500">
                      <th className="sticky left-0 bg-mist-50 px-4 py-3 font-semibold">Ученик</th>
                      {graded.map((m) => (
                        <th key={m.moduleId} className="px-2 py-3 text-center font-semibold">
                          <span className="inline-flex items-center gap-1"><Icon name={m.type} className="h-3.5 w-3.5" /> {metaOf(m.type).label}</span>
                          <div className="font-normal normal-case text-slate-400"><Rich text={titleOf[m.moduleId]} /></div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center font-semibold">Средний балл</th>
                      <th className="px-4 py-3 font-semibold">Выполнено</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist-100">
                    {stats.rows.map((r) => (
                      <tr key={r.id}>
                        <td className="sticky left-0 bg-white px-4 py-2.5 font-semibold text-ocean-900">
                          <a href={`#student-${r.id}`} className="hover:text-lagoon-700">{r.name}</a>
                        </td>
                        {graded.map((m) => {
                          const c = r.cells[m.moduleId];
                          return (
                            <td key={m.moduleId} className="px-2 py-2 text-center">
                              <span className={`inline-block min-w-16 rounded-lg px-2 py-1 font-semibold ${scoreClass(c.score)}`}>
                                {m.type === "practice"
                                  ? c.attempts
                                    ? `${c.correct}/${m.goal}${c.done ? " ✓" : ""}`
                                    : "—"
                                  : pct(c.score)}
                              </span>
                              {c.attempts > 0 && (
                                <div className="mt-0.5 text-[11px] text-slate-400">
                                  {m.type === "practice" ? `точность ${pct(c.score)}` : plural(c.attempts, ["попытка", "попытки", "попыток"])}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block min-w-14 rounded-lg px-2 py-1 font-bold ${scoreClass(r.average)}`}>{pct(r.average)}</span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-mist-100">
                              <div className="h-full rounded-full bg-sun-400" style={{ width: `${r.completion * 100}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{pct(r.completion)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Детали по ученикам */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ocean-900">Работы учеников</h2>
              {stats.rows.filter((r) => r.attempts.length).length === 0 && (
                <div className="card p-6 text-slate-500">Пока никто не отправил результатов по этому уроку.</div>
              )}
              {stats.rows
                .filter((r) => r.attempts.length)
                .map((r) => (
                  <details key={r.id} id={`student-${r.id}`} className="card scroll-mt-20 overflow-hidden">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-3">
                      <span className="font-bold text-ocean-900">{r.name}</span>
                      <span className={`pill ${scoreClass(r.average)}`}>{pct(r.average)}</span>
                      <span className="text-xs text-slate-500">{plural(r.attempts.length, ["попытка", "попытки", "попыток"])}</span>
                      {r.lastActivity && <span className="ml-auto text-xs text-slate-400">последняя активность {time(r.lastActivity)}</span>}
                    </summary>
                    <ul className="space-y-2 border-t border-mist-100 bg-mist-50 p-4">
                      {r.attempts.map((a) => <AttemptLine key={a.id} r={a} title={titleOf[a.moduleId] ?? a.moduleId} />)}
                    </ul>
                  </details>
                ))}
            </section>

            <aside className="space-y-6">
              {/* Сложность модулей */}
              <section className="card p-5">
                <h2 className="mb-3 font-bold text-ocean-900">Где классу трудно</h2>
                <ul className="space-y-3">
                  {stats.moduleStats.map((m) => (
                    <li key={m.moduleId}>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Icon name={m.type} className="h-4 w-4 text-lagoon-600" /> <Rich text={titleOf[m.moduleId]} />
                        </span>
                        <span className="font-semibold text-ocean-800">{pct(m.average)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-mist-100">
                        <div
                          className={`h-full rounded-full ${m.average === null ? "" : m.average >= 0.85 ? "bg-emerald-500" : m.average >= 0.6 ? "bg-sun-400" : "bg-rose-400"}`}
                          style={{ width: `${(m.average ?? 0) * 100}%` }}
                        />
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">начали {m.started}, выполнили {m.done} из {stats.rows.length}</div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card p-5">
                <h2 className="mb-1 font-bold text-ocean-900">Ученики и PIN-коды</h2>
                <p className="mb-3 text-xs text-slate-500">PIN нужен ученику, чтобы снова войти под своим именем.</p>
                {classroom.students.length === 0 ? (
                  <p className="text-sm text-slate-500">Пока никто не вошёл.</p>
                ) : (
                  <ul className="divide-y divide-mist-100 text-sm">
                    {classroom.students.map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-1.5">
                        <span className="text-slate-700">{s.name}</span>
                        <span className="font-mono text-slate-500">{s.pin}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        </>
      ) : null}

      <section className="card p-5">
        <h2 className="mb-1 font-bold text-ocean-900">Уроки класса</h2>
        <p className="mb-3 text-sm text-slate-500">Ученики видят только назначенные уроки.</p>
        <AssignLessons
          classId={classroom.id}
          lessons={myLessons.map((l) => ({
            id: l.id,
            title: l.title,
            blocks: l._count.blocks,
            assigned: classroom.lessons.some((x) => x.id === l.id),
          }))}
        />
      </section>
    </main>
  );
}
