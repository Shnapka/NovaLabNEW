/**
 * Простой ограничитель частоты в памяти процесса: на VPS сайт работает одним процессом, этого достаточно.
 * hit("forgot:1.2.3.4", 10, 15 * 60_000) → false, если за окно уже было 10 попыток.
 * peek — только проверить, не засчитывая попытку (например, считать лишь неудачные входы).
 */
const hits = new Map<string, number[]>();

export function hit(key: string, max: number, windowMs: number, peek = false) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  if (!peek) list.push(now);
  hits.set(key, list);
  // Не даём карте разрастаться: старые ключи выбрасываем при каждом тысячном ключе
  if (hits.size > 1000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return true;
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
