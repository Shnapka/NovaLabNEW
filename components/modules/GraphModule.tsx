"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { GraphChart, GraphCheck, GraphContent } from "@/lib/modules/types";
import { compile, fmt } from "@/lib/modules/expr";
import Rich from "./Rich";
import { BoatScene, DiveScene, FloatScene, RaceScene } from "./GraphScenes";

// Палитра: ocean, sun (затемнён для контраста на белом), lagoon, коралловый
const COLORS = ["#01597B", "#DBA800", "#3F9AA8", "#E0525B"];
const W = 640;
const H = 320;
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

/** Проверка ответа «по графику»: 2 % или 0,01 */
function CheckItem({ check, value, unit }: { check: GraphCheck; value: number; unit: string }) {
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");
  const verify = () => {
    const a = Number(answer.replace(",", ".").replace(/\s/g, ""));
    setState(Number.isFinite(a) && Math.abs(a - value) <= Math.max(Math.abs(value) * 0.02, 0.01) ? "ok" : "bad");
  };
  return (
    <li className="rounded-xl bg-white p-3 ring-1 ring-mist-100">
      <p className="text-sm text-slate-700"><Rich text={check.text} /></p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          inputMode="decimal"
          className="input w-32 py-1.5 font-mono"
          placeholder="ответ"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setState("idle");
          }}
          onKeyDown={(e) => e.key === "Enter" && answer.trim() && verify()}
        />
        <span className="text-sm text-slate-500">{unit}</span>
        <button disabled={!answer.trim()} onClick={verify} className="btn-primary py-1.5">Проверить</button>
        {state === "ok" && <span className="text-sm font-semibold text-emerald-700">✓ Верно!</span>}
        {state === "bad" && (
          <span className="text-sm font-semibold text-rose-700">
            ✗ Правильно: {fmt(value, 3)} {unit}
          </span>
        )}
      </div>
      {state !== "idle" && check.explain && (
        <p className="mt-2 rounded-lg bg-mist-50 px-3 py-2 text-xs text-slate-600"><Rich text={check.explain} /></p>
      )}
    </li>
  );
}

function Chart({ chart }: { chart: GraphChart }) {
  const keys = useMemo(() => chart.params.map((p) => p.key), [chart]);
  const vars = useMemo(() => ["x", ...keys], [keys]);
  const clipId = useId();
  const [vals, setVals] = useState<Record<string, number>>(Object.fromEntries(chart.params.map((p) => [p.key, p.value])));
  const [hoverX, setHoverX] = useState<number | null>(null);
  const xMin = chart.x.min ?? 0;
  const xMax = chart.x.max;
  const [playX, setPlayX] = useState(chart.playhead ? xMin + (xMax - xMin) * 0.4 : xMin);
  const [playing, setPlaying] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const fns = useMemo(() => chart.series.map((s) => compile(s.expr, vars)), [chart, vars]);
  const readFns = useMemo(() => (chart.readouts ?? []).map((r) => compile(r.expr, vars)), [chart, vars]);
  const checkFns = useMemo(() => (chart.checks ?? []).map((c) => compile(c.expr, vars)), [chart, vars]);
  const sceneFns = useMemo(() => {
    const s = chart.scene;
    if (!s) return null;
    const c = (e: string) => compile(e, vars);
    if (s.kind === "race") return { pos: s.bodies.map((b) => c(b.pos)) };
    if (s.kind === "dive") return { side: c(s.side), depth: c(s.depth), reading: c(s.reading), buoyancy: c(s.buoyancy), weight: c(s.weight) };
    if (s.kind === "boat") return { draft: c(s.draft), height: c(s.height), cargo: c(s.cargo) };
    return { fraction: c(s.fraction), sinks: c(s.sinks) };
  }, [chart, vars]);

  const yMax = chart.y.max;
  const pv = keys.map((k) => vals[k]);
  const at = (f: (...a: number[]) => number, x: number) => f(x, ...pv);
  const sx = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);

  // Анимация бегунка
  useEffect(() => {
    if (!playing) return;
    const duration = (chart.playhead?.duration ?? 6) * 1000;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setPlayX((x) => {
        const nx = x + ((xMax - xMin) * dt) / duration;
        if (nx >= xMax) {
          setPlaying(false);
          return xMax;
        }
        return nx;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, chart.playhead?.duration, xMax, xMin]);

  const N = 240;
  const paths = fns.map((f) => {
    const segs: [number, number][][] = [];
    let cur: [number, number][] = [];
    for (let j = 0; j <= N; j++) {
      const x = xMin + ((xMax - xMin) * j) / N;
      const y = at(f, x);
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
    const inside = x >= xMin && x <= xMax;
    setHoverX(inside ? x : null);
    // С бегунком: перетаскивание по графику двигает его
    if (chart.playhead && inside && e.buttons === 1) {
      setPlaying(false);
      setPlayX(x);
    }
  }

  const shownX = chart.playhead ? (hoverX ?? playX) : hoverX;

  type Fn = (...a: number[]) => number;
  const scene = (() => {
    const s = chart.scene;
    if (!s || !sceneFns) return null;
    const F = sceneFns as Record<string, Fn> & { pos?: Fn[] };
    const X = chart.playhead ? playX : xMax;
    if (s.kind === "race" && F.pos) {
      const every = s.markEvery ?? 0;
      const marks = F.pos.map((f) =>
        every > 0 ? Array.from({ length: Math.floor((X - xMin) / every) + 1 }, (_, k) => at(f, xMin + k * every)).filter(Number.isFinite) : []
      );
      return <RaceScene length={s.length} bodies={s.bodies.map((b, i) => ({ label: b.label, pos: at(F.pos![i], X) }))} marks={marks} />;
    }
    if (s.kind === "dive")
      return <DiveScene side={at(F.side, X)} depth={at(F.depth, X)} reading={at(F.reading, X)} buoyancy={at(F.buoyancy, X)} weight={at(F.weight, X)} />;
    if (s.kind === "boat") return <BoatScene draft={at(F.draft, X)} height={at(F.height, X)} cargo={at(F.cargo, X)} />;
    if (s.kind === "float") return <FloatScene fraction={at(F.fraction, X)} sinks={at(F.sinks, X) > 0.5} />;
    return null;
  })();

  return (
    <section className="space-y-4 rounded-2xl border border-mist-100 p-4 sm:p-5">
      <div>
        <h3 className="text-lg font-bold text-ocean-900"><Rich text={chart.title} /></h3>
        {chart.description && <p className="text-sm text-slate-600"><Rich text={chart.description} /></p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chart.params.map((p) => (
          <label key={p.key} className="block rounded-xl border border-mist-100 bg-mist-50 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span><Rich text={p.label} /></span>
              <span className="shrink-0 font-mono font-semibold">{fmt(vals[p.key])} {p.unit}</span>
            </div>
            <input
              type="range"
              className="w-full accent-ocean-700"
              min={p.min}
              max={p.max}
              step={p.step}
              value={vals[p.key]}
              onChange={(e) => setVals({ ...vals, [p.key]: Number(e.target.value) })}
            />
          </label>
        ))}
      </div>

      {scene && <div className="overflow-hidden rounded-xl">{scene}</div>}

      {chart.playhead && (
        <div className="flex items-center gap-3 rounded-xl bg-ocean-700 px-3 py-2 text-white">
          <button
            onClick={() => {
              if (!playing && playX >= xMax - 1e-9) setPlayX(xMin);
              setPlaying(!playing);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun-400 text-ocean-950"
            aria-label={playing ? "Пауза" : "Запустить"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button onClick={() => (setPlaying(false), setPlayX(xMin))} className="shrink-0 text-xs text-aqua-200 hover:text-white" aria-label="В начало">
            ⟲
          </button>
          <input
            type="range"
            className="w-full accent-sun-400"
            min={xMin}
            max={xMax}
            step={(xMax - xMin) / 400}
            value={playX}
            onChange={(e) => {
              setPlaying(false);
              setPlayX(Number(e.target.value));
            }}
          />
          <span className="w-36 shrink-0 text-right font-mono text-sm">
            <Rich text={chart.playhead.label} /> = {fmt(playX, 1)} {chart.x.unit}
          </span>
        </div>
      )}

      <div className="relative rounded-xl border border-mist-100 bg-white p-2">
        <div className="absolute left-3 top-1 text-xs font-medium text-slate-500">
          <Rich text={chart.y.label} />, {chart.y.unit}
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHoverX(null)}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
            </clipPath>
          </defs>
          {ticks(0, yMax).map((v) => (
            <g key={"y" + v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="#E2E8ED" />
              <text x={PAD.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="#64748b">{fmt(v)}</text>
            </g>
          ))}
          {ticks(xMin, xMax).map((v) => (
            <g key={"x" + v}>
              <line x1={sx(v)} x2={sx(v)} y1={PAD.t} y2={H - PAD.b} stroke="#EEF2F5" />
              <text x={sx(v)} y={H - PAD.b + 16} textAnchor="middle" fontSize="11" fill="#64748b">{fmt(v)}</text>
            </g>
          ))}
          <line x1={PAD.l} x2={W - PAD.r} y1={sy(0)} y2={sy(0)} stroke="#A9B7C2" />
          <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#A9B7C2" />

          <g clipPath={`url(#${clipId})`}>
            {paths.map((segs, i) =>
              segs.map((pts, k) => {
                const d = pts.map(([x, y], j) => `${j ? "L" : "M"}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join("");
                const color = COLORS[i % COLORS.length];
                return (
                  <g key={`${i}-${k}`}>
                    {chart.series[i].fill && (
                      <path d={`${d}L${sx(pts[pts.length - 1][0])},${sy(0)}L${sx(pts[0][0])},${sy(0)}Z`} fill={color} opacity={0.15} />
                    )}
                    <path d={d} fill="none" stroke={color} strokeWidth={chart.series[i].dashed ? 2 : 2.5} strokeDasharray={chart.series[i].dashed ? "6 5" : undefined} />
                  </g>
                );
              })
            )}
            {/* «Пройденная» часть до бегунка */}
            {chart.playhead && <rect x={sx(playX)} y={PAD.t} width={Math.max(0, W - PAD.r - sx(playX))} height={H - PAD.t - PAD.b} fill="#fff" opacity="0.55" />}
          </g>

          {shownX !== null && (
            <g>
              <line x1={sx(shownX)} x2={sx(shownX)} y1={PAD.t} y2={H - PAD.b} stroke="#013E56" strokeDasharray="4 3" />
              {fns.map((f, i) => {
                const y = at(f, shownX);
                return Number.isFinite(y) && y <= yMax ? <circle key={i} cx={sx(shownX)} cy={sy(y)} r={5} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth="2" /> : null;
              })}
            </g>
          )}
        </svg>
        <div className="absolute bottom-1 right-3 text-xs font-medium text-slate-500">
          <Rich text={chart.x.label} />, {chart.x.unit}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {chart.series.map((s, i) => {
          const y = shownX !== null ? at(fns[i], shownX) : NaN;
          return (
            <span key={i} className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-5 rounded" style={{ background: COLORS[i % COLORS.length], opacity: s.dashed ? 0.6 : 1 }} />
              <Rich text={s.label} />
              {shownX !== null && Number.isFinite(y) && <span className="font-mono text-slate-600">= {fmt(y)} {chart.y.unit}</span>}
            </span>
          );
        })}
        {shownX !== null ? (
          <span className="font-mono text-slate-500">
            при <Rich text={chart.x.label} /> = {fmt(shownX, 1)} {chart.x.unit}
          </span>
        ) : (
          <span className="text-slate-400">Наведи курсор на график, чтобы увидеть значения</span>
        )}
      </div>

      {chart.readouts && chart.readouts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {chart.readouts.map((r, i) => (
            <div key={i} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <Rich text={r.label} />: <span className="font-mono font-semibold">{fmt(at(readFns[i], chart.playhead ? playX : xMax))} {r.unit}</span>
            </div>
          ))}
        </div>
      )}

      {chart.checks && chart.checks.length > 0 && (
        <div className="rounded-xl bg-lagoon-50 p-3">
          <div className="mb-2 text-sm font-bold text-ocean-900">Найди по графику</div>
          <ul className="space-y-2">
            {chart.checks.map((c, i) => (
              // key с параметрами: при смене параметров вопрос «сбрасывается»
              <CheckItem key={`${i}-${pv.join(",")}`} check={c} value={at(checkFns[i], playX)} unit={c.unit} />
            ))}
          </ul>
        </div>
      )}

      {chart.question && (
        <div className="rounded-xl border border-lagoon-200 bg-white p-3 text-sm text-ocean-950">
          <span className="font-semibold">Подумай: </span>
          <Rich text={chart.question} />
        </div>
      )}
    </section>
  );
}

export default function GraphModule({ content }: { content: GraphContent }) {
  return (
    <div className="space-y-8">
      {content.charts.map((c, i) => <Chart key={i} chart={c} />)}
    </div>
  );
}
