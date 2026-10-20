-- CreateTable
CREATE TABLE "ClassTerm" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassTerm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassTerm_classroomId_idx" ON "ClassTerm"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTerm_classroomId_quarter_sectionId_key" ON "ClassTerm"("classroomId", "quarter", "sectionId");

-- AddForeignKey
ALTER TABLE "ClassTerm" ADD CONSTRAINT "ClassTerm_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTerm" ADD CONSTRAINT "ClassTerm_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

