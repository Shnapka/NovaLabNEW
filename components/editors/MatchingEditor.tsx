"use client";
import type { MatchingContent } from "@/lib/modules/types";
import Icon from "@/components/Icon";

// Редактор карточек на сопоставление: пары «левая — правая»
export default function MatchingEditor({ value, onChange }: { value: MatchingContent; onChange: (v: MatchingContent) => void }) {
  const pairs = value.pairs;
  const setPair = (i: number, side: "left" | "right", text: string) =>
    onChange({ ...value, pairs: pairs.map((p, k) => (k === i ? { ...p, [side]: text } : p)) });

  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold text-slate-500">
        Подсказка для ученика
        <input
          className="input mt-1 py-1.5 text-sm"
          placeholder="Нажми на карточку слева, затем на подходящую карточку справа."
          value={value.instruction ?? ""}
          onChange={(e) => onChange({ ...value, instruction: e.target.value || undefined })}
        />
      </label>

      <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 text-sm">
        <span />
        <span className="text-xs font-semibold text-slate-500">Левая карточка (понятие, формула)</span>
        <span className="text-xs font-semibold text-slate-500">Правая карточка (пара к ней)</span>
        <span />
        {pairs.map((p, i) => (
          <div key={i} className="contents">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mist-100 text-xs font-bold text-ocean-800">{i + 1}</span>
            <input className="input py-1.5" value={p.left} placeholder="Например, v = s / t" onChange={(e) => setPair(i, "left", e.target.value)} />
            <input className="input py-1.5" value={p.right} placeholder="Формула скорости" onChange={(e) => setPair(i, "right", e.target.value)} />
            <button
              type="button"
              onClick={() => onChange({ ...value, pairs: pairs.filter((_, k) => k !== i) })}
              className="px-2 text-slate-400 hover:text-rose-600"
              aria-label="Удалить пару"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {pairs.length < 16 && (
        <button type="button" onClick={() => onChange({ ...value, pairs: [...pairs, { left: "", right: "" }] })} className="btn-ghost">
          <Icon name="plus" className="h-4 w-4" /> Добавить пару
        </button>
      )}
    </div>
  );
}
