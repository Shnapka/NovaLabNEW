import "./globals.css";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata = { title: "NovaLab", description: "NovaLab — интерактивные уроки физики: симуляции, практика и статистика успеваемости" };

// Общая оболочка. Шапка сайта — в app/(site)/layout.tsx, у панели администратора своя — в app/admin.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
