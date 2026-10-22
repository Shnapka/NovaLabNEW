// Практика «Взаимодействие тележек» (Кронгарт, 7 кл., § 10, рис. 10.3–10.4): серверная проверка задач из Unity-симуляции.
// Порт CartsSolver.cs (LabFiz): m₁ / m₂ = v₂ / v₁, а за одно и то же время l₂ / l₁ = v₂ / v₁.
import { type PracticeTopic, type Quantity, type UnitTable, fmt, isQuantity } from "./common";

const MASS: UnitTable = { g: { label: "г", toSI: 1 }, kg: { label: "кг", toSI: 1000 } }; // в граммах
const LENGTH: UnitTable = { cm: { label: "см", toSI: 1 }, m: { label: "м", toSI: 100 } }; // в сантиметрах
const SPEED: UnitTable = { "m/s": { label: "м/с", toSI: 1 } };
const TRACK_CM = 60;

export type InteractionTask = {
  unknown: "s2" | "v2" | "m2";
  m1: Quantity;
  m2?: Quantity;
  s1?: Quantity;
  s2?: Quantity;
  v1?: Quantity;
  answerUnit: string;
};

const ANSWER: Record<InteractionTask["unknown"], UnitTable> = { s2: LENGTH, v2: SPEED, m2: MASS };
const NEED: Record<InteractionTask["unknown"], (keyof InteractionTask)[]> = {
  s2: ["m1", "m2", "s1"],
  v2: ["m1", "m2", "v1"],
  m2: ["m1", "s1", "s2"],
};
const TABLE: Partial<Record<keyof InteractionTask, UnitTable>> = { m1: MASS, m2: MASS, s1: LENGTH, s2: LENGTH, v1: SPEED };

const g = (x: Quantity) => x.value * MASS[x.unit].toSI;
const cm = (x: Quantity) => x.value * LENGTH[x.unit].toSI;
const text = (x: Quantity, t: UnitTable) => `${fmt(x.value)} ${t[x.unit]?.label ?? x.unit}`;
const SETUP = "Две тележки, связанные нитью, стоят на столе, между ними сжатая пружина. ";

/** Ответ в см / м/с / г */
function base(t: InteractionTask) {
  switch (t.unknown) {
    case "s2":
      return (cm(t.s1!) * g(t.m1)) / g(t.m2!);
    case "v2":
      return (t.v1!.value * g(t.m1)) / g(t.m2!);
    case "m2":
      return (g(t.m1) * cm(t.s1!)) / cm(t.s2!);
  }
}

export const interactionTopic: PracticeTopic<InteractionTask> = {
  id: "interaction",
  unknowns: [
    { value: "s2", label: "Путь второй тележки" },
    { value: "v2", label: "Скорость второй тележки" },
    { value: "m2", label: "Масса второй тележки" },
  ],

  createTask(unknown) {
    switch (unknown) {
      case "v2":
        return { unknown: "v2", m1: { value: 200, unit: "g" }, m2: { value: 400, unit: "g" }, v1: { value: 0.4, unit: "m/s" }, answerUnit: "m/s" };
      case "m2":
        return { unknown: "m2", m1: { value: 200, unit: "g" }, s1: { value: 40, unit: "cm" }, s2: { value: 20, unit: "cm" }, answerUnit: "g" };
      default:
        return { unknown: "s2", m1: { value: 200, unit: "g" }, m2: { value: 400, unit: "g" }, s1: { value: 30, unit: "cm" }, answerUnit: "cm" };
    }
  },

  // Задачу составляют в Unity-симуляции; здесь — поля запасного веб-редактора
  fields(task) {
    const all = {
      m1: { kind: "quantity" as const, key: "m1", label: "Масса левой тележки m_{1}", units: MASS },
      m2: { kind: "quantity" as const, key: "m2", label: "Масса правой тележки m_{2}", units: MASS },
      s1: { kind: "quantity" as const, key: "s1", label: "Путь левой тележки l_{1}", units: LENGTH },
      s2: { kind: "quantity" as const, key: "s2", label: "Путь правой тележки l_{2}", units: LENGTH },
      v1: { kind: "quantity" as const, key: "v1", label: "Скорость левой тележки v_{1}", units: SPEED },
    };
    return NEED[task.unknown].map((k) => all[k as keyof typeof all]);
  },

  answerUnits: (task) => ANSWER[task.unknown],

  describe(t) {
    const unit = ANSWER[t.unknown][t.answerUnit]?.label ?? t.answerUnit;
    switch (t.unknown) {
      case "s2":
        return `${SETUP}Масса левой тележки m₁ = ${text(t.m1, MASS)}, правой m₂ = ${text(t.m2!, MASS)}. Нить пережгли, и тележки разъехались. Левая тележка проехала ${text(t.s1!, LENGTH)}. Какое расстояние за то же время проехала правая тележка? Ответ дайте в ${unit}.`;
      case "v2":
        return `${SETUP}Масса левой тележки m₁ = ${text(t.m1, MASS)}, правой m₂ = ${text(t.m2!, MASS)}. После пережигания нити левая тележка приобрела скорость ${text(t.v1!, SPEED)}. Какую скорость приобрела правая тележка? Ответ дайте в ${unit}.`;
      case "m2":
        return `${SETUP}Масса левой тележки m₁ = ${text(t.m1, MASS)}. После пережигания нити за одно и то же время левая тележка проехала ${text(t.s1!, LENGTH)}, а правая — ${text(t.s2!, LENGTH)}. Какова масса правой тележки? Ответ дайте в ${unit}.`;
    }
  },

  validate(raw) {
    const errors: string[] = [];
    const t = raw as Partial<InteractionTask>;
    if (!t || typeof t !== "object" || !t.unknown || !(t.unknown in NEED)) return { errors: ["Неизвестный тип задачи"], warnings: [] };
    const task = { unknown: t.unknown, answerUnit: t.answerUnit } as InteractionTask;
    for (const k of NEED[t.unknown]) {
      const v = t[k];
      const table = TABLE[k]!;
      if (!isQuantity(v, table) || v.value <= 0) {
        errors.push(`Не задано значение ${k}`);
        continue;
      }
      (task as Record<string, unknown>)[k] = { value: v.value, unit: v.unit };
      if ((k === "m1" || k === "m2") && (g(v) < 50 || g(v) > 5000)) errors.push("Масса тележки — от 50 г до 5 кг");
      if ((k === "s1" || k === "s2") && cm(v) > TRACK_CM + 1e-9) errors.push(`Путь больше ${TRACK_CM} см — тележка уедет за край стола`);
      if (k === "v1" && (v.value < 0.01 || v.value > 2)) errors.push("Скорость левой тележки — от 0,01 до 2 м/с");
    }
    if (!t.answerUnit || !(t.answerUnit in ANSWER[t.unknown])) errors.push("Не выбраны единицы ответа");
    if (!errors.length && task.unknown === "s2" && base(task) > TRACK_CM + 1e-9) errors.push("Правая тележка упадёт со стола — возьмите путь левой тележки поменьше");
    return errors.length ? { errors, warnings: [] } : { errors, warnings: [], task };
  },

  solve(t) {
    const steps = ["При взаимодействии скорости тел обратно пропорциональны их массам: [[m_{1}||m_{2}]] = [[v_{2}||v_{1}]]."];
    const v = base(t);
    switch (t.unknown) {
      case "s2":
        steps.push("За одно и то же время пути пропорциональны скоростям: [[l_{2}||l_{1}]] = [[v_{2}||v_{1}]] = [[m_{1}||m_{2}]].");
        steps.push(`l_{2} = l_{1} · m_{1} / m_{2} = ${fmt(cm(t.s1!))} см · ${fmt(g(t.m1))} г / ${fmt(g(t.m2!))} г = ${fmt(v)} см.`);
        break;
      case "v2":
        steps.push(`v_{2} = v_{1} · m_{1} / m_{2} = ${fmt(t.v1!.value)} м/с · ${fmt(g(t.m1))} г / ${fmt(g(t.m2!))} г = ${fmt(v)} м/с.`);
        break;
      case "m2":
        steps.push("За одно и то же время пути пропорциональны скоростям, значит [[m_{1}||m_{2}]] = [[l_{2}||l_{1}]].");
        steps.push(`m_{2} = m_{1} · l_{1} / l_{2} = ${fmt(g(t.m1))} г · ${fmt(cm(t.s1!))} см / ${fmt(cm(t.s2!))} см = ${fmt(v)} г.`);
        break;
    }
    const unit = ANSWER[t.unknown][t.answerUnit];
    const value = v / unit.toSI;
    if (unit.toSI !== 1) steps.push(`${fmt(v)} ${t.unknown === "s2" ? "см" : "г"} = ${fmt(value)} ${unit.label}`);
    return { value, unitLabel: unit.label, steps };
  },

  // ★ путь и скорость · ★★ масса (отношение «наоборот») · +★ если нужен перевод единиц
  difficulty(t) {
    const stars = t.unknown === "m2" ? 2 : 1;
    const qs = [t.m1, t.m2, t.s1, t.s2].filter(Boolean) as Quantity[];
    const convert = t.answerUnit === "m" || t.answerUnit === "kg" || qs.some((x) => x.unit === "kg" || x.unit === "m");
    return Math.min(3, stars + (convert ? 1 : 0));
  },
};
