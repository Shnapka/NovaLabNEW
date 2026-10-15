import "./globals.css";
import Link from "next/link";
import { auth, signOut } from "@/auth";

export const metadata = { title: "PhysLab", description: "Уроки физики с интерактивными модулями" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="flex items-center gap-4 border-b bg-white px-6 py-3">
          <Link href="/" className="text-lg font-bold">PhysLab</Link>
          <Link href="/catalog" className="text-sm hover:underline">Каталог</Link>
          <div className="ml-auto flex items-center gap-4 text-sm">
            {session?.user ? (
              <>
                <Link href="/dashboard" className="hover:underline">Мои уроки</Link>
                <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                  <button className="text-gray-500 hover:underline">Выйти</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded bg-blue-600 px-3 py-1 text-white">Войти</Link>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
