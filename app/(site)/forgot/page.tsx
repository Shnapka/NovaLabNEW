"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

// Восстановление пароля для учителя и ученика с аккаунтом: код из письма → новый пароль → сразу вход
export default function ForgotPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [back, setBack] = useState("/login");

  // Почту, уже введённую на странице входа, передаём через sessionStorage, а не в адресе страницы
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("nl_forgot_email");
      if (saved) setEmail(saved);
    } catch {}
    if (new URLSearchParams(window.location.search).get("role") === "student") setBack("/student");
  }, []);

  async function post(url: string, body: object) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, data: (await r.json().catch(() => ({}))) as { error?: string } };
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await post("/api/password/forgot", { email });
      if (!r.ok) return setError(r.data.error ?? "Ошибка");
      setStep("code");
      setInfo(`Если ${email} зарегистрирована, на неё придёт письмо с кодом из 6 цифр. Проверьте и папку «Спам».`);
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== repeat) return setError("Пароли не совпадают");
    setBusy(true);
    try {
      const r = await post("/api/password/reset", { email, code, password });
      if (!r.ok) return setError(r.data.error ?? "Ошибка");
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) return (window.location.href = back);
      const session = await fetch("/api/auth/session").then((x) => x.json());
      window.location.href = session?.user?.role === "STUDENT" ? "/student" : "/library";
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md items-center px-4 py-10">
      <div className="card w-full p-8 sm:p-10">
        <h1 className="text-2xl font-extrabold text-ocean-900">Восстановление пароля</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          {step === "email" ? "Пришлём код на почту, указанную при регистрации — для учителей и учеников с аккаунтом." : info}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Почта</span>
              <input className="input" type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <button disabled={busy} className="btn-primary w-full py-3 text-base">{busy ? "Отправляем…" : "Получить код"}</button>
          </form>
        ) : (
          <form onSubmit={reset} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Код из письма</span>
              <input
                className="input text-center font-mono text-2xl font-bold tracking-[0.4em]"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Новый пароль</span>
              <input className="input" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="mt-1 block text-xs text-slate-500">Минимум 8 символов</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Повторите пароль</span>
              <input className="input" type="password" required minLength={8} autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
            </label>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <button disabled={busy} className="btn-primary w-full py-3 text-base">{busy ? "Подождите…" : "Сохранить пароль и войти"}</button>
            <p className="text-center text-sm text-slate-500">
              Письма нет?{" "}
              <button type="button" disabled={busy} onClick={() => sendCode()} className="font-semibold text-lagoon-700 hover:text-ocean-700">
                Отправить ещё раз
              </button>{" "}
              (через минуту)
            </p>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-slate-500">
          <a href={back} className="font-semibold text-lagoon-700 hover:text-ocean-700">← Вернуться ко входу</a>
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">Вошли в класс по коду без аккаунта? Пароля у вас нет — PIN подскажет учитель.</p>
      </div>
    </main>
  );
}
