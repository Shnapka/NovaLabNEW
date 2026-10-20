// Сроки сдачи уроков: учитель задаёт дату и время, после них результаты по уроку не принимаются

/** Срок истёк? */
export const isOverdue = (dueAt: Date | string | null | undefined, now = new Date()) => !!dueAt && new Date(dueAt).getTime() < now.getTime();

/** «до 25 окт., 23:59» — время сдачи в часовом поясе Казахстана */
export const fmtDue = (dueAt: Date | string) =>
  new Date(dueAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });

/** Сколько осталось: «3 дня», «5 ч», «40 мин» — или null, если срок прошёл */
export function timeLeft(dueAt: Date | string, now = new Date()) {
  const ms = new Date(dueAt).getTime() - now.getTime();
  if (ms <= 0) return null;
  const h = ms / 3_600_000;
  if (h >= 48) return `${Math.floor(h / 24)} дн.`;
  if (h >= 1) return `${Math.floor(h)} ч`;
  return `${Math.max(1, Math.round(ms / 60_000))} мин`;
}

export const DEADLINE_MESSAGE = "Срок сдачи урока истёк — результат не сохранён";
