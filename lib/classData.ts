import { prisma } from "@/lib/db";
import { GRADED_TYPES, computeLessonStats, type GradedModule } from "@/lib/stats";

type BlockWithModule = { moduleId: string; module: { type: string; title: string; content: unknown } };

/** Оцениваемые модули урока (один модуль, стоящий в уроке дважды, считается один раз) */
export function gradedOf(blocks: BlockWithModule[]): GradedModule[] {
  return blocks
    .filter((b) => GRADED_TYPES.includes(b.module.type))
    .filter((b, i, arr) => arr.findIndex((x) => x.moduleId === b.moduleId) === i)
    .map((b) => ({
      moduleId: b.moduleId,
      type: b.module.type,
      title: b.module.title,
      goal: Number((b.module.content as { goal?: number })?.goal ?? 1),
    }));
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
        include: { blocks: { orderBy: { position: "asc" }, include: { module: true } } },
      },
    },
  });
  if (!classroom) return null;

  const results = await prisma.result.findMany({
    where: { student: { classroomId: classroom.id }, lessonId: { in: classroom.lessons.map((l) => l.id) } },
    orderBy: { createdAt: "desc" },
  });

  const lessons = classroom.lessons.map((lesson) => {
    const graded = gradedOf(lesson.blocks);
    const stats = computeLessonStats(graded, classroom.students, results.filter((r) => r.lessonId === lesson.id));
    return { lesson, graded, stats };
  });

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

  return { classroom, results, lessons, journal };
}
