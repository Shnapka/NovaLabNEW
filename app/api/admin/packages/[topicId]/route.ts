import { NextResponse } from "next/server";
import { adminSession } from "@/lib/authz";
import { checkRemovalCode, removalCode, removalImpact, removeTopicPackage } from "@/lib/packages/remove";

export const runtime = "nodejs";

const topicIdOf = async (params: Promise<{ topicId: string }>) => {
  const id = Number((await params).topicId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Что удалится вместе с пакетом темы + код подтверждения, который администратор вводит в окне
export async function GET(_req: Request, { params }: { params: Promise<{ topicId: string }> }) {
  if (!(await adminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const topicId = await topicIdOf(params);
  const impact = topicId ? await removalImpact(topicId) : null;
  if (!impact || !topicId) return NextResponse.json({ error: "У темы нет модулей" }, { status: 404 });
  return NextResponse.json({ ...impact, code: removalCode(topicId) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ topicId: string }> }) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const topicId = await topicIdOf(params);
  if (!topicId) return NextResponse.json({ error: "Тема не найдена" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  if (typeof body?.code !== "string" || !checkRemovalCode(topicId, body.code)) {
    return NextResponse.json({ error: "Неверный или устаревший код подтверждения — откройте удаление заново" }, { status: 400 });
  }
  const removed = await removeTopicPackage(topicId, session.user.email ?? null);
  if (!removed) return NextResponse.json({ error: "У темы нет модулей" }, { status: 404 });
  return NextResponse.json({ ok: true, ...removed });
}
