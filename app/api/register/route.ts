import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { STUDENT_COOKIE, classPin, getStudent, newStudentToken, normalizeName } from "@/lib/student";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["TEACHER", "STUDENT"]).default("TEACHER"),
  classCode: z.string().trim().max(12).optional(), // ученик может сразу вступить в класс
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте поля: имя минимум 2 буквы, корректная почта, пароль минимум 8 символов" }, { status: 400 });
  }
  const { password, role } = parsed.data;
  const name = normalizeName(parsed.data.name);
  const email = parsed.data.email.toLowerCase();
  const code = parsed.data.classCode?.toUpperCase() || null;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Такая почта уже зарегистрирована — войдите" }, { status: 409 });

  // Код класса проверяем до создания аккаунта, чтобы не остался «полузарегистрированный» ученик
  const classroom = role === "STUDENT" && code ? await prisma.classroom.findUnique({ where: { code } }) : null;
  if (role === "STUDENT" && code && !classroom) {
    return NextResponse.json({ error: "Класс с таким кодом не найден. Проверьте код у учителя или оставьте поле пустым." }, { status: 404 });
  }

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });

  const res = NextResponse.json({ ok: true } as Record<string, unknown>);
  if (role !== "STUDENT") return res;

  // Ученик уже заходил по коду без аккаунта — переносим его класс и результаты в аккаунт
  const guest = await getStudent();
  if (guest && !guest.userId) {
    await prisma.student.update({ where: { id: guest.id }, data: { userId: user.id } });
    res.cookies.delete(STUDENT_COOKIE);
  }

  if (classroom && !(guest && guest.classroomId === classroom.id)) {
    const taken = await prisma.student.findUnique({ where: { classroomId_name: { classroomId: classroom.id, name } } });
    if (taken) {
      return NextResponse.json({
        ok: true,
        warning: `Аккаунт создан, но в классе ${classroom.name} уже есть ученик «${name}». Вступи в класс на своей странице и укажи имя иначе (например, с фамилией) или свой PIN.`,
      });
    }
    await prisma.student.create({
      data: { name, classroomId: classroom.id, userId: user.id, pin: await classPin(classroom.id), token: newStudentToken() },
    });
    return NextResponse.json({ ok: true, classroom: classroom.name });
  }
  return res;
}
