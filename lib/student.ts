import { randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const STUDENT_COOKIE = "nl_student";

/** Ученик быстрого входа (без аккаунта) — по секретному токену в cookie */
export async function getStudent() {
  const token = (await cookies()).get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  return prisma.student.findUnique({ where: { token }, include: { classroom: true } });
}

/**
 * Кто сейчас ученик и в каких классах он состоит:
 * - account — вошёл в аккаунт ученика, может состоять в нескольких классах;
 * - guest — быстрый вход по коду, имени и PIN (один класс);
 * - null — не ученик.
 */
export async function getStudentContext() {
  const session = await auth();
  if (session?.user?.role === "STUDENT") {
    const students = await prisma.student.findMany({
      where: { userId: session.user.id },
      include: { classroom: true },
      orderBy: { createdAt: "asc" },
    });
    return { mode: "account" as const, userId: session.user.id, name: session.user.name ?? "", students };
  }
  const guest = await getStudent();
  if (guest) return { mode: "guest" as const, userId: null, name: guest.name, students: [guest] };
  return { mode: null, userId: null, name: "", students: [] };
}

/** Участие ученика в классе, которому назначен урок (через него пишутся результаты) */
export async function resolveStudentForLesson(lessonId: string) {
  const ctx = await getStudentContext();
  if (!ctx.students.length) return null;
  return prisma.student.findFirst({
    where: { id: { in: ctx.students.map((s) => s.id) }, classroom: { lessons: { some: { id: lessonId } } } },
    include: { classroom: true },
  });
}

export const newStudentToken = () => randomBytes(24).toString("base64url");
export const newPin = () => String(randomInt(0, 10000)).padStart(4, "0");

// Код класса без похожих символов (0/O, 1/I/L)
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const newClassCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join("");

/** Нормализация имени: обрезать пробелы, схлопнуть повторы — «Иванов  Пётр» = «Иванов Пётр» */
export const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ");
