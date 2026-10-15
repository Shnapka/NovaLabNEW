import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { STUDENT_COOKIE, newPin, newStudentToken, normalizeName } from "@/lib/student";

const schema = z.object({
  code: z.string().min(4).max(12),
  name: z.string().min(2).max(60),
  pin: z.string().max(8).optional(),
});

// Вход ученика: код класса + имя. Новый ученик получает PIN, вернувшийся — вводит его.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Введите код класса и имя (минимум 2 буквы)" }, { status: 400 });

  const code = parsed.data.code.trim().toUpperCase();
  const name = normalizeName(parsed.data.name);
  const classroom = await prisma.classroom.findUnique({ where: { code } });
  if (!classroom) return NextResponse.json({ error: "Класс с таким кодом не найден. Проверьте код у учителя." }, { status: 404 });

  let student = await prisma.student.findUnique({ where: { classroomId_name: { classroomId: classroom.id, name } } });
  let isNew = false;
  if (student) {
    if (!parsed.data.pin) {
      return NextResponse.json(
        { error: "В классе уже есть ученик с таким именем. Введите свой PIN-код (его можно узнать у учителя).", needPin: true },
        { status: 409 }
      );
    }
    if (parsed.data.pin.trim() !== student.pin) {
      return NextResponse.json({ error: "Неверный PIN-код.", needPin: true }, { status: 403 });
    }
  } else {
    student = await prisma.student.create({
      data: { name, classroomId: classroom.id, pin: newPin(), token: newStudentToken() },
    });
    isNew = true;
  }

  const res = NextResponse.json({ ok: true, name: student.name, classroom: classroom.name, pin: isNew ? student.pin : undefined });
  res.cookies.set(STUDENT_COOKIE, student.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(STUDENT_COOKIE);
  return res;
}
