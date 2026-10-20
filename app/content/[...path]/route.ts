import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { DATA_DIR, contentType, safeJoin } from "@/lib/packages/storage";

export const runtime = "nodejs";

/**
 * Файлы, загруженные пакетами тем (Unity-билды): /content/modules/<id>/…
 * На VPS их отдаёт Caddy напрямую с диска (быстрее и без нагрузки на Node); этот обработчик — запасной путь.
 * Если браузер принимает Brotli и рядом лежит .br — отдаём сжатую версию (в 3–4 раза меньше).
 */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  const file = safeJoin(DATA_DIR, rel);
  if (!file || !rel.startsWith("modules/")) return new Response("Not found", { status: 404 });

  const br = /\bbr\b/.test(req.headers.get("accept-encoding") ?? "");
  let path = file;
  let encoded = false;
  let info = await stat(file).catch(() => null);
  if (!info?.isFile()) return new Response("Not found", { status: 404 });
  if (br) {
    const packed = await stat(`${file}.br`).catch(() => null);
    if (packed?.isFile()) {
      path = `${file}.br`;
      info = packed;
      encoded = true;
    }
  }
  const etag = `"${info.size.toString(36)}-${info.mtimeMs.toString(36)}${encoded ? "-br" : ""}"`;
  const headers: Record<string, string> = {
    "Content-Type": contentType(file),
    "Content-Length": String(info.size),
    ETag: etag,
    Vary: "Accept-Encoding",
    // index.html — всегда свежий (новая версия пакета), остальное — день, с проверкой по ETag
    "Cache-Control": file.endsWith(".html") ? "no-cache" : "public, max-age=86400",
  };
  if (encoded) headers["Content-Encoding"] = "br";
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(Readable.toWeb(createReadStream(path)) as ReadableStream, { headers });
}
