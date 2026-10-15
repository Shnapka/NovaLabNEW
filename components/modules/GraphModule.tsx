"use client";
import { useId, useMemo, useRef, useState } from "react";
import type { GraphChart, GraphContent } from "@/lib/modules/types";
import { compile, fmt } from "@/lib/modules/expr";
import Rich from "./Rich";

const COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706"];
const W = 640;
const H = 340;
const PAD = { l: 52, r: 16, t: 14, b: 32 };

function niceStep(range: number, target = 5) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
}

function ticks(min: number, max: number) {
  const step = niceStep(max - min);
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

function Chart({ chart }: { chart: GraphChart }) {
  const keys = useMemo(() => chart.params.map((p) => p.key), [chart]);
  const clipId = useId();
  const [vals, setVals] = useState<Record<string, number>>(
    Object.fromEntries(chart.params.map((p) => [p.key, p.value]))
  );
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fns = useMemo(() => chart.series.map((s) => compile(s.expr, ["x", ...keys])), [chart, keys]);
  const readFns = useMemo(() => (chart.readouts ?? []).map((r) => compile(r.expr, keys)), [chart, keys]);

  const xMin = chart.x.min ?? 0;
  const xMax = chart.x.max;
  const yMax = chart.y.max;
  const pv = keys.map((k) => vals[k]);
  const sx = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);
  const at = (i: number, x: number) => fns[i](x, ...pv);

  // Точки графика; NaN разрывает линию
  const N = 240;
  const paths = fns.map((_, i) => {
    const segs: [number, number][][] = [];
    let cur: [number, number][] = [];
    for (let j = 0; j <= N; j++) {
      const x = xMin + ((xMax - xMin) * j) / N;
      const y = at(i, x);
      if (Number.isFinite(y)) cur.push([x, y]);
      else if (cur.length) {
        segs.push(cur);
        cur = [];
      }
    }
    if (cur.length) segs.push(cur);
    return segs;
  });

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const x = xMin + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (xMax - xMin);
    setHoverX(x >= xMin && x <= xMax ? x : null);
  }

  const shownX = hoverX ?? null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold"><Rich text={chart.title} /></h3>
        {chart.description && <p className="text-sm text-gray-600"><Rich text={chart.description} /></p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {chart.params.map((p) => (
          <label key={p.key} className="block rounded-lg border bg-gray-50 px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span><Rich text={p.label} /></span>
              <span className="font-mono font-semibold">{fmt(vals[p.key])} {p.unit}</span>
            </div>
            <input
              type="range"
              className="w-full accent-indigo-600"
              min={p.min}
              max={p.max}
              step={p.step}
              value={vals[p.key]}
              onChange={(e) => setVals({ ...vals, [p.key]: Number(e.target.value) })}
            />
          </label>
        ))}
      </div>

      <div className="relative rounded-lg border bg-white p-2">
        <div className="absolute left-3 top-1 text-xs font-medium text-gray-500">
          <Rich text={chart.y.label} />, {chart.y.unit}
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHoverX(null)}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
            </clipPath>
          </defs>
          {ticks(0, yMax).map((v) => (
            <g key={"y" + v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="#e5e7eb" />
              <text x={PAD.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="#6b7280">{fmt(v)}</text>
            </g>
          ))}
          {ticks(xMin, xMax).map((v) => (
            <g key={"x" + v}>
              <line x1={sx(v)} x2={sx(v)} y1={PAD.t} y2={H - PAD.b} stroke="#f3f4f6" />
              <text x={sx(v)} y={H - PAD.b + 16} textAnchor="middle" fontSize="11" fill="#6b7280">{fmt(v)}</text>
            </g>
          ))}
          <line x1={PAD.l} x2={W - PAD.r} y1={sy(0)} y2={sy(0)} stroke="#9ca3af" />
          <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#9ca3af" />

          <g clipPath={`url(#${clipId})`}>
            {paths.map((segs, i) =>
              segs.map((pts, k) => {
                const d = pts.map(([x, y], j) => `${j ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join("");
                const color = COLORS[i % COLORS.length];
                return (
                  <g key={`${i}-${k}`}>
                    {chart.series[i].fill && (
                      <path
                        d={`${d}L${sx(pts[pts.length - 1][0])},${sy(0)}L${sx(pts[0][0])},${sy(0)}Z`}
                        fill={color}
                        opacity={0.15}
                      />
                    )}
                    <path d={d} fill="none" stroke={color} strokeWidth={2.5} />
                  </g>
                );
              })
            )}
          </g>

          {shownX !== null && (
            <g>
              <line x1={sx(shownX)} x2={sx(shownX)} y1={PAD.t} y2={H - PAD.b} stroke="#111827" strokeDasharray="4 3" />
              {fns.map((_, i) => {
                const y = at(i, shownX);
                return Number.isFinite(y) && y <= yMax ? (
                  <circle key={i} cx={sx(shownX)} cy={sy(y)} r={4} fill={COLORS[i % COLORS.length]} />
                ) : null;
              })}
            </g>
          )}
        </svg>
        <div className="absolute bottom-1 right-3 text-xs font-medium text-gray-500">
          <Rich text={chart.x.label} />, {chart.x.unit}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {chart.series.map((s, i) => {
          const y = shownX !== null ? at(i, shownX) : NaN;
          return (
            <span key={i} className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-5 rounded" style={{ background: COLORS[i % COLORS.length] }} />
              <Rich text={s.label} />
              {shownX !== null && <span className="font-mono text-gray-600">= {fmt(y)} {chart.y.unit}</span>}
            </span>
          );
        })}
        {shownX !== null && (
          <span className="font-mono text-gray-500">
            при <Rich text={chart.x.label} /> = {fmt(shownX, 1)} {chart.x.unit}
          </span>
        )}
        {shownX === null && <span className="text-gray-400">Наведи курсор на график, чтобы увидеть значения</span>}
      </div>

      {chart.readouts && chart.readouts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {chart.readouts.map((r, i) => (
            <div key={i} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <Rich text={r.label} />: <span className="font-mono font-semibold">{fmt(readFns[i](...pv))} {r.unit}</span>
            </div>
          ))}
        </div>
      )}

      {chart.question && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
          <span className="font-semibold">Вопрос: </span>
          <Rich text={chart.question} />
        </div>
      )}
    </section>
  );
}

export default function GraphModule({ content }: { content: GraphContent }) {
  return (
    <div className="space-y-10">
      {content.charts.map((c, i) => <Chart key={i} chart={c} />)}
    </div>
  );
}
