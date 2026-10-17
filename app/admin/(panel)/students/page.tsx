import { redirect } from "next/navigation";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { avg, fmtAvg, ratingClass } from "@/lib/feedback";
import { plural } from "@/lib/plural";
import Filters, { ratingRange } from "@/components/admin/Filters";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const LIMIT = 200;

type SP = { lesson?: string; rating?: string; comments?: string };

export default async function AdminStudentFeedback({ searchParams }: { searchParams: Promise<SP> }) {
  if (!(await adminSession())) redirect("/admin/login");
  const sp = await searchParams;

  const where = {
    ...(sp.lesson ? { lessonTitle: sp.lesson } : {}),
    ...(ratingRange(sp.rating) ? { rating: ratingRange(sp.rating) } : {}),
    ...(sp.comments ? { OR: [{ liked: { not: null } }, { disliked: { not: null } }] } : {}),
  };
  const [items, total, lessons, teachers] = await Promise.all([
    prisma.lessonFeedback.findMany({ where, orderBy: { updatedAt: "desc" }, take: LIMIT }),
    prisma.lessonFeedback.count({ where }),
    prisma.lessonFeedback.findMany({ distinct: ["lessonTitle"], select: { lessonTitle: true }, orderBy: { lessonTitle: "asc" } }),
    prisma.user.findMany({ where: { role: "TEACHER" }, select: { id: true, name: true, email: true } }),
  ]);
  const teacherName = (id: string | null) => {
    const t = teachers.find((x) => x.id === id);
    return t ? t.name || t.email : "—";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Отзывы учеников</h1>
        <p className="text-slate-500">
          {plural(total, ["отзыв", "отзыва", "отзывов"])} · средняя оценка {fmtAvg(avg(items.map((i) => i.rating)))}
          {total > LIMIT && ` · показаны последние ${LIMIT}, полный список — в CSV`}
        </p>
      </div>
      <Filters base="/admin/students" lessons={lessons.map((l) => l.lessonTitle)} current={sp} commentLabel="только с комментарием" />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-semibold">Оценка</th>
                <th className="px-3 py-3 font-semibold">Урок</th>
                <th className="px-3 py-3 font-semibold">Ученик · класс · учитель</th>
                <th className="px-3 py-3 font-semibold">👍 Понравилось</th>
                <th className="px-3 py-3 font-semibold">👎 Не понравилось</th>
                <th className="px-3 py-3 font-semibold">Когда</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 align-top">
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Ничего не найдено</td>
                </tr>
              )}
              {items.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg font-extrabold ${ratingClass(f.rating)}`}>{f.rating}</span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{f.lessonTitle}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {f.studentName}
                    <div className="text-xs text-slate-400">{f.classroomName} · {teacherName(f.teacherId)}</div>
                  </td>
                  <td className="max-w-xs whitespace-pre-line px-3 py-3 text-slate-700">{f.liked ?? <span className="text-slate-300">—</span>}</td>
                  <td className="max-w-xs whitespace-pre-line px-3 py-3 text-slate-700">{f.disliked ?? <span className="text-slate-300">—</span>}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{time(f.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
