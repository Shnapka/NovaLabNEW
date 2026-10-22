// Практика «Мастерская задач: масса тела» (7 кл.): серверная проверка задач из Unity-симуляции mass-practice.
// Порт MassSolver.cs (LabFiz): четыре типа — пружинные весы, рычажные весы, тара, много одинаковых тел.
// Решение ведётся в граммах, затем переводится в единицы ответа.
import { type PracticeTopic, type Quantity, type UnitTable, fmt, isNum, isQuantity } from "./common";

export const MASS_UNITS: UnitTable = {
  mg: { label: "мг", toSI: 0.001 },
  g: { label: "г", toSI: 1 },
  kg: { label: "кг", toSI: 1000 },
};

// Разновес Г-4-211.10, мг
const WEIGHT_SET = [100000, 50000, 20000, 20000, 10000, 5000, 2000, 2000, 1000, 500, 200, 200, 100, 50, 20, 20, 10];
const LEVER_CAPACITY = 200; // г
const ELECTRONIC_CAPACITY = 2000; // г

const ITEMS = {
  clip: { one: "скрепку", few: "скрепки", many: "скрепок", genitive: "скрепки" },
  coin: { one: "монету", few: "монеты", many: "монет", genitive: "монеты" },
  nut: { one: "гайку", few: "гайки", many: "гаек", genitive: "гайки" },
  pea: { one: "горошину", few: "горошины", many: "горошин", genitive: "горошины" },
} as const;
const CONTAINERS = {
  glass: { label: "Стакан", nominative: "Пустой стакан стоит", into: "в стакан" },
  jar: { label: "Банка", nominative: "Пустая банка стоит", into: "в банку" },
  pan: { label: "Кастрюля", nominative: "Пустая кастрюля стоит", into: "в кастрюлю" },
} as const;
const CONTENTS = {
  water: { label: "Вода", verb: "налили", accusative: "воду", genitive: "воды", instrumental: "водой" },
  milk: { label: "Молоко", verb: "налили", accusative: "молоко", genitive: "молока", instrumental: "молоком" },
  sugar: { label: "Сахар", verb: "насыпали", accusative: "сахар", genitive: "сахара", instrumental: "сахаром" },
  grain: { label: "Крупа", verb: "насыпали", accusative: "крупу", genitive: "крупы", instrumental: "крупой" },
} as const;

export type MassTask = {
  unknown: "spring" | "lever" | "tare" | "pieces";
  mark?: Quantity; // пружинные: значение у первого числового штриха
  divisions?: number; // делений между «0» и этим штрихом
  pointer?: number; // на каком делении стрелка
  limit?: Quantity; // предел весов
  weights?: Quantity[]; // рычажные: гири на правой чаше
  container?: keyof typeof CONTAINERS; // тара
  content?: keyof typeof CONTENTS;
  m1?: Quantity;
  m2?: Quantity;
  item?: keyof typeof ITEMS; // много одинаковых тел
  count?: number;
  total?: Quantity;
  answerUnit: string;
};

const grams = (x: Quantity) => x.value * MASS_UNITS[x.unit].toSI;
const fromGrams = (g: number, unit: string) => g / MASS_UNITS[unit].toSI;
const label = (unit: string) => MASS_UNITS[unit]?.label ?? unit;
const text = (x: Quantity) => `${fmt(x.value)} ${label(x.unit)}`;

function plural(n: number, one: string, few: string, many: string) {
  const m100 = Math.abs(n) % 100;
  const m10 = Math.abs(n) % 10;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

/** «500 мг = 500 : 1000 = 0,5 г»; пусто для граммов */
function toGramsText(x: Quantity) {
  if (x.unit === "g") return "";
  return `${text(x)} = ${fmt(x.value)}${x.unit === "mg" ? " : " : " · "}1000 = ${fmt(grams(x))} г`;
}

/** «130 г = 130 : 1000 = 0,13 кг»; пусто для граммов */
function fromGramsText(g: number, unit: string) {
  if (unit === "g") return "";
  return `${fmt(g)} г = ${fmt(g)}${unit === "mg" ? " · " : " : "}1000 = ${fmt(fromGrams(g, unit))} ${label(unit)}`;
}

const list = (xs: Quantity[]) => xs.map(text).reduce((a, b, i) => (i === 0 ? b : i === xs.length - 1 ? `${a} и ${b}` : `${a}, ${b}`), "");

/** Гири в мг, если все они есть в школьном наборе; иначе null */
function weightMilligrams(ws: Quantity[]) {
  const left = [...WEIGHT_SET];
  const out: number[] = [];
  for (const w of ws) {
    const mg = Math.round(grams(w) * 1000);
    const i = left.indexOf(mg);
    if (Math.abs(grams(w) * 1000 - mg) > 1e-6 || i < 0) return null;
    left.splice(i, 1);
    out.push(mg);
  }
  return out;
}

function answerGrams(t: MassTask) {
  switch (t.unknown) {
    case "spring":
      return t.pointer! * (grams(t.mark!) / t.divisions!);
    case "lever":
      return t.weights!.reduce((s, w) => s + grams(w), 0);
    case "tare":
      return grams(t.m2!) - grams(t.m1!);
    case "pieces":
      return grams(t.total!) / t.count!;
  }
}

const NEED: Record<MassTask["unknown"], (keyof MassTask)[]> = {
  spring: ["mark", "divisions", "pointer", "limit"],
  lever: ["weights"],
  tare: ["container", "content", "m1", "m2"],
  pieces: ["item", "count", "total"],
};

export const massTopic: PracticeTopic<MassTask> = {
  id: "mass",
  unknowns: [
    { value: "spring", label: "Пружинные весы" },
    { value: "lever", label: "Рычажные весы" },
    { value: "tare", label: "Масса без тары" },
    { value: "pieces", label: "Масса одного из многих" },
  ],

  createTask(unknown) {
    switch (unknown) {
      case "lever":
        return { unknown: "lever", weights: [{ value: 50, unit: "g" }, { value: 20, unit: "g" }, { value: 500, unit: "mg" }], answerUnit: "g" };
      case "tare":
        return { unknown: "tare", container: "glass", content: "water", m1: { value: 180, unit: "g" }, m2: { value: 380, unit: "g" }, answerUnit: "g" };
      case "pieces":
        return { unknown: "pieces", item: "clip", count: 40, total: { value: 20, unit: "g" }, answerUnit: "mg" };
      default:
        return { unknown: "spring", mark: { value: 50, unit: "g" }, divisions: 10, pointer: 26, limit: { value: 200, unit: "g" }, answerUnit: "g" };
    }
  },

  // Составление задачи идёт в Unity-симуляции; здесь — поля для запасного веб-редактора (без набора гирь)
  fields(task) {
    const select = (key: string, lbl: string, map: Record<string, { label?: string }>) => ({
      kind: "select" as const,
      key,
      label: lbl,
      options: Object.entries(map).map(([value, v]) => ({ value, label: v.label ?? value })),
    });
    switch (task.unknown) {
      case "spring":
        return [
          { kind: "quantity", key: "mark", label: "Значение у штриха", units: MASS_UNITS },
          { kind: "number", key: "divisions", label: "Делений до штриха", unitLabel: "" },
          { kind: "number", key: "pointer", label: "Стрелка на делении", unitLabel: "" },
          { kind: "quantity", key: "limit", label: "Предел весов", units: MASS_UNITS },
        ];
      case "tare":
        return [
          select("container", "Посуда", CONTAINERS),
          select("content", "Что положили", CONTENTS),
          { kind: "quantity", key: "m1", label: "Пустая посуда m_{1}", units: MASS_UNITS },
          { kind: "quantity", key: "m2", label: "С содержимым m_{2}", units: MASS_UNITS },
        ];
      case "pieces":
        return [
          select("item", "Что взвешиваем", { clip: { label: "Скрепки" }, coin: { label: "Монеты" }, nut: { label: "Гайки" }, pea: { label: "Горошины" } }),
          { kind: "number", key: "count", label: "Сколько штук N", unitLabel: "шт." },
          { kind: "quantity", key: "total", label: "Показание весов M", units: MASS_UNITS },
        ];
      default:
        return [];
    }
  },

  answerUnits: () => MASS_UNITS,

  describe(t) {
    const unit = label(t.answerUnit);
    switch (t.unknown) {
      case "spring":
        return `На шкале пружинных весов между штрихами «0» и «${text(t.mark!)}» ${t.divisions} ${plural(t.divisions!, "деление", "деления", "делений")}. Стрелка весов с грузом остановилась на ${t.pointer}-м делении. Какова масса груза? Ответ дайте в ${unit}.`;
      case "lever":
        return `Тело уравновесили на рычажных весах ${t.weights!.length === 1 ? "гирей" : "гирями"} ${list(t.weights!)}. Какова масса тела? Ответ дайте в ${unit}.`;
      case "tare": {
        const c = CONTAINERS[t.container!];
        const s = CONTENTS[t.content!];
        return `${c.nominative} на электронных весах — табло показывает ${text(t.m1!)}. Когда ${c.into} ${s.verb} ${s.accusative}, весы показали ${text(t.m2!)}. Какова масса ${s.genitive}? Ответ дайте в ${unit}.`;
      }
      case "pieces": {
        const i = ITEMS[t.item!];
        return `На электронные весы положили ${t.count} ${plural(t.count!, "одинаковую", "одинаковые", "одинаковых")} ${plural(t.count!, i.one, i.few, i.many)}. Весы показали ${text(t.total!)}. Какова масса одной ${i.genitive}? Ответ дайте в ${unit}.`;
      }
    }
  },

  validate(raw) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const t = raw as Partial<MassTask>;
    if (!t || typeof t !== "object" || !t.unknown || !(t.unknown in NEED)) return { errors: ["Неизвестный тип задачи"], warnings };
    if (!t.answerUnit || !(t.answerUnit in MASS_UNITS)) errors.push("Не выбраны единицы ответа");
    const task = { unknown: t.unknown, answerUnit: t.answerUnit } as MassTask;
    const mass = (key: "mark" | "limit" | "m1" | "m2" | "total", name: string) => {
      const v = t[key];
      if (!isQuantity(v, MASS_UNITS)) return errors.push(`${name}: введите число`), false;
      if (v.value <= 0 || v.value > 1e7) return errors.push(`${name} должна быть больше нуля`), false;
      task[key] = { value: v.value, unit: v.unit };
      return true;
    };
    const int = (key: "divisions" | "pointer" | "count", min: number, max: number, msg: string) => {
      const v = t[key];
      if (!isNum(v) || !Number.isInteger(v) || v < min || v > max) return errors.push(msg), false;
      task[key] = v;
      return true;
    };

    switch (t.unknown) {
      case "spring": {
        const ok = mass("mark", "Значение у штриха") && mass("limit", "Предел измерения");
        const okDiv = int("divisions", 2, 50, "Между штрихами должно быть от 2 до 50 делений");
        const okPtr = int("pointer", 1, 100000, "Стрелка на нуле: груз не положен");
        if (ok && okDiv && okPtr && task.pointer! > grams(task.limit!) / (grams(task.mark!) / task.divisions!) + 1e-9)
          errors.push(`Стрелка ушла за предел шкалы (${text(task.limit!)})`);
        break;
      }
      case "lever": {
        const ws = Array.isArray(t.weights) ? t.weights : [];
        if (!ws.length) {
          errors.push("Положите на правую чашку хотя бы одну гирю");
          break;
        }
        if (ws.length > WEIGHT_SET.length || !ws.every((w) => isQuantity(w, MASS_UNITS) && w.value > 0)) {
          errors.push("Неверные массы гирь");
          break;
        }
        task.weights = ws.map((w) => ({ value: w.value, unit: w.unit }));
        const sum = task.weights.reduce((s, w) => s + grams(w), 0);
        if (!weightMilligrams(task.weights)) errors.push("Таких гирь нет в наборе (100, 50, 20, 20, 10, 5, 2, 2, 1 г; 500, 200, 200, 100, 50, 20, 20, 10 мг)");
        else if (sum > LEVER_CAPACITY + 1e-9) errors.push(`Учебные рычажные весы рассчитаны на 200 г, а гирь — ${fmt(sum)} г`);
        break;
      }
      case "tare": {
        if (typeof t.container !== "string" || !(t.container in CONTAINERS)) errors.push("Выберите посуду");
        else task.container = t.container;
        if (typeof t.content !== "string" || !(t.content in CONTENTS)) errors.push("Выберите, что положить в посуду");
        else task.content = t.content;
        if (mass("m1", "Масса пустой посуды") && mass("m2", "Показание весов")) {
          if (grams(task.m2!) <= grams(task.m1!) + 1e-9) errors.push(`С содержимым весы должны показать больше, чем пустая посуда (${text(task.m1!)})`);
          else if (grams(task.m2!) > ELECTRONIC_CAPACITY + 1e-9) errors.push("Электронные весы рассчитаны на 2 кг");
        }
        break;
      }
      case "pieces": {
        if (typeof t.item !== "string" || !(t.item in ITEMS)) errors.push("Выберите, что взвешиваем");
        else task.item = t.item;
        int("count", 2, 500, "Число тел — от 2 до 500");
        if (mass("total", "Показание весов") && grams(task.total!) > ELECTRONIC_CAPACITY + 1e-9) errors.push("Электронные весы рассчитаны на 2 кг");
        break;
      }
    }
    return errors.length ? { errors, warnings } : { errors, warnings, task };
  },

  solve(t) {
    const steps: string[] = [];
    const g = answerGrams(t);
    switch (t.unknown) {
      case "spring": {
        const c = grams(t.mark!) / t.divisions!;
        steps.push(`Дано: между штрихами «0» и «${text(t.mark!)}» — ${t.divisions} ${plural(t.divisions!, "деление", "деления", "делений")}, стрелка на ${t.pointer}-м делении.`);
        steps.push(
          `Цена деления: c = (${text(t.mark!)} − 0) : ${t.divisions} = ` +
            (t.mark!.unit === "g" ? `${fmt(c)} г.` : `${fmt(fromGrams(c, t.mark!.unit))} ${label(t.mark!.unit)} = ${fmt(c)} г.`),
        );
        steps.push(`Показание весов: m = n · c = ${t.pointer} · ${fmt(c)} г = ${fmt(g)} г.`);
        break;
      }
      case "lever": {
        steps.push("Весы в равновесии — масса тела равна сумме масс гирь.");
        const conv = [...new Set(t.weights!.map(toGramsText).filter(Boolean))];
        if (conv.length) steps.push(`Переведём в граммы: ${conv.join("; ")}.`);
        steps.push(`m = ${t.weights!.map((w) => `${fmt(grams(w))} г`).join(" + ")} = ${fmt(g)} г.`);
        break;
      }
      case "tare": {
        const s = CONTENTS[t.content!];
        steps.push(`Дано: посуда с ${s.instrumental} m_{2} = ${text(t.m2!)}, пустая посуда m_{1} = ${text(t.m1!)}.`);
        const conv = [t.m2!, t.m1!].map(toGramsText).filter(Boolean);
        if (conv.length) steps.push(`Переведём в граммы: ${conv.join("; ")}.`);
        steps.push(`Масса ${s.genitive}: m = m_{2} − m_{1} = ${fmt(grams(t.m2!))} г − ${fmt(grams(t.m1!))} г = ${fmt(g)} г.`);
        break;
      }
      case "pieces": {
        const i = ITEMS[t.item!];
        steps.push(`Дано: N = ${t.count}, масса всех вместе M = ${text(t.total!)}.`);
        const conv = toGramsText(t.total!);
        if (conv) steps.push(`Переведём в граммы: ${conv}.`);
        steps.push(`Масса одной ${i.genitive}: m = M : N = ${fmt(grams(t.total!))} г : ${t.count} = ${fmt(g)} г.`);
        break;
      }
    }
    const value = fromGrams(g, t.answerUnit);
    const back = fromGramsText(g, t.answerUnit);
    if (back) steps.push(`Переведём в ${label(t.answerUnit)}: ${back}.`);
    steps.push(`Ответ: m = ${fmt(value)} ${label(t.answerUnit)}.`);
    return { value, unitLabel: label(t.answerUnit), steps };
  },

  // ★ рычажные и тара · ★★ пружинные и «много одинаковых» · +★ если нужен перевод единиц
  difficulty(t) {
    const stars = t.unknown === "spring" || t.unknown === "pieces" ? 2 : 1;
    const given = t.unknown === "spring" ? [t.mark!] : t.unknown === "lever" ? t.weights! : t.unknown === "tare" ? [t.m1!, t.m2!] : [t.total!];
    const convert = t.answerUnit !== "g" || given.some((x) => x.unit !== "g");
    return Math.min(3, stars + (convert ? 1 : 0));
  },
};
