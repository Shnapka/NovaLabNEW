"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Icon";

// Вход администратора: отдельный провайдер "admin", пользователи сайта здесь войти не могут
export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("admin", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) return setError("Неверная почта или пароль администратора");
    window.location.href = "/admin";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10" />
          <div>
            <div className="text-lg font-extrabold text-slate-900">NovaLab</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Панель администратора</div>
          </div>
        </div>
        <label className="mt-6 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Почта</span>
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Пароль</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </label>
        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="btn mt-6 w-full bg-slate-900 py-2.5 text-white hover:bg-slate-800 disabled:opacity-60">
          {busy ? "Вход…" : "Войти"}
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">Учителя и ученики входят на главной странице сайта</p>
      </form>
    </main>
  );
}
