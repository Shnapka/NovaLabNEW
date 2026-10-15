"use client";
import { useRouter } from "next/navigation";

export default function StudentLogout({ className = "" }: { className?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/student/join", { method: "DELETE" });
    router.push("/student");
    router.refresh();
  }
  return (
    <button onClick={logout} className={className}>
      Выйти
    </button>
  );
}
