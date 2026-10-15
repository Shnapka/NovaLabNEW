import "./globals.css";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { auth, signOut } from "@/auth";
import NavLinks from "@/components/NavLinks";
import { getStudent } from "@/lib/student";
import { Logo } from "@/components/Icon";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata = { title: "NovaLab", description: "NovaLab — интерактивные уроки физики: симуляции, практика и статистика успеваемости" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const student = session?.user ? null : await getStudent();
  const name = session?.user?.name ?? session?.user?.email ?? "";
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="min-h-screen font-sans">
        <header className="sticky top-0 z-30 bg-ocean-700 shadow-[0_2px_12px_rgba(1,62,86,0.25)]">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
              <Logo />
              <span className="hidden sm:inline">Nova<span className="text-sun-400">Lab</span></span>
            </Link>
            {session?.user && <NavLinks />}
            <div className="ml-auto flex shrink-0 items-center gap-3 text-sm">
              {session?.user ? (
                <>
                  <span className="hidden items-center gap-2 text-aqua-200 md:flex">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sun-400 text-xs font-bold text-ocean-950">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                    {name}
                  </span>
                  <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                    <button className="rounded-lg px-3 py-1.5 text-aqua-200 transition hover:bg-white/10 hover:text-white">Выйти</button>
                  </form>
                </>
              ) : student ? (
                <Link href="/student" className="flex items-center gap-2 rounded-lg px-2 py-1 text-aqua-200 hover:bg-white/10 hover:text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lagoon-500 text-xs font-bold text-white">
                    {student.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{student.name} · {student.classroom.name}</span>
                </Link>
              ) : (
                <>
                  <Link href="/student" className="rounded-lg px-3 py-1.5 font-semibold text-aqua-200 hover:bg-white/10 hover:text-white">Я ученик</Link>
                  <Link href="/login" className="btn-accent">Войти</Link>
                </>
              )}
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
