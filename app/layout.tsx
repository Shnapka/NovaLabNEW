import "./globals.css";
import Link from "next/link";
import { auth, signOut } from "@/auth";

export const metadata = { title: "PhysLab", description: "Библиотека интерактивных уроков физики для учителей" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="flex items-center gap-5 border-b bg-white px-6 py-3">
          <Link href="/" className="text-lg font-bold">
            Phys<span className="text-indigo-600">Lab</span>
          </Link>
          {session?.user && (
            <>
              <Link href="/library" className="text-sm hover:underline">Библиотека</Link>
              <Link href="/dashboard" className="text-sm hover:underline">Мои уроки</Link>
            </>
          )}
          <div className="ml-auto flex items-center gap-4 text-sm">
            {session?.user ? (
              <>
                <span className="hidden text-gray-500 sm:inline">{session.user.name ?? session.user.email}</span>
                <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                  <button className="text-gray-500 hover:underline">Выйти</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded bg-indigo-600 px-3 py-1 text-white">Войти</Link>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
