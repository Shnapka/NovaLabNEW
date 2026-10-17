import { NextResponse } from "next/server";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";

// Удалить ученика из класса вместе с его результатами. Аккаунт ученика (если есть) остаётся:
// он сможет снова вступить в класс по коду, но начнёт с чистой статистики.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { count } = await prisma.student.deleteMany({ where: { id: sid, classroomId: id, classroom: { ownerId: session.user.id } } });
  if (!count) return NextResponse.json({ error: "Ученик не найден" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
