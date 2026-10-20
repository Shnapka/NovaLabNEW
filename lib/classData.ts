import { prisma } from "@/lib/db";
import { GRADED_TYPES, computeLessonStats, type GradedModule } from "@/lib/stats";
import { applyOverride } from "@/lib/modules/overrides";
import { kindsOf } from "@/lib/practice/kinds";
import type { PlanRow } from "@/lib/terms";

type BlockWithModule = { moduleId: string; config?: unknown; module: { type: string; title: string; content: unknown } };

/** Оцениваемые модули урока (один модуль, стоящий в уроке дважды, считается один раз) */
export function gradedOf(blocks: BlockWithModule[]): GradedModule[] {
  return blocks
    .filter((b) => GRADED_TYPES.includes(b.module.type))
    .filter((b, i, arr) => arr.findIndex((x) => x.moduleId === b.moduleId) === i)
    .map((b) => ({
      moduleId: b.moduleId,
      type: b.module.type,
      title: applyOverride(b.module, b.config).title,
      goal: Number((b.module.content as { goal?: number })?.goal ?? 1),
      kinds: b.module.type === "practice" ? kindsOf((b.module.content as { topic?: string })?.topic).map((k) => k.value) : undefined,
    }));
}

// Раздел урока — по разделу большинства его модулей (класс · раздел учебника)
type BlockWithTopic = { module: { topic: { title: string; paragraph: string | null; section: { id: number; title: string; order: number; grade: { number: number } } } } };
export function lessonGroup(blocks: BlockWithTopic[]) {
  if (blocks.length === 0) return { key: "none", label: "Без модулей", order: 1e9, topic: null as string | null };
  const count = new Map<number, number>();
  for (const b of blocks) count.set(b.module.topic.section.id, (count.get(b.module.topic.section.id) ?? 0) + 1);
  const [topId, topCount] = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  if (count.size > 1 && topCount <= blocks.length / 2) return { key: "mixed", label: "Смешанные уроки", order: 1e8, topic: null };
  const sec = blocks.find((b) => b.module.topic.section.id === topId)!.module.topic.section;
  // Темы сравниваем по названию: Prisma возвращает отдельный объект темы для каждого модуля
  const inSection = blocks.filter((b) => b.module.topic.section.id === topId).map((b) => b.module.topic);
  const titles = new Set(inSection.map((t) => t.title));
  const t = titles.size === 1 ? inSection[0] : null;
  return {
    key: `s${sec.id}`,
    label: `${sec.grade.number} кл. · ${sec.title}`,
    order: sec.grade.number * 1000 + sec.order,
    topic: t ? `${t.paragraph ? t.paragraph + " · " : ""}${t.title}` : null,
  };
}

export const shortTitle = (t: string) => {
  const s = t.replace(/^[^:]+:\s*/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Всё для кабинета класса: ученики, уроки в порядке добавления и статистика по каждому уроку.
 * null — класса нет или он чужой.
 */
export async function loadClassForTeacher(id: string, ownerId: string) {
  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId },
    include: {
      students: { orderBy: { name: "asc" }, include: { _count: { select: { results: true } } } },
      lessons: {
        orderBy: { createdAt: "asc" },
        include: {
          blocks: {
            orderBy: { position: "asc" },
            // Только нужные поля: без настроек симуляций (configSchema) и лишних колонок — меньше памяти на запрос
            select: {
              moduleId: true,
              config: true,
              module: {
                select: {
                  type: true,
                  title: true,
                  content: true,
                  topic: { select: { title: true, paragraph: true, section: { select: { id: true, title: true, order: true, grade: { select: { number: true } } } } } },
                },
              },
            },
          },
        },
      },
      terms: { include: { section: { include: { grade: true } } }, orderBy: [{ quarter: "asc" }, { startDate: "asc" }] },
    },
  });
  if (!classroom) return null;

  const results = await prisma.result.findMany({
    where: { student: { classroomId: classroom.id }, lessonId: { in: classroom.lessons.map((l) => l.id) } },
    orderBy: { createdAt: "desc" },
  });

  // Уроки по разделам учебника, внутри раздела — в порядке добавления
  const lessons = classroom.lessons
    .map((lesson, added) => {
      const graded = gradedOf(lesson.blocks);
      const stats = computeLessonStats(graded, classroom.students, results.filter((r) => r.lessonId === lesson.id));
      return { lesson, graded, stats, group: lessonGroup(lesson.blocks), added };
    })
    .sort((a, b) => a.group.order - b.group.order || a.added - b.added);
  const groups = [...new Map(lessons.map((l) => [l.group.key, { ...l.group, lessonIds: lessons.filter((x) => x.group.key === l.group.key).map((x) => x.lesson.id) }])).values()];

  // Журнал: ученик × урок
  const journal = classroom.students.map((s) => {
    const cells = Object.fromEntries(
      lessons.map(({ lesson, stats }) => {
        const row = stats.rows.find((r) => r.id === s.id)!;
        return [lesson.id, { average: row.average, completion: row.completion, attempts: row.attempts.length }];
      })
    );
    const started = Object.values(cells).filter((c) => c.average !== null);
    const mine = results.filter((r) => r.studentId === s.id);
    return {
      id: s.id,
      name: s.name,
      hasAccount: !!s.userId,
      pin: s.pin,
      cells,
      overall: started.length ? started.reduce((a, c) => a + c.average!, 0) / started.length : null,
      lessonsDone: Object.values(cells).filter((c) => c.completion === 1).length,
      attempts: mine.length,
      practiceSolved: mine.filter((r) => r.kind === "practice" && r.correct).length,
      lastActivity: mine[0]?.createdAt ?? null,
    };
  });

  // План четвертей: раздел → четверть и даты
  const plan: PlanRow[] = classroom.terms.map((t) => ({
    quarter: t.quarter,
    sectionId: t.sectionId,
    label: `${t.section.grade.number} кл. · ${t.section.title}`,
    start: t.startDate,
    end: t.endDate,
  }));

  return { classroom, results, lessons, groups, journal, plan };
}
