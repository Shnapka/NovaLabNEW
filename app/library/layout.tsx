import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Библиотека доступна только учителям, вошедшим в аккаунт
export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/library");
  return <>{children}</>;
}
