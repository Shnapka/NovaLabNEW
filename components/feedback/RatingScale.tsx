"use client";

// Шкала 1–10 кнопками: цвет от красного к зелёному, выбранная — крупнее
const tone = (n: number) => (n >= 8 ? "emerald" : n >= 5 ? "sun" : "rose");
const ACTIVE = { emerald: "bg-emerald-500 text-white", sun: "bg-sun-400 text-ocean-950", rose: "bg-rose-500 text-white" };
const IDLE = { emerald: "hover:bg-emerald-50", sun: "hover:bg-sun-50", rose: "hover:bg-rose-50" };

export default function RatingScale({ value, onChange, low = "совсем не понравилось", high = "очень понравилось" }: { value: number | null; onChange: (n: number) => void; low?: string; high?: string }) {
  return (
    <div>
      <div role="radiogroup" aria-label="Оценка от 1 до 10" className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`aspect-square rounded-xl border text-sm font-extrabold transition sm:text-base ${
              value === n ? `${ACTIVE[tone(n)]} scale-110 border-transparent shadow` : `border-mist-200 bg-white text-ocean-800 ${IDLE[tone(n)]}`
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-slate-400">
        <span>1 — {low}</span>
        <span>10 — {high}</span>
      </div>
    </div>
  );
}
