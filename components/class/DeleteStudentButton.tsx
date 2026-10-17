"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/plural";
import { useConfirm } from "../ConfirmDialog";
import Icon from "../Icon";

export default function DeleteStudentButton({
  classId,
  studentId,
  name,
  attempts,
  hasAccount,
  redirectTo,
  withLabel = false,
}: {
  classId: string;
  studentId: string;
  name: string;
  attempts: number;
  hasAccount: boolean;
  redirectTo?: string;
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [ask, dialog] = useConfirm();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const ok = await ask({
      title: `Удалить ученика ${name} из класса?`,
      text: (
        <>
          <p>{attempts ? `Будут удалены все его результаты: ${plural(attempts, ["попытка", "попытки", "попыток"])}.` : "Результатов у ученика пока нет."}</p>
          <p>
            {hasAccount
              ? "Аккаунт ученика сохранится: по коду класса он сможет вступить снова, но статистика начнётся заново."
              : "Вход по имени и PIN перестанет работать."}
          </p>
        </>
      ),
      confirmLabel: "Удалить ученика",
    });
    if (!ok) return;
    setBusy(true);
    const r = await fetch(`/api/classes/${classId}/students/${studentId}`, { method: "DELETE" });
    setBusy(false);
    if (!r.ok) return alert("Не удалось удалить ученика");
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={remove}
        disabled={busy}
        title="Удалить ученика из класса"
        className={withLabel ? "btn border border-mist-200 bg-white text-rose-600 hover:border-rose-200 hover:bg-rose-50" : "rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"}
      >
        <Icon name="trash" className="h-4 w-4" />
        {withLabel ? "Удалить из класса" : <span className="sr-only">Удалить</span>}
      </button>
      {dialog}
    </>
  );
}
