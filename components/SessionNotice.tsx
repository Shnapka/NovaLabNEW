"use client";
import { useEffect, useState } from "react";

// Одноразовое сообщение после редиректа (например, предупреждение при регистрации)
export default function SessionNotice() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const t = sessionStorage.getItem("nl_notice");
    if (t) {
      setText(t);
      sessionStorage.removeItem("nl_notice");
    }
  }, []);
  if (!text) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-sun-100 bg-sun-50 px-5 py-4 text-sm text-sun-900">
      <span>{text}</span>
      <button onClick={() => setText(null)} className="text-sun-900/60 hover:text-sun-900">×</button>
    </div>
  );
}
