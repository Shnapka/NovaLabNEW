"use client";
import { useEffect, useRef, useState } from "react";

export type ModuleEvent = { type: string; data?: unknown };

export default function ModuleFrame({
  src,
  config,
  onEvent,
  label,
}: {
  src: string;
  config: unknown;
  onEvent?: (e: ModuleEvent) => void;
  label?: string; // подпись над симуляцией
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // храним последние значения в ref, чтобы не переподписываться на каждый рендер
  const configRef = useRef(config);
  const onEventRef = useRef(onEvent);
  configRef.current = config;
  onEventRef.current = onEvent;
  // Модуль уже ответил на init (например, событием started) — повторный init по ready не нужен
  const spokeRef = useRef(false);
  const [native, setNative] = useState(false); // настоящий полноэкранный режим браузера
  const [overlay, setOverlay] = useState(false); // запасной: на всё окно, если браузер запретил (iOS, встроенные окна)
  const fullscreen = native || overlay;

  const sendInit = () =>
    ref.current?.contentWindow?.postMessage({ source: "physlab-host", type: "init", config: configRef.current }, "*");

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== ref.current?.contentWindow) return;
      const d = e.data;
      if (!d || d.source !== "physlab-module") return;

      if (d.type === "ready") {
        // Модуль загрузился. Шаблон Unity копит ранние сообщения и уже мог получить init — тогда не дублируем
        if (!spokeRef.current) sendInit();
      } else {
        spokeRef.current = true;
        onEventRef.current?.({ type: d.type, data: d.data });
      }
    }
    window.addEventListener("message", onMessage);
    // Лёгкий модуль может прислать "ready" ещё до гидрации React, и мы его пропустим.
    // Поэтому шлём init сразу. Если модуль ещё не готов, он это сообщение не услышит
    // и позже пришлёт "ready" сам.
    sendInit();

    const onFs = () => setNative(document.fullscreenElement === boxRef.current);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOverlay(false);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // В режиме «на всё окно» страница под симуляцией не прокручивается
  useEffect(() => {
    if (!overlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlay]);

  function toggleFullscreen() {
    if (overlay) return setOverlay(false);
    if (document.fullscreenElement) return void document.exitFullscreen();
    const box = boxRef.current;
    if (box?.requestFullscreen && document.fullscreenEnabled) {
      box.requestFullscreen().then(() => ref.current?.focus()).catch(() => setOverlay(true));
    } else setOverlay(true);
  }

  return (
    <div
      ref={boxRef}
      className={
        native ? "flex h-full w-full flex-col bg-ocean-950" : overlay ? "fixed inset-0 z-[60] flex flex-col bg-ocean-950" : "space-y-2"
      }
    >
      <div className={`flex items-center gap-3 ${fullscreen ? "px-4 py-2 text-white" : ""}`}>
        {label && <span className={`text-sm font-semibold ${fullscreen ? "text-aqua-200" : "text-slate-500"}`}>{label}</span>}
        <button
          onClick={toggleFullscreen}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            fullscreen ? "bg-white/10 text-white hover:bg-white/20" : "bg-ocean-700 text-white hover:bg-ocean-800"
          }`}
          title={fullscreen ? "Выйти из полноэкранного режима (Esc)" : "Открыть симуляцию на весь экран"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d={fullscreen ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} />
          </svg>
          {fullscreen ? "Свернуть" : "На весь экран"}
        </button>
      </div>
      <iframe
        ref={ref}
        src={src}
        // Документ модуля (пере)загрузился: сбрасываем признак и отдаём настройки — шаблон Unity поставит их в очередь
        onLoad={() => {
          spokeRef.current = false;
          sendInit();
        }}
        className={fullscreen ? "w-full flex-1 bg-black" : "aspect-video w-full rounded-lg border bg-black"}
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}
