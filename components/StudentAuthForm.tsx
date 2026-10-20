"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

// Регистрация и вход ученика по почте. При регистрации можно сразу вступить в класс по коду.
export default function StudentAuthForm() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        const r = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role: "STUDENT", classCode: code || undefined }),
        });
        const data = await r.json();
        if (!r.ok) return setError(data.error ?? "Ошибка регистрации");
        if (data.warning) sessionStorage.setItem("nl_notice", data.warning);
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) return setError("Неверная почта или пароль");
      const session = await fetch("/api/auth/session").then((r) => r.json());
      if (session?.user?.role !== "STUDENT") return setError("Это аккаунт учителя. Войдите на странице «Войти».");
      window.location.href = "/student";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex rounded-xl bg-mist-50 p-1 text-sm font-semibold">
        {(["register", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`flex-1 rounded-lg py-2 transition ${mode === m ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500 hover:text-ocean-700"}`}
          >
            {m === "register" ? "Регистрация" : "Вход"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Фамилия и имя</span>
            <input className="input" required minLength={2} autoComplete="name" placeholder="Иванов Пётр" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Почта</span>
          <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Пароль</span>
          <input
            className="input"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "register" && <span className="mt-1 block text-xs text-slate-500">Минимум 8 символов</span>}
          {mode === "login" && (
            <a href="/forgot?role=student" onClick={() => sessionStorage.setItem("nl_forgot_email", email)} className="mt-1.5 inline-block text-xs font-semibold text-lagoon-700 hover:text-ocean-700">
              Забыли пароль?
            </a>
          )}
        </label>
        {mode === "register" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Код класса <span className="font-normal text-slate-400">— даст учитель</span></span>
            <input
              className="input text-center font-mono text-lg font-bold uppercase tracking-[0.25em]"
              placeholder="ABC123"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
        )}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="btn-accent w-full py-3 text-base">
          {busy ? "Подождите…" : mode === "login" ? "Войти" : code ? "Создать аккаунт и вступить в класс" : "Создать аккаунт"}
        </button>
      </form>
    </div>
  );
}
