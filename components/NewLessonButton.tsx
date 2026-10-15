"use client";
import { useRouter } from "next/navigation";

export default function NewLessonButton() {
  const router = useRouter();
  async function create() {
    const r = await fetch("/api/lessons", { method: "POST" });
    const { id } = await r.json();
    router.push(`/lessons/${id}/edit`);
  }
  return (
    <button onClick={create} className="rounded bg-blue-600 px-4 py-2 text-white">
      + Новый урок
    </button>
  );
}
