-- Отзывы учеников становятся анонимными: убираем ученика, имя и точное время.
-- Старые отзывы сохраняются; связь с учеником у них теряется (voterKey = legacy-<id>).

ALTER TABLE "LessonFeedback" DROP CONSTRAINT "LessonFeedback_studentId_fkey";
DROP INDEX "LessonFeedback_studentId_lessonId_key";

ALTER TABLE "LessonFeedback"
ADD COLUMN "voterKey" TEXT,
ADD COLUMN "day" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "likedTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "dislikedTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "wish" TEXT;

UPDATE "LessonFeedback" SET "voterKey" = 'legacy-' || "id", "day" = "updatedAt"::date;

ALTER TABLE "LessonFeedback" ALTER COLUMN "voterKey" SET NOT NULL;

ALTER TABLE "LessonFeedback"
DROP COLUMN "studentId",
DROP COLUMN "studentName",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

CREATE UNIQUE INDEX "LessonFeedback_voterKey_key" ON "LessonFeedback"("voterKey");
