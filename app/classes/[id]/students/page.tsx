import Link from "next/link";
import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { loadClassForTeacher } from "@/lib/classData";
import { pct, scoreClass } from "@/lib/stats";
import Icon from "@/components/Icon";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Вкладка «Ученики»: кто в классе, как входит и как учится
export default async function ClassStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  const data = session?.user?.id ? await loadClassForTeacher(id, session.user.id) : null;
  if (!data) notFound();
  const { classroom, lessons, journal } = data;

  if (journal.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <Icon name="users" className="h-10 w-10 text-lagoon-600" />
        <h2 className="mt-3 text-xl font-bold text-ocean-900">Пока никто не вступил в класс</h2>
        <p className="mt-1 max-w-md text-slate-500">
          Ученик открывает «Я ученик», регистрируется по почте и вводит код <b className="font-mono text-ocean-800">{classroom.code}</b>.
        </p>
      </div>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-mist-50 text-left text-xs text-slate-500">
              <th className="px-4 py-3 font-semibold">Ученик</th>
              <th className="px-3 py-3 font-semibold">Вход</th>
              <th className="px-3 py-3 text-center font-semibold">Средний балл</th>
              <th className="px-3 py-3 text-center font-semibold">Пройдено уроков</th>
              <th className="px-3 py-3 text-center font-semibold">Своих задач решено</th>
              <th className="px-3 py-3 text-center font-semibold">Попыток</th>
              <th className="px-3 py-3 font-semibold">Последняя активность</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-100">
            {journal.map((r) => (
              <tr key={r.id} className="hover:bg-mist-50/60">
                <td className="px-4 py-2.5">
                  <Link href={`/classes/${id}/students/${r.id}`} className="font-semibold text-ocean-900 hover:text-lagoon-700">{r.name}</Link>
                </td>
                <td className="px-3 py-2.5">
                  {r.hasAccount ? (
                    <span className="pill bg-lagoon-100 text-lagoon-800">аккаунт (почта)</span>
                  ) : (
                    <span className="text-xs text-slate-500">по PIN <b className="font-mono text-slate-700">{r.pin}</b></span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-block min-w-14 rounded-lg px-2 py-1 font-bold ${scoreClass(r.overall)}`}>{pct(r.overall)}</span>
                </td>
                <td className="px-3 py-2.5 text-center text-slate-600">{r.lessonsDone} / {lessons.length}</td>
                <td className="px-3 py-2.5 text-center text-slate-600">{r.practiceSolved}</td>
                <td className="px-3 py-2.5 text-center text-slate-600">{r.attempts}</td>
                <td className="px-3 py-2.5 text-xs text-slate-500">{r.lastActivity ? time(r.lastActivity) : "—"}</td>
                <td className="px-3 py-2.5 text-right">
                  <Link href={`/classes/${id}/students/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-ocean-700 hover:text-lagoon-700">
                    Все работы <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-mist-100 px-5 py-3 text-xs text-slate-500">
        Ученики с аккаунтом входят по почте и паролю. PIN нужен тем, кто вошёл без регистрации, — его можно им подсказать.
      </p>
    </section>
  );
}
