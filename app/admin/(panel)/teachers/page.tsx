import { redirect } from "next/navigation";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { TEACHER_QUESTIONS, answerLabel, avg, fmtAvg, ratingClass, type ReviewAnswers } from "@/lib/feedback";
import { plural } from "@/lib/plural";
import Filters, { ratingRange } from "@/components/admin/Filters";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const LIMIT = 200;

type SP = { lesson?: string; rating?: string; comments?: string };

export default async function AdminTeacherReviews({ searchParams }: { searchParams: Promise<SP> }) {
  if (!(await adminSession())) redirect("/admin/login");
  const sp = await searchParams;

  const where = {
    ...(sp.lesson ? { lessonTitle: sp.lesson } : {}),
    ...(ratingRange(sp.rating) ? { rating: ratingRange(sp.rating) } : {}),
    ...(sp.comments ? { comment: { not: null } } : {}),
  };
  const [items, total, lessons] = await Promise.all([
    prisma.teacherReview.findMany({ where, orderBy: { updatedAt: "desc" }, take: LIMIT }),
    prisma.teacherReview.count({ where }),
    prisma.teacherReview.findMany({ distinct: ["lessonTitle"], select: { lessonTitle: true }, orderBy: { lessonTitle: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Анкеты учителей</h1>
        <p className="text-slate-500">
          {plural(total, ["анкета", "анкеты", "анкет"])} · средняя оценка {fmtAvg(avg(items.map((i) => i.rating)))}
          {total > LIMIT && ` · показаны последние ${LIMIT}, полный список — в CSV`}
        </p>
      </div>
      <Filters base="/admin/teachers" lessons={lessons.map((l) => l.lessonTitle)} current={sp} commentLabel="только с комментарием" />

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white py-10 text-center text-slate-400 shadow-sm ring-1 ring-slate-200">Ничего не найдено</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((r) => {
            const a = r.answers as ReviewAnswers;
            return (
              <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${ratingClass(r.rating)}`}>{r.rating}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">{r.lessonTitle}</div>
                    <div className="text-xs text-slate-500">{r.teacherName} · {r.classroomName} · {time(r.updatedAt)}</div>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  {TEACHER_QUESTIONS.map((q) => (
                    <div key={q.id} className="contents">
                      <dt className="text-slate-500">{q.title}</dt>
                      <dd className="font-medium text-slate-800">{answerLabel(q, a[q.id]) || <span className="text-slate-300">—</span>}</dd>
                    </div>
                  ))}
                </dl>
                {r.comment && <p className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{r.comment}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
