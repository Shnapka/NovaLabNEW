-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonFeedback" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "liked" TEXT,
    "disliked" TEXT,
    "studentId" TEXT,
    "lessonId" TEXT,
    "classroomId" TEXT,
    "teacherId" TEXT,
    "lessonTitle" TEXT NOT NULL,
    "classroomName" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "comment" TEXT,
    "teacherId" TEXT,
    "lessonId" TEXT,
    "classroomId" TEXT,
    "lessonTitle" TEXT NOT NULL,
    "classroomName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "LessonFeedback_classroomId_idx" ON "LessonFeedback"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonFeedback_studentId_lessonId_key" ON "LessonFeedback"("studentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherReview_lessonId_classroomId_key" ON "TeacherReview"("lessonId", "classroomId");

-- AddForeignKey
ALTER TABLE "LessonFeedback" ADD CONSTRAINT "LessonFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonFeedback" ADD CONSTRAINT "LessonFeedback_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonFeedback" ADD CONSTRAINT "LessonFeedback_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

