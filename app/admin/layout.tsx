// Панель администратора — отдельная часть сайта со своим каркасом.
// Не показывается в поиске, ссылок на неё с сайта нет (кроме кнопки у вошедшего администратора).
export const metadata = { title: "NovaLab · Администратор", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-100">{children}</div>;
}
