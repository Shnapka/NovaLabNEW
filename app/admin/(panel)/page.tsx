import Link from "next/link";
import { redirect } from "next/navigation";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { TEACHER_QUESTIONS, avg, fmtAvg, ratingClass, type ReviewAnswers } from "@/lib/feedback";
import { AnswerBars, RatingHistogram, Stat } from "@/components/admin/Charts";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function AdminOverview() {
  if (!(await adminSession())) redirect("/admin/login");

  const [teachers, studentAccounts, students, classes, lessons, feedback, reviews] = await Promise.all([
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.student.count(),
    prisma.classroom.count(),
    prisma.lesson.count(),
    prisma.lessonFeedback.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.teacherReview.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);
  const sAvg = avg(feedback.map((f) => f.rating));
  const tAvg = avg(reviews.map((r) => r.rating));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Обзор</h1>
          <p className="text-slate-500">Все оценки уроков от учеников и учителей платформы</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=students" className="btn bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">CSV: ученики</a>
          <a href="/api/admin/export?type=teachers" className="btn bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">CSV: учителя</a>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat value={teachers} label="Учителей" />
        <Stat value={students} label="Учеников в классах" hint={`с аккаунтом: ${studentAccounts}`} />
        <Stat value={classes} label="Классов" />
        <Stat value={lessons} label="Уроков" />
        <Stat value={fmtAvg(sAvg)} label="Оценка учеников" hint={`отзывов: ${feedback.length}`} />
        <Stat value={fmtAvg(tAvg)} label="Оценка учителей" hint={`анкет: ${reviews.length}`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold text-slate-900">Оценки учеников</h2>
          <p className="mb-4 text-xs text-slate-500">Сколько раз поставлена каждая оценка от 1 до 10</p>
          {feedback.length ? <RatingHistogram ratings={feedback.map((f) => f.rating)} label="Оценки учеников" /> : <Empty />}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold text-slate-900">Оценки учителей</h2>
          <p className="mb-4 text-xs text-slate-500">Сколько раз поставлена каждая оценка от 1 до 10</p>
          {reviews.length ? <RatingHistogram ratings={reviews.map((r) => r.rating)} label="Оценки учителей" /> : <Empty />}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold text-slate-900">Ответы учителей в анкете</h2>
        <p className="mb-4 text-xs text-slate-500">Доля анкет, где отмечен вариант · всего анкет: {reviews.length}</p>
        {reviews.length ? (
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
            {TEACHER_QUESTIONS.map((q) => {
              const answers = reviews.map((r) => (r.answers as ReviewAnswers)[q.id]);
              const answeredCount = answers.filter((a) => a && a.length).length;
              const rows = q.options
                .map((o) => ({ label: o.label, count: answers.filter((a) => (Array.isArray(a) ? a.includes(o.id) : a === o.id)).length }))
                .sort((a, b) => (q.multi ? b.count - a.count : 0));
              return (
                <div key={q.id}>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">
                    {q.title} <span className="font-normal text-slate-400">· ответили {answeredCount}</span>
                  </h3>
                  <AnswerBars rows={rows} total={answeredCount} />
                </div>
              );
            })}
          </div>
        ) : (
          <Empty />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Recent title="Последние отзывы учеников" href="/admin/students">
          {feedback.slice(0, 6).map((f) => (
            <li key={f.id} className="flex gap-3 py-2.5">
              <Score r={f.rating} />
              <div className="min-w-0 text-sm">
                <div className="truncate font-semibold text-slate-800">{f.lessonTitle}</div>
                <div className="text-xs text-slate-500">{f.studentName} · {f.classroomName} · {time(f.updatedAt)}</div>
                {(f.liked || f.disliked) && <p className="mt-1 line-clamp-2 text-slate-600">{[f.liked && `👍 ${f.liked}`, f.disliked && `👎 ${f.disliked}`].filter(Boolean).join("  ")}</p>}
              </div>
            </li>
          ))}
        </Recent>
        <Recent title="Последние анкеты учителей" href="/admin/teachers">
          {reviews.slice(0, 6).map((r) => (
            <li key={r.id} className="flex gap-3 py-2.5">
              <Score r={r.rating} />
              <div className="min-w-0 text-sm">
                <div className="truncate font-semibold text-slate-800">{r.lessonTitle}</div>
                <div className="text-xs text-slate-500">{r.teacherName} · {r.classroomName} · {time(r.updatedAt)}</div>
                {r.comment && <p className="mt-1 line-clamp-2 text-slate-600">{r.comment}</p>}
              </div>
            </li>
          ))}
        </Recent>
      </section>
    </div>
  );
}

function Score({ r }: { r: number }) {
  return <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-extrabold ${ratingClass(r)}`}>{r}</span>;
}

function Empty() {
  return <p className="py-8 text-center text-sm text-slate-400">Пока нет данных</p>;
}

function Recent({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  const empty = Array.isArray(children) && children.length === 0;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-ocean-700 hover:underline">Все →</Link>
      </div>
      {empty ? <Empty /> : <ul className="mt-2 divide-y divide-slate-100">{children}</ul>}
    </div>
  );
}
