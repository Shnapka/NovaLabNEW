import type { SummaryBlock, SummaryContent } from "@/lib/modules/types";
import Rich from "./Rich";

function Block({ b }: { b: SummaryBlock }) {
  switch (b.kind) {
    case "h":
      return <h3 className="pt-3 text-xl font-bold text-ocean-900"><Rich text={b.text} /></h3>;
    case "p":
      return <p className="leading-relaxed text-slate-700"><Rich text={b.text} /></p>;
    case "def":
      return (
        <div className="rounded-lg border-l-4 border-lagoon-500 bg-lagoon-50 p-4">
          <span className="font-semibold text-ocean-900"><Rich text={b.term} /></span>
          <span className="text-ocean-950"> — <Rich text={b.text} /></span>
        </div>
      );
    case "formula":
      return (
        <div className="rounded-xl bg-mist-50 px-4 py-4">
          <div className="whitespace-pre text-center font-serif text-2xl text-ocean-950"><Rich text={b.expr} /></div>
          {b.legend && (
            <dl className="mx-auto mt-2 grid max-w-md grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm text-slate-600">
              {b.legend.map(([sym, meaning]) => (
                <div key={sym} className="contents">
                  <dt className="text-right font-serif text-ocean-950"><Rich text={sym} /></dt>
                  <dd>— <Rich text={meaning} /></dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      );
    case "list":
      return (
        <ul className="list-disc space-y-1 pl-6 text-slate-700">
          {b.items.map((it, i) => <li key={i}><Rich text={it} /></li>)}
        </ul>
      );
    case "note":
      return (
        <div className="rounded-lg border border-sun-100 bg-sun-50 p-3 text-sm text-sun-900">
          <Rich text={b.text} />
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto">
          {b.caption && <div className="mb-1 text-sm font-medium text-slate-600">{b.caption}</div>}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-mist-50 text-left">
                {b.head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  {r.map((c, j) => <td key={j} className="px-3 py-1.5"><Rich text={c} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "example":
      return (
        <details className="group rounded-lg border bg-white p-4">
          <summary className="cursor-pointer list-none">
            <span className="mr-2 rounded bg-lagoon-100 px-2 py-0.5 text-xs font-semibold text-lagoon-800">Пример</span>
            <Rich text={b.problem} />
            <span className="ml-2 text-sm text-lagoon-700 group-open:hidden">Показать решение</span>
          </summary>
          <div className="mt-3 space-y-1 border-t pt-3 text-slate-700">
            {b.solution.map((s, i) => <p key={i}><Rich text={s} /></p>)}
            <p className="pt-1 font-semibold">Ответ: <Rich text={b.answer} /></p>
          </div>
        </details>
      );
  }
}

export default function SummaryModule({ content }: { content: SummaryContent }) {
  return (
    <article className="space-y-4">
      {content.blocks.map((b, i) => <Block key={i} b={b} />)}
    </article>
  );
}
