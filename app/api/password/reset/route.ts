import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/lib/passwordReset";
import { clientIp, hit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), code: z.string().max(12), password: z.string().min(8).max(200) });

// Шаг 2: код из письма + новый пароль
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Введите код из письма и новый пароль (минимум 8 символов)" }, { status: 400 });
  if (!hit(`reset:${clientIp(req)}`, 20, 15 * 60_000)) return NextResponse.json({ error: "Слишком много попыток. Попробуйте через 15 минут." }, { status: 429 });
  const r = await resetPassword(parsed.data.email, parsed.data.code, parsed.data.password);
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 });
}
