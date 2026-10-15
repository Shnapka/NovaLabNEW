"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// account — ученик с аккаунтом вступает в (ещё один) класс; иначе быстрый вход без аккаунта
export default function StudentJoinForm({ account }: { account?: { name: string } }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState(account?.name ?? "");
  const [pin, setPin] = useState("");
  const [needPin, setNeedPin] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [newPin, setNewPin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
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
    if (account) {
      setInfo(data.already ? `Ты уже в классе ${data.classroom}` : data.linked ? `Результаты перенесены, ты в классе ${data.classroom}` : `Ты вступил в класс ${data.classroom}`);
      setCode("");
      setPin("");
      setNeedPin(false);
      router.refresh();
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
    <form onSubmit={join} className={account ? "grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end" : "space-y-4"}>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Код класса</span>
        <input
          className="input text-center font-mono text-xl font-bold uppercase tracking-[0.25em]"
          placeholder="ABC123"
          maxLength={8}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">{account ? "Имя в классе" : "Фамилия и имя"}</span>
        <input className="input" placeholder="Иванов Пётр" required minLength={2} value={name} onChange={(e) => { setName(e.target.value); setNeedPin(false); }} />
      </label>
      {needPin && (
        <label className={`block ${account ? "sm:col-span-3" : ""}`}>
          <span className="mb-1 block text-sm font-medium text-slate-700">PIN-код</span>
          <input className="input text-center font-mono text-xl tracking-[0.3em]" inputMode="numeric" maxLength={4} required value={pin} onChange={(e) => setPin(e.target.value)} />
        </label>
      )}
      <button disabled={busy} className={account ? "btn-accent py-3" : "btn-primary w-full py-3 text-base"}>
        {busy ? "Подождите…" : account ? "Вступить в класс" : "Войти"}
      </button>
      {error && <p className={`rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ${account ? "sm:col-span-3" : ""}`}>{error}</p>}
      {info && <p className={`rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ${account ? "sm:col-span-3" : ""}`}>{info}</p>}
    </form>
  );
}
