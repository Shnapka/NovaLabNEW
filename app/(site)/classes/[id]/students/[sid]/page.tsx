import Link from "next/link";
import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { loadClassForTeacher, shortTitle } from "@/lib/classData";
import { metaOf } from "@/lib/modules/meta";
import { pct, scoreClass } from "@/lib/stats";
import Rich from "@/components/modules/Rich";
import Icon from "@/components/Icon";
import AttemptLine from "@/components/class/AttemptLine";
import DeleteStudentButton from "@/components/class/DeleteStudentButton";

// Профиль ученика: все уроки класса, баллы по модулям и все попытки
export default async function ClassStudentPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const session = await teacherSession();
  const data = session?.user?.id ? await loadClassForTeacher(id, session.user.id) : null;
  const me = data?.journal.find((r) => r.id === sid);
  if (!data || !me) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/classes/${id}/students`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ocean-700">
          <Icon name="arrowLeft" className="h-4 w-4" /> Все ученики
        </Link>
        <DeleteStudentButton
          classId={id}
          studentId={sid}
          name={me.name}
          attempts={me.attempts}
          hasAccount={me.hasAccount}
          redirectTo={`/classes/${id}/students`}
          withLabel
        />
      </div>

      <section className="card flex flex-wrap items-center gap-6 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sun-400 text-2xl font-extrabold text-ocean-950">
          {me.name.slice(0, 1)}
        </span>
        <div className="mr-auto">
          <h2 className="text-2xl font-extrabold text-ocean-900">{me.name}</h2>
          <p className="text-sm text-slate-500">{me.hasAccount ? "Входит по почте (аккаунт ученика)" : `Входит без аккаунта · PIN ${me.pin}`}</p>
        </div>
        {[
          ["Средний балл", pct(me.overall)],
          ["Пройдено уроков", `${me.lessonsDone} / ${data.lessons.length}`],
          ["Своих задач решено", `${me.practiceSolved}`],
          ["Попыток", `${me.attempts}`],
        ].map(([label, value]) => (
          <div key={label} className="text-center">
            <div className="text-2xl font-extrabold text-ocean-900">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </section>

      {data.lessons.map(({ lesson, graded, stats, group }, i) => {
        const row = stats.rows.find((r) => r.id === sid)!;
        const titleOf = Object.fromEntries(graded.map((m) => [m.moduleId, shortTitle(m.title)]));
        const newGroup = i === 0 || data.lessons[i - 1].group.key !== group.key;
        return (
          <section key={lesson.id} className="card overflow-hidden">
            {newGroup && (
              <div className="flex items-center gap-2 bg-ocean-700 px-5 py-2 text-xs font-bold uppercase tracking-wide text-white">
                <Icon name="book" className="h-4 w-4" /> {group.label}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 border-b border-mist-100 px-5 py-4">
              <span className="text-sm font-semibold text-mist-300">{i + 1}.</span>
              <h3 className="mr-auto text-lg font-bold text-ocean-900">{lesson.title}</h3>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-mist-100">
                  <div className="h-full rounded-full bg-sun-400" style={{ width: `${row.completion * 100}%` }} />
                </div>
                <span className="text-xs text-slate-500">выполнено {pct(row.completion)}</span>
              </div>
              <span className={`rounded-xl px-3 py-1 text-lg font-extrabold ${scoreClass(row.average)}`}>{pct(row.average)}</span>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-[300px_1fr]">
              <ul className="space-y-1.5">
                {graded.map((m) => {
                  const c = row.cells[m.moduleId];
                  return (
                    <li key={m.moduleId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${metaOf(m.type).tile}`}>
                          <Icon name={m.type} className="h-3.5 w-3.5" />
                        </span>
                        <Rich text={titleOf[m.moduleId]} />
                      </span>
                      <span className={`shrink-0 rounded-lg px-2 py-0.5 font-semibold ${scoreClass(c.score)}`}>
                        {m.type === "practice" ? (c.attempts ? `${c.correct} из ${m.goal}${c.done ? " ✓" : ""}` : "—") : pct(c.score)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {row.attempts.length === 0 ? (
                <p className="text-sm text-slate-400">Ученик ещё не работал на этом уроке.</p>
              ) : (
                <details className="rounded-xl bg-mist-50 p-3" open={row.attempts.length <= 4}>
                  <summary className="cursor-pointer text-sm font-semibold text-ocean-800">Все попытки ({row.attempts.length})</summary>
                  <ul className="mt-2 space-y-2">
                    {row.attempts.map((a) => <AttemptLine key={a.id} r={a} title={titleOf[a.moduleId] ?? a.moduleId} />)}
                  </ul>
                </details>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
