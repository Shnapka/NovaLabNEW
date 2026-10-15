"use client";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function NewLessonButton() {
  const router = useRouter();
  async function create() {
    const r = await fetch("/api/lessons", { method: "POST" });
    const { id } = await r.json();
    router.push(`/lessons/${id}/edit`);
  }
  return (
    <button onClick={create} className="btn-accent">
      <Icon name="plus" className="h-4 w-4" /> Пустой урок
    </button>
  );
}
