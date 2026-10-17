"use client";
import { useState } from "react";
import RatingScale from "./RatingScale";
import Icon from "../Icon";

export type MyFeedback = { rating: number; liked: string; disliked: string } | null;

// Последний шаг урока для ученика: оценка 1–10 и необязательные «понравилось / не понравилось»
export default function StudentFeedback({ lessonId, initial, onSaved }: { lessonId: string; initial: MyFeedback; onSaved: (f: MyFeedback) => void }) {
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [liked, setLiked] = useState(initial?.liked ?? "");
  const [disliked, setDisliked] = useState(initial?.disliked ?? "");
  const [state, setState] = useState<"idle" | "busy" | "saved">(initial ? "saved" : "idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Выбери оценку от 1 до 10");
    setError("");
    setState("busy");
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, rating, liked, disliked }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setState("idle");
      return setError(data.error ?? "Не удалось отправить");
    }
    setState("saved");
    onSaved({ rating, liked, disliked });
  }

  const edit = () => state === "saved" && setState("idle");

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl p-6 sm:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-100 text-sun-600">
        <Icon name="star" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-2xl font-extrabold text-ocean-900">Как тебе урок?</h2>
      <p className="mt-1 text-slate-500">Оценку и комментарии увидит учитель — это поможет сделать уроки лучше.</p>

      <div className="mt-6">
        <RatingScale value={rating} onChange={(n) => { setRating(n); edit(); }} />
      </div>

      <label className="mt-6 block">
        <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">👍 Что понравилось <span className="font-normal text-slate-400">— необязательно</span></span>
        <textarea value={liked} onChange={(e) => { setLiked(e.target.value); edit(); }} maxLength={1000} rows={3} className="input resize-y" placeholder="Например: симуляция с корабликом, понятные графики" />
      </label>
      <label className="mt-4 block">
        <span className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-rose-700">👎 Что не понравилось <span className="font-normal text-slate-400">— необязательно</span></span>
        <textarea value={disliked} onChange={(e) => { setDisliked(e.target.value); edit(); }} maxLength={1000} rows={3} className="input resize-y" placeholder="Например: долго грузилось, непонятная задача" />
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
