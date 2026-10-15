"use client";
import { useEffect, useRef } from "react";

export type ModuleEvent = { type: string; data?: unknown };

export default function ModuleFrame({
  src,
  config,
  onEvent,
}: {
  src: string;
  config: unknown;
  onEvent?: (e: ModuleEvent) => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  // храним последние значения в ref, чтобы не переподписываться на каждый рендер
  const configRef = useRef(config);
  const onEventRef = useRef(onEvent);
  configRef.current = config;
  onEventRef.current = onEvent;
  // Модуль уже ответил на init (например, событием started) — повторный init по ready не нужен
  const spokeRef = useRef(false);

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
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      src={src}
      // Документ модуля (пере)загрузился: сбрасываем признак и отдаём настройки — шаблон Unity поставит их в очередь
      onLoad={() => {
        spokeRef.current = false;
        sendInit();
      }}
      className="aspect-video w-full rounded-lg border bg-black"
      allow="fullscreen"
      allowFullScreen
    />
  );
}
