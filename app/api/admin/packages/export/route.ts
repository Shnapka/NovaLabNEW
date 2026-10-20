import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { adminSession } from "@/lib/authz";
import { exportTopic } from "@/lib/packages/exporter";

export const runtime = "nodejs";

// Скачать тему как пакет (образец формата и резервная копия): ?topicId=…
export async function GET(req: Request) {
  if (!(await adminSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const topicId = Number(new URL(req.url).searchParams.get("topicId"));
  if (!Number.isInteger(topicId)) return NextResponse.json({ error: "topicId" }, { status: 400 });
  const out = await exportTopic(topicId);
  if (!out) return NextResponse.json({ error: "Тема не найдена" }, { status: 404 });
  return new NextResponse(Readable.toWeb(out.stream as Readable) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${out.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
