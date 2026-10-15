-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "textbook" TEXT;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "content" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "version" SET DEFAULT '1.0.0',
ALTER COLUMN "buildUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paragraph" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Section_gradeId_title_key" ON "Section"("gradeId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_sectionId_title_key" ON "Topic"("sectionId", "title");

