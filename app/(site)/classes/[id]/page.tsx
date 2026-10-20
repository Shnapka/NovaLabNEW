import Link from "next/link";
import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { loadClassForTeacher } from "@/lib/classData";
import { pct } from "@/lib/stats";
import { plural } from "@/lib/plural";
import Icon from "@/components/Icon";
import JournalTable from "@/components/class/JournalTable";
import TermFilter from "@/components/class/TermFilter";
import { resolveTerm, visibleSectionKeys } from "@/lib/terms";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Вкладка «Журнал»: сводка по урокам текущей четверти и раздела (или выбранных в фильтре)
export default async function ClassJournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; s?: string }>;
}) {
  const { id } = await params;
  const { q, s } = await searchParams;
  const session = await teacherSession();
  const data = session?.user?.id ? await loadClassForTeacher(id, session.user.id) : null;
  if (!data) notFound();
  const { classroom, results } = data;

  // Только уроки выбранной четверти / раздела; итоги учеников пересчитываются по ним
  const term = resolveTerm(data.plan, new Date(), q, s);
  const keys = visibleSectionKeys(term);
  const lessons = keys ? data.lessons.filter((l) => keys.has(l.group.key)) : data.lessons;
  const groupCount = new Set(lessons.map((l) => l.group.key)).size;
  const journal = data.journal.map((r) => {
    const cells = lessons.map((l) => r.cells[l.lesson.id]);
    const started = cells.filter((c) => c.average !== null);
    return {
      ...r,
      overall: started.length ? started.reduce((a, c) => a + c.average!, 0) / started.length : null,
      lessonsDone: cells.filter((c) => c.completion === 1).length,
    };
  });

  const active = journal.filter((r) => r.overall !== null);
  const classAvg = active.length ? active.reduce((a, r) => a + r.overall!, 0) / active.length : null;
  const inactive = journal.filter((r) => r.attempts === 0);
  const struggling = journal.filter((r) => r.overall !== null && r.overall < 0.6).sort((a, b) => a.overall! - b.overall!);
  const recent = results.slice(0, 8);
  const lessonTitle = Object.fromEntries(lessons.map((l) => [l.lesson.id, l.lesson.title]));
  const studentName = Object.fromEntries(classroom.students.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <TermFilter planHref={`/classes/${classroom.id}/plan`} base={`/classes/${classroom.id}`} term={term} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Средний балл класса", pct(classAvg), "по всем начатым урокам", "chart"],
          ["Работают", `${active.length} из ${journal.length}`, "учеников с результатами", "users"],
          [term.quarter === "all" ? "Уроков за год" : "Уроков в выборке", `${lessons.length}`, plural(groupCount, ["раздел", "раздела", "разделов"]), "layers"],
          ["Своих задач решено", `${journal.reduce((a, r) => a + r.practiceSolved, 0)}`, `всего попыток: ${results.length}`, "practice"],
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

      {(struggling.length > 0 || inactive.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          {struggling.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
              <div className="mb-2 text-sm font-bold text-rose-800">Требуют внимания — средний балл ниже 60%</div>
              <div className="flex flex-wrap gap-2">
                {struggling.map((r) => (
                  <Link key={r.id} href={`/classes/${classroom.id}/students/${r.id}`} className="pill bg-white py-1 text-rose-700 ring-1 ring-rose-200 hover:ring-rose-400">
                    {r.name} · {pct(r.overall)}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div className="rounded-2xl border border-mist-200 bg-white p-4">
              <div className="mb-2 text-sm font-bold text-slate-600">Ещё не приступали</div>
              <div className="flex flex-wrap gap-2">
                {inactive.map((r) => (
                  <span key={r.id} className="pill bg-mist-50 py-1 text-slate-500 ring-1 ring-mist-200">{r.name}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <JournalTable
        classId={classroom.id}
        lessons={lessons.map(({ lesson, stats, group }) => ({
          id: lesson.id,
          title: lesson.title,
          group: group.label,
          topic: group.topic,
          average: stats.kpi.average,
          finished: stats.kpi.finished,
          active: stats.kpi.active,
        }))}
        rows={journal.map((r) => ({
          id: r.id,
          name: r.name,
          hasAccount: r.hasAccount,
          overall: r.overall,
          lessonsDone: r.lessonsDone,
          attempts: r.attempts,
          cells: r.cells,
        }))}
      />

      {recent.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900">Последняя активность</h2>
          <ul className="divide-y divide-mist-100 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                <Link href={`/classes/${classroom.id}/students/${r.studentId}`} className="font-semibold text-ocean-900 hover:text-lagoon-700">
                  {studentName[r.studentId]}
                </Link>
                <span className="text-slate-500">
                  {r.kind === "practice" ? (r.correct ? "решил свою задачу верно" : "ошибся в своей задаче") : r.kind === "quiz" ? "прошёл квиз" : r.kind === "matching" ? "собрал карточки" : "выполнил задание"}
                </span>
                <span className="text-slate-400">· {lessonTitle[r.lessonId]}</span>
                <span className="ml-auto text-xs text-slate-400">{time(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
