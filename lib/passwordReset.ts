import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";

/** Восстановление пароля учителя и ученика по коду из письма */

const TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_MS = 60 * 1000;
const PER_HOUR = 5;

const hashCode = (id: string, code: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "novalab").update(`${id}:${code}`).digest("hex");

/** Отправляет код, если почта зарегистрирована. Ответ сайта одинаковый в любом случае — так нельзя узнать, чья почта есть в системе */
export async function requestReset(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, role: true } });
  if (!user) return;

  const recent = await prisma.passwordReset.findMany({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent.length >= PER_HOUR || (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_MS)) return;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  // Записи старше часа для лимита уже не нужны; проверяется всегда только последний код
  await prisma.passwordReset.deleteMany({ where: { userId: user.id, createdAt: { lte: new Date(Date.now() - 60 * 60 * 1000) } } });
  await prisma.passwordReset.create({ data: { userId: user.id, codeHash: hashCode(user.id, code), expiresAt: new Date(Date.now() + TTL_MS) } });

  const hello = user.name ? `Здравствуйте, ${user.name}!` : "Здравствуйте!";
  const text = `${hello}\n\nКод для восстановления пароля NovaLab: ${code}\n\nКод действует 15 минут. Если вы не запрашивали восстановление, просто проигнорируйте это письмо — пароль останется прежним.`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f2a43;max-width:480px">
<p>${hello.replace(/[<>&]/g, "")}</p>
<p>Код для восстановления пароля <b>NovaLab</b>:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:16px 0">${code}</p>
<p>Код действует 15 минут.</p>
<p style="color:#64748b;font-size:13px">Если вы не запрашивали восстановление, просто проигнорируйте это письмо — пароль останется прежним.</p>
</div>`;
  await sendMail(user.email, `Код восстановления пароля: ${code}`, text, html);
}

export type ResetResult = { ok: true; email: string } | { ok: false; error: string };

/** Проверяет код и ставит новый пароль. После успеха все коды пользователя удаляются */
export async function resetPassword(emailRaw: string, codeRaw: string, password: string): Promise<ResetResult> {
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.replace(/\s/g, "");
  const fail = { ok: false as const, error: "Неверный или устаревший код. Запросите новый." };
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user || !/^\d{6}$/.test(code)) return fail;

  const reset = await prisma.passwordReset.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  if (!reset || reset.expiresAt < new Date() || reset.attempts >= MAX_ATTEMPTS) return fail;

  const ok = timingSafeEqual(Buffer.from(hashCode(user.id, code)), Buffer.from(reset.codeHash));
  if (!ok) {
    const attempts = reset.attempts + 1;
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts } });
    const left = MAX_ATTEMPTS - attempts;
    return { ok: false, error: left > 0 ? `Код не подходит. Осталось попыток: ${left}.` : "Попытки закончились. Запросите новый код." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
    prisma.passwordReset.deleteMany({ where: { userId: user.id } }),
  ]);
  return { ok: true, email };
}
