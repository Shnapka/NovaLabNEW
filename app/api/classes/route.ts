import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { newClassCode } from "@/lib/student";

const schema = z.object({ name: z.string().trim().min(1).max(40) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Введите название класса, например «7А»" }, { status: 400 });

  // Код уникальный: при редком совпадении пробуем ещё раз
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const c = await prisma.classroom.create({
        data: { name: parsed.data.name, code: newClassCode(), ownerId: session.user.id },
      });
      return NextResponse.json({ id: c.id });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
  }
  return NextResponse.json({ error: "Не удалось создать код класса, попробуйте ещё раз" }, { status: 500 });
}
