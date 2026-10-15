import { Prisma, PrismaClient } from "@prisma/client";
import { curriculum } from "../content/curriculum";

const prisma = new PrismaClient();

// Сид идемпотентный: его можно запускать повторно после правки content/,
// уроки учителей при этом не удаляются.
async function main() {
  let topicCount = 0;
  let moduleCount = 0;

  for (const g of curriculum) {
    const grade = await prisma.grade.upsert({
      where: { number: g.number },
      update: { textbook: g.textbook },
      create: { number: g.number, textbook: g.textbook },
    });

    for (const [si, s] of g.sections.entries()) {
      const section = await prisma.section.upsert({
        where: { gradeId_title: { gradeId: grade.id, title: s.title } },
        update: { order: si },
        create: { title: s.title, order: si, gradeId: grade.id },
      });

      for (const [ti, raw] of s.topics.entries()) {
        const t = typeof raw === "string" ? { title: raw } : raw;
        const paragraph = "paragraph" in t ? (t.paragraph ?? null) : null;
        const topic = await prisma.topic.upsert({
          where: { sectionId_title: { sectionId: section.id, title: t.title } },
          update: { order: ti, paragraph },
          create: { title: t.title, order: ti, paragraph, sectionId: section.id },
        });
        topicCount++;

        const modules = "modules" in t ? (t.modules ?? []) : [];
        for (const [mi, m] of modules.entries()) {
          const data = {
            type: m.type,
            title: m.title,
            description: m.description ?? null,
            order: mi,
            buildUrl: m.buildUrl ?? null,
            configSchema: (m.configSchema ?? {}) as Prisma.InputJsonValue,
            content: m.content as unknown as Prisma.InputJsonValue,
            topicId: topic.id,
          };
          await prisma.module.upsert({ where: { id: m.id }, update: data, create: { id: m.id, ...data } });
          moduleCount++;
        }
      }
    }
  }
  console.log(`Готово: классов ${curriculum.length}, тем ${topicCount}, модулей ${moduleCount}`);
}

main().finally(() => prisma.$disconnect());
