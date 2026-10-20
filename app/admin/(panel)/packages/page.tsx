import { redirect } from "next/navigation";
import { adminSession } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { metaOf } from "@/lib/modules/meta";
import PackageUploader from "@/components/admin/PackageUploader";

const time = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} МБ`;

// Пакеты тем: новая тема учебника со всеми модулями добавляется загрузкой одного ZIP — без обновления сайта
export default async function AdminPackages() {
  if (!(await adminSession())) redirect("/admin/login");

  const [packages, topics] = await Promise.all([
    prisma.topicPackage.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.topic.findMany({
      where: { modules: { some: {} } },
      orderBy: [{ section: { grade: { number: "asc" } } }, { section: { order: "asc" } }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        paragraph: true,
        section: { select: { title: true, grade: { select: { number: true } } } },
        modules: { orderBy: { order: "asc" }, select: { type: true, source: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Пакеты тем</h1>
        <p className="text-slate-500">
          Тема = пакет модулей: конспект, графики, симуляция, практика, квиз, карточки. Формат — в docs/TOPIC-PACKAGES.md; образец — «Скачать пакет» у любой темы ниже.
        </p>
      </div>

      <PackageUploader />

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <h2 className="border-b border-slate-100 px-5 py-4 font-bold text-slate-900">Темы с модулями · {topics.length}</h2>
        <ul className="divide-y divide-slate-100">
          {topics.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <span className="w-20 shrink-0 text-xs text-slate-400">{t.section.grade.number} кл. {t.paragraph}</span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-slate-800">{t.title}</span>
                <span className="block text-xs text-slate-400">{t.section.title}</span>
              </span>
              <span className="flex gap-1">
                {t.modules.map((m, i) => (
                  <span key={i} title={metaOf(m.type).label} className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${metaOf(m.type).tile}`}>
                    {metaOf(m.type).label}
                  </span>
                ))}
              </span>
              <span className={`pill ${t.modules.some((m) => m.source === "package") ? "bg-sun-100 text-sun-900" : "bg-slate-100 text-slate-500"}`}>
                {t.modules.some((m) => m.source === "package") ? "из пакета" : "встроенная"}
              </span>
              <a href={`/api/admin/packages/export?topicId=${t.id}`} className="font-semibold text-ocean-700 hover:underline">Скачать пакет</a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <h2 className="border-b border-slate-100 px-5 py-4 font-bold text-slate-900">История загрузок</h2>
        {packages.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Пакеты ещё не загружались</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {packages.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-800">{p.title}</span>
                  <span className="block text-xs text-slate-400">
                    {p.fileName} · {mb(p.size)} · версия {p.version} · {(p.modules as unknown[]).length} модулей
                  </span>
                </span>
                <span className="text-xs text-slate-500">{p.uploadedBy} · {time(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
