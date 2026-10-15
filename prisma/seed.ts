import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const grade = await prisma.grade.upsert({
    where: { number: 7 },
    update: {},
    create: { number: 7 },
  });
  const section = await prisma.section.create({
    data: { title: "Механика", gradeId: grade.id },
  });

  await prisma.topic.create({
    data: {
      title: "Сила трения",
      sectionId: section.id,
      modules: {
        create: [
          {
            id: "friction-sim",
            type: "simulation",
            title: "Симуляция трения",
            description: "Брусок на поверхности: меняем массу и покрытие",
            version: "1.0.0",
            buildUrl: "/modules/demo/index.html", // потом замените на Unity-билд
            configSchema: { surface: ["wood", "ice"], mass: "number", showGraph: "boolean" },
          },
          {
            id: "friction-quiz",
            type: "quiz",
            title: "Квиз: трение",
            version: "1.0.0",
            buildUrl: "/modules/demo/index.html",
            configSchema: {},
          },
        ],
      },
    },
  });

  await prisma.topic.create({
    data: {
      title: "Давление",
      sectionId: section.id,
      modules: {
        create: [
          {
            id: "pressure-sim",
            type: "simulation",
            title: "Симуляция давления",
            version: "1.0.0",
            buildUrl: "/modules/demo/index.html",
            configSchema: {},
          },
        ],
      },
    },
  });
}

main().finally(() => prisma.$disconnect());
