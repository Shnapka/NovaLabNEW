// Проверка присланных отзывов — только на сервере (zod не попадает в код браузера)
import { z } from "zod";

// Отзыв ученика в конце урока: оценка 1–10 и два необязательных комментария
export const studentFeedbackSchema = z.object({
  lessonId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  liked: z.string().trim().max(1000).optional().default(""),
  disliked: z.string().trim().max(1000).optional().default(""),
});

export const teacherReviewSchema = z.object({
  lessonId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
  comment: z.string().trim().max(2000).optional().default(""),
});
