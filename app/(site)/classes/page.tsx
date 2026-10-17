import Link from "next/link";
import { redirect } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { plural } from "@/lib/plural";
import CreateClassForm from "@/components/CreateClassForm";
import Icon from "@/components/Icon";

export default async function ClassesPage() {
  const session = await teacherSession();
  if (!session?.user?.id) redirect("/login?next=/classes");

  const classes = await prisma.classroom.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { students: true, lessons: true } },
      lessons: { select: { id: true } },
      reviews: { select: { lessonId: true } },
    },
  });
  // Сколько уроков каждого класса учитель ещё не оценил
  const toReview = (c: (typeof classes)[number]) => c.lessons.filter((l) => !c.reviews.some((r) => r.lessonId === l.id)).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lagoon-700">Успеваемость</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">Мои классы</h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            Создайте класс, назначьте ему уроки и дайте ученикам код. Ученики входят на странице{" "}
            <span className="font-semibold text-ocean-800">«Я ученик»</span>, а их результаты собираются в статистику.
          </p>
        </div>
        <CreateClassForm />
      </div>

      {classes.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aqua-100 text-ocean-700">
            <Icon name="users" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-ocean-900">Пока нет классов</h2>
          <p className="mt-1 max-w-md text-slate-500">Создайте первый класс, например «7А», — система выдаст код для входа учеников.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={`/classes/${c.id}`} className="card group block p-5 transition hover:-translate-y-0.5 hover:border-lagoon-500 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-extrabold text-ocean-900">{c.name}</h2>
                  <span className="rounded-lg bg-sun-100 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-sun-900">{c.code}</span>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Icon name="users" className="h-4 w-4" /> {plural(c._count.students, ["ученик", "ученика", "учеников"])}</span>
                  <span className="flex items-center gap-1"><Icon name="layers" className="h-4 w-4" /> {plural(c._count.lessons, ["урок", "урока", "уроков"])}</span>
                </div>
                {toReview(c) > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-sun-50 px-2.5 py-1.5 text-xs font-semibold text-sun-900">
                    <Icon name="bell" className="h-3.5 w-3.5" /> Оцените {plural(toReview(c), ["урок", "урока", "уроков"])} — вкладка «Оценить уроки»
                  </div>
                )}
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-ocean-700">
                  <Icon name="chart" className="h-4 w-4" /> Открыть статистику
                  <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
