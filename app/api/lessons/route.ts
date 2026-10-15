import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// POST {}            — пустой урок
// POST { topicId }   — урок со всеми модулями темы из библиотеки
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const topicId = Number(body?.topicId);

  if (topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { modules: { orderBy: { order: "asc" } } },
    });
    if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });
    const lesson = await prisma.lesson.create({
      data: {
        title: topic.title,
        ownerId: session.user.id,
        blocks: {
          create: topic.modules.map((m, i) => ({
            moduleId: m.id,
            position: i,
            config: (m.type === "simulation" ? m.configSchema : {}) as Prisma.InputJsonValue,
          })),
        },
      },
    });
    return NextResponse.json({ id: lesson.id });
  }

  const lesson = await prisma.lesson.create({
    data: { title: "Новый урок", ownerId: session.user.id },
  });
  return NextResponse.json({ id: lesson.id });
}
