import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { adminSession } from "@/lib/authz";
import { Logo } from "@/components/Icon";
import AdminNav from "@/components/admin/AdminNav";

// Всё внутри (panel) — только для администратора. Каждая страница и API дополнительно проверяют adminSession().
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await adminSession();
  if (!session) redirect("/admin/login");

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-extrabold">
            <Logo className="h-10 w-10" />
            <span className="hidden sm:inline">NovaLab</span>
            <span className="rounded bg-sun-400 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-900">admin</span>
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-400 md:inline">{session.user.email}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}>
              <button className="rounded-lg px-3 py-1.5 text-slate-300 hover:bg-white/10 hover:text-white">Выйти</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
