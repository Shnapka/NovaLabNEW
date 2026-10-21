// Проверка присланных отзывов — только на сервере (zod не попадает в код браузера)
import { createHmac } from "node:crypto";
import { z } from "zod";

// Анонимный отзыв ученика в конце урока: оценка 1–10, отмеченные варианты и пожелание
export const studentFeedbackSchema = z.object({
  lessonId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  likedTags: z.array(z.string().max(40)).max(20).optional().default([]),
  dislikedTags: z.array(z.string().max(40)).max(20).optional().default([]),
  wish: z.string().trim().max(1000).optional().default(""),
});

export const teacherReviewSchema = z.object({
  lessonId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
  comment: z.string().trim().max(2000).optional().default(""),
});

/** Ключ анонимного отзыва: один отзыв ученика на урок, но по ключу не узнать, чей он */
export const voterKey = (studentId: string, lessonId: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "novalab").update(`feedback:${studentId}:${lessonId}`).digest("hex");
