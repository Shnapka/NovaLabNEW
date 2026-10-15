"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentJoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [needPin, setNeedPin] = useState(false);
  const [error, setError] = useState("");
  const [newPin, setNewPin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/student/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, pin: needPin ? pin : undefined }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(data.error ?? "Ошибка");
      if (data.needPin) setNeedPin(true);
      return;
    }
    if (data.pin) setNewPin(data.pin);
    else router.refresh();
  }

  if (newPin) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-extrabold text-ocean-900">Добро пожаловать!</h2>
        <p className="text-slate-600">Запомни свой PIN-код — он понадобится, чтобы войти снова:</p>
        <div className="mx-auto w-fit rounded-2xl bg-sun-100 px-8 py-4 font-mono text-5xl font-extrabold tracking-[0.3em] text-ocean-900">{newPin}</div>
        <p className="text-xs text-slate-500">Если забудешь, PIN можно узнать у учителя.</p>
        <button onClick={() => router.refresh()} className="btn-primary w-full py-3 text-base">Я запомнил — к урокам</button>
      </div>
    );
  }

  return (
    <form onSubmit={join} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Код класса</span>
        <input
          className="input text-center font-mono text-2xl font-bold uppercase tracking-[0.3em]"
          placeholder="ABC123"
          maxLength={8}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Фамилия и имя</span>
        <input className="input" placeholder="Иванов Пётр" required minLength={2} value={name} onChange={(e) => { setName(e.target.value); setNeedPin(false); }} />
      </label>
      {needPin && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">PIN-код</span>
          <input className="input text-center font-mono text-xl tracking-[0.3em]" inputMode="numeric" maxLength={4} required value={pin} onChange={(e) => setPin(e.target.value)} />
        </label>
      )}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className="btn-primary w-full py-3 text-base">{busy ? "Подождите…" : "Войти"}</button>
    </form>
  );
}
