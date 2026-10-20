"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";
import { plural } from "@/lib/plural";

type Impact = {
  title: string;
  modules: { id: string; type: string; title: string }[];
  lessons: number;
  results: number;
  labNotes: number;
  removesTopic: boolean;
  code: string;
};

// Удаление пакета темы: сервер показывает, что затронет удаление, и выдаёт код — его нужно ввести
export default function DeletePackageButton({ topicId }: { topicId: number }) {
  const router = useRouter();
  const [ask, dialog] = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setError("");
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/packages/${topicId}`);
      const info = (await r.json()) as Impact & { error?: string };
      if (!r.ok) return setError(info.error ?? "Ошибка");
      const ok = await ask({
        title: "Удалить пакет темы?",
        confirmLabel: "Удалить навсегда",
        typeToConfirm: info.code,
        text: (
          <>
            <p className="font-semibold text-ocean-900">{info.title}</p>
            <p>Модули ({info.modules.length}): {info.modules.map((m) => m.title).join(", ")}.</p>
            {info.lessons > 0 && (
              <p className="text-rose-700">
                Модули уберутся из {plural(info.lessons, ["урока", "уроков", "уроков"])} учителей.
                {info.results > 0 && <> Результаты учеников по ним удалятся: {info.results}.</>}
              </p>
            )}
            <p>
              {info.removesTopic
                ? `Тема создана пакетом — она исчезнет из учебника${info.labNotes ? ` вместе с заметками учеников (${info.labNotes})` : ""}.`
                : "Тема останется в оглавлении учебника, но без модулей."}
            </p>
            <p className="text-slate-500">Отменить нельзя. Чтобы вернуть модули, заранее нажмите «Скачать пакет» — его можно загрузить снова.</p>
          </>
        ),
      });
      if (!ok) return;
      const d = await fetch(`/api/admin/packages/${topicId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: info.code }),
      });
      if (!d.ok) return setError(((await d.json()) as { error?: string }).error ?? "Ошибка удаления");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={run} disabled={busy} className="font-semibold text-rose-600 hover:underline disabled:opacity-50">
        {busy ? "…" : "Удалить"}
      </button>
      {error && <span className="w-full text-right text-xs text-rose-600">{error}</span>}
      {dialog}
    </>
  );
}
