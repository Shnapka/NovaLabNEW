import { createHmac, timingSafeEqual } from "node:crypto";
import { rm } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { MODULES_DIR, safeJoin } from "./storage";

/**
 * Удаление пакета темы: все модули темы, их блоки в уроках учителей и результаты учеников по ним.
 * Тема, созданная пакетом, удаляется целиком; тема из программы учебника остаётся в оглавлении — без модулей.
 */

const WINDOW_MS = 10 * 60 * 1000;

// Код подтверждения выдаёт сервер: без него запрос на удаление не пройдёт, даже если кнопку нажали случайно
function codeFor(topicId: number, slot: number) {
  const h = createHmac("sha256", process.env.AUTH_SECRET ?? "novalab").update(`remove-topic:${topicId}:${slot}`).digest();
  return String(h.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export const removalCode = (topicId: number) => codeFor(topicId, Math.floor(Date.now() / WINDOW_MS));

/** Код действует 10–20 минут: текущее и предыдущее окно */
export function checkRemovalCode(topicId: number, code: string) {
  if (!/^\d{6}$/.test(code.trim())) return false;
  const slot = Math.floor(Date.now() / WINDOW_MS);
  const given = Buffer.from(code.trim());
  return [slot, slot - 1].some((s) => timingSafeEqual(Buffer.from(codeFor(topicId, s)), given));
}

/** Что затронет удаление — показывается администратору в окне подтверждения */
export async function removalImpact(topicId: number) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      title: true,
      paragraph: true,
      source: true,
      section: { select: { title: true, grade: { select: { number: true } } } },
      modules: { select: { id: true, type: true, title: true } },
      _count: { select: { labNotes: true } },
    },
  });
  if (!topic || topic.modules.length === 0) return null;
  const ids = topic.modules.map((m) => m.id);
  const [lessons, results] = await Promise.all([
    prisma.lesson.count({ where: { blocks: { some: { moduleId: { in: ids } } } } }),
    prisma.result.count({ where: { moduleId: { in: ids } } }),
  ]);
  return {
    topicId: topic.id,
    title: `${topic.section.grade.number} кл. · ${topic.paragraph ? topic.paragraph + " · " : ""}${topic.title}`,
    modules: topic.modules,
    lessons,
    results,
    // Заметки учеников в «Моей лаборатории» пропадают только вместе с темой
    labNotes: topic.source === "package" ? topic._count.labNotes : 0,
    removesTopic: topic.source === "package",
  };
}

export async function removeTopicPackage(topicId: number, removedBy: string | null) {
  const impact = await removalImpact(topicId);
  if (!impact) return null;
  const ids = impact.modules.map((m) => m.id);
  const sectionId = (await prisma.topic.findUniqueOrThrow({ where: { id: topicId }, select: { sectionId: true } })).sectionId;

  await prisma.$transaction(async (tx) => {
    await tx.topicPackage.updateMany({ where: { topicId, removedAt: null }, data: { removedAt: new Date(), removedBy } });
    await tx.result.deleteMany({ where: { moduleId: { in: ids } } });
    await tx.lessonBlock.deleteMany({ where: { moduleId: { in: ids } } });
    await tx.module.deleteMany({ where: { id: { in: ids } } });
    // Сид не должен вернуть удалённые встроенные модули при следующем запуске
    await tx.removedModule.createMany({ data: ids.map((id) => ({ id })), skipDuplicates: true });
    if (impact.removesTopic) {
      await tx.topic.delete({ where: { id: topicId } });
      // Глава, созданная пакетом, уходит, если в ней больше нет тем и её нет в планах четвертей
      const section = await tx.section.findUnique({ where: { id: sectionId }, select: { source: true, _count: { select: { topics: true, terms: true } } } });
      if (section?.source === "package" && section._count.topics === 0 && section._count.terms === 0) {
        await tx.section.delete({ where: { id: sectionId } });
      }
    }
  });

  // Файлы билдов из пакетов. Встроенные билды (public/modules) остаются в образе сайта, но больше не используются
  for (const id of ids) {
    const dir = safeJoin(MODULES_DIR, id);
    if (dir) await rm(dir, { recursive: true, force: true });
  }
  return impact;
}
