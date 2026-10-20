import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import yazl from "yazl";
import { prisma } from "@/lib/db";
import { MANIFEST_NAME, PACKAGE_FORMAT } from "./manifest";
import { MODULES_DIR } from "./storage";

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (!e.name.endsWith(".br") && !e.name.endsWith(".gz")) out.push(p);
  }
  return out;
}

/** Папка билда модуля: загруженный пакетом (data/modules) или встроенный в сайт (public/modules) */
function buildDir(moduleId: string, buildUrl: string | null) {
  if (!buildUrl || buildUrl.includes("/placeholder/")) return null;
  const candidates = [join(MODULES_DIR, moduleId), join(process.cwd(), "public", "modules", moduleId)];
  return candidates.find((d) => existsSync(join(d, "index.html"))) ?? null;
}

/** Тема как пакет: описание + билды. Возвращает поток ZIP (файлы читаются с диска по одному) */
export async function exportTopic(topicId: number) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { section: { include: { grade: true } }, modules: { orderBy: { order: "asc" } } },
  });
  if (!topic) return null;

  const zip = new yazl.ZipFile();
  const modules = [];
  for (const m of topic.modules) {
    const dir = buildDir(m.id, m.buildUrl);
    const build = dir ? `builds/${m.id}` : undefined;
    if (dir) for (const f of await walk(dir)) zip.addFile(f, `${build}/${relative(dir, f).split("\\").join("/")}`);
    modules.push({
      id: m.id,
      type: m.type,
      title: m.title,
      ...(m.description ? { description: m.description } : {}),
      ...(build ? { build } : {}),
      configSchema: m.configSchema,
      content: m.content,
    });
  }
  const manifest = {
    format: PACKAGE_FORMAT,
    version: topic.modules[0]?.version ?? "1.0.0",
    grade: topic.section.grade.number,
    section: topic.section.title,
    ...(topic.paragraph ? { paragraph: topic.paragraph } : {}),
    topic: topic.title,
    modules,
  };
  zip.addBuffer(Buffer.from(JSON.stringify(manifest, null, 2), "utf8"), MANIFEST_NAME);
  zip.end();
  const slug = `${topic.section.grade.number}-${(topic.paragraph ?? "").replace(/\D+/g, "") || topic.id}`;
  return { stream: zip.outputStream, fileName: `novalab-topic-${slug}.zip` };
}
