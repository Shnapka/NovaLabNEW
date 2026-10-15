import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { STUDENT_COOKIE, newPin, newStudentToken, normalizeName } from "@/lib/student";

const schema = z.object({
  code: z.string().min(4).max(12),
  name: z.string().min(2).max(60),
  pin: z.string().max(8).optional(),
});

const bad = (error: string, status: number, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });

// Вступление в класс по коду.
// • Ученик с аккаунтом: участие привязывается к аккаунту, классов может быть несколько.
// • Быстрый вход без аккаунта: код + имя, новичок получает PIN, вернувшийся вводит его.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Введите код класса и имя (минимум 2 буквы)", 400);

  const code = parsed.data.code.trim().toUpperCase();
  const name = normalizeName(parsed.data.name);
  const pin = parsed.data.pin?.trim();
  const classroom = await prisma.classroom.findUnique({ where: { code } });
  if (!classroom) return bad("Класс с таким кодом не найден. Проверьте код у учителя.", 404);

  const session = await auth();
  const byName = await prisma.student.findUnique({ where: { classroomId_name: { classroomId: classroom.id, name } } });

  if (session?.user?.role === "STUDENT") {
    const userId = session.user.id;
    const already = await prisma.student.findUnique({ where: { classroomId_userId: { classroomId: classroom.id, userId } } });
    if (already) return NextResponse.json({ ok: true, classroom: classroom.name, already: true });

    if (byName) {
      if (byName.userId) return bad(`В классе уже есть ученик «${name}». Укажи имя иначе, например с фамилией.`, 409);
      // Ученик раньше заходил без аккаунта — переносим его результаты в аккаунт по PIN
      if (!pin) {
        return bad(`В классе уже есть «${name}». Если это ты (входил без аккаунта), введи свой PIN — результаты перейдут в аккаунт. Иначе укажи другое имя.`, 409, { needPin: true });
      }
      if (pin !== byName.pin) return bad("Неверный PIN-код.", 403, { needPin: true });
      await prisma.student.update({ where: { id: byName.id }, data: { userId } });
      return NextResponse.json({ ok: true, classroom: classroom.name, linked: true });
    }

    await prisma.student.create({
      data: { name, classroomId: classroom.id, userId, pin: newPin(), token: newStudentToken() },
    });
    return NextResponse.json({ ok: true, classroom: classroom.name });
  }

  if (session?.user) return bad("Вы вошли как учитель. Чтобы зайти учеником, выйдите из аккаунта.", 403);

  // Быстрый вход без аккаунта
  let student = byName;
  let isNew = false;
  if (student) {
    if (student.userId) return bad("Этот ученик входит через свой аккаунт — нажми «Войти в аккаунт».", 409);
    if (!pin) {
      return bad("В классе уже есть ученик с таким именем. Введите свой PIN-код (его можно узнать у учителя).", 409, { needPin: true });
    }
    if (pin !== student.pin) return bad("Неверный PIN-код.", 403, { needPin: true });
  } else {
    student = await prisma.student.create({
      data: { name, classroomId: classroom.id, pin: newPin(), token: newStudentToken() },
    });
    isNew = true;
  }

  const res = NextResponse.json({ ok: true, name: student.name, classroom: classroom.name, pin: isNew ? student.pin : undefined });
  res.cookies.set(STUDENT_COOKIE, student.token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(STUDENT_COOKIE);
  return res;
}
