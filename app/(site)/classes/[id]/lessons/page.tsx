import Link from "next/link";
import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { loadClassForTeacher, shortTitle } from "@/lib/classData";
import { plural } from "@/lib/plural";
import { metaOf } from "@/lib/modules/meta";
import { pct, scoreClass } from "@/lib/stats";
import Rich from "@/components/modules/Rich";
import Icon from "@/components/Icon";
import AttemptLine from "@/components/class/AttemptLine";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Вкладка «По уроку»: модули урока × ученики, работы учеников, трудные модули
export default async function ClassLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { id } = await params;
  const { lesson: lessonParam } = await searchParams;
  const session = await teacherSession();
  const data = session?.user?.id ? await loadClassForTeacher(id, session.user.id) : null;
  if (!data) notFound();
  const { classroom, lessons } = data;

  if (lessons.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        В классе пока нет уроков. <Link href={`/classes/${id}/manage`} className="font-semibold text-ocean-700">Добавить урок</Link>
      </div>
    );
  }

  // По умолчанию — последний добавленный урок
  const selected = lessons.find((l) => l.lesson.id === lessonParam) ?? lessons[lessons.length - 1];
  const { lesson, graded, stats } = selected;
  const current = lessons.indexOf(selected);
  const titleOf = Object.fromEntries(graded.map((m) => [m.moduleId, shortTitle(m.title)]));
  const prev = lessons[current - 1];
  const next = lessons[current + 1];

  return (
    <div className="space-y-6">
      {/* Выбор урока */}
      <div className="flex flex-wrap items-center gap-2">
        {prev && (
          <Link href={`/classes/${id}/lessons?lesson=${prev.lesson.id}`} className="btn-ghost px-2.5 py-1.5" title="Предыдущий урок">
            <Icon name="arrowLeft" className="h-4 w-4" />
          </Link>
        )}
        <div className="flex-1 space-y-2">
          {data.groups.map((g) => (
            <div key={g.key} className="flex flex-wrap items-center gap-2">
              <span className="w-full text-xs font-bold uppercase tracking-wide text-lagoon-700 sm:w-48">{g.label}</span>
              {lessons
                .filter((l) => l.group.key === g.key)
                .map((l) => (
                  <Link
                    key={l.lesson.id}
                    href={`/classes/${id}/lessons?lesson=${l.lesson.id}`}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                      l.lesson.id === lesson.id ? "bg-ocean-700 text-white" : "bg-white text-ocean-800 ring-1 ring-mist-200 hover:ring-lagoon-500"
                    }`}
                  >
                    <span className="opacity-60">{lessons.indexOf(l) + 1}.</span> {l.lesson.title}
                    <span className={`ml-2 rounded px-1.5 text-xs ${l.lesson.id === lesson.id ? "bg-white/20" : scoreClass(l.stats.kpi.average)}`}>
                      {pct(l.stats.kpi.average)}
                    </span>
                  </Link>
                ))}
            </div>
          ))}
        </div>
        {next && (
          <Link href={`/classes/${id}/lessons?lesson=${next.lesson.id}`} className="btn-ghost px-2.5 py-1.5" title="Следующий урок">
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        )}
      </div>

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

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-mist-100 px-5 py-4">
          <div>
            <div className="text-xs font-semibold text-lagoon-700">{selected.group.label}{selected.group.topic ? ` · ${selected.group.topic}` : ""}</div>
            <h2 className="text-lg font-bold text-ocean-900">{lesson.title}: успеваемость по модулям</h2>
          </div>
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
                      <div className="font-normal text-slate-400"><Rich text={titleOf[m.moduleId]} /></div>
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
                            {m.type === "practice" ? (c.attempts ? `${c.correct}/${m.goal}${c.done ? " ✓" : ""}` : "—") : pct(c.score)}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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

        <aside>
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
        </aside>
      </div>
    </div>
  );
}
