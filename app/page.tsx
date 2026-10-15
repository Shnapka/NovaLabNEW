import Link from "next/link";
import { auth } from "@/auth";
import { MODULE_META, TYPE_ORDER } from "@/lib/modules/meta";

export default async function Home() {
  const session = await auth();
  const cta = session?.user ? "/library" : "/login?next=/library";

  return (
    <main className="mx-auto max-w-5xl space-y-14 p-6 sm:p-10">
      <section className="text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
          Интерактивные уроки физики
          <br />
          <span className="text-indigo-600">для 7–11 классов</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-gray-600">
          Общая библиотека уроков по школьной программе. Выберите класс, раздел и тему — и проведите урок
          с WebGL-симуляцией, конспектом, графиками и играми на закрепление.
        </p>
        <div className="flex justify-center gap-3">
          <Link href={cta} className="rounded-lg bg-indigo-600 px-6 py-3 text-white">Открыть библиотеку</Link>
          {!session?.user && (
            <Link href="/login" className="rounded-lg border bg-white px-6 py-3">Войти как учитель</Link>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-center text-xl font-semibold">Из чего состоит каждый урок</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TYPE_ORDER.map((t) => (
            <div
              key={t}
              className={`rounded-xl border p-4 ${
                t === "simulation" ? "border-indigo-600 bg-gradient-to-br from-indigo-600 to-violet-600 text-white lg:col-span-1" : "bg-white"
              }`}
            >
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${t === "simulation" ? "bg-white/20" : MODULE_META[t].badge}`}
              >
                {MODULE_META[t].label}
              </span>
              <p className={`mt-2 text-sm ${t === "simulation" ? "text-indigo-50" : "text-gray-600"}`}>
                {MODULE_META[t].hint}
                {t === "simulation" && " — центр урока"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
