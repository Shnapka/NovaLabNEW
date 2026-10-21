import { redirect } from "next/navigation";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { STUDENT_DISLIKED, STUDENT_LIKED, avg, fmtAvg, ratingClass, type FeedbackOption } from "@/lib/feedback";
import { plural } from "@/lib/plural";
import Filters, { ratingRange } from "@/components/admin/Filters";

const day = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const labels = (ids: string[], options: FeedbackOption[]) => ids.map((id) => options.find((o) => o.id === id)?.label ?? id);
const LIMIT = 200;

type SP = { lesson?: string; rating?: string; comments?: string };

export default async function AdminStudentFeedback({ searchParams }: { searchParams: Promise<SP> }) {
  if (!(await adminSession())) redirect("/admin/login");
  const sp = await searchParams;

  const where = {
    ...(sp.lesson ? { lessonTitle: sp.lesson } : {}),
    ...(ratingRange(sp.rating) ? { rating: ratingRange(sp.rating) } : {}),
    ...(sp.comments ? { OR: [{ wish: { not: null } }, { liked: { not: null } }, { disliked: { not: null } }] } : {}),
  };
  const [items, total, lessons, teachers] = await Promise.all([
    prisma.lessonFeedback.findMany({ where, orderBy: [{ day: "desc" }, { voterKey: "asc" }], take: LIMIT }),
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
      <p className="text-sm text-slate-500">Опрос анонимный: в базе нет ни ученика, ни его имени, ни времени отправки — только дата.</p>
      <Filters base="/admin/students" lessons={lessons.map((l) => l.lessonTitle)} current={sp} commentLabel="только с пожеланием" />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-semibold">Оценка</th>
                <th className="px-3 py-3 font-semibold">Урок</th>
                <th className="px-3 py-3 font-semibold">Класс · учитель</th>
                <th className="px-3 py-3 font-semibold">👍 Понравилось</th>
                <th className="px-3 py-3 font-semibold">👎 Не понравилось</th>
                <th className="px-3 py-3 font-semibold">💡 Хотели бы видеть</th>
                <th className="px-3 py-3 font-semibold">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 align-top">
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">Ничего не найдено</td>
                </tr>
              )}
              {items.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg font-extrabold ${ratingClass(f.rating)}`}>{f.rating}</span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{f.lessonTitle}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {f.classroomName}
                    <div className="text-xs text-slate-400">{teacherName(f.teacherId)}</div>
                  </td>
                  <td className="max-w-xs px-3 py-3 text-slate-700"><Tags list={labels(f.likedTags, STUDENT_LIKED)} text={f.liked} /></td>
                  <td className="max-w-xs px-3 py-3 text-slate-700"><Tags list={labels(f.dislikedTags, STUDENT_DISLIKED)} text={f.disliked} /></td>
                  <td className="max-w-xs whitespace-pre-line px-3 py-3 text-slate-700">{f.wish ?? <span className="text-slate-300">—</span>}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{day(f.day)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Отмеченные варианты; text — свободный комментарий из старой версии опроса
function Tags({ list, text }: { list: string[]; text: string | null }) {
  if (!list.length && !text) return <span className="text-slate-300">—</span>;
  return (
    <>
      {list.length > 0 && <div>{list.join(", ")}</div>}
      {text && <div className="mt-1 whitespace-pre-line text-xs text-slate-500">{text}</div>}
    </>
  );
}
