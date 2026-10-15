import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import LessonPlayer from "@/components/LessonPlayer";
import { applyOverride } from "@/lib/modules/overrides";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { blocks: { orderBy: { position: "asc" }, include: { module: true } } },
  });
  if (!lesson) notFound();
  const isOwner = session?.user?.id === lesson.ownerId;
  if (!lesson.isPublished && !isOwner) notFound();

  return (
    <LessonPlayer
      title={lesson.title}
      backHref={isOwner ? `/lessons/${lesson.id}/edit` : undefined}
      blocks={lesson.blocks.map((b) => ({
        id: b.id,
        type: b.module.type,
        title: applyOverride(b.module, b.config).title,
        content: applyOverride(b.module, b.config).content,
        buildUrl: b.module.buildUrl,
        config: b.config,
      }))}
    />
  );
}
