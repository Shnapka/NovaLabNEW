import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { adminSession } from "@/lib/authz";
import { importPackage } from "@/lib/packages/importer";
import { TMP_DIR } from "@/lib/packages/storage";

export const runtime = "nodejs";
const MAX_SIZE = 500 * 1024 * 1024; // пакет темы с Unity-билдами — до 500 МБ

// Загрузка пакета темы: тело запроса — сам ZIP-файл. Пишем его потоком на диск (не держим в памяти) и импортируем.
export async function POST(req: Request) {
  const session = await adminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!req.body) return NextResponse.json({ error: "Файл не получен" }, { status: 400 });
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_SIZE) return NextResponse.json({ error: "Пакет больше 500 МБ" }, { status: 413 });

  const fileName = decodeURIComponent(req.headers.get("x-file-name") ?? "package.zip").slice(0, 200);
  await mkdir(TMP_DIR, { recursive: true });
  const tmp = join(TMP_DIR, `upload-${randomBytes(8).toString("hex")}.zip`);
  try {
    let size = 0;
    const limit = new Transform({
      transform(chunk, _enc, cb) {
        size += chunk.length;
        cb(size > MAX_SIZE ? new Error("too-big") : null, chunk);
      },
    });
    try {
      await pipeline(Readable.fromWeb(req.body as never), limit, createWriteStream(tmp));
    } catch (e) {
      const big = e instanceof Error && e.message === "too-big";
      return NextResponse.json({ error: big ? "Пакет больше 500 МБ" : "Файл загрузился не полностью" }, { status: big ? 413 : 400 });
    }
    const result = await importPackage(tmp, fileName, session.user.email ?? null).catch((e: unknown) => ({
      ok: false as const,
      errors: [e instanceof Error && /zip|central directory|signature/i.test(e.message) ? "Это не ZIP-архив или он повреждён" : `Ошибка импорта: ${e instanceof Error ? e.message : e}`],
    }));
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } finally {
    await rm(tmp, { force: true });
  }
}
