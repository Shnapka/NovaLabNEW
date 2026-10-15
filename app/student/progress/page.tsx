import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentContext } from "@/lib/student";
import { GRADED_TYPES, computeLessonStats, pct, scoreClass } from "@/lib/stats";
import { metaOf } from "@/lib/modules/meta";
import Rich from "@/components/modules/Rich";
import Icon from "@/components/Icon";

export const metadata = { title: "NovaLab — моя статистика" };

const shortTitle = (t: string) => {
  const s = t.replace(/^[^:]+:\s*/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const num = (n: unknown) => (typeof n === "number" ? n.toLocaleString("ru-RU", { maximumSignificantDigits: 6 }) : "—");
const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function StudentProgressPage() {
  const ctx = await getStudentContext();
  if (!ctx.mode) redirect("/student");

  const memberships = await prisma.student.findMany({
    where: { id: { in: ctx.students.map((s) => s.id) } },
    include: {
      classroom: {
        include: { lessons: { orderBy: { updatedAt: "desc" }, include: { blocks: { orderBy: { position: "asc" }, include: { module: true } } } } },
      },
      results: { orderBy: { createdAt: "desc" }, include: { module: { select: { title: true } } } },
    },
  });

  // Статистика по каждому уроку — тем же расчётом, что видит учитель
  const lessonCards = memberships.flatMap((m) =>
    m.classroom.lessons.map((l) => {
      const graded = l.blocks
        .filter((b) => GRADED_TYPES.includes(b.module.type))
        .filter((b, i, arr) => arr.findIndex((x) => x.moduleId === b.moduleId) === i)
        .map((b) => ({ moduleId: b.moduleId, type: b.module.type, title: b.module.title, goal: Number((b.module.content as { goal?: number })?.goal ?? 1) }));
      const stats = computeLessonStats(graded, [{ id: m.id, name: m.name }], m.results.filter((r) => r.lessonId === l.id));
      return { lesson: l, classroom: m.classroom.name, graded, row: stats.rows[0] };
    })
  );

  const allResults = memberships.flatMap((m) => m.results);
  const started = lessonCards.filter((c) => c.row.average !== null);
  const kpi = {
    average: started.length ? started.reduce((a, c) => a + c.row.average!, 0) / started.length : null,
    finished: lessonCards.filter((c) => c.graded.length && c.row.completion === 1).length,
    solved: allResults.filter((r) => r.kind === "practice" && r.correct).length,
    attempts: allResults.length,
  };
  const practice = allResults.filter((r) => r.kind === "practice").slice(0, 20);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lagoon-700">{ctx.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">Моя статистика</h1>
        </div>
        <Link href="/student" className="btn-ghost"><Icon name="arrowLeft" className="h-4 w-4" /> К урокам</Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Средний балл", pct(kpi.average), "chart"],
          ["Уроков пройдено полностью", `${kpi.finished} из ${lessonCards.length}`, "check"],
          ["Своих задач решено верно", `${kpi.solved}`, "practice"],
          ["Всего попыток", `${kpi.attempts}`, "layers"],
        ].map(([label, value, icon]) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Icon name={icon} className="h-4 w-4 text-lagoon-600" /> {label}
            </div>
            <div className="mt-2 text-3xl font-extrabold text-ocean-900">{value}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold text-ocean-900">По урокам</h2>
        {lessonCards.length === 0 && <div className="card p-6 text-slate-500">Пока нет назначенных уроков.</div>}
        <div className="grid gap-4 lg:grid-cols-2">
          {lessonCards.map(({ lesson, classroom, graded, row }) => (
            <div key={`${classroom}-${lesson.id}`} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-lagoon-700">{classroom}</div>
                  <h3 className="text-lg font-bold text-ocean-900">{lesson.title}</h3>
                </div>
                <span className={`rounded-xl px-3 py-1.5 text-lg font-extrabold ${scoreClass(row.average)}`}>{pct(row.average)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist-100">
                  <div className="h-full rounded-full bg-sun-400" style={{ width: `${row.completion * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-500">выполнено {pct(row.completion)}</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {graded.map((m) => {
                  const c = row.cells[m.moduleId];
                  return (
                    <li key={m.moduleId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${metaOf(m.type).tile}`}>
                          <Icon name={m.type} className="h-3.5 w-3.5" />
                        </span>
                        <Rich text={shortTitle(m.title)} />
                      </span>
                      <span className={`shrink-0 rounded-lg px-2 py-0.5 font-semibold ${scoreClass(c.score)}`}>
                        {m.type === "practice" ? (c.attempts ? `${c.correct} из ${m.goal}${c.done ? " ✓" : ""}` : "—") : pct(c.score)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Link href={`/student/lesson/${lesson.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ocean-700 hover:text-lagoon-700">
                {row.completion === 1 ? "Повторить урок" : "Продолжить урок"} <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold text-ocean-900">Мои задачи</h2>
        {practice.length === 0 ? (
          <div className="card p-6 text-slate-500">Здесь появятся задачи, которые ты составишь и решишь в модулях «Практика».</div>
        ) : (
          <ul className="space-y-2">
            {practice.map((r) => {
              const d = (r.detail ?? {}) as Record<string, unknown>;
              return (
                <li key={r.id} className="card p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className={r.correct ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>{r.correct ? "✓ Верно" : "✗ Неверно"}</span>
                    <span>сложность <span className="text-sun-600">{"★".repeat(Number(d.difficulty ?? 1))}</span></span>
                    <span className="ml-auto">{time(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-slate-700"><Rich text={String(d.statement ?? "")} /></p>
                  <p className="mt-1 text-sm text-slate-600">
                    Мой ответ: <b>{num(d.answer)} {String(d.unit ?? "")}</b>
                    {!r.correct && <> · правильный: <b>{num(d.expected)} {String(d.unit ?? "")}</b></>}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
