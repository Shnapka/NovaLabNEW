// Компиляция формул графиков вида "m*v^2/2". Разрешены только числа, операторы,
// имена переменных графика и небольшой набор математических функций.
const MATH = {
  sqrt: Math.sqrt,
  min: Math.min,
  max: Math.max,
  abs: Math.abs,
  pow: Math.pow,
  sin: Math.sin,
  cos: Math.cos,
  PI: Math.PI,
  NaN: NaN,
};

export function compile(expr: string, vars: string[]): (...args: number[]) => number {
  if (!/^[\w\s.+\-*/()^,?:<>=]*$/.test(expr)) throw new Error(`Недопустимые символы в формуле: ${expr}`);
  for (const id of expr.match(/(?<![\w.])[A-Za-z_]\w*/g) ?? []) {
    if (!vars.includes(id) && !(id in MATH)) throw new Error(`Неизвестное имя «${id}» в формуле: ${expr}`);
  }
  const fn = new Function(...Object.keys(MATH), ...vars, `return (${expr.replace(/\^/g, "**")});`);
  const mathValues = Object.values(MATH);
  return (...args) => Number(fn(...mathValues, ...args));
}

export const fmt = (n: number, digits = 2) =>
  Number.isFinite(n) ? n.toLocaleString("ru-RU", { maximumFractionDigits: digits }) : "—";
