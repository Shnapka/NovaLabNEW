// Предсжатие Unity-билдов в public/modules: рядом с каждым крупным файлом кладётся .br (Brotli).
// Caddy отдаёт .br браузерам, которые его принимают: 30 МБ симуляции превращаются в ~8 МБ.
//   node scripts/compress-modules.mjs [папка]   (по умолчанию public/modules)
import { createReadStream, createWriteStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { createBrotliCompress, constants as zc } from "node:zlib";

const root = resolve(process.argv[2] ?? join(import.meta.dirname, "..", "public", "modules"));
const COMPRESSIBLE = /\.(wasm|data|js|html|css|json|svg|txt|unityweb)$/i;

async function* files(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else yield p;
  }
}

let count = 0, before = 0, after = 0;
for await (const f of files(root)) {
  if (!COMPRESSIBLE.test(f)) continue;
  const s = await stat(f);
  if (s.size < 1024) continue;
  const out = `${f}.br`;
  const o = await stat(out).catch(() => null);
  if (!o || o.mtimeMs < s.mtimeMs) {
    await pipeline(createReadStream(f), createBrotliCompress({ params: { [zc.BROTLI_PARAM_QUALITY]: 9, [zc.BROTLI_PARAM_SIZE_HINT]: s.size } }), createWriteStream(out));
  }
  count++;
  before += s.size;
  after += (await stat(out)).size;
}
const mb = (n) => (n / 1024 / 1024).toFixed(1) + " МБ";
console.log(`Сжато файлов: ${count}, ${mb(before)} → ${mb(after)}`);
