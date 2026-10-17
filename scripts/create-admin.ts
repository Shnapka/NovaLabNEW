// Создать администратора панели NovaLab (или сменить ему пароль):
//   npm run admin:create -- admin@school.ru "Имя"
// Пароль берётся из ADMIN_PASSWORD, а если её нет — генерируется и печатается один раз.
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { ensureAdmin } from "./admin";

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email?.includes("@")) {
    console.error('Укажите почту: npm run admin:create -- admin@school.ru "Имя"');
    process.exit(1);
  }
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
  const prisma = new PrismaClient();
  try {
    const r = await ensureAdmin(prisma, email, password, name);
    console.log(`Администратор ${email}: ${r}. Вход: /admin/login`);
    if (generated) console.log(`Пароль (сохраните, больше не покажется): ${password}`);
  } finally {
    await prisma.$disconnect();
  }
}
main();
