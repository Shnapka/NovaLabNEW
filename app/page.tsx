import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-10 text-center">
      <h1 className="mb-4 text-4xl font-bold">Соберите свой урок физики</h1>
      <p className="mb-8 text-gray-600">
        Выберите тему, добавьте симуляции, графики и квизы и покажите урок классу.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/catalog" className="rounded border px-5 py-2">Открыть каталог</Link>
        <Link href="/dashboard" className="rounded bg-blue-600 px-5 py-2 text-white">Создать урок</Link>
      </div>
    </main>
  );
}
