"use client";
import { useEffect, useState } from "react";
import type { MatchingContent, QuizContent } from "@/lib/modules/types";
import { validateMatching, validateQuiz, type BlockOverride } from "@/lib/modules/overrides";
import QuizModule from "@/components/modules/QuizModule";
import MatchingModule from "@/components/modules/MatchingModule";
import QuizEditor from "./QuizEditor";
import MatchingEditor from "./MatchingEditor";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

// Окно «Свои вопросы»: редактор квиза или карточек с предпросмотром. Сохраняет правки только в этот урок.
export default function ContentEditorModal({
  type,
  libraryTitle,
  libraryContent,
  override,
  onSave,
  onClose,
}: {
  type: "quiz" | "matching";
  libraryTitle: string;
  libraryContent: unknown;
  override: BlockOverride;
  onSave: (o: BlockOverride | null) => void; // null — вернуть стандартные вопросы из библиотеки
  onClose: () => void;
}) {
  const [title, setTitle] = useState(override.title ?? "");
  const [content, setContent] = useState(() => clone(override.content ?? libraryContent) as QuizContent | MatchingContent);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function save() {
    const errs = type === "quiz" ? validateQuiz(content) : validateMatching(content);
    setErrors(errs);
    if (errs.length) return setTab("edit");
    // Пустые необязательные поля не храним
    const cleaned =
      type === "quiz"
        ? { questions: (content as QuizContent).questions.map((q) => ({ ...q, text: q.text.trim(), explain: q.explain.trim() })) }
        : { ...(content as MatchingContent), pairs: (content as MatchingContent).pairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() })) };
    onSave({ ...(title.trim() ? { title: title.trim() } : {}), content: cleaned });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ocean-950/60 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-3xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-mist-100 px-5 py-4">
          <div className="mr-auto">
            <div className="text-xs font-semibold text-lagoon-700">{type === "quiz" ? "Свои вопросы квиза" : "Свои карточки"}</div>
            <div className="font-bold text-ocean-900">Правки сохранятся только в этом уроке</div>
          </div>
          <div className="flex rounded-xl bg-mist-50 p-1 text-sm font-semibold">
            {(
              [
                ["edit", "Редактор"],
                ["preview", "Предпросмотр"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 ${tab === k ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="px-2 text-xl text-slate-400 hover:text-slate-700" aria-label="Закрыть">×</button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto bg-mist-50/60 p-5">
          {tab === "edit" ? (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-500">
                Название модуля в уроке
                <input className="input mt-1 py-1.5 text-sm" placeholder={libraryTitle} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              {type === "quiz" ? (
                <QuizEditor value={content as QuizContent} onChange={setContent} />
              ) : (
                <MatchingEditor value={content as MatchingContent} onChange={setContent} />
              )}
              <p className="text-xs text-slate-500">
                В тексте можно писать индексы и дроби: <code>F_{"{A}"}</code> → F<sub>A</sub>, <code>v^{"{2}"}</code> → v<sup>2</sup>,{" "}
                <code>[[s||t]]</code> → дробь s/t, <code>**жирный**</code>.
              </p>
            </div>
          ) : (
            <div className="card p-5">
              {/* key — чтобы предпросмотр начинался заново при каждом открытии */}
              {type === "quiz" ? (
                validateQuiz(content).length ? <p className="text-sm text-slate-500">Исправьте ошибки в редакторе, чтобы увидеть предпросмотр.</p> : <QuizModule key={JSON.stringify(content)} content={content as QuizContent} />
              ) : validateMatching(content).length ? (
                <p className="text-sm text-slate-500">Исправьте ошибки в редакторе, чтобы увидеть предпросмотр.</p>
              ) : (
                <MatchingModule key={JSON.stringify(content)} content={content as MatchingContent} />
              )}
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <ul className="space-y-0.5 border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {errors.slice(0, 6).map((e) => <li key={e}>• {e}</li>)}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-mist-100 px-5 py-4">
          {!!override.content && (
            <button onClick={() => onSave(null)} className="text-sm font-semibold text-slate-500 hover:text-rose-600">
              Вернуть стандартные из библиотеки
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="btn-ghost">Отмена</button>
            <button onClick={save} className="btn-primary">Применить к уроку</button>
          </div>
        </div>
      </div>
    </div>
  );
}
