-- CreateTable
CREATE TABLE "LessonDeadline" (
    "classroomId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonDeadline_pkey" PRIMARY KEY ("classroomId","lessonId")
);

-- CreateTable
CREATE TABLE "LabNote" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabNote_owner_topicId_key" ON "LabNote"("owner", "topicId");

-- AddForeignKey
ALTER TABLE "LessonDeadline" ADD CONSTRAINT "LessonDeadline_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDeadline" ADD CONSTRAINT "LessonDeadline_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabNote" ADD CONSTRAINT "LabNote_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

