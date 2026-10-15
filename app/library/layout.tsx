import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Библиотека — инструмент учителя; ученик попадает в свой кабинет
export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/library");
  if (session.user.role === "STUDENT") redirect("/student");
  return <>{children}</>;
}
