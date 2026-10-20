import { join, normalize, resolve, sep } from "node:path";

/**
 * Где лежат файлы, загруженные пакетами тем (Unity-билды). Не внутри public/: их добавляют без пересборки сайта.
 * На VPS это постоянный том Docker (DATA_DIR=/data), локально — ./data.
 */
export const DATA_DIR = resolve(process.env.DATA_DIR || join(process.cwd(), "data"));
export const MODULES_DIR = join(DATA_DIR, "modules");
export const TMP_DIR = join(DATA_DIR, "tmp");

/** Адрес, по которому сайт отдаёт загруженный билд модуля */
export const contentUrl = (moduleId: string) => `/content/modules/${moduleId}/index.html`;

/** Путь файла внутри base; null — если путь выходит за пределы base (../, абсолютный, обратные слеши) */
export function safeJoin(base: string, rel: string): string | null {
  if (!rel || rel.includes("\0") || rel.includes("\\") || rel.startsWith("/")) return null;
  const full = normalize(join(base, rel));
  return full.startsWith(base + sep) ? full : null;
}

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "application/javascript",
  mjs: "application/javascript",
  css: "text/css",
  json: "application/json",
  wasm: "application/wasm",
  data: "application/octet-stream",
  unityweb: "application/octet-stream",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  webp: "image/webp",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  woff2: "font/woff2",
  ttf: "font/ttf",
  txt: "text/plain; charset=utf-8",
};

export const contentType = (file: string) => TYPES[file.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";

/** Какие файлы стоит хранить ещё и в сжатом виде (.br): крупные текстовые и бинарные части билда */
export const COMPRESSIBLE = /\.(wasm|data|js|html|css|json|svg|txt|unityweb)$/i;
