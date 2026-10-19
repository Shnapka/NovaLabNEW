// Набор линейных иконок 24×24 (stroke = currentColor)
const PATHS: Record<string, string> = {
  simulation: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v20M3 7l9 5 9-5",
  summary: "M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h13M8 7h7M8 11h5",
  graph: "M3 3v18h18M7 15l4-5 3 3 5-7",
  quiz: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-2.5-13a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01",
  matching: "M3 5h7v6H3zM14 13h7v6h-7zM10 8h4a2 2 0 0 1 2 2v3M14 16h-4a2 2 0 0 1-2-2v-3",
  practice: "M4 20h4L18.5 9.5l-4-4L4 16v4ZM13 7l4 4M14 20h7",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  chart: "M3 3v18h18M8 17V11M13 17V7M18 17v-4",
  key: "M15 7a4 4 0 1 1-3.9 4.9L3 20v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7Zm1 1h.01",
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
  message: "M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12ZM8 10h8M8 14h5",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4a2 2 0 0 0 4 0",
  trash: "M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3",
  shield: "M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Zm-3 9 2 2 4-4",
  download: "M12 4v11m-5-5 5 5 5-5M4 20h16",
};

export default function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name] ?? PATHS.layers} />
    </svg>
  );
}

// Логотип NovaLab: вспыхивающая звезда («нова») на орбите
// Знак NovaLab «Нова-монограмма»: звезда-вспышка с гранью, N в негативе и белая L (исходник — NovaLab.svg, страница 1)
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="112" fill="#01597B" />
      <path d="M256 40Q286.24 225.76 472 256Q286.24 286.24 256 472Q225.76 286.24 40 256Q225.76 225.76 256 40Z" fill="#F2BA00" />
      <path d="M256 40Q286.24 225.76 472 256Q286.24 286.24 256 472Z" fill="#DBA800" />
      <path d="M168 322 196 190 252 322 280 190" fill="none" stroke="#01597B" strokeWidth="26" strokeMiterlimit="10" />
      <path d="M308 190 284 322H346" fill="none" stroke="#FFFFFF" strokeWidth="26" strokeMiterlimit="10" />
    </svg>
  );
}
