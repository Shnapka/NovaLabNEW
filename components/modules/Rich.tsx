import type { ReactNode } from "react";

// Мини-разметка для физических текстов:
// **жирный**, x_{индекс}, x^{степень}, [[числитель||знаменатель]] — дробь.
function parse(s: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let buf = "";
  let i = 0;
  let n = 0;
  const key = () => `${keyPrefix}-${n++}`;
  const flush = () => {
    if (buf) out.push(buf);
    buf = "";
  };

  while (i < s.length) {
    if (s.startsWith("[[", i)) {
      const mid = s.indexOf("||", i);
      const end = s.indexOf("]]", i);
      if (mid > i && end > mid) {
        flush();
        const k = key();
        out.push(
          <span key={k} className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.9em] leading-tight">
            <span className="px-1">{parse(s.slice(i + 2, mid), k + "n")}</span>
            <span className="w-full border-t border-current px-1">{parse(s.slice(mid + 2, end), k + "d")}</span>
          </span>
        );
        i = end + 2;
        continue;
      }
    }
    if (s.startsWith("**", i)) {
      const end = s.indexOf("**", i + 2);
      if (end > i) {
        flush();
        const k = key();
        out.push(<strong key={k}>{parse(s.slice(i + 2, end), k)}</strong>);
        i = end + 2;
        continue;
      }
    }
    if ((s[i] === "_" || s[i] === "^") && s[i + 1] === "{") {
      const end = s.indexOf("}", i + 2);
      if (end > i) {
        flush();
        const k = key();
        const inner = parse(s.slice(i + 2, end), k);
        out.push(s[i] === "_" ? <sub key={k}>{inner}</sub> : <sup key={k}>{inner}</sup>);
        i = end + 1;
        continue;
      }
    }
    buf += s[i];
    i++;
  }
  flush();
  return out;
}

export default function Rich({ text }: { text: string }) {
  return <>{parse(text, "r")}</>;
}
