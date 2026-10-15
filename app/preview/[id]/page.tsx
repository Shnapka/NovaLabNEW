import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ModuleFrame from "@/components/ModuleFrame";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await prisma.module.findUnique({ where: { id } });
  if (!mod) notFound();
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">{mod.title}</h1>
      <ModuleFrame src={mod.buildUrl} config={{}} />
    </main>
  );
}
