// Практика «Составь и реши задачу на движение» (Перышкин, 7 кл., § 16–17)
import {
  type PracticeTopic,
  type Quantity,
  type UnitTable,
  fmt,
  isQuantity,
  q,
  siStep,
  toSI,
} from "./common";

export const SPEED_UNITS: UnitTable = { "m/s": { label: "м/с", toSI: 1 }, "km/h": { label: "км/ч", toSI: 1 / 3.6 } };
export const TIME_UNITS: UnitTable = { s: { label: "с", toSI: 1 }, min: { label: "мин", toSI: 60 }, h: { label: "ч", toSI: 3600 } };
export const DIST_UNITS: UnitTable = { m: { label: "м", toSI: 1 }, km: { label: "км", toSI: 1000 } };

// Формы слов для текста условия и реалистичный диапазон скоростей (м/с) для подсказок
export const MOVERS = {
  pedestrian: { label: "Пешеход", gen: "пешехода", now: "идёт", will: "пройдёт", did: "прошёл", went: "шёл", pron: "он", range: [0.5, 2.5] },
  runner: { label: "Бегун", gen: "бегуна", now: "бежит", will: "пробежит", did: "пробежал", went: "бежал", pron: "он", range: [2, 11] },
  cyclist: { label: "Велосипедист", gen: "велосипедиста", now: "едет", will: "проедет", did: "проехал", went: "ехал", pron: "он", range: [2, 15] },
  car: { label: "Автомобиль", gen: "автомобиля", now: "едет", will: "проедет", did: "проехал", went: "ехал", pron: "он", range: [3, 60] },
  train: { label: "Поезд", gen: "поезда", now: "едет", will: "проедет", did: "проехал", went: "ехал", pron: "он", range: [5, 90] },
  plane: { label: "Самолёт", gen: "самолёта", now: "летит", will: "пролетит", did: "пролетел", went: "летел", pron: "он", range: [50, 300] },
  snail: { label: "Улитка", gen: "улитки", now: "ползёт", will: "проползёт", did: "проползла", went: "ползла", pron: "она", range: [0.0005, 0.02] },
} as const;
export type MoverKey = keyof typeof MOVERS;

// Участок неравномерного движения: дан путь и скорость или время и скорость
export type Segment = { v: Quantity; s?: Quantity; t?: Quantity };

export type SpeedTask = {
  unknown: "s" | "v" | "t" | "vavg"; // vavg — средняя скорость (задачи из Unity-практики)
  mover: MoverKey;
  s?: Quantity;
  v?: Quantity;
  t?: Quantity;
  segments?: Segment[]; // только для vavg: 2–3 участка
  answerUnit: string;
};

const ANSWER_UNITS = { s: DIST_UNITS, v: SPEED_UNITS, t: TIME_UNITS, vavg: SPEED_UNITS } as const;
const SI = { s: "м", v: "м/с", t: "с", vavg: "м/с" } as const;
const ORDER = ["сначала", "затем", "потом"];

// Время и путь участка в СИ
function segmentSI(seg: Segment) {
  const v = toSI(seg.v, SPEED_UNITS);
  if (seg.s) {
    const s = toSI(seg.s, DIST_UNITS);
    return { s, t: s / v, v };
  }
  const t = toSI(seg.t!, TIME_UNITS);
  return { s: v * t, t, v };
}

export const speedTopic: PracticeTopic<SpeedTask> = {
  id: "speed",
  unknowns: [
    { value: "s", label: "Путь s" },
    { value: "v", label: "Скорость v" },
    { value: "t", label: "Время t" },
  ],

  createTask(unknown) {
    const base = { mover: "cyclist" as MoverKey, s: { value: 3, unit: "km" }, v: { value: 18, unit: "km/h" }, t: { value: 20, unit: "min" } };
    if (unknown === "v") return { unknown: "v", mover: base.mover, s: base.s, t: base.t, answerUnit: "km/h" };
    if (unknown === "t") return { unknown: "t", mover: base.mover, s: base.s, v: base.v, answerUnit: "min" };
    return { unknown: "s", mover: base.mover, v: base.v, t: base.t, answerUnit: "km" };
  },

  fields(task) {
    const mover = {
      kind: "select" as const,
      key: "mover",
      label: "Кто движется",
      options: Object.entries(MOVERS).map(([value, m]) => ({ value, label: m.label })),
    };
    const s = { kind: "quantity" as const, key: "s", label: "Путь s", units: DIST_UNITS };
    const v = { kind: "quantity" as const, key: "v", label: "Скорость v", units: SPEED_UNITS };
    const t = { kind: "quantity" as const, key: "t", label: "Время t", units: TIME_UNITS };
    return [mover, ...(task.unknown === "s" ? [v, t] : task.unknown === "v" ? [s, t] : [s, v])];
  },

  answerUnits: (task) => ANSWER_UNITS[task.unknown],

  describe(task) {
    const m = MOVERS[task.mover];
    const unit = ANSWER_UNITS[task.unknown][task.answerUnit]?.label ?? task.answerUnit;
    if (task.unknown === "vavg") {
      const parts = task.segments!.map((seg, i) =>
        seg.s
          ? `${ORDER[i]} ${m.did} ${q(seg.s, DIST_UNITS)} со скоростью ${q(seg.v, SPEED_UNITS)}`
          : `${ORDER[i]} ${q(seg.t!, TIME_UNITS)} ${m.went} со скоростью ${q(seg.v, SPEED_UNITS)}`
      );
      return `${m.label} ${parts.join(", ")}. Найдите среднюю скорость на всём пути. Ответ дайте в ${unit}.`;
    }
    if (task.unknown === "s")
      return `${m.label} ${m.now} равномерно со скоростью ${q(task.v!, SPEED_UNITS)}. Какой путь ${m.pron} ${m.will} за ${q(task.t!, TIME_UNITS)}? Ответ дайте в ${unit}.`;
    if (task.unknown === "t")
      return `За какое время ${m.label.toLowerCase()} ${m.will} ${q(task.s!, DIST_UNITS)}, если ${m.pron} ${m.now} равномерно со скоростью ${q(task.v!, SPEED_UNITS)}? Ответ дайте в ${unit}.`;
    return `${m.label} ${m.did} ${q(task.s!, DIST_UNITS)} за ${q(task.t!, TIME_UNITS)}, двигаясь равномерно. Найдите скорость ${m.gen}. Ответ дайте в ${unit}.`;
  },

  validate(raw) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const t = raw as Partial<SpeedTask>;
    if (!t || typeof t !== "object") return { errors: ["Нет данных задачи"], warnings };
    if (t.unknown !== "s" && t.unknown !== "v" && t.unknown !== "t" && t.unknown !== "vavg") return { errors: ["Не выбрано, что нужно найти"], warnings };
    if (!t.mover || !(t.mover in MOVERS)) errors.push("Не выбран движущийся объект");
    if (t.unknown === "vavg") return validateAverage(t, errors, warnings);
    const need = { s: ["v", "t"], v: ["s", "t"], t: ["s", "v"] }[t.unknown] as ("s" | "v" | "t")[];
    const tables = { s: DIST_UNITS, v: SPEED_UNITS, t: TIME_UNITS };
    for (const k of need) {
      const x = t[k];
      if (!isQuantity(x, tables[k])) errors.push(`Не задано значение ${k}`);
      else if (x.value <= 0) errors.push(`Значение ${k} должно быть больше нуля`);
      else if (x.value > 1e7) errors.push(`Слишком большое значение ${k}`);
    }
    if (!t.answerUnit || !(t.answerUnit in ANSWER_UNITS[t.unknown])) errors.push("Не выбраны единицы ответа");
    if (errors.length) return { errors, warnings };

    const task = { unknown: t.unknown, mover: t.mover, answerUnit: t.answerUnit } as SpeedTask;
    for (const k of need) task[k] = { value: t[k]!.value, unit: t[k]!.unit };

    // Подсказка о реалистичности — не мешает решать
    const v = task.v ? toSI(task.v, SPEED_UNITS) : toSI(task.s!, DIST_UNITS) / toSI(task.t!, TIME_UNITS);
    const [lo, hi] = MOVERS[task.mover].range;
    if (v < lo / 3 || v > hi * 3)
      warnings.push(`Для объекта «${MOVERS[task.mover].label}» скорость ${fmt(v)} м/с выглядит нереалистично — можно решить, но проверьте условие.`);
    return { errors, warnings, task };
  },

  solve(task) {
    const steps: string[] = [];
    let si: number;
    if (task.unknown === "vavg") {
      const segs = task.segments!.map(segmentSI);
      task.segments!.forEach((seg, i) => {
        const n = i + 1;
        const x = segs[i];
        steps.push(siStep(`v_{${n}}`, seg.v, SPEED_UNITS, "м/с"));
        if (seg.s) {
          steps.push(siStep(`s_{${n}}`, seg.s, DIST_UNITS, "м"));
          steps.push(`t_{${n}} = [[s_{${n}}||v_{${n}}]] = [[${fmt(x.s)} м||${fmt(x.v)} м/с]] = ${fmt(x.t)} с`);
        } else {
          steps.push(siStep(`t_{${n}}`, seg.t!, TIME_UNITS, "с"));
          steps.push(`s_{${n}} = v_{${n}} · t_{${n}} = ${fmt(x.v)} м/с · ${fmt(x.t)} с = ${fmt(x.s)} м`);
        }
      });
      const S = segs.reduce((a, x) => a + x.s, 0);
      const T = segs.reduce((a, x) => a + x.t, 0);
      si = S / T;
      steps.push(`Весь путь s = ${segs.map((x) => fmt(x.s)).join(" + ")} = ${fmt(S)} м, всё время t = ${segs.map((x) => fmt(x.t)).join(" + ")} = ${fmt(T)} с`);
      steps.push(`v_{ср} = [[s||t]] = [[${fmt(S)} м||${fmt(T)} с]] = ${fmt(si)} м/с`);
    } else if (task.unknown === "s") {
      steps.push(siStep("v", task.v!, SPEED_UNITS, "м/с"), siStep("t", task.t!, TIME_UNITS, "с"));
      const v = toSI(task.v!, SPEED_UNITS);
      const t = toSI(task.t!, TIME_UNITS);
      si = v * t;
      steps.push(`s = v · t = ${fmt(v)} м/с · ${fmt(t)} с = ${fmt(si)} м`);
    } else if (task.unknown === "v") {
      steps.push(siStep("s", task.s!, DIST_UNITS, "м"), siStep("t", task.t!, TIME_UNITS, "с"));
      const s = toSI(task.s!, DIST_UNITS);
      const t = toSI(task.t!, TIME_UNITS);
      si = s / t;
      steps.push(`v = [[s||t]] = [[${fmt(s)} м||${fmt(t)} с]] = ${fmt(si)} м/с`);
    } else {
      steps.push(siStep("s", task.s!, DIST_UNITS, "м"), siStep("v", task.v!, SPEED_UNITS, "м/с"));
      const s = toSI(task.s!, DIST_UNITS);
      const v = toSI(task.v!, SPEED_UNITS);
      si = s / v;
      steps.push(`t = [[s||v]] = [[${fmt(s)} м||${fmt(v)} м/с]] = ${fmt(si)} с`);
    }
    const unit = ANSWER_UNITS[task.unknown][task.answerUnit];
    const value = si / unit.toSI;
    if (unit.toSI !== 1) steps.push(`${fmt(si)} ${SI[task.unknown]} = ${fmt(value)} ${unit.label}`);
    return { value, unitLabel: unit.label, steps };
  },

  // Сложность = сколько переводов единиц нужно сделать
  difficulty(task) {
    if (task.unknown === "vavg") {
      // ★★ — две ступени решения; ★★★ — если ещё нужен перевод единиц
      const units = [task.answerUnit, ...task.segments!.flatMap((g) => [g.v.unit, g.s?.unit, g.t?.unit])].filter(Boolean);
      const si = units.every((u) => ["m", "m/s", "s"].includes(u!));
      const kmh = units.every((u) => ["km", "km/h", "h"].includes(u!));
      return si || kmh ? 2 : 3;
    }
    const conv = (["s", "v", "t"] as const).filter((k) => {
      const x = task[k];
      const tables = { s: DIST_UNITS, v: SPEED_UNITS, t: TIME_UNITS };
      return x && tables[k][x.unit].toSI !== 1;
    }).length + (ANSWER_UNITS[task.unknown][task.answerUnit].toSI !== 1 ? 1 : 0);
    return Math.min(3, 1 + Math.floor(conv / 1.5));
  },
};

function validateAverage(t: Partial<SpeedTask>, errors: string[], warnings: string[]) {
  const segs = t.segments;
  if (!Array.isArray(segs) || segs.length < 2 || segs.length > 3) {
    errors.push("Средняя скорость: нужно 2 или 3 участка пути");
    return { errors, warnings };
  }
  const clean: Segment[] = [];
  segs.forEach((g, i) => {
    const n = i + 1;
    const ok = (x: unknown, table: UnitTable) => isQuantity(x, table) && x.value > 0 && x.value <= 1e7;
    if (!g || typeof g !== "object" || !ok(g.v, SPEED_UNITS)) return void errors.push(`Участок ${n}: не задана скорость`);
    const hasS = g.s !== undefined;
    const hasT = g.t !== undefined;
    if (hasS === hasT) return void errors.push(`Участок ${n}: должен быть задан либо путь, либо время`);
    if (hasS && !ok(g.s, DIST_UNITS)) return void errors.push(`Участок ${n}: неверный путь`);
    if (hasT && !ok(g.t, TIME_UNITS)) return void errors.push(`Участок ${n}: неверное время`);
    clean.push(hasS ? { v: { ...g.v }, s: { ...g.s! } } : { v: { ...g.v }, t: { ...g.t! } });
  });
  if (!t.answerUnit || !(t.answerUnit in SPEED_UNITS)) errors.push("Не выбраны единицы ответа");
  if (errors.length) return { errors, warnings };
  const task: SpeedTask = { unknown: "vavg", mover: t.mover!, segments: clean, answerUnit: t.answerUnit! };
  return { errors, warnings, task };
}
