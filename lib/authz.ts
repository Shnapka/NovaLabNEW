import { auth } from "@/auth";

/** Сессия учителя (или администратора); для учеников и гостей — null */
export async function teacherSession() {
  const session = await auth();
  return session?.user?.id && session.user.role !== "STUDENT" ? session : null;
}
