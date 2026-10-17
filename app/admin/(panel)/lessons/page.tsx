import Link from "next/link";
import { redirect } from "next/navigation";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { avg, fmtAvg, ratingClass } from "@/lib/feedback";

// Сводка по урокам: уроки сгруппированы по названию (копии одной темы у разных учителей — вместе)
export default async function AdminLessons() {
  if (!(await adminSession())) redirect("/admin/login");

  const [feedback, reviews] = await Promise.all([
    prisma.lessonFeedback.findMany({ select: { lessonTitle: true, rating: true, liked: true, disliked: true, teacherId: true } }),
    prisma.teacherReview.findMany({ select: { lessonTitle: true, rating: true, comment: true, teacherId: true } }),
  ]);
  const titles = [...new Set([...feedback.map((f) => f.lessonTitle), ...reviews.map((r) => r.lessonTitle)])];
  const rows = titles
    .map((t) => {
      const fs = feedback.filter((f) => f.lessonTitle === t);
      const rs = reviews.filter((r) => r.lessonTitle === t);
      return {
        title: t,
        sCount: fs.length,
        sAvg: avg(fs.map((f) => f.rating)),
        sComments: fs.filter((f) => f.liked || f.disliked).length,
        tCount: rs.length,
        tAvg: avg(rs.map((r) => r.rating)),
        teachers: new Set([...fs.map((f) => f.teacherId), ...rs.map((r) => r.teacherId)].filter(Boolean)).size,
      };
    })
    .sort((a, b) => b.sCount + b.tCount - (a.sCount + a.tCount));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">По урокам</h1>
        <p className="text-slate-500">Средние оценки каждого урока от учеников и учителей</p>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-semibold">Урок</th>
                <th className="px-3 py-3 text-center font-semibold">Учителей</th>
                <th className="px-3 py-3 text-center font-semibold">Оценка учеников</th>
                <th className="px-3 py-3 text-center font-semibold">Отзывов / с комментарием</th>
                <th className="px-3 py-3 text-center font-semibold">Оценка учителей</th>
                <th className="px-3 py-3 text-center font-semibold">Анкет</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Пока нет оценок</td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.title} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                    <Link href={`/admin/students?lesson=${encodeURIComponent(r.title)}`} className="hover:text-ocean-700">{r.title}</Link>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{r.teachers}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block min-w-12 rounded-lg px-2 py-1 font-bold ${ratingClass(r.sAvg)}`}>{fmtAvg(r.sAvg)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{r.sCount} / {r.sComments}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Link href={`/admin/teachers?lesson=${encodeURIComponent(r.title)}`}>
                      <span className={`inline-block min-w-12 rounded-lg px-2 py-1 font-bold ${ratingClass(r.tAvg)}`}>{fmtAvg(r.tAvg)}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{r.tCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
