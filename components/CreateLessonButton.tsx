"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

// Копирует все модули темы в новый личный урок учителя, который можно перестроить в конструкторе
export default function CreateLessonButton({ topicId }: { topicId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    const r = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });
    if (!r.ok) return setBusy(false);
    const { id } = await r.json();
    router.push(`/lessons/${id}/edit`);
  }
  return (
    <button onClick={create} disabled={busy} className="btn-accent" title="Скопировать модули темы в свой урок и настроить его">
      <Icon name="plus" className="h-4 w-4" />
      {busy ? "Создаю…" : "Собрать свой урок"}
    </button>
  );
}
