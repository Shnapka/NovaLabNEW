import Link from "next/link";
import { redirect } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { plural } from "@/lib/plural";
import { metaOf } from "@/lib/modules/meta";
import NewLessonButton from "@/components/NewLessonButton";
import DeleteLessonButton from "@/components/DeleteLessonButton";
import Icon from "@/components/Icon";
import LessonFilterBar from "@/components/LessonFilterBar";
import { lessonGroup } from "@/lib/classData";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ q?: string; section?: string; class?: string }> }) {
  const session = await teacherSession();
  if (!session?.user?.id) redirect("/login?next=/dashboard");
  const { q, section, class: klass } = await searchParams;

  const [all, classes] = await Promise.all([
    prisma.lesson.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        blocks: {
          orderBy: { position: "asc" },
          include: { module: { select: { type: true, topic: { select: { title: true, paragraph: true, section: { select: { id: true, title: true, order: true, grade: { select: { number: true } } } } } } } } },
        },
        classrooms: { select: { id: true } },
        _count: { select: { classrooms: true, results: true } },
      },
    }),
    prisma.classroom.findMany({ where: { ownerId: session.user.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Фильтр: поиск по названию, раздел учебника, класс
  const withGroup = all.map((l) => ({ ...l, group: lessonGroup(l.blocks) }));
  const sections = [...new Map(withGroup.map((l) => [l.group.key, l.group])).values()]
    .filter((g) => g.key !== "none")
    .sort((a, b) => a.order - b.order)
    .map((g) => ({ value: g.key, label: g.label }));
  const needle = q?.trim().toLowerCase();
  const lessons = withGroup.filter(
    (l) =>
      (!needle || l.title.toLowerCase().includes(needle)) &&
      (!section || l.group.key === section) &&
      (!klass || (klass === "none" ? l.classrooms.length === 0 : l.classrooms.some((c) => c.id === klass))),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-lagoon-700">Кабинет учителя</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ocean-900">Мои уроки</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/library" className="btn-ghost">
            <Icon name="book" className="h-4 w-4" /> Из библиотеки
          </Link>
          <NewLessonButton />
        </div>
      </div>

      {all.length > 0 && (
        <LessonFilterBar
          action="/dashboard"
          q={q}
          section={section}
          sections={sections}
          klass={klass}
          classes={classes.map((c) => ({ value: c.id, label: c.name }))}
          shown={lessons.length}
          total={all.length}
        />
      )}

      {all.length > 0 && lessons.length === 0 && (
        <div className="card p-8 text-center text-slate-500">
          По этому фильтру уроков нет. <Link href="/dashboard" className="font-semibold text-ocean-700">Показать все</Link>
        </div>
      )}

      {all.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sun-100 text-sun-600">
            <Icon name="layers" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-ocean-900">Здесь появятся ваши уроки</h2>
          <p className="mt-1 max-w-md text-slate-500">
            Откройте готовую тему в библиотеке и нажмите «Собрать свой урок» — или начните с пустого урока.
          </p>
          <Link href="/library" className="btn-primary mt-6">Открыть библиотеку</Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => (
            <li key={l.id} className="card flex flex-col p-5 transition hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold leading-snug text-ocean-900">{l.title}</h2>
                <span className={`pill shrink-0 ${l.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-mist-100 text-slate-500"}`}>
                  {l.isPublished ? "по ссылке" : "черновик"}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {plural(l.blocks.length, ["модуль", "модуля", "модулей"])} · изменён{" "}
                {l.updatedAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
              </div>
              <div className="mt-4 flex min-h-8 flex-wrap gap-1">
                {l.blocks.map((b) => (
                  <span key={b.id} title={metaOf(b.module.type).label} className={`flex h-8 w-8 items-center justify-center rounded-lg ${metaOf(b.module.type).tile}`}>
                    <Icon name={b.module.type} className="h-4 w-4" />
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-2 border-t border-mist-100 pt-4">
                <Link href={`/lesson/${l.id}`} className="btn-primary flex-1">
                  <Icon name="play" className="h-4 w-4" /> Показать
                </Link>
                <Link href={`/lessons/${l.id}/edit`} className="btn-ghost flex-1">
                  <Icon name="edit" className="h-4 w-4" /> Изменить
                </Link>
                <DeleteLessonButton lessonId={l.id} title={l.title} classes={l._count.classrooms} results={l._count.results} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
