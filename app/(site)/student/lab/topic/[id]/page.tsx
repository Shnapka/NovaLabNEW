import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentContext, labOwner } from "@/lib/student";
import { TYPE_ORDER } from "@/lib/modules/meta";
import { isLabType, labTopics } from "@/lib/lab";
import LabTopic from "@/components/LabTopic";

// Тема в «Моей лаборатории»: конспект, графики, симуляция, практика — без оценок — и личная заметка
export default async function LabTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getStudentContext();
  const owner = labOwner(ctx);
  if (!ctx.mode || !owner) redirect("/student");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const topic = await prisma.topic.findUnique({
    where: { id },
    include: { modules: { orderBy: { order: "asc" } }, section: { include: { grade: true } } },
  });
  if (!topic) notFound();
  // Открыта, только если учитель выложил урок по этой теме классу ученика (и это учебник его класса)
  if (!(await labTopics(ctx.students.map((s) => s.classroomId))).topicIds.has(topic.id)) notFound();
  const note = await prisma.labNote.findUnique({ where: { owner_topicId: { owner, topicId: id } } });

  const modules = topic.modules
    .filter((m) => isLabType(m.type))
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.order - b.order);

  return (
    <LabTopic
      topicId={topic.id}
      title={`${topic.paragraph ? topic.paragraph + " · " : ""}${topic.title}`}
      subtitle={`${topic.section.grade.number} класс · ${topic.section.title}`}
      backHref={`/student/lab?grade=${topic.section.grade.number}`}
      note={note ? { text: note.text, updatedAt: note.updatedAt.toISOString() } : null}
      blocks={modules.map((m) => ({
        id: m.id,
        type: m.type,
        title: m.title,
        content: m.content,
        buildUrl: m.buildUrl,
        // Практика в лаборатории — без цели «по типам» и без прошлых результатов
        config: m.type === "practice" ? { ...((m.configSchema as object) ?? {}), solvedKinds: [] } : m.configSchema,
      }))}
    />
  );
}
