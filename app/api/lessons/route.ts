import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const lesson = await prisma.lesson.create({
    data: { title: "Новый урок", ownerId: session.user.id },
  });
  return NextResponse.json({ id: lesson.id });
}
