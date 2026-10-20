import { prisma } from "@/lib/db";

// «Моя лаборатория» ученика: свободная работа с учебником без оценок.
// Доступны только модули для самостоятельного изучения; квизы и карточки остаются в уроках учителя.
export const LAB_TYPES = ["simulation", "summary", "graph", "practice"] as const;

export const isLabType = (t: string) => (LAB_TYPES as readonly string[]).includes(t);

/**
 * Учебники каких классов доступны ученику: номер из названия класса («7А», «7 Б» → 7),
 * а если его нет — классы тем, по которым построены уроки и план четвертей его классов.
 */
export async function studentGrades(classroomIds: string[]): Promise<number[]> {
  if (!classroomIds.length) return [];
  const classrooms = await prisma.classroom.findMany({
    where: { id: { in: classroomIds } },
    select: {
      name: true,
      terms: { select: { section: { select: { grade: { select: { number: true } } } } } },
      lessons: { select: { blocks: { select: { module: { select: { topic: { select: { section: { select: { grade: { select: { number: true } } } } } } } } } } } },
    },
  });
  const existing = new Set((await prisma.grade.findMany({ select: { number: true } })).map((g) => g.number));
  const out = new Set<number>();
  for (const c of classrooms) {
    const fromName = Number(c.name.match(/^\s*(\d{1,2})/)?.[1]);
    if (existing.has(fromName)) {
      out.add(fromName);
      continue;
    }
    for (const t of c.terms) out.add(t.section.grade.number);
    for (const l of c.lessons) for (const b of l.blocks) out.add(b.module.topic.section.grade.number);
  }
  return [...out].filter((n) => existing.has(n)).sort((a, b) => a - b);
}
