import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import LessonPlayer from "@/components/LessonPlayer";

export default async function PresentTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id: Number(id) || 0 },
    include: { modules: { orderBy: { order: "asc" } } },
  });
  if (!topic) notFound();

  return (
    <LessonPlayer
      title={topic.title}
      backHref={`/library/topic/${topic.id}`}
      blocks={topic.modules.map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        content: m.content,
        buildUrl: m.buildUrl,
        config: m.configSchema,
      }))}
    />
  );
}
