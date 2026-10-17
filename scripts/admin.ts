import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

/** Создать администратора или обновить его пароль. Возвращает, что произошло. */
export async function ensureAdmin(prisma: PrismaClient, email: string, password: string, name?: string) {
  email = email.toLowerCase();
  if (password.length < 10) throw new Error("Пароль администратора — не короче 10 символов");
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing && (await bcrypt.compare(password, existing.passwordHash))) return "без изменений";
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    await prisma.admin.update({ where: { email }, data: { passwordHash, ...(name ? { name } : {}) } });
    return "пароль обновлён";
  }
  await prisma.admin.create({ data: { email, passwordHash, name: name || null } });
  return "создан";
}
