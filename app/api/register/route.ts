import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { STUDENT_COOKIE, getStudent } from "@/lib/student";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TEACHER", "STUDENT"]).default("TEACHER"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте поля: пароль минимум 8 символов" }, { status: 400 });
  }
  const { name, password, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Такой email уже зарегистрирован" }, { status: 409 });

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });

  const res = NextResponse.json({ ok: true });
  // Ученик уже заходил по коду без аккаунта — привязываем его класс и результаты к новому аккаунту
  if (role === "STUDENT") {
    const guest = await getStudent();
    if (guest && !guest.userId) {
      await prisma.student.update({ where: { id: guest.id }, data: { userId: user.id } });
      res.cookies.delete(STUDENT_COOKIE);
    }
  }
  return res;
}
