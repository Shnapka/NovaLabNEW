import Link from "next/link";
import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { avg, fmtAvg, ratingClass } from "@/lib/feedback";
import { plural } from "@/lib/plural";
import Icon from "@/components/Icon";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Вкладка «Отзывы учеников»: оценки 1–10 и комментарии, по урокам
export default async function ClassFeedbackPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lesson?: string }> }) {
  const { id } = await params;
  const { lesson: only } = await searchParams;
  const session = await teacherSession();
  if (!session?.user?.id) notFound();

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      _count: { select: { students: true } },
      lessons: { orderBy: { createdAt: "asc" }, select: { id: true, title: true } },
      feedback: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!classroom) notFound();
  const { feedback, lessons } = classroom;

  if (feedback.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <Icon name="message" className="h-10 w-10 text-lagoon-600" />
        <h2 className="mt-3 text-xl font-bold text-ocean-900">Отзывов пока нет</h2>
        <p className="mt-1 max-w-md text-slate-500">
          В конце каждого урока ученик видит шаг «Оценка урока»: оценка от 1 до 10 и по желанию — что понравилось и что нет.
        </p>
      </div>
    );
  }

  const perLesson = lessons
    .map((l) => {
      const fs = feedback.filter((f) => f.lessonId === l.id);
      return { ...l, count: fs.length, avg: avg(fs.map((f) => f.rating)), comments: fs.filter((f) => f.liked || f.disliked).length };
    })
    .filter((l) => l.count > 0);
  const shown = only ? feedback.filter((f) => f.lessonId === only) : feedback;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-2 lg:sticky lg:top-20 lg:self-start">
        <Link
          href={`/classes/${id}/feedback`}
          className={`card flex items-center justify-between p-4 transition hover:border-lagoon-500 ${!only ? "border-ocean-700 ring-1 ring-ocean-700" : ""}`}
        >
          <div>
            <div className="font-bold text-ocean-900">Все уроки</div>
            <div className="text-xs text-slate-500">{plural(feedback.length, ["отзыв", "отзыва", "отзывов"])}</div>
          </div>
          <span className={`rounded-lg px-2.5 py-1 text-lg font-extrabold ${ratingClass(avg(feedback.map((f) => f.rating)))}`}>
            {fmtAvg(avg(feedback.map((f) => f.rating)))}
          </span>
        </Link>
        {perLesson.map((l) => (
          <Link
            key={l.id}
            href={`/classes/${id}/feedback?lesson=${l.id}`}
            className={`card flex items-center justify-between gap-3 p-4 transition hover:border-lagoon-500 ${only === l.id ? "border-ocean-700 ring-1 ring-ocean-700" : ""}`}
          >
            <div className="min-w-0">
              <div className="truncate font-semibold text-ocean-900">{l.title}</div>
              <div className="text-xs text-slate-500">
                оценили {l.count} из {classroom._count.students} · {plural(l.comments, ["комментарий", "комментария", "комментариев"])}
              </div>
            </div>
            <span className={`shrink-0 rounded-lg px-2.5 py-1 font-extrabold ${ratingClass(l.avg)}`}>{fmtAvg(l.avg)}</span>
          </Link>
        ))}
      </aside>

      <section className="space-y-3">
        {shown.map((f) => (
          <article key={f.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-extrabold ${ratingClass(f.rating)}`}>{f.rating}</span>
              <div className="mr-auto min-w-0">
                <div className="font-bold text-ocean-900">{f.studentId ? f.studentName : `${f.studentName} (удалён из класса)`}</div>
                <div className="text-xs text-slate-500">{f.lessonTitle} · {time(f.updatedAt)}</div>
              </div>
            </div>
            {(f.liked || f.disliked) ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {f.liked && (
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">👍 Понравилось</div>
                    <p className="whitespace-pre-line">{f.liked}</p>
                  </div>
                )}
                {f.disliked && (
                  <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wide text-rose-700">👎 Не понравилось</div>
                    <p className="whitespace-pre-line">{f.disliked}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Только оценка, без комментариев</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
