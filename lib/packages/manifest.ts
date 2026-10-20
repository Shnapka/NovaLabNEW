import { z } from "zod";
import { PRACTICE_TOPICS } from "@/lib/practice";

/**
 * Пакет темы — ZIP-архив:
 *   novalab-topic.json          — описание темы и всех её модулей (формат ниже)
 *   builds/<id модуля>/…        — Unity WebGL-билд симуляции или практики (index.html + Build/), если он есть
 *
 * Полное описание с примером — docs/TOPIC-PACKAGES.md; образец — «Скачать пакет» у любой темы в панели администратора.
 */
export const MANIFEST_NAME = "novalab-topic.json";
export const PACKAGE_FORMAT = "novalab-topic@1";
export const MODULE_TYPES = ["simulation", "summary", "graph", "practice", "quiz", "matching"] as const;

const text = z.string().trim().min(1);
const str = z.string();

// Содержимое модулей — по типам (те же поля, что в lib/modules/types.ts); лишние поля допускаются
const summary = z.object({
  blocks: z
    .array(
      z.union([
        z.object({ kind: z.enum(["h", "p", "note"]), text: str }),
        z.object({ kind: z.literal("def"), term: str, text: str }),
        z.object({ kind: z.literal("formula"), expr: str, legend: z.array(z.tuple([str, str])).optional() }),
        z.object({ kind: z.literal("list"), items: z.array(str) }),
        z.object({ kind: z.literal("table"), caption: str.optional(), head: z.array(str), rows: z.array(z.array(str)) }),
        z.object({ kind: z.literal("example"), problem: str, solution: z.array(str), answer: str }),
      ]),
    )
    .min(1),
});
const graph = z.object({
  charts: z
    .array(
      z.object({
        title: text,
        x: z.object({ label: str, unit: str, max: z.number() }).passthrough(),
        y: z.object({ label: str, unit: str, max: z.number() }).passthrough(),
        params: z.array(z.object({ key: text, label: str, min: z.number(), max: z.number(), step: z.number(), value: z.number() }).passthrough()),
        series: z.array(z.object({ label: str, expr: text }).passthrough()).min(1),
      }).passthrough(),
    )
    .min(1),
});
const quiz = z.object({
  questions: z
    .array(
      z.union([
        z.object({ kind: z.literal("single"), text, options: z.array(str).min(2), answer: z.number().int().min(0), explain: str }),
        z.object({ kind: z.literal("number"), text, answer: z.number(), unit: str, tolerance: z.number().optional(), explain: str }),
      ]),
    )
    .min(1),
});
const matching = z.object({ instruction: str.optional(), pairs: z.array(z.object({ left: text, right: text })).min(2) });
const simulation = z.object({ goal: str, scene: str, controls: z.array(z.any()).default([]), observe: z.array(str), tasks: z.array(str) }).passthrough();
const practice = z.object({ topic: text, goal: z.number().int().positive().optional(), intro: str.optional() }).passthrough();
const CONTENT = { summary, graph, quiz, matching, simulation, practice } as const;

const moduleSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,59}$/, "id модуля — латиница, цифры и дефис, 3–60 символов"),
  type: z.enum(MODULE_TYPES),
  title: text.max(200),
  description: z.string().max(500).optional(),
  configSchema: z.record(z.string(), z.unknown()).optional(),
  content: z.unknown(),
  build: z.string().optional(), // папка билда в архиве, например "builds/density-sim"
});

export const manifestSchema = z.object({
  format: z.literal(PACKAGE_FORMAT),
  version: z.string().max(40).default("1.0.0"),
  grade: z.number().int().min(1).max(11),
  section: text.max(200), // раздел (глава) учебника; если такого нет — будет создан
  paragraph: z.string().max(40).optional(), // «§ 12», «Лаб. № 3»
  topic: text.max(300),
  modules: z.array(moduleSchema).min(1).max(20),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestModule = Manifest["modules"][number];

/** Проверка описания пакета: структура, содержимое каждого модуля, наличие билдов, проверщик практики */
export function validateManifest(raw: unknown, files: Set<string>): { manifest?: Manifest; errors: string[] } {
  const parsed = manifestSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.issues.slice(0, 10).map((i) => `${i.path.join(".") || "описание"}: ${i.message}`) };
  }
  const m = parsed.data;
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [i, mod] of m.modules.entries()) {
    const where = `модуль ${i + 1} (${mod.id})`;
    if (ids.has(mod.id)) errors.push(`${where}: id повторяется`);
    ids.add(mod.id);
    const c = CONTENT[mod.type].safeParse(mod.content);
    if (!c.success) errors.push(`${where}: содержимое не подходит для типа «${mod.type}» — ${c.error.issues[0]?.path.join(".")} ${c.error.issues[0]?.message}`);
    if (mod.type === "practice") {
      const topic = (mod.content as { topic?: string })?.topic;
      // Ответы практики проверяет сервер — для новой темы нужен её проверщик в lib/practice
      if (topic && !PRACTICE_TOPICS[topic]) {
        errors.push(`${where}: для практики «${topic}» на сервере нет проверщика ответов (есть: ${Object.keys(PRACTICE_TOPICS).join(", ")})`);
      }
    }
    if (mod.build) {
      const dir = mod.build.replace(/\/+$/, "");
      if (!files.has(`${dir}/index.html`)) errors.push(`${where}: в архиве нет ${dir}/index.html`);
      if (mod.type !== "simulation" && mod.type !== "practice") errors.push(`${where}: билд бывает только у симуляции или практики`);
    } else if (mod.type === "simulation") {
      errors.push(`${where}: у симуляции нужен Unity-билд (поле build)`);
    }
  }
  return errors.length ? { errors } : { manifest: m, errors };
}
