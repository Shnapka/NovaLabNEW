"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
  }

  const input = "w-full rounded border px-3 py-2";
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">{mode === "login" ? "Вход" : "Регистрация"}</h1>
      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <input className={input} placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-blue-600 py-2 text-white">
          {mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
      <button className="mt-4 text-sm text-blue-600" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
      </button>
    </main>
  );
}
