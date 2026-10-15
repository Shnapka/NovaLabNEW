import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MODULE_META, TYPE_ORDER } from "@/lib/modules/meta";
import TopicView from "@/components/TopicView";
import CreateLessonButton from "@/components/CreateLessonButton";
import Icon from "@/components/Icon";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id: Number(id) || 0 },
    include: {
      section: { include: { grade: true } },
      modules: { orderBy: { order: "asc" } },
    },
  });
  if (!topic) notFound();
  const grade = topic.section.grade;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/library" className="hover:text-ocean-700">Библиотека</Link>
        <span className="mx-2 text-mist-300">/</span>
        <Link href={`/library/${grade.number}`} className="hover:text-ocean-700">{grade.number} класс</Link>
        <span className="mx-2 text-mist-300">/</span>
        <Link href={`/library/${grade.number}#section-${topic.section.id}`} className="hover:text-ocean-700">{topic.section.title}</Link>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {topic.paragraph && <span className="pill bg-sun-100 text-sun-900">{topic.paragraph}</span>}
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Icon name="book" className="h-4 w-4" /> {grade.textbook}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-ocean-900 sm:text-4xl">{topic.title}</h1>
        </div>
        {topic.modules.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/library/topic/${topic.id}/present`} className="btn-ghost">
              <Icon name="play" className="h-4 w-4" /> Показать классу
            </Link>
            <CreateLessonButton topicId={topic.id} />
          </div>
        )}
      </header>

      {topic.modules.length > 0 ? (
        <TopicView
          modules={topic.modules.map((m) => ({
            id: m.id,
            type: m.type,
            title: m.title,
            description: m.description,
            content: m.content,
            buildUrl: m.buildUrl,
            config: m.configSchema,
          }))}
        />
      ) : (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aqua-100 text-ocean-700">
            <Icon name="layers" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold text-ocean-900">Модули для этой темы в разработке</h2>
          <p className="mt-1 max-w-md text-slate-500">Урок будет состоять из пяти модулей. Пока можно выбрать готовую тему в библиотеке.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {TYPE_ORDER.map((t) => (
              <span key={t} className={`pill py-1 ${MODULE_META[t].badge}`}>
                <Icon name={t} className="h-3.5 w-3.5" /> {MODULE_META[t].label}
              </span>
            ))}
          </div>
          <Link href={`/library/${grade.number}`} className="btn-primary mt-8">
            <Icon name="arrowLeft" className="h-4 w-4" /> К темам {grade.number} класса
          </Link>
        </div>
      )}
    </main>
  );
}
