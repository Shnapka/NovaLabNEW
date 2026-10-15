// Практика «Составь и реши задачу на архимедову силу» (Перышкин, 7 кл., § 50–53)
import { type PracticeTopic, type Quantity, type UnitTable, fmt, isNum, isQuantity, q, siStep, toSI } from "./common";

export const VOLUME_UNITS: UnitTable = {
  cm3: { label: "см³", toSI: 1e-6 },
  dm3: { label: "дм³", toSI: 1e-3 },
  m3: { label: "м³", toSI: 1 },
};
export const FORCE_UNITS: UnitTable = { N: { label: "Н", toSI: 1 }, kN: { label: "кН", toSI: 1000 } };
export const DENSITY_UNITS: UnitTable = { "kg/m3": { label: "кг/м³", toSI: 1 }, "g/cm3": { label: "г/см³", toSI: 1000 } };
export const MASS_UNITS: UnitTable = { kg: { label: "кг", toSI: 1 }, g: { label: "г", toSI: 0.001 } };

// Плотности — по таблице учебника Перышкина
export const LIQUIDS = {
  water: { label: "Вода", rho: 1000, into: "в воду", inside: "в воде" },
  saltwater: { label: "Морская вода", rho: 1030, into: "в морскую воду", inside: "в морской воде" },
  oil: { label: "Масло подсолнечное", rho: 930, into: "в подсолнечное масло", inside: "в подсолнечном масле" },
  kerosene: { label: "Керосин", rho: 800, into: "в керосин", inside: "в керосине" },
  alcohol: { label: "Спирт", rho: 800, into: "в спирт", inside: "в спирте" },
  mercury: { label: "Ртуть", rho: 13600, into: "в ртуть", inside: "в ртути" },
} as const;
export type LiquidKey = keyof typeof LIQUIDS;

export type ArchimedesTask = {
  unknown: "FA" | "V" | "rho" | "P1" | "cargo";
  g: 9.8 | 10;
  liquid?: LiquidKey; // для всех, кроме rho
  V?: Quantity; // объём тела
  FA?: Quantity; // архимедова сила
  P?: Quantity; // вес тела в воздухе
  L?: number; // кораблик: длина, ширина, высота борта, см
  W?: number;
  H?: number;
  hullMass?: number; // масса пустого кораблика, кг
  answerUnit: string;
};

const ANSWER_UNITS = { FA: FORCE_UNITS, V: VOLUME_UNITS, rho: DENSITY_UNITS, P1: FORCE_UNITS, cargo: MASS_UNITS } as const;

const NEED: Record<ArchimedesTask["unknown"], (keyof ArchimedesTask)[]> = {
  FA: ["liquid", "V"],
  V: ["liquid", "FA"],
  rho: ["V", "FA"],
  P1: ["liquid", "P", "V"],
  cargo: ["liquid", "L", "W", "H", "hullMass"],
};

const QTABLES: Partial<Record<keyof ArchimedesTask, UnitTable>> = { V: VOLUME_UNITS, FA: FORCE_UNITS, P: FORCE_UNITS };

export const archimedesTopic: PracticeTopic<ArchimedesTask> = {
  id: "archimedes",
  unknowns: [
    { value: "FA", label: "Архимедова сила F_{A}" },
    { value: "V", label: "Объём тела V" },
    { value: "rho", label: "Плотность жидкости ρ" },
    { value: "P1", label: "Вес тела в жидкости P_{1}" },
    { value: "cargo", label: "Груз кораблика" },
  ],

  createTask(unknown) {
    switch (unknown) {
      case "V":
        return { unknown: "V", g: 9.8, liquid: "water", FA: { value: 4.9, unit: "N" }, answerUnit: "cm3" };
      case "rho":
        return { unknown: "rho", g: 10, V: { value: 500, unit: "cm3" }, FA: { value: 4, unit: "N" }, answerUnit: "kg/m3" };
      case "P1":
        return { unknown: "P1", g: 9.8, liquid: "water", P: { value: 20, unit: "N" }, V: { value: 1, unit: "dm3" }, answerUnit: "N" };
      case "cargo":
        return { unknown: "cargo", g: 9.8, liquid: "water", L: 40, W: 20, H: 10, hullMass: 0.5, answerUnit: "kg" };
      default:
        return { unknown: "FA", g: 9.8, liquid: "water", V: { value: 200, unit: "cm3" }, answerUnit: "N" };
    }
  },

  fields(task) {
    const all = {
      liquid: {
        kind: "select" as const,
        key: "liquid",
        label: "Жидкость",
        options: Object.entries(LIQUIDS).map(([value, l]) => ({ value, label: `${l.label} (${l.rho} кг/м³)` })),
      },
      V: { kind: "quantity" as const, key: "V", label: "Объём тела V", units: VOLUME_UNITS },
      FA: { kind: "quantity" as const, key: "FA", label: "Архимедова сила F_{A}", units: FORCE_UNITS },
      P: { kind: "quantity" as const, key: "P", label: "Вес тела в воздухе P", units: FORCE_UNITS },
      L: { kind: "number" as const, key: "L", label: "Длина корпуса L", unitLabel: "см" },
      W: { kind: "number" as const, key: "W", label: "Ширина корпуса W", unitLabel: "см" },
      H: { kind: "number" as const, key: "H", label: "Высота борта H", unitLabel: "см" },
      hullMass: { kind: "number" as const, key: "hullMass", label: "Масса пустого кораблика", unitLabel: "кг", step: 0.1 },
    };
    const g = {
      kind: "select" as const,
      key: "g",
      label: "Ускорение свободного падения g",
      numeric: true,
      options: [
        { value: "9.8", label: "9,8 Н/кг" },
        { value: "10", label: "10 Н/кг" },
      ],
    };
    return [...NEED[task.unknown].map((k) => all[k as keyof typeof all]), g];
  },

  answerUnits: (task) => ANSWER_UNITS[task.unknown],

  describe(task) {
    const unit = ANSWER_UNITS[task.unknown][task.answerUnit]?.label ?? task.answerUnit;
    const l = task.liquid ? LIQUIDS[task.liquid] : null;
    const g = `Ускорение свободного падения g = ${fmt(task.g)} Н/кг.`;
    switch (task.unknown) {
      case "FA":
        return `Тело объёмом ${q(task.V!, VOLUME_UNITS)} полностью погрузили ${l!.into}. Какая архимедова сила действует на тело? ${g} Ответ дайте в ${unit}.`;
      case "V":
        return `На тело, полностью погружённое ${l!.into}, действует выталкивающая сила ${q(task.FA!, FORCE_UNITS)}. Найдите объём тела. ${g} Ответ дайте в ${unit}.`;
      case "rho":
        return `На тело объёмом ${q(task.V!, VOLUME_UNITS)}, полностью погружённое в жидкость, действует архимедова сила ${q(task.FA!, FORCE_UNITS)}. Определите плотность жидкости. Что это может быть за жидкость? ${g} Ответ дайте в ${unit}.`;
      case "P1":
        return `Тело весом ${q(task.P!, FORCE_UNITS)} и объёмом ${q(task.V!, VOLUME_UNITS)} подвесили к динамометру и полностью погрузили ${l!.into}. Что покажет динамометр? ${g} Ответ дайте в ${unit}.`;
      case "cargo":
        return `Кораблик-баржа имеет прямоугольный корпус длиной ${fmt(task.L!)} см, шириной ${fmt(task.W!)} см и высотой борта ${fmt(task.H!)} см. Масса пустого кораблика ${fmt(task.hullMass!)} кг. Какой наибольший груз можно положить в кораблик, чтобы он не затонул ${l!.inside}? ${g} Ответ дайте в ${unit}.`;
    }
  },

  validate(raw) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const t = raw as Partial<ArchimedesTask>;
    if (!t || typeof t !== "object" || !t.unknown || !(t.unknown in NEED)) return { errors: ["Не выбрано, что нужно найти"], warnings };
    if (t.g !== 9.8 && t.g !== 10) errors.push("g должно быть 9,8 или 10 Н/кг");
    const task = { unknown: t.unknown, g: t.g, answerUnit: t.answerUnit } as ArchimedesTask;
    for (const k of NEED[t.unknown]) {
      const v = t[k];
      if (k === "liquid") {
        if (typeof v !== "string" || !(v in LIQUIDS)) errors.push("Не выбрана жидкость");
        else task.liquid = v as LiquidKey;
      } else if (QTABLES[k]) {
        if (!isQuantity(v, QTABLES[k]!)) errors.push(`Не задано значение ${k}`);
        else if (v.value <= 0 || v.value > 1e7) errors.push(`Значение ${k} должно быть больше нуля и разумного размера`);
        else (task as Record<string, unknown>)[k] = { value: v.value, unit: v.unit };
      } else {
        if (!isNum(v) || v <= 0 || v > 1e5) errors.push(`Значение ${k} должно быть положительным числом`);
        else (task as Record<string, unknown>)[k] = v;
      }
    }
    if (!t.answerUnit || !(t.answerUnit in ANSWER_UNITS[t.unknown])) errors.push("Не выбраны единицы ответа");
    if (errors.length) return { errors, warnings };

    // Физическая осмысленность условия
    if (task.unknown === "P1") {
      const fa = LIQUIDS[task.liquid!].rho * task.g * toSI(task.V!, VOLUME_UNITS);
      if (fa >= toSI(task.P!, FORCE_UNITS))
        errors.push(`Архимедова сила (${fmt(fa)} Н) не меньше веса тела — тело всплывёт, и динамометр покажет 0. Увеличьте вес или уменьшите объём.`);
    }
    if (task.unknown === "cargo") {
      const maxMass = LIQUIDS[task.liquid!].rho * (task.L! / 100) * (task.W! / 100) * (task.H! / 100);
      if (maxMass <= task.hullMass!) errors.push("Такой кораблик утонет даже пустым — уменьшите его массу или увеличьте размеры.");
      if (task.L! > 2000 || task.W! > 2000 || task.H! > 1000) warnings.push("Это уже не кораблик, а корабль — проверьте размеры.");
    }
    if (task.unknown === "rho") {
      const rho = toSI(task.FA!, FORCE_UNITS) / (task.g * toSI(task.V!, VOLUME_UNITS));
      if (rho < 500 || rho > 15000) warnings.push(`Получится плотность ${fmt(rho)} кг/м³ — таких жидкостей почти не бывает. Проверьте условие.`);
    }
    return { errors, warnings, task };
  },

  solve(task) {
    const steps: string[] = [];
    const g = task.g;
    const rhoL = task.liquid ? LIQUIDS[task.liquid].rho : 0;
    if (task.liquid) steps.push(`ρ_{ж} = ${rhoL} кг/м³ (${LIQUIDS[task.liquid].label.toLowerCase()}), g = ${fmt(g)} Н/кг`);
    let si = 0;
    let siLabel = "";
    let note: string | undefined;

    switch (task.unknown) {
      case "FA": {
        steps.push(siStep("V", task.V!, VOLUME_UNITS, "м³"));
        const V = toSI(task.V!, VOLUME_UNITS);
        si = rhoL * g * V;
        siLabel = "Н";
        steps.push(`F_{A} = ρ_{ж} · g · V = ${rhoL} · ${fmt(g)} · ${fmt(V)} = ${fmt(si)} Н`);
        break;
      }
      case "V": {
        steps.push(siStep("F_{A}", task.FA!, FORCE_UNITS, "Н"));
        const FA = toSI(task.FA!, FORCE_UNITS);
        si = FA / (rhoL * g);
        siLabel = "м³";
        steps.push(`Из F_{A} = ρ_{ж}gV: V = [[F_{A}||ρ_{ж} · g]] = [[${fmt(FA)}||${rhoL} · ${fmt(g)}]] = ${fmt(si)} м³`);
        break;
      }
      case "rho": {
        steps.push(`g = ${fmt(g)} Н/кг`, siStep("V", task.V!, VOLUME_UNITS, "м³"), siStep("F_{A}", task.FA!, FORCE_UNITS, "Н"));
        const V = toSI(task.V!, VOLUME_UNITS);
        const FA = toSI(task.FA!, FORCE_UNITS);
        si = FA / (g * V);
        siLabel = "кг/м³";
        steps.push(`Из F_{A} = ρ_{ж}gV: ρ_{ж} = [[F_{A}||g · V]] = [[${fmt(FA)}||${fmt(g)} · ${fmt(V)}]] = ${fmt(si)} кг/м³`);
        const match = Object.values(LIQUIDS).filter((l) => Math.abs(l.rho - si) / l.rho < 0.03);
        note = match.length
          ? `По таблице плотностей это ${match.map((l) => l.label.toLowerCase()).join(" или ")}.`
          : "Жидкости с такой плотностью нет в таблице учебника.";
        break;
      }
      case "P1": {
        steps.push(siStep("P", task.P!, FORCE_UNITS, "Н"), siStep("V", task.V!, VOLUME_UNITS, "м³"));
        const P = toSI(task.P!, FORCE_UNITS);
        const V = toSI(task.V!, VOLUME_UNITS);
        const FA = rhoL * g * V;
        si = P - FA;
        siLabel = "Н";
        steps.push(`F_{A} = ρ_{ж} · g · V = ${rhoL} · ${fmt(g)} · ${fmt(V)} = ${fmt(FA)} Н`);
        steps.push(`P_{1} = P − F_{A} = ${fmt(P)} − ${fmt(FA)} = ${fmt(si)} Н`);
        break;
      }
      case "cargo": {
        const L = task.L! / 100;
        const W = task.W! / 100;
        const H = task.H! / 100;
        const V = L * W * H;
        steps.push(`L = ${fmt(L)} м, W = ${fmt(W)} м, H = ${fmt(H)} м`);
        steps.push(`Наибольший объём погружённой части (вода у края борта): V = L · W · H = ${fmt(V)} м³`);
        steps.push(`Наибольшая архимедова сила: F_{A} = ρ_{ж} · g · V = ${rhoL} · ${fmt(g)} · ${fmt(V)} = ${fmt(rhoL * g * V)} Н`);
        steps.push(`Плавает, пока F_{тяж} ≤ F_{A}: (m_{к} + m_{гр}) · g ≤ ρ_{ж} · g · V → m_{гр} ≤ ρ_{ж}V − m_{к}`);
        si = rhoL * V - task.hullMass!;
        siLabel = "кг";
        steps.push(`m_{гр} = ${rhoL} · ${fmt(V)} − ${fmt(task.hullMass!)} = ${fmt(si)} кг`);
        break;
      }
    }
    const unit = ANSWER_UNITS[task.unknown][task.answerUnit];
    const value = si / unit.toSI;
    if (unit.toSI !== 1) steps.push(`${fmt(si)} ${siLabel} = ${fmt(value)} ${unit.label}`);
    return { value, unitLabel: unit.label, steps, note };
  },

  difficulty(task) {
    let d = task.unknown === "FA" ? 0 : 1;
    for (const k of ["V", "FA", "P"] as const) if (task[k] && QTABLES[k]![task[k]!.unit].toSI !== 1) d++;
    if (ANSWER_UNITS[task.unknown][task.answerUnit].toSI !== 1) d++;
    return Math.min(3, 1 + Math.floor(d / 1.5));
  },
};
