import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Сборка «standalone»: в образ попадает только нужное для запуска (server.js + трассированные зависимости),
  // без dev-зависимостей и исходников — меньше диска и памяти на VPS. Включается в Docker (NEXT_STANDALONE=1);
  // на Railway и локально сайт запускается обычным next start
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  // За Caddy сжатие делает он (zstd/gzip, готовые .br для симуляций) — Node не тратит на это процессор.
  // На Railway и локально (без прокси) Next сжимает сам.
  compress: process.env.NEXT_COMPRESS !== "0",
  // Библиотеки ZIP работают с файлами на сервере — не упаковываем их в бандл
  serverExternalPackages: ["yauzl", "yazl", "nodemailer"],
};

export default nextConfig;
