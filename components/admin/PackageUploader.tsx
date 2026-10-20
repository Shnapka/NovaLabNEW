"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result =
  | { ok: true; title: string; topicId: number; modules: { id: string; type: string; title: string; created: boolean }[] }
  | { ok: false; errors: string[] };

// Загрузка пакета темы (ZIP) с прогрессом; ответ — что создано и обновлено, или список ошибок
export default function PackageUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function upload() {
    if (!file) return;
    setResult(null);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/packages");
    xhr.setRequestHeader("Content-Type", "application/zip");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      try {
        const data = JSON.parse(xhr.responseText);
        setResult(data.ok ? data : { ok: false, errors: data.errors ?? [data.error ?? "Ошибка загрузки"] });
        if (data.ok) {
          setFile(null);
          if (input.current) input.current.value = "";
          router.refresh();
        }
      } catch {
        setResult({ ok: false, errors: [`Ошибка сервера (${xhr.status})`] });
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setResult({ ok: false, errors: ["Нет соединения с сервером"] });
    };
    xhr.send(file);
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-bold text-slate-900">Загрузить пакет темы</h2>
      <p className="mt-1 text-sm text-slate-500">
        ZIP с файлом <code className="rounded bg-slate-100 px-1">novalab-topic.json</code> и папками билдов. Тема и модули появятся у учителей и учеников сразу — перезапуск сайта не нужен.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700"
        />
        <button onClick={upload} disabled={!file || progress !== null} className="btn bg-slate-900 px-5 text-white hover:bg-slate-800 disabled:opacity-50">
          {progress === null ? "Загрузить" : progress < 100 ? `Загрузка ${progress}%` : "Распаковка…"}
        </button>
        {file && <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} МБ</span>}
      </div>
      {progress !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-ocean-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {result && !result.ok && (
        <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          <div className="font-bold">Пакет не загружен</div>
          <ul className="mt-1 list-disc pl-5">
            {result.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {result?.ok && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="font-bold">✓ Загружено: {result.title}</div>
          <ul className="mt-1 space-y-0.5">
            {result.modules.map((m) => (
              <li key={m.id}>
                {m.created ? "новый" : "обновлён"} · {m.type} · {m.title} <span className="text-emerald-700/60">({m.id})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
