import Link from "next/link";
import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { MIN_ANONYMOUS, avg, fmtAvg, ratingClass } from "@/lib/feedback";
import { plural } from "@/lib/plural";
import Icon from "@/components/Icon";
import FeedbackSummary from "@/components/feedback/FeedbackSummary";

// Вкладка «Отзывы учеников»: анонимная сводка по урокам. Урок открывается, когда отзывов не меньше MIN_ANONYMOUS
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
      feedback: {
        select: { id: true, voterKey: true, lessonId: true, rating: true, likedTags: true, dislikedTags: true, wish: true, liked: true, disliked: true },
      },
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
          В конце каждого урока ученик проходит анонимный опрос: оценка от 1 до 10, что понравилось и что нет, и что он хотел бы видеть.
        </p>
      </div>
    );
  }

  const perLesson = lessons
    .map((l) => {
      const fs = feedback.filter((f) => f.lessonId === l.id);
      return { ...l, count: fs.length, open: fs.length >= MIN_ANONYMOUS, avg: avg(fs.map((f) => f.rating)) };
    })
    .filter((l) => l.count > 0);
  // Отзывы показываются только по урокам, где их достаточно, чтобы нельзя было догадаться, кто что написал
  const openIds = new Set(perLesson.filter((l) => l.open).map((l) => l.id));
  const current = only ? perLesson.find((l) => l.id === only) : null;
  const shown = feedback.filter((f) => f.lessonId && openIds.has(f.lessonId) && (!only || f.lessonId === only));
  const allAvg = avg(feedback.filter((f) => f.lessonId && openIds.has(f.lessonId)).map((f) => f.rating));

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
          <span className={`rounded-lg px-2.5 py-1 text-lg font-extrabold ${ratingClass(allAvg)}`}>{fmtAvg(allAvg)}</span>
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
                оценили {l.count} из {classroom._count.students}
                {!l.open && ` · откроется после ${MIN_ANONYMOUS}`}
              </div>
            </div>
            <span className={`shrink-0 rounded-lg px-2.5 py-1 font-extrabold ${ratingClass(l.open ? l.avg : null)}`}>{l.open ? fmtAvg(l.avg) : "🔒"}</span>
          </Link>
        ))}
      </aside>

      <section className="space-y-4">
        <p className="flex items-center gap-2 rounded-2xl border border-aqua-200 bg-aqua-100/40 px-4 py-3 text-sm text-ocean-900">
          <Icon name="message" className="h-5 w-5 shrink-0 text-lagoon-600" />
          <span>
            Опрос анонимный: имён и времени отправки нет. Сводка по уроку появляется, когда его оценили хотя бы {MIN_ANONYMOUS} ученика.
          </span>
        </p>
        {current && !current.open ? (
          <div className="card px-6 py-12 text-center">
            <div className="text-4xl">🔒</div>
            <h2 className="mt-2 text-lg font-bold text-ocean-900">Пока {plural(current.count, ["отзыв", "отзыва", "отзывов"])}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Сводка откроется, когда урок оценят ещё {MIN_ANONYMOUS - current.count} — чтобы никто не узнал, чей это отзыв.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <div className="card px-6 py-12 text-center text-sm text-slate-500">
            Ни по одному уроку пока нет {MIN_ANONYMOUS} отзывов — сводка появится, когда ученики оценят уроки.
          </div>
        ) : (
          <FeedbackSummary items={shown} />
        )}
      </section>
    </div>
  );
}
