"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function CreateClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) return setError(data.error ?? "Ошибка");
    router.push(`/classes/${data.id}`);
  }

  return (
    <form onSubmit={create} className="flex flex-wrap items-start gap-2">
      <div>
        <input className="input w-48 py-2" placeholder="Например, 7А" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
      <button disabled={busy || !name.trim()} className="btn-accent py-2.5">
        <Icon name="plus" className="h-4 w-4" /> Создать класс
      </button>
    </form>
  );
}
