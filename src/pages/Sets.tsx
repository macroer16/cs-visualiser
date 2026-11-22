import { useMemo, useState } from "react";
import { Card, PageTitle } from "../components/Layout";
import { evaluate, parse } from "../lib/boolean";

// Set expressions reuse the Boolean parser: ∪ = OR, ∩ = AND, ' = complement.
// Difference A − B is rewritten to A ∩ B'.
const toBoolean = (expr: string) =>
  expr.replace(/\bu\b/g, "∪").replace(/\bn\b/g, "∩").replace(/\s*[−-]\s*([A-C]|\([^)]*\))/g, " ∩ $1'");

const PRESETS2 = ["A ∪ B", "A ∩ B", "A − B", "B − A", "A'", "(A ∪ B)'"];
const PRESETS3 = ["A ∪ B ∪ C", "A ∩ B ∩ C", "(A ∩ B) − C", "A ∩ (B ∪ C)", "(A ∪ B)' ∩ C", "A − (B ∪ C)"];

// Circle positions in the SVG, for 2 and 3 sets.
const CIRCLES = {
  2: [{ x: 160, y: 150, label: "A" }, { x: 260, y: 150, label: "B" }],
  3: [{ x: 165, y: 125, label: "A" }, { x: 255, y: 125, label: "B" }, { x: 210, y: 200, label: "C" }],
} as const;
const R = 85;

export default function Sets() {
  const [count, setCount] = useState<2 | 3>(2);
  const [expr, setExpr] = useState("A ∩ B");
  const [elems, setElems] = useState({ U: "1 2 3 4 5 6 7 8 9 10", A: "1 2 3 4 5", B: "4 5 6 7", C: "2 5 7 9" });

  const names = useMemo(() => (count === 2 ? ["A", "B"] : ["A", "B", "C"]), [count]);

  const parsed = useMemo(() => {
    try { return { tree: parse(toBoolean(expr)), error: null }; } catch (e) { return { tree: null, error: (e as Error).message }; }
  }, [expr]);

  // Every region of the diagram is one combination of in/out for each set.
  const regions = useMemo(() => {
    const list: Record<string, boolean>[] = [];
    for (let i = 0; i < 1 << names.length; i++) {
      const env: Record<string, boolean> = {};
      names.forEach((n, j) => (env[n] = ((i >> j) & 1) === 1));
      list.push(env);
    }
    return list;
  }, [names]);

  const sets = Object.fromEntries(
    Object.entries(elems).map(([k, v]) => [k, new Set(v.split(/[\s,]+/).filter(Boolean))]),
  ) as Record<"U" | "A" | "B" | "C", Set<string>>;
  const tree = parsed.tree;
  const answer = tree
    ? [...sets.U].filter((x) => evaluate(tree, Object.fromEntries(names.map((n) => [n, sets[n as "A"].has(x)]))))
    : [];

  return (
    <>
      <PageTitle
        module="Mathematics for Computing"
        title="Sets & Venn diagrams"
        intro="Pick an operation (or type your own) and the matching region lights up. Edit the elements to see the actual answer set."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="mb-3 flex gap-1">
            {[2, 3].map((c) => (
              <button key={c} onClick={() => { setCount(c as 2 | 3); setExpr(c === 2 ? "A ∩ B" : "A ∩ B ∩ C"); }}
                className={`rounded-md px-3 py-1.5 text-sm ${count === c ? "bg-ink text-white" : "bg-stone-100"}`}>
                {c} sets
              </button>
            ))}
          </div>

          <svg viewBox="0 0 420 300" className="w-full" role="img" aria-label={`Venn diagram shading ${expr}`}>
            <defs>
              {CIRCLES[count].map((c) => (
                <clipPath id={`clip-${c.label}`} key={c.label}><circle cx={c.x} cy={c.y} r={R} /></clipPath>
              ))}
            </defs>
            <rect x="10" y="10" width="400" height="280" rx="12" fill="white" stroke="#a8a29e" />
            <text x="24" y="34" className="fill-stone-500 text-sm">U</text>

            {/* Shade each region the expression includes: clip to the sets it's in, mask out the rest. */}
            {tree && regions.map((env, i) => {
              if (!evaluate(tree, env)) return null;
              const inside = names.filter((n) => env[n]);
              const outside = names.filter((n) => !env[n]);
              let shape = (
                <g mask={`url(#mask-${i})`}>
                  <rect x="10" y="10" width="400" height="280" rx="12" fill="#1d4ed8" fillOpacity="0.35" />
                </g>
              );
              for (const n of inside) shape = <g clipPath={`url(#clip-${n})`}>{shape}</g>;
              return (
                <g key={i}>
                  <mask id={`mask-${i}`}>
                    <rect x="0" y="0" width="420" height="300" fill="white" />
                    {CIRCLES[count].filter((c) => outside.includes(c.label)).map((c) => (
                      <circle key={c.label} cx={c.x} cy={c.y} r={R} fill="black" />
                    ))}
                  </mask>
                  {shape}
                </g>
              );
            })}

            {CIRCLES[count].map((c) => (
              <g key={c.label}>
                <circle cx={c.x} cy={c.y} r={R} fill="none" stroke="#1c1917" strokeWidth="2" />
                <text x={c.x + (c.label === "A" ? -70 : c.label === "B" ? 60 : 0)} y={c.label === "C" ? c.y + 75 : c.y - 70}
                  className="fill-ink text-lg font-bold">{c.label}</text>
              </g>
            ))}
          </svg>

          <label className="mt-4 block text-sm font-medium" htmlFor="set-expr">Expression</label>
          <input id="set-expr" value={expr} onChange={(e) => setExpr(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono" />
          <div className="mt-3 flex flex-wrap gap-2">
            {(count === 2 ? PRESETS2 : PRESETS3).map((p) => (
              <button key={p} onClick={() => setExpr(p)}
                className={`rounded-md px-2.5 py-1 font-mono text-sm ${p === expr ? "bg-accent text-white" : "bg-stone-100 hover:bg-stone-200"}`}>{p}</button>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">Symbols: ∪ (or u, OR) union · ∩ (or n, AND) intersection · − difference · A' complement</p>
          {parsed.error && <p className="mt-2 text-sm text-amber-700">Not quite: {parsed.error}</p>}
        </Card>

        <Card>
          <h2 className="font-semibold">With real elements</h2>
          <div className="mt-3 space-y-3">
            {(["U", ...names] as ("U" | "A" | "B" | "C")[]).map((k) => (
              <label key={k} className="flex items-center gap-3">
                <span className="w-6 font-mono font-bold">{k}</span>
                <input value={elems[k]} onChange={(e) => setElems({ ...elems, [k]: e.target.value })}
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 font-mono text-sm" />
              </label>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-accent/5 p-4">
            <p className="font-mono text-sm text-stone-600">{expr} =</p>
            <p className="mt-1 font-mono text-xl font-semibold text-accent">{`{ ${answer.join(", ")} }`}</p>
            <p className="mt-1 text-sm text-stone-500">|{expr}| = {answer.length}</p>
          </div>
          <p className="mt-4 text-sm text-stone-600">
            Complement (A') means everything in the universal set U that is not in A — that's why U matters.
          </p>
        </Card>
      </div>
    </>
  );
}
