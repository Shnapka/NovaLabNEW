"use client";
import { fmt } from "@/lib/modules/expr";

// Сцены над графиком: рисуются в SVG 640×190 по значениям, посчитанным для текущего x бегунка
const W = 640;
const H = 190;
const C = { ocean: "#01597B", sun: "#DBA800", lagoon: "#3F9AA8", coral: "#E0525B", mist: "#E2E8ED", water: "#99D8DE", ink: "#013E56" };
// Те же цвета, что у линий на графике
const BODY_COLORS = [C.ocean, C.sun, C.lagoon];

export function RaceScene({
  length,
  bodies,
  marks,
}: {
  length: number;
  bodies: { label: string; pos: number }[];
  marks: number[][]; // по каждому участнику — позиции меток-«следов»
}) {
  const x0 = 40;
  const x1 = W - 30;
  const sx = (s: number) => x0 + (Math.max(0, Math.min(s, length)) / length) * (x1 - x0);
  const lane = (i: number) => 52 + i * 42;
  const step = length / 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <rect x="0" y="0" width={W} height={H} rx="14" fill="#EEF8FA" />
      {/* дорожки */}
      {bodies.map((_, i) => (
        <rect key={i} x={x0} y={lane(i) - 14} width={x1 - x0} height="28" rx="6" fill={i % 2 ? "#E2E8ED" : "#D8EFF3"} />
      ))}
      {/* разметка */}
      {Array.from({ length: 11 }, (_, k) => (
        <g key={k}>
          <line x1={sx(k * step)} x2={sx(k * step)} y1="32" y2={lane(bodies.length - 1) + 16} stroke="#A9B7C2" strokeDasharray="2 4" />
          <text x={sx(k * step)} y="24" fontSize="10" textAnchor="middle" fill="#64748b">{fmt(k * step, 0)}</text>
        </g>
      ))}
      <text x={x1 + 6} y="24" fontSize="10" fill="#64748b">м</text>
      {/* финиш */}
      <rect x={x1 - 2} y="34" width="4" height={lane(bodies.length - 1) - 18} fill={C.ink} />
      {/* метки-«следы» */}
      {marks.map((ms, i) =>
        ms.map((m, k) => <rect key={`${i}-${k}`} x={sx(m) - 1.5} y={lane(i) - 9} width="3" height="18" rx="1.5" fill={BODY_COLORS[i]} opacity="0.35" />)
      )}
      {/* участники */}
      {bodies.map((b, i) => (
        <g key={i} transform={`translate(${sx(b.pos)} ${lane(i)})`}>
          <circle r="12" fill={BODY_COLORS[i]} />
          <text y="4" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">{i + 1}</text>
          <text y="-17" fontSize="10" fontWeight="600" textAnchor="middle" fill={C.ink}>{fmt(b.pos, 1)} м</text>
        </g>
      ))}
      <g fontSize="10" fill="#64748b">
        {bodies.map((b, i) => (
          <text key={i} x="8" y={lane(i) + 4} fontWeight="600" fill={BODY_COLORS[i]}>{i + 1}</text>
        ))}
      </g>
      <text x={x0} y={H - 8} fontSize="10" fill="#64748b">
        {bodies.map((b, i) => `${i + 1} — ${b.label}`).join("   ·   ")}
      </text>
    </svg>
  );
}

export function DiveScene({ side, depth, reading, buoyancy, weight }: { side: number; depth: number; reading: number; buoyancy: number; weight: number }) {
  const px = 4; // пикселей на сантиметр
  const surface = 100;
  const a = side * px;
  const cubeTop = surface + depth * px - a;
  const cx = 300;
  const springTop = 18;
  const springBottom = Math.max(springTop + 20, cubeTop - 10);
  const coils = 8;
  const zig = Array.from({ length: coils * 2 + 1 }, (_, i) => `${cx + (i % 2 ? 7 : -7)},${springTop + 12 + ((springBottom - springTop - 12) * i) / (coils * 2)}`).join(" ");
  const arrow = (from: number, len: number, color: string, up: boolean, label: string, dx: number) => {
    if (len < 2) return null;
    const to = up ? from - len : from + len;
    return (
      <g stroke={color} fill={color}>
        <line x1={cx + dx} x2={cx + dx} y1={from} y2={to} strokeWidth="3" />
        <path d={up ? `M${cx + dx - 5} ${to + 8}L${cx + dx} ${to}L${cx + dx + 5} ${to + 8}Z` : `M${cx + dx - 5} ${to - 8}L${cx + dx} ${to}L${cx + dx + 5} ${to - 8}Z`} />
        <text x={cx + dx + 8} y={(from + to) / 2} fontSize="11" fontWeight="700" stroke="none">{label}</text>
      </g>
    );
  };
  const scale = 60 / Math.max(weight, 0.01); // стрелка веса — 60 px
  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full" aria-hidden>
      <rect x="0" y="0" width={W} height={H + 40} rx="14" fill="#F4F7F9" />
      {/* штатив и динамометр */}
      <rect x="150" y="6" width="300" height="8" rx="4" fill="#A9B7C2" />
      <rect x={cx - 16} y={springTop - 6} width="32" height="14" rx="4" fill={C.ocean} />
      <polyline points={zig} fill="none" stroke={C.ocean} strokeWidth="2" />
      <line x1={cx} x2={cx} y1={springBottom} y2={cubeTop} stroke={C.ocean} strokeWidth="2" />
      {/* сосуд */}
      <path d={`M190 ${surface - 30}V${H + 30}H410V${surface - 30}`} fill="none" stroke="#A9B7C2" strokeWidth="3" />
      <rect x="192" y={surface} width="216" height={H + 28 - surface} fill={C.water} opacity="0.55" />
      <line x1="192" x2="408" y1={surface} y2={surface} stroke={C.lagoon} strokeWidth="2" />
      {/* тело */}
      <rect x={cx - a / 2} y={cubeTop} width={a} height={a} rx="4" fill={C.ink} opacity="0.9" />
      {depth > 0 && (
        <rect x={cx - a / 2} y={Math.max(cubeTop, surface)} width={a} height={Math.min(depth, side) * px} fill={C.lagoon} opacity="0.45" />
      )}
      {/* силы */}
      {arrow(cubeTop + a / 2, weight * scale, C.coral, false, "F тяж", -a / 2 - 26)}
      {arrow(cubeTop + a / 2, buoyancy * scale, C.lagoon, true, "F A", a / 2 + 14)}
      {/* табло динамометра */}
      <g transform="translate(470 40)">
        <rect width="150" height="96" rx="12" fill="#fff" stroke={C.mist} strokeWidth="2" />
        <text x="14" y="24" fontSize="11" fill="#64748b">Динамометр</text>
        <text x="14" y="52" fontSize="24" fontWeight="800" fill={C.ink}>{fmt(reading, 2)} Н</text>
        <text x="14" y="72" fontSize="11" fill="#64748b">в воздухе {fmt(weight, 2)} Н</text>
        <text x="14" y="88" fontSize="11" fill={C.lagoon}>F A = {fmt(buoyancy, 2)} Н</text>
      </g>
      <text x="20" y="40" fontSize="11" fill="#64748b">глубина нижней грани</text>
      <text x="20" y="60" fontSize="20" fontWeight="800" fill={C.ink}>{fmt(Math.max(depth, 0), 1)} см</text>
    </svg>
  );
}

export function BoatScene({ draft, height, cargo }: { draft: number; height: number; cargo: number }) {
  const px = 5;
  const surface = 95;
  const sunk = draft > height + 1e-9;
  const hullW = 240;
  const h = height * px;
  const bottom = sunk ? H - 22 : surface + draft * px;
  const top = bottom - h;
  const x = W / 2 - hullW / 2;
  const blocks = Math.min(12, Math.round(cargo));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <rect x="0" y="0" width={W} height={H} rx="14" fill="#F4F7F9" />
      <rect x="0" y={surface} width={W} height={H - surface} fill={C.water} opacity="0.55" />
      <line x1="0" x2={W} y1={surface} y2={surface} stroke={C.lagoon} strokeWidth="2" />
      <g transform={sunk ? `rotate(-8 ${W / 2} ${bottom})` : undefined}>
        <rect x={x} y={top} width={hullW} height={h} rx="6" fill={C.ocean} />
        {!sunk && <line x1={x - 6} x2={x + hullW + 6} y1={surface} y2={surface} stroke={C.sun} strokeWidth="3" />}
        {Array.from({ length: blocks }, (_, i) => (
          <rect key={i} x={x + 14 + (i % 6) * 36} y={top - 16 - Math.floor(i / 6) * 16} width="30" height="14" rx="3" fill={C.sun} />
        ))}
      </g>
      <g transform="translate(18 18)">
        <rect width="170" height="62" rx="12" fill="#fff" stroke={C.mist} strokeWidth="2" />
        <text x="12" y="24" fontSize="12" fontWeight="800" fill={sunk ? C.coral : "#059669"}>{sunk ? "Тонет ✗" : "Плавает ✓"}</text>
        <text x="12" y="44" fontSize="11" fill="#64748b">осадка {sunk ? "—" : `${fmt(draft, 2)} см`} из {fmt(height, 1)}</text>
        <text x="12" y="57" fontSize="11" fill="#64748b">груз {fmt(cargo, 1)} кг</text>
      </g>
    </svg>
  );
}

export function FloatScene({ fraction, sinks }: { fraction: number; sinks: boolean }) {
  const surface = 70;
  const a = 70;
  const f = Math.max(0, Math.min(fraction, 1));
  const top = sinks ? H - 8 - a : surface - a * (1 - f);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <rect x="0" y="0" width={W} height={H} rx="14" fill="#F4F7F9" />
      <rect x="0" y={surface} width={W} height={H - surface} fill={C.water} opacity="0.55" />
      <line x1="0" x2={W} y1={surface} y2={surface} stroke={C.lagoon} strokeWidth="2" />
      <rect x={W / 2 - a / 2} y={top} width={a} height={a} rx="4" fill="#B88A00" />
      {!sinks && f > 0 && <rect x={W / 2 - a / 2} y={surface} width={a} height={a * f} fill={C.ocean} opacity="0.35" />}
      <g transform="translate(18 18)">
        <rect width="190" height="46" rx="12" fill="#fff" stroke={C.mist} strokeWidth="2" />
        <text x="12" y="20" fontSize="12" fontWeight="800" fill={sinks ? C.coral : "#059669"}>{sinks ? "Тонет — лежит на дне" : "Плавает ✓"}</text>
        <text x="12" y="36" fontSize="11" fill="#64748b">под водой {fmt(Math.min(fraction, 1) * 100, 0)} % объёма</text>
      </g>
    </svg>
  );
}
