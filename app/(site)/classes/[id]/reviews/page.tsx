import { notFound } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { avg, type ReviewAnswers } from "@/lib/feedback";
import { lessonGroup } from "@/lib/classData";
import TeacherReviews from "@/components/feedback/TeacherReviews";

// Вкладка «Оценить уроки»: напоминалка по каждому уроку класса и мини-анкета учителя
export default async function ClassReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) notFound();

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      lessons: {
        orderBy: { createdAt: "asc" },
        include: {
          blocks: { include: { module: { include: { topic: { include: { section: { include: { grade: true } } } } } } } },
          results: { where: { student: { classroomId: id } }, select: { studentId: true } },
        },
      },
      reviews: true,
      feedback: { select: { lessonId: true, rating: true } },
    },
  });
  if (!classroom) notFound();

  const lessons = classroom.lessons
    .map((l, i) => ({ l, g: lessonGroup(l.blocks), i }))
    .sort((a, b) => a.g.order - b.g.order || a.i - b.i)
    .map(({ l, g }) => {
      const review = classroom.reviews.find((r) => r.lessonId === l.id);
      const fs = classroom.feedback.filter((f) => f.lessonId === l.id);
      return {
        id: l.id,
        title: l.title,
        group: g.label,
        // Урок «прошёл», если в нём уже есть результаты учеников — такие напоминаем оценить в первую очередь
        studentsActive: new Set(l.results.map((r) => r.studentId)).size,
        studentAvg: avg(fs.map((f) => f.rating)),
        studentCount: fs.length,
        review: review
          ? { rating: review.rating, answers: review.answers as ReviewAnswers, comment: review.comment ?? "", updatedAt: review.updatedAt.toISOString() }
          : null,
      };
    });

  return <TeacherReviews classId={classroom.id} lessons={lessons} />;
}
