import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { teacherSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { plural } from "@/lib/plural";
import Icon from "@/components/Icon";
import ClassTabs from "@/components/class/ClassTabs";
import DeleteClassButton from "@/components/class/DeleteClassButton";

// Общая шапка кабинета класса: название, код для учеников и вкладки
export default async function ClassLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await teacherSession();
  if (!session?.user?.id) redirect(`/login?next=/classes/${id}`);

  const classroom = await prisma.classroom.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      _count: { select: { students: true, lessons: true, feedback: true } },
      lessons: { select: { id: true } },
      reviews: { select: { lessonId: true } },
    },
  });
  if (!classroom) notFound();
  // Напоминалка: уроки класса, которые учитель ещё не оценил
  const reviewed = new Set(classroom.reviews.map((r) => r.lessonId));
  const toReview = classroom.lessons.filter((l) => !reviewed.has(l.id)).length;

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/classes" className="hover:text-ocean-700">Мои классы</Link>
        <span className="mx-2 text-mist-300">/</span>
        <span className="text-ocean-800">{classroom.name}</span>
      </nav>

      <header className="flex flex-wrap items-stretch justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold text-ocean-900">{classroom.name}</h1>
            <DeleteClassButton classId={classroom.id} name={classroom.name} students={classroom._count.students} />
          </div>
          <p className="mt-1 text-slate-500">
            {plural(classroom._count.students, ["ученик", "ученика", "учеников"])} ·{" "}
            {plural(classroom._count.lessons, ["урок", "урока", "уроков"])}
          </p>
        </div>
        <div className="card flex items-center gap-4 px-5 py-3">
          <Icon name="key" className="h-6 w-6 text-sun-500" />
          <div>
            <div className="text-xs font-semibold text-slate-500">Код класса для учеников</div>
            <div className="font-mono text-3xl font-extrabold tracking-[0.2em] text-ocean-800">{classroom.code}</div>
          </div>
          <div className="max-w-52 border-l border-mist-100 pl-4 text-xs text-slate-500">
            Ученик регистрируется по почте на странице <b className="text-ocean-800">«Я ученик»</b> и вводит этот код
          </div>
        </div>
      </header>

      <ClassTabs
        classId={classroom.id}
        counts={{ students: classroom._count.students, lessons: classroom._count.lessons, feedback: classroom._count.feedback, toReview }}
      />
      {children}
    </main>
  );
}
