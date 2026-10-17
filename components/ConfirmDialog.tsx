"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  title: string;
  text?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  // Для необратимых удалений: подтвердить можно, только введя это слово (например, название класса)
  typeToConfirm?: string;
};

/**
 * Окно «Вы уверены?» вместо системного confirm().
 * const [ask, dialog] = useConfirm(); … if (await ask({ title: "Удалить?" })) …; и вывести {dialog} в разметке.
 */
export function useConfirm() {
  const [opts, setOpts] = useState<Options | null>(null);
  const resolver = useRef<(ok: boolean) => void>(null);

  const ask = useCallback(
    (o: Options) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );
  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpts(null);
  };

  return [ask, opts ? <ConfirmDialog key="confirm" {...opts} onClose={close} /> : null] as const;
}

function ConfirmDialog({ title, text, confirmLabel = "Удалить", danger = true, typeToConfirm, onClose }: Options & { onClose: (ok: boolean) => void }) {
  const [typed, setTyped] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const ready = !typeToConfirm || typed.trim().toLowerCase() === typeToConfirm.trim().toLowerCase();

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ocean-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-extrabold ${danger ? "bg-rose-100 text-rose-600" : "bg-aqua-100 text-ocean-700"}`}>!</span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-extrabold text-ocean-900">{title}</h2>
            {text && <div className="mt-1.5 space-y-1 text-sm text-slate-600">{text}</div>}
          </div>
        </div>
        {typeToConfirm && (
          <label className="mt-4 block text-sm text-slate-600">
            Чтобы подтвердить, введите <b className="text-ocean-900">{typeToConfirm}</b>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ready && onClose(true)}
              className="input mt-1.5"
            />
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} onClick={() => onClose(false)} className="btn-ghost">Отмена</button>
          <button
            onClick={() => onClose(true)}
            disabled={!ready}
            className={`btn px-4 disabled:opacity-40 ${danger ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-ocean-700 text-white hover:bg-ocean-800"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
