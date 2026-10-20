import { existsSync } from "node:fs";
import { join } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { curriculum } from "../content/curriculum";
import type { ModuleSeed } from "../lib/modules/types";
import { ensureAdmin } from "../scripts/admin";

const prisma = new PrismaClient();

// Если Unity-билд симуляции лежит в public/modules/<id модуля>/, подключаем его вместо заглушки
function resolveBuildUrl(m: ModuleSeed) {
  if ((m.type === "simulation" || m.type === "practice") && existsSync(join(__dirname, "..", "public", "modules", m.id, "index.html"))) {
    return `/modules/${m.id}/index.html`;
  }
  return m.buildUrl ?? null;
}

// Сид идемпотентный: его можно запускать повторно после правки content/,
// уроки учителей при этом не удаляются.
async function main() {
  let topicCount = 0;
  let moduleCount = 0;
  // Встроенные модули, которые администратор удалил вместе с пакетом темы, — не возвращаем
  const removed = new Set((await prisma.removedModule.findMany({ select: { id: true } })).map((r) => r.id));

  for (const g of curriculum) {
    const grade = await prisma.grade.upsert({
      where: { number: g.number },
      update: { textbook: g.textbook },
      create: { number: g.number, textbook: g.textbook },
    });

    for (const [si, s] of g.sections.entries()) {
      const section = await prisma.section.upsert({
        where: { gradeId_title: { gradeId: grade.id, title: s.title } },
        update: { order: si, source: "seed" },
        create: { title: s.title, order: si, gradeId: grade.id },
      });

      for (const [ti, raw] of s.topics.entries()) {
        const t = typeof raw === "string" ? { title: raw } : raw;
        const paragraph = "paragraph" in t ? (t.paragraph ?? null) : null;
        const topic = await prisma.topic.upsert({
          where: { sectionId_title: { sectionId: section.id, title: t.title } },
          update: { order: ti, paragraph, source: "seed" },
          create: { title: t.title, order: ti, paragraph, sectionId: section.id },
        });
        topicCount++;

        const modules = "modules" in t ? (t.modules ?? []) : [];
        for (const [mi, m] of modules.entries()) {
          if (removed.has(m.id)) continue;
          const data = {
            type: m.type,
            title: m.title,
            description: m.description ?? null,
            order: mi,
            buildUrl: resolveBuildUrl(m),
            configSchema: (m.configSchema ?? {}) as Prisma.InputJsonValue,
            content: m.content as unknown as Prisma.InputJsonValue,
            topicId: topic.id,
          };
          // Модуль, загруженный пакетом из панели администратора, сид не перезаписывает
          const existing = await prisma.module.findUnique({ where: { id: m.id }, select: { source: true } });
          if (existing?.source === "package") continue;
          await prisma.module.upsert({ where: { id: m.id }, update: data, create: { id: m.id, ...data } });
          moduleCount++;
        }
      }
    }

    // Программа класса сменилась (другой учебник) — убираем темы и разделы, которых в ней больше нет.
    // Удаляются только пустые: модули к этому моменту уже переехали в новые темы.
    const keepSections = new Set(g.sections.map((s) => s.title));
    const keepTopics = new Set(g.sections.flatMap((s) => s.topics.map((raw) => `${s.title}|${typeof raw === "string" ? raw : raw.title}`)));
    const existing = await prisma.section.findMany({ where: { gradeId: grade.id }, include: { topics: { include: { _count: { select: { modules: true } } } } } });
    for (const sec of existing) {
      for (const tp of sec.topics) {
        if (!keepTopics.has(`${sec.title}|${tp.title}`) && tp._count.modules === 0) await prisma.topic.delete({ where: { id: tp.id } });
      }
      if (!keepSections.has(sec.title) && (await prisma.topic.count({ where: { sectionId: sec.id } })) === 0) {
        await prisma.section.delete({ where: { id: sec.id } });
      }
    }
  }
  console.log(`Готово: классов ${curriculum.length}, тем ${topicCount}, модулей ${moduleCount}`);

  // Администратор из переменных окружения (удобно на хостинге: задать ADMIN_EMAIL и ADMIN_PASSWORD в настройках сервиса)
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const r = await ensureAdmin(prisma, email, password, process.env.ADMIN_NAME);
    console.log(`Администратор ${email}: ${r}`);
  }
}

main().finally(() => prisma.$disconnect());
