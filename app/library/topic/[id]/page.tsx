import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MODULE_META, TYPE_ORDER } from "@/lib/modules/meta";
import TopicView from "@/components/TopicView";
import CreateLessonButton from "@/components/CreateLessonButton";

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
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <nav className="text-sm text-gray-500">
        <Link href="/library" className="hover:underline">Библиотека</Link> /{" "}
        <Link href={`/library/${grade.number}`} className="hover:underline">{grade.number} класс</Link> / {topic.section.title}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{topic.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {topic.paragraph && <span className="mr-2 font-mono">{topic.paragraph}</span>}
            {grade.textbook}
          </p>
        </div>
        {topic.modules.length > 0 && (
          <div className="flex gap-2">
            <Link href={`/library/topic/${topic.id}/present`} className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50">
              ▶ Показать классу
            </Link>
            <CreateLessonButton topicId={topic.id} />
          </div>
        )}
      </div>

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
        <div className="rounded-xl border border-dashed bg-white p-10 text-center">
          <div className="text-lg font-semibold">Модули для этой темы в разработке</div>
          <p className="mt-1 text-gray-500">Планируемый состав урока:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TYPE_ORDER.map((t) => (
              <span key={t} className={`rounded-full px-3 py-1 text-sm ${MODULE_META[t].badge}`}>
                {MODULE_META[t].label}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
