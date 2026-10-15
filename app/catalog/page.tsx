import { redirect } from "next/navigation";

// Старый адрес каталога ведёт в библиотеку
export default function CatalogPage() {
  redirect("/library");
}
