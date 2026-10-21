"use client";
import { useState } from "react";
import RatingScale from "./RatingScale";
import Icon from "../Icon";
import { STUDENT_DISLIKED, STUDENT_LIKED, type FeedbackOption } from "@/lib/feedback";

export type MyFeedback = { rating: number; likedTags: string[]; dislikedTags: string[]; wish: string } | null;

// Последний шаг урока: анонимный опрос — оценка 1–10, готовые варианты «понравилось / не понравилось» и пожелание
export default function StudentFeedback({
  lessonId,
  moduleTypes,
  initial,
  onSaved,
}: {
  lessonId: string;
  moduleTypes: string[];
  initial: MyFeedback;
  onSaved: (f: MyFeedback) => void;
}) {
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [liked, setLiked] = useState<string[]>(initial?.likedTags ?? []);
  const [disliked, setDisliked] = useState<string[]>(initial?.dislikedTags ?? []);
  const [wish, setWish] = useState(initial?.wish ?? "");
  const [state, setState] = useState<"idle" | "busy" | "saved">(initial ? "saved" : "idle");
  const [error, setError] = useState("");

  // Варианты про модули — только те, что были в этом уроке
  const likedOptions = STUDENT_LIKED.filter((o) => !o.module || moduleTypes.includes(o.module));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Выбери оценку от 1 до 10");
    setError("");
    setState("busy");
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, rating, likedTags: liked, dislikedTags: disliked, wish }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setState("idle");
      return setError(data.error ?? "Не удалось отправить");
    }
    setState("saved");
    onSaved({ rating, likedTags: liked, dislikedTags: disliked, wish });
  }

  const edit = () => state === "saved" && setState("idle");
  const toggle = (list: string[], set: (l: string[]) => void, id: string, exclusive?: string) => {
    edit();
    if (list.includes(id)) return set(list.filter((x) => x !== id));
    // «Всё понравилось» и конкретные жалобы взаимоисключают друг друга
    set(id === exclusive ? [id] : [...list.filter((x) => x !== exclusive), id]);
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl p-6 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-100 text-sun-600">
        <Icon name="star" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-2xl font-extrabold text-ocean-900">Как тебе урок?</h2>
      <p className="mt-1 text-slate-500">
        Опрос <b className="text-ocean-800">анонимный</b>: учитель увидит только общие ответы класса, без имён. Это поможет сделать уроки лучше.
      </p>

      <div className="mt-6">
        <RatingScale value={rating} onChange={(n) => { setRating(n); edit(); }} />
      </div>

      <Chips
        title="👍 Что понравилось?"
        tone="emerald"
        options={likedOptions}
        selected={liked}
        onToggle={(id) => toggle(liked, setLiked, id)}
      />
      <Chips
        title="👎 Что не понравилось?"
        tone="rose"
        options={STUDENT_DISLIKED}
        selected={disliked}
        onToggle={(id) => toggle(disliked, setDisliked, id, "nothing")}
      />

      <label className="mt-6 block">
        <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ocean-800">
          💡 Что бы ты хотел(а) видеть на уроках? <span className="font-normal text-slate-400">— необязательно</span>
        </span>
        <textarea
          value={wish}
          onChange={(e) => { setWish(e.target.value); edit(); }}
          maxLength={1000}
          rows={3}
          className="input resize-y"
          placeholder="Например: больше опытов, задачи из жизни, соревнование между классами"
        />
        <span className="mt-1 block text-xs text-slate-400">Не пиши своё имя — так отзыв останется анонимным.</span>
      </label>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button disabled={state !== "idle"} className="btn-primary px-6 py-2.5 disabled:opacity-60">
          {state === "busy" ? "Отправляю…" : state === "saved" ? "Отправлено" : initial ? "Обновить отзыв" : "Отправить отзыв"}
        </button>
        {state === "saved" && (
          <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <Icon name="check" className="h-4 w-4" /> Спасибо! Отзыв можно изменить в любой момент
          </span>
        )}
      </div>
    </form>
  );
}

const TONES = {
  emerald: { title: "text-emerald-700", on: "border-emerald-500 bg-emerald-500 text-white" },
  rose: { title: "text-rose-700", on: "border-rose-500 bg-rose-500 text-white" },
};

function Chips({
  title,
  tone,
  options,
  selected,
  onToggle,
}: {
  title: string;
  tone: keyof typeof TONES;
  options: FeedbackOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="mt-6">
      <legend className={`mb-2 text-sm font-semibold ${TONES[tone].title}`}>
        {title} <span className="font-normal text-slate-400">— можно несколько</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${on ? TONES[tone].on : "border-mist-200 bg-white text-ocean-800 hover:border-lagoon-500"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
