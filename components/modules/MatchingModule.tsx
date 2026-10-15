"use client";
import { useEffect, useState } from "react";
import type { MatchingContent } from "@/lib/modules/types";
import type { ModuleEvent } from "@/components/ModuleFrame";
import Rich from "./Rich";

function shuffled(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchingModule({
  content,
  onEvent,
}: {
  content: MatchingContent;
  onEvent?: (e: ModuleEvent) => void;
}) {
  const n = content.pairs.length;
  const [leftOrder, setLeftOrder] = useState<number[]>(() => Array.from({ length: n }, (_, i) => i));
  const [rightOrder, setRightOrder] = useState<number[]>(() => Array.from({ length: n }, (_, i) => i));
  const [picked, setPicked] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  // Перемешиваем только в браузере, чтобы не было расхождения с серверной разметкой
  const reset = () => {
    setLeftOrder(shuffled(n));
    setRightOrder(shuffled(n));
    setPicked(null);
    setMatched([]);
    setWrong(null);
    setMistakes(0);
  };
  useEffect(reset, [n]);

  function pickRight(r: number) {
    if (picked === null || matched.includes(r)) return;
    if (r === picked) {
      const next = [...matched, r];
      setMatched(next);
      setPicked(null);
      if (next.length === n) onEvent?.({ type: "matching-result", data: { pairs: n, mistakes } });
    } else {
      setMistakes(mistakes + 1);
      setWrong(r);
      setTimeout(() => setWrong(null), 600);
    }
  }

  const done = matched.length === n;
  const card = "w-full rounded-lg border-2 px-3 py-3 text-left transition min-h-14";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-gray-600">{content.instruction ?? "Сопоставь карточки."}</span>
        <span className="text-gray-500">
          Пар: {matched.length}/{n} · Ошибок: {mistakes}
        </span>
      </div>

      {done && (
        <div className="rounded-lg bg-emerald-50 p-4 text-center text-emerald-900">
          <div className="text-lg font-semibold">Все пары найдены!</div>
          <div className="text-sm">
            {mistakes === 0 ? "Без единой ошибки — отлично!" : `Ошибок: ${mistakes}. Попробуй пройти ещё раз без ошибок.`}
          </div>
          <button onClick={reset} className="mt-2 rounded bg-emerald-600 px-4 py-1.5 text-sm text-white">Перемешать и сыграть снова</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="space-y-2">
          {leftOrder.map((l) => {
            const isMatched = matched.includes(l);
            return (
              <button
                key={l}
                disabled={isMatched}
                onClick={() => setPicked(l)}
                className={`${card} ${
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : picked === l
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                }`}
              >
                <Rich text={content.pairs[l].left} />
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rightOrder.map((r) => {
            const isMatched = matched.includes(r);
            return (
              <button
                key={r}
                disabled={isMatched}
                onClick={() => pickRight(r)}
                className={`${card} ${
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : wrong === r
                      ? "animate-pulse border-rose-400 bg-rose-50"
                      : picked !== null
                        ? "border-gray-200 bg-white hover:border-indigo-400"
                        : "border-gray-200 bg-white"
                }`}
              >
                <Rich text={content.pairs[r].right} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
