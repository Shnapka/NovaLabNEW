import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { PassThrough, type Readable } from "node:stream";
import { createBrotliCompress, constants as zc } from "node:zlib";
import yauzl from "yauzl";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MANIFEST_NAME, validateManifest, type Manifest } from "./manifest";
import { COMPRESSIBLE, MODULES_DIR, contentUrl, safeJoin } from "./storage";

const MAX_MANIFEST = 2 * 1024 * 1024; // описание темы — до 2 МБ
const MAX_FILES = 2000;

type Zip = yauzl.ZipFile;
type Entry = yauzl.Entry;

const openZip = (path: string) =>
  new Promise<Zip>((ok, fail) => yauzl.open(path, { lazyEntries: true, autoClose: false, validateEntrySizes: true }, (e, z) => (e || !z ? fail(e) : ok(z))));

/** Список записей архива (только заголовки — данные не читаются) */
function listEntries(zip: Zip) {
  return new Promise<Entry[]>((ok, fail) => {
    const out: Entry[] = [];
    zip.on("entry", (e: Entry) => {
      out.push(e);
      if (out.length > MAX_FILES) return fail(new Error(`В архиве больше ${MAX_FILES} файлов`));
      zip.readEntry();
    });
    zip.on("end", () => ok(out));
    zip.on("error", fail);
    zip.readEntry();
  });
}

const openStream = (zip: Zip, e: Entry) => new Promise<Readable>((ok, fail) => zip.openReadStream(e, (err, s) => (err || !s ? fail(err) : ok(s))));

async function readText(zip: Zip, e: Entry) {
  if (e.uncompressedSize > MAX_MANIFEST) throw new Error(`${MANIFEST_NAME} больше 2 МБ`);
  const chunks: Buffer[] = [];
  for await (const c of await openStream(zip, e)) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8").replace(/^﻿/, "");
}

/** Распаковать файл; крупные части билда сразу сохраняем ещё и сжатыми (.br) — так их отдаёт Caddy / сайт */
async function extract(zip: Zip, e: Entry, target: string) {
  await mkdir(dirname(target), { recursive: true });
  const src = await openStream(zip, e);
  if (!COMPRESSIBLE.test(target) || e.uncompressedSize < 1024) return pipeline(src, createWriteStream(target));
  const plain = new PassThrough();
  const packed = new PassThrough();
  src.pipe(plain);
  src.pipe(packed);
  await Promise.all([
    pipeline(plain, createWriteStream(target)),
    pipeline(packed, createBrotliCompress({ params: { [zc.BROTLI_PARAM_QUALITY]: 6, [zc.BROTLI_PARAM_SIZE_HINT]: e.uncompressedSize } }), createWriteStream(`${target}.br`)),
  ]);
}

export type ImportResult =
  | { ok: true; packageId: string; topicId: number; title: string; modules: { id: string; type: string; title: string; created: boolean }[] }
  | { ok: false; errors: string[] };

/**
 * Импорт пакета темы из ZIP-файла на диске. Перезапускать сайт не нужно: тема и модули появляются сразу.
 * Модуль с тем же id в той же теме обновляется (уроки учителей и результаты учеников сохраняются).
 */
export async function importPackage(zipPath: string, fileName: string, uploadedBy: string | null): Promise<ImportResult> {
  const zip = await openZip(zipPath);
  const staged: { id: string; dir: string }[] = [];
  try {
    const entries = await listEntries(zip);
    const files = new Set(entries.filter((e) => !e.fileName.endsWith("/")).map((e) => e.fileName));
    const manifestEntry = entries.find((e) => e.fileName === MANIFEST_NAME);
    if (!manifestEntry) return { ok: false, errors: [`В корне архива нет файла ${MANIFEST_NAME}`] };

    let raw: unknown;
    try {
      raw = JSON.parse(await readText(zip, manifestEntry));
    } catch {
      return { ok: false, errors: [`${MANIFEST_NAME}: это не JSON`] };
    }
    const { manifest, errors } = validateManifest(raw, files);
    if (!manifest) return { ok: false, errors };

    // Куда встанет тема; конфликты id с модулями других тем
    const grade = await prisma.grade.findUnique({ where: { number: manifest.grade } });
    if (!grade) return { ok: false, errors: [`В программе нет ${manifest.grade} класса`] };
    const section = await prisma.section.findUnique({ where: { gradeId_title: { gradeId: grade.id, title: manifest.section } } });
    const existingTopic = section ? await prisma.topic.findUnique({ where: { sectionId_title: { sectionId: section.id, title: manifest.topic } } }) : null;
    const clash = await prisma.module.findMany({
      where: { id: { in: manifest.modules.map((m) => m.id) }, ...(existingTopic ? { topicId: { not: existingTopic.id } } : {}) },
      include: { topic: { select: { title: true } } },
    });
    if (clash.length) {
      return { ok: false, errors: clash.map((c) => `модуль ${c.id} уже есть в теме «${c.topic.title}» — дайте модулю другой id`) };
    }

    // Билды — во временные папки; на место они встанут только после успешной записи в базу
    const stamp = Date.now();
    for (const m of manifest.modules.filter((x) => x.build)) {
      const prefix = `${m.build!.replace(/\/+$/, "")}/`;
      const dir = join(MODULES_DIR, `.staging-${m.id}-${stamp}`);
      staged.push({ id: m.id, dir });
      for (const e of entries) {
        if (!e.fileName.startsWith(prefix) || e.fileName.endsWith("/")) continue;
        const target = safeJoin(dir, e.fileName.slice(prefix.length));
        if (!target) return { ok: false, errors: [`недопустимый путь в архиве: ${e.fileName}`] };
        await extract(zip, e, target);
      }
    }

    const size = (await stat(zipPath)).size;
    const result = await saveToDb(manifest, fileName, size, uploadedBy);

    for (const s of staged) {
      const final = join(MODULES_DIR, s.id);
      const old = `${final}.old-${stamp}`;
      await rename(final, old).catch(() => {});
      await rename(s.dir, final);
      await rm(old, { recursive: true, force: true });
    }
    staged.length = 0;
    return result;
  } finally {
    zip.close();
    for (const s of staged) await rm(s.dir, { recursive: true, force: true });
  }
}

async function saveToDb(m: Manifest, fileName: string, size: number, uploadedBy: string | null): Promise<ImportResult> {
  return prisma.$transaction(async (tx) => {
    const grade = await tx.grade.findUniqueOrThrow({ where: { number: m.grade } });
    let section = await tx.section.findUnique({ where: { gradeId_title: { gradeId: grade.id, title: m.section } } });
    if (!section) {
      const last = await tx.section.aggregate({ where: { gradeId: grade.id }, _max: { order: true } });
      section = await tx.section.create({ data: { gradeId: grade.id, title: m.section, order: (last._max.order ?? -1) + 1, source: "package" } });
    }
    let topic = await tx.topic.findUnique({ where: { sectionId_title: { sectionId: section.id, title: m.topic } } });
    if (topic) {
      topic = await tx.topic.update({ where: { id: topic.id }, data: { paragraph: m.paragraph ?? topic.paragraph } });
    } else {
      const last = await tx.topic.aggregate({ where: { sectionId: section.id }, _max: { order: true } });
      topic = await tx.topic.create({
        data: { sectionId: section.id, title: m.topic, paragraph: m.paragraph ?? null, order: (last._max.order ?? -1) + 1, source: "package" },
      });
    }

    // Пакет возвращает модули, удалённые раньше: снимаем отметку, иначе их не будет и после сида
    await tx.removedModule.deleteMany({ where: { id: { in: m.modules.map((mod) => mod.id) } } });

    const done: { id: string; type: string; title: string; created: boolean }[] = [];
    for (const [order, mod] of m.modules.entries()) {
      const data = {
        type: mod.type,
        title: mod.title,
        description: mod.description ?? null,
        order,
        version: m.version,
        buildUrl: mod.build ? contentUrl(mod.id) : null,
        configSchema: (mod.configSchema ?? {}) as Prisma.InputJsonValue,
        content: mod.content as Prisma.InputJsonValue,
        topicId: topic.id,
        source: "package",
      };
      const before = await tx.module.findUnique({ where: { id: mod.id }, select: { id: true } });
      await tx.module.upsert({ where: { id: mod.id }, update: data, create: { id: mod.id, ...data } });
      done.push({ id: mod.id, type: mod.type, title: mod.title, created: !before });
    }

    const title = `${m.grade} кл. · ${m.paragraph ? m.paragraph + " · " : ""}${m.topic}`;
    const pkg = await tx.topicPackage.create({
      data: { topicId: topic.id, title, version: m.version, fileName, size, modules: done as unknown as Prisma.InputJsonValue, uploadedBy },
    });
    return { ok: true as const, packageId: pkg.id, topicId: topic.id, title, modules: done };
  });
}
