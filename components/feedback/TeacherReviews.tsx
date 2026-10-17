"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEACHER_QUESTIONS, fmtAvg, ratingClass, type ReviewAnswers } from "@/lib/feedback";
import { plural } from "@/lib/plural";
import RatingScale from "./RatingScale";
import Icon from "../Icon";

type Review = { rating: number; answers: ReviewAnswers; comment: string; updatedAt: string };
type L = { id: string; title: string; group: string; studentsActive: number; studentAvg: number | null; studentCount: number; review: Review | null };

const date = (s: string) => new Date(s).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export default function TeacherReviews({ classId, lessons }: { classId: string; lessons: L[] }) {
  const [open, setOpen] = useState<L | null>(null);
  const pending = lessons.filter((l) => !l.review);
  // Сначала — неоценённые, среди них выше те, что ученики уже проходили
  const sorted = [...lessons].sort((a, b) => Number(!!a.review) - Number(!!b.review) || b.studentsActive - a.studentsActive);

  if (lessons.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <Icon name="bell" className="h-10 w-10 text-lagoon-600" />
        <h2 className="mt-3 text-xl font-bold text-ocean-900">В классе пока нет уроков</h2>
        <p className="mt-1 text-slate-500">Добавьте уроки во вкладке «Уроки класса» — после урока здесь появится короткая анкета.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className={`card flex flex-wrap items-center gap-4 p-5 ${pending.length ? "border-sun-400 bg-sun-50" : ""}`}>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${pending.length ? "bg-sun-400 text-ocean-950" : "bg-emerald-100 text-emerald-700"}`}>
          <Icon name={pending.length ? "bell" : "check"} className="h-6 w-6" />
        </span>
        <div className="mr-auto">
          <h2 className="text-lg font-extrabold text-ocean-900">
            {pending.length ? `Оцените ${plural(pending.length, ["урок", "урока", "уроков"])}` : "Все уроки оценены — спасибо!"}
          </h2>
          <p className="text-sm text-slate-600">Анкета займёт меньше минуты: оценка и несколько отметок. Ответы помогают улучшать уроки NovaLab.</p>
        </div>
      </section>

      <ul className="grid gap-3 md:grid-cols-2">
        {sorted.map((l) => (
          <li key={l.id} className="card flex flex-col p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-lagoon-700">{l.group}</div>
            <div className="mt-1 flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-ocean-900">{l.title}</h3>
              {l.review ? (
                <span className={`shrink-0 rounded-lg px-2.5 py-1 font-extrabold ${ratingClass(l.review.rating)}`}>{l.review.rating}/10</span>
              ) : (
                <span className="pill shrink-0 bg-sun-400 text-ocean-950">ждёт оценки</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{l.studentsActive ? `проходили ${plural(l.studentsActive, ["ученик", "ученика", "учеников"])}` : "ученики ещё не начинали"}</span>
              <span>
                оценка учеников: <b className="text-ocean-800">{l.studentCount ? `${fmtAvg(l.studentAvg)} (${l.studentCount})` : "—"}</b>
              </span>
              {l.review && <span>ваш отзыв от {date(l.review.updatedAt)}</span>}
            </div>
            <div className="mt-4 flex-1" />
            <button onClick={() => setOpen(l)} className={l.review ? "btn-ghost" : "btn-accent"}>
              <Icon name={l.review ? "edit" : "star"} className="h-4 w-4" /> {l.review ? "Изменить отзыв" : "Оценить урок"}
            </button>
          </li>
        ))}
      </ul>

      {open && <ReviewModal classId={classId} lesson={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ReviewModal({ classId, lesson, onClose }: { classId: string; lesson: L; onClose: () => void }) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(lesson.review?.rating ?? null);
  const [answers, setAnswers] = useState<ReviewAnswers>(lesson.review?.answers ?? {});
  const [comment, setComment] = useState(lesson.review?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answered = TEACHER_QUESTIONS.filter((q) => answers[q.id]?.length).length;

  function pick(qid: string, oid: string, multi?: boolean) {
    setAnswers((a) => {
      if (!multi) return { ...a, [qid]: a[qid] === oid ? "" : oid };
      const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : [];
      let next = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
      // «Ничего» и конкретные проблемы взаимоисключают друг друга
      if (qid === "issues") next = oid === "none" && next.includes("none") ? ["none"] : next.filter((x) => x !== "none");
      return { ...a, [qid]: next };
    });
  }

  async function save() {
    if (!rating) return setError("Поставьте оценку уроку от 1 до 10");
    setBusy(true);
    setError("");
    const r = await fetch(`/api/classes/${classId}/reviews`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, rating, answers, comment }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(data.error ?? "Не удалось сохранить");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ocean-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="mx-auto my-6 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-mist-100 px-6 py-4">
          <div className="mr-auto">
            <div className="text-xs font-semibold text-lagoon-700">Анкета об уроке · отмечено {answered} из {TEACHER_QUESTIONS.length}</div>
            <h2 id="review-title" className="text-xl font-extrabold text-ocean-900">{lesson.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Закрыть" className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-mist-50">×</button>
        </header>

        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="mb-2 font-bold text-ocean-900">Общая оценка урока <span className="text-rose-600">*</span></div>
            <RatingScale value={rating} onChange={setRating} low="плохо" high="отлично" />
          </div>

          {TEACHER_QUESTIONS.map((q) => (
            <fieldset key={q.id}>
              <legend className="mb-2 text-sm font-bold text-ocean-900">
                {q.title} {q.multi && <span className="font-normal text-slate-400">— можно несколько</span>}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {q.options.map((o) => {
                  const v = answers[q.id];
                  const on = Array.isArray(v) ? v.includes(o.id) : v === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(q.id, o.id, q.multi)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                        on ? "bg-ocean-700 text-white" : "bg-mist-50 text-ocean-800 ring-1 ring-mist-200 hover:ring-lagoon-500"
                      }`}
                    >
                      {on && "✓ "}
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-ocean-900">
              Дополнительный комментарий <span className="font-normal text-slate-400">— необязательно</span>
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={3}
              className="input resize-y"
              placeholder="Что улучшить в уроке, чего не хватило, идеи"
            />
          </label>
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-mist-100 px-6 py-4">
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button onClick={onClose} className="btn-ghost ml-auto">Позже</button>
          <button onClick={save} disabled={busy} className="btn-primary px-6 disabled:opacity-60">
            {busy ? "Сохраняю…" : "Отправить"}
          </button>
        </footer>
      </div>
    </div>
  );
}
