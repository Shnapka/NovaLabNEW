import { randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const STUDENT_COOKIE = "nl_student";

/** Ученик текущего браузера (по секретному токену в cookie) или null */
export async function getStudent() {
  const token = (await cookies()).get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  return prisma.student.findUnique({ where: { token }, include: { classroom: true } });
}

export const newStudentToken = () => randomBytes(24).toString("base64url");
export const newPin = () => String(randomInt(0, 10000)).padStart(4, "0");

// Код класса без похожих символов (0/O, 1/I/L)
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const newClassCode = () => Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join("");

/** Нормализация имени: обрезать пробелы, схлопнуть повторы — «Иванов  Пётр» = «Иванов Пётр» */
export const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ");
