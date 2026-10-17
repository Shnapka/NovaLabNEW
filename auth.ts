import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    // Учителя и ученики (таблица User)
    Credentials({
      id: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(c) {
        const email = String(c?.email ?? "").toLowerCase();
        const password = String(c?.password ?? "");
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        // Роль ADMIN у пользователя сайта не даёт входа в панель: администраторы живут в таблице Admin
        return ok ? { id: user.id, email: user.email, name: user.name, role: user.role === "STUDENT" ? "STUDENT" : "TEACHER" } : null;
      },
    }),
    // Администраторы платформы (таблица Admin) — вход только на /admin/login
    Credentials({
      id: "admin",
      credentials: { email: {}, password: {} },
      async authorize(c) {
        const email = String(c?.email ?? "").toLowerCase();
        const password = String(c?.password ?? "");
        const admin = await prisma.admin.findUnique({ where: { email } });
        // Хэш-пустышка: время ответа одинаковое, есть такой администратор или нет
        const ok = await bcrypt.compare(password, admin?.passwordHash ?? "$2b$10$031QLvTnou/DWJCukLUAWOla4PXqXPZLneyjNHqJtGxI8ZnV754qS");
        if (!admin || !ok) return null;
        await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
        return { id: admin.id, email: admin.email, name: admin.name ?? "Администратор", role: "ADMIN" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      // Сессии, выданные до появления ролей, принадлежат учителям
      session.user.role = (token.role as typeof session.user.role) ?? "TEACHER";
      return session;
    },
  },
});
