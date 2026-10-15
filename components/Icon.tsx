// Набор линейных иконок 24×24 (stroke = currentColor)
const PATHS: Record<string, string> = {
  simulation: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v20M3 7l9 5 9-5",
  summary: "M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h13M8 7h7M8 11h5",
  graph: "M3 3v18h18M7 15l4-5 3 3 5-7",
  quiz: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-2.5-13a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01",
  matching: "M3 5h7v6H3zM14 13h7v6h-7zM10 8h4a2 2 0 0 1 2 2v3M14 16h-4a2 2 0 0 1-2-2v-3",
  play: "M6 4l14 8-14 8V4Z",
  plus: "M12 5v14M5 12h14",
  search: "m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
  check: "M5 12.5 10 17 19 7",
  arrowLeft: "M19 12H5m6-6-6 6 6 6",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  book: "M2 5a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2V5Zm20 0a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2V5Z",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
};

export default function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name] ?? PATHS.layers} />
    </svg>
  );
}

// Логотип: орбиты атома с «солнечным» ядром
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#01597B" />
      <g fill="none" stroke="#99D8DE" strokeWidth="1.6">
        <ellipse cx="16" cy="16" rx="11" ry="4.5" />
        <ellipse cx="16" cy="16" rx="11" ry="4.5" transform="rotate(60 16 16)" />
        <ellipse cx="16" cy="16" rx="11" ry="4.5" transform="rotate(-60 16 16)" />
      </g>
      <circle cx="16" cy="16" r="3" fill="#F2BA00" />
    </svg>
  );
}
