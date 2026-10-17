import { NextResponse } from "next/server";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";

// Удалить класс: вместе с учениками этого класса и их результатами.
// Уроки учителя остаются в «Моих уроках»; отзывы остаются в панели администратора (без ссылки на класс).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { count } = await prisma.classroom.deleteMany({ where: { id, ownerId: session.user.id } });
  if (!count) return NextResponse.json({ error: "Класс не найден" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
