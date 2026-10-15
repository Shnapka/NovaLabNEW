"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Icon";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        const r = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!r.ok) return setError((await r.json()).error ?? "Ошибка");
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) return setError("Неверный email или пароль");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next?.startsWith("/") && !next.startsWith("//") ? next : "/library";
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl items-center px-4 py-10">
      <div className="card grid w-full overflow-hidden md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-ocean-900 via-ocean-700 to-lagoon-600 p-10 text-white md:flex">
          <Logo className="h-12 w-12" />
          <div>
            <h2 className="text-3xl font-extrabold leading-tight">
              Библиотека интерактивных уроков <span className="text-sun-400">физики</span>
            </h2>
            <ul className="mt-6 space-y-2 text-aqua-100">
              <li>● Программа 7–11 классов по учебнику</li>
              <li>● WebGL-симуляции в центре урока</li>
              <li>● Конспекты, графики, квизы и карточки</li>
            </ul>
          </div>
          <p className="text-sm text-aqua-200">Для учителей физики</p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-6 flex rounded-xl bg-mist-50 p-1 text-sm font-semibold">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 rounded-lg py-2 transition ${mode === m ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500 hover:text-ocean-700"}`}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-extrabold text-ocean-900">
            {mode === "login" ? "С возвращением!" : "Создайте аккаунт учителя"}
          </h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            {mode === "login" ? "Войдите, чтобы открыть библиотеку уроков." : "Это займёт меньше минуты."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Имя</span>
                <input className="input" required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
              <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Пароль</span>
              <input
                className="input"
                type="password"
                required
                minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "register" && <span className="mt-1 block text-xs text-slate-500">Минимум 8 символов</span>}
            </label>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <button disabled={busy} className="btn-primary w-full py-3 text-base">
              {busy ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
