import { useMemo, useState } from "react";
import { Card, PageTitle } from "../components/Layout";
import { combinations, evaluate, parse, subExpressions, toText, variables } from "../lib/boolean";

const EXAMPLES = ["(A AND B) OR NOT C", "A XOR B", "NOT (A AND B)", "NOT A OR NOT B", "(A OR B) AND (A OR C)", "A NAND B"];

export default function TruthTable() {
  const [expr, setExpr] = useState("(A AND B) OR NOT C");
  const [showSteps, setShowSteps] = useState(true);

  // Parse once per change; show a friendly message if it's not valid yet.
  const result = useMemo(() => {
    try {
      const tree = parse(expr);
      const vars = variables(tree);
      if (vars.length > 6) throw new Error("Use at most 6 variables (that's already 64 rows!)");
      return { tree, vars, cols: subExpressions(tree).length ? subExpressions(tree) : [tree], rows: combinations(vars) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [expr]);

  return (
    <>
      <PageTitle
        module="Mathematics for Computing"
        title="Truth table builder"
        intro="Type any Boolean expression. You can use words (AND, OR, NOT, XOR, NAND, NOR) or symbols (& | ! ^ and A' for NOT A)."
      />

      <Card>
        <label className="text-sm font-medium" htmlFor="expr">Expression</label>
        <input id="expr" value={expr} onChange={(e) => setExpr(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 font-mono text-lg" spellCheck={false} />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => setExpr(e)} className="rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs hover:bg-stone-200">{e}</button>
          ))}
        </div>
      </Card>

      {"error" in result ? (
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Not quite: {result.error}</p>
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-stone-600">
              {result.vars.length} input{result.vars.length === 1 ? "" : "s"} → 2<sup>{result.vars.length}</sup> = {result.rows.length} rows.{" "}
              Output is 1 in {result.rows.filter((r) => evaluate(result.tree, r)).length} of them.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showSteps} onChange={(e) => setShowSteps(e.target.checked)} />
              Show working columns
            </label>
          </div>
          <table className="w-full text-center font-mono text-sm">
            <thead>
              <tr className="border-b-2 border-stone-300">
                {result.vars.map((v) => <th key={v} className="px-3 py-2">{v}</th>)}
                {(showSteps ? result.cols : result.cols.slice(-1)).map((c, i, arr) => (
                  <th key={i} className={`px-3 py-2 whitespace-nowrap ${i === arr.length - 1 ? "bg-accent/10 text-accent" : "text-stone-500"}`}>
                    {toText(c).replace(/^\((.*)\)$/, "$1")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((env, r) => (
                <tr key={r} className="border-b border-stone-100">
                  {result.vars.map((v) => <td key={v} className="px-3 py-1.5">{+env[v]}</td>)}
                  {(showSteps ? result.cols : result.cols.slice(-1)).map((c, i, arr) => {
                    const val = evaluate(c, env);
                    const last = i === arr.length - 1;
                    return (
                      <td key={i} className={`px-3 py-1.5 ${last ? `font-bold ${val ? "bg-on/15 text-on" : "bg-accent/5"}` : "text-stone-500"}`}>
                        {+val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
