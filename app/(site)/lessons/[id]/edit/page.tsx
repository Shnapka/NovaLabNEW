import { notFound, redirect } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { EDITABLE_TYPES } from "@/lib/modules/overrides";
import LessonBuilder from "@/components/LessonBuilder";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) redirect("/login");

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      blocks: { orderBy: { position: "asc" } },
      _count: { select: { classrooms: true, results: true } },
    },
  });
  if (!lesson || lesson.ownerId !== session.user.id) notFound();

  const modules = await prisma.module.findMany({
    include: { topic: { include: { section: { include: { grade: true } } } } },
    orderBy: [{ topicId: "asc" }, { order: "asc" }],
  });

  return (
    <LessonBuilder
      lessonId={lesson.id}
      initialTitle={lesson.title}
      initialPublished={lesson.isPublished}
      usage={{ classes: lesson._count.classrooms, results: lesson._count.results }}
      initialBlocks={lesson.blocks.map((b) => ({
        moduleId: b.moduleId,
        config: JSON.stringify(b.config, null, 2),
      }))}
      modules={modules.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        topic: m.topic.title,
        topicId: m.topicId,
        section: m.topic.section.title,
        grade: m.topic.section.grade.number,
        defaults: JSON.stringify(m.configSchema, null, 2),
        content: EDITABLE_TYPES.includes(m.type) ? m.content : undefined,
      }))}
    />
  );
}
