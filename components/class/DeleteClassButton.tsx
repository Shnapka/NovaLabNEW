"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { plural } from "@/lib/plural";
import { useConfirm } from "../ConfirmDialog";
import Icon from "../Icon";

// Удаление класса: самое необратимое действие учителя, поэтому подтверждение вводом названия
export default function DeleteClassButton({ classId, name, students }: { classId: string; name: string; students: number }) {
  const router = useRouter();
  const [ask, dialog] = useConfirm();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const ok = await ask({
      title: `Удалить класс «${name}»?`,
      text: (
        <>
          <p>
            {students
              ? `Из класса будут удалены ${plural(students, ["ученик", "ученика", "учеников"])} и все их результаты.`
              : "В классе пока нет учеников."}{" "}
            Код класса перестанет работать.
          </p>
          <p>Ваши уроки останутся в «Моих уроках». Отменить удаление нельзя.</p>
        </>
      ),
      confirmLabel: "Удалить класс",
      typeToConfirm: name,
    });
    if (!ok) return;
    setBusy(true);
    const r = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
    setBusy(false);
    if (!r.ok) return alert("Не удалось удалить класс");
    router.push("/classes");
    router.refresh();
  }

  return (
    <>
      <button onClick={remove} disabled={busy} title="Удалить класс" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
        <Icon name="trash" className="h-5 w-5" />
        <span className="sr-only">Удалить класс</span>
      </button>
      {dialog}
    </>
  );
}
