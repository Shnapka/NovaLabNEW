import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Новый урок учителя со всеми модулями темы из библиотеки (null — темы нет или в ней нет модулей) */
export async function createLessonFromTopic(ownerId: string, topicId: number) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { modules: { orderBy: { order: "asc" } } },
  });
  if (!topic || topic.modules.length === 0) return null;
  return prisma.lesson.create({
    data: {
      title: topic.title,
      ownerId,
      blocks: {
        create: topic.modules.map((m, i) => ({
          moduleId: m.id,
          position: i,
          config: (m.type === "simulation" || m.type === "practice" ? m.configSchema : {}) as Prisma.InputJsonValue,
        })),
      },
    },
  });
}
