// Подключение Unity WebGL-билда к симуляции на сайте.
//
//   npm run unity:import -- <папка билда> <id модуля>      например: ... C:\Unity\LabFiz\Builds\WebGL\archimedes-boat archimedes-sim
//   npm run unity:import -- --remove <id модуля>           вернуть заглушку
//
// Билд копируется в public/modules/<id модуля>/, а модулю в базе прописывается buildUrl.
// prisma db seed тоже находит билды в этой папке, так что подключение не слетит при повторном сиде.
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const PLACEHOLDER = "/modules/placeholder/index.html";
const root = resolve(import.meta.dirname, "..");
const prisma = new PrismaClient();

const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function findSimulation(id) {
  const mod = await prisma.module.findUnique({ where: { id } });
  if (!mod) {
    const sims = await prisma.module.findMany({ where: { type: "simulation" }, select: { id: true, title: true } });
    fail(`Модуль «${id}» не найден. Доступные симуляции:\n${sims.map((s) => `   ${s.id} — ${s.title}`).join("\n")}`);
  }
  if (mod.type !== "simulation") fail(`Модуль «${id}» — это ${mod.type}, а не симуляция.`);
  return mod;
}

async function remove(id) {
  await findSimulation(id);
  rmSync(join(root, "public", "modules", id), { recursive: true, force: true });
  await prisma.module.update({ where: { id }, data: { buildUrl: PLACEHOLDER } });
  console.log(`✔ Билд «${id}» удалён, симуляция снова показывает заглушку.`);
}

async function importBuild(src, id) {
  const mod = await findSimulation(id);
  const buildDir = resolve(src);
  if (!existsSync(join(buildDir, "index.html"))) fail(`В папке ${buildDir} нет index.html. Укажите папку, в которую Unity собрал WebGL.`);
  if (!existsSync(join(buildDir, "Build"))) fail(`В папке ${buildDir} нет подпапки Build/.`);

  const files = walk(buildDir);
  const compressed = files.filter((f) => /\.(br|gz)$/.test(f));
  if (compressed.length) {
    fail(
      "Билд сжат (Brotli/Gzip), а наш сервер не отдаёт для него нужные заголовки — симуляция не загрузится.\n" +
        "  В Unity: Project Settings → Player → WebGL → Publishing Settings:\n" +
        "  Compression Format = Disabled  (или оставьте сжатие, но включите Decompression Fallback),\n" +
        "  затем пересоберите билд."
    );
  }

  const html = readFileSync(join(buildDir, "index.html"), "utf8");
  const warnings = [];
  if (!html.includes("physlab-module")) {
    warnings.push(
      "index.html собран не из шаблона Physlab: сайт не сможет передать симуляции настройки урока.\n" +
        "    Project Settings → Player → WebGL → Resolution and Presentation → WebGL Template = Physlab."
    );
  }

  const dest = join(root, "public", "modules", id);
  rmSync(dest, { recursive: true, force: true });
  cpSync(buildDir, dest, { recursive: true });

  const buildUrl = `/modules/${id}/index.html`;
  await prisma.module.update({ where: { id }, data: { buildUrl } });

  const mb = files.reduce((s, f) => s + statSync(f).size, 0) / 1024 / 1024;
  console.log(`\n✔ Билд подключён к «${mod.title}»`);
  console.log(`  файлы:   public/modules/${id}/ (${mb.toFixed(1)} МБ)`);
  console.log(`  адрес:   ${buildUrl}`);
  console.log(`  урок:    http://localhost:3000/library/topic/${mod.topicId}`);
  for (const w of warnings) console.warn(`\n⚠ ${w}`);
  if (mb > 50) console.warn("\n⚠ Билд больше 50 МБ — на школьном интернете он будет грузиться долго.");
}

const args = process.argv.slice(2);
try {
  if (args[0] === "--remove" && args[1]) await remove(args[1]);
  else if (args.length === 2) await importBuild(args[0], args[1]);
  else
    fail(
      "Использование:\n" +
        "  npm run unity:import -- <папка WebGL-билда> <id модуля>\n" +
        "  npm run unity:import -- --remove <id модуля>\n" +
        "Например: npm run unity:import -- C:\\Unity\\LabFiz\\Builds\\WebGL\\archimedes-boat archimedes-sim"
    );
} finally {
  await prisma.$disconnect();
}
