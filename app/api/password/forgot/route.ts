import { NextResponse } from "next/server";
import { z } from "zod";
import { mailConfigured } from "@/lib/mail";
import { requestReset } from "@/lib/passwordReset";
import { clientIp, hit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Шаг 1 восстановления пароля: отправить код на почту
export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().email() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Введите почту, на которую зарегистрирован аккаунт" }, { status: 400 });
  if (!mailConfigured()) return NextResponse.json({ error: "Отправка писем на сайте пока не настроена — обратитесь к администратору" }, { status: 503 });
  if (!hit(`forgot:${clientIp(req)}`, 10, 15 * 60_000)) return NextResponse.json({ error: "Слишком много запросов. Попробуйте через 15 минут." }, { status: 429 });
  try {
    await requestReset(parsed.data.email);
  } catch (e) {
    console.error("Не удалось отправить код восстановления:", e);
    return NextResponse.json({ error: "Не удалось отправить письмо. Попробуйте позже." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
