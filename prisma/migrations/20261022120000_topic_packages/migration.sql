-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'seed';

-- CreateTable
CREATE TABLE "TopicPackage" (
    "id" TEXT NOT NULL,
    "topicId" INTEGER,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicPackage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TopicPackage" ADD CONSTRAINT "TopicPackage_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

