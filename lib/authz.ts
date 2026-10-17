import { auth } from "@/auth";

/** Сессия учителя; для учеников, гостей и администраторов — null */
export async function teacherSession() {
  const session = await auth();
  return session?.user?.id && session.user.role === "TEACHER" ? session : null;
}

/**
 * Сессия администратора платформы. Администраторы — отдельная таблица Admin, не пользователи сайта:
 * их нельзя зарегистрировать через сайт, и у них нет доступа к кабинетам учителей и учеников.
 */
export async function adminSession() {
  const session = await auth();
  return session?.user?.id && session.user.role === "ADMIN" ? session : null;
}
