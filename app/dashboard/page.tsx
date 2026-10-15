import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import NewLessonButton from "@/components/NewLessonButton";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lessons = await prisma.lesson.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { blocks: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои уроки</h1>
        <NewLessonButton />
      </div>
      {lessons.length === 0 && <p className="text-gray-500">Пока нет уроков. Создайте первый.</p>}
      <ul className="space-y-2">
        {lessons.map((l) => (
          <li key={l.id} className="flex items-center justify-between rounded border bg-white p-4">
            <div>
              <div className="font-medium">{l.title}</div>
              <div className="text-sm text-gray-500">
                Модулей: {l._count.blocks} · {l.isPublished ? "опубликован" : "черновик"}
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={`/lessons/${l.id}/edit`} className="text-blue-600">Редактировать</Link>
              <Link href={`/lesson/${l.id}`} className="text-blue-600">Показать</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
