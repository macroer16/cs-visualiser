import { useState } from "react";
import { Card, PageTitle } from "../components/Layout";
import { BASES, format, fromDecimalSteps, groupBits, isValid, parseIn, toDecimalSteps, twosComplement } from "../lib/bases";

export default function Bases() {
  const [text, setText] = useState("45");
  const [base, setBase] = useState(10);
  const [width, setWidth] = useState(8);
  const [target, setTarget] = useState(2);

  const valid = isValid(text, base);
  const n = valid ? parseIn(text, base) : 0;

  return (
    <>
      <PageTitle
        module="Computer Systems Fundamentals"
        title="Number bases"
        intro="Type a number in any base. Every other base updates as you type, and the working shows how to do it by hand in an exam."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex-1 min-w-48">
            <span className="text-sm font-medium">Your number</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`mt-1 w-full rounded-lg border px-3 py-2.5 font-mono text-xl ${valid ? "border-stone-300" : "border-red-400 bg-red-50"}`}
              aria-invalid={!valid}
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium">is written in</legend>
            <div className="mt-1 flex gap-1">
              {BASES.map((b) => (
                <button
                  key={b.base}
                  onClick={() => { if (valid) setText(format(n, b.base)); setBase(b.base); }}
                  className={`rounded-lg px-3 py-2.5 text-sm ${base === b.base ? "bg-ink text-white" : "bg-stone-100 hover:bg-stone-200"}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        {!valid && (
          <p className="mt-2 text-sm text-red-600">
            That isn't a valid {BASES.find((b) => b.base === base)?.name.toLowerCase()} number — use digits {BASES.find((b) => b.base === base)?.digits}.
          </p>
        )}
      </Card>

      {valid && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BASES.map((b) => (
              <Card key={b.base} className={b.base === base ? "border-accent ring-1 ring-accent" : ""}>
                <p className="text-sm text-stone-500">{b.name} <span className="font-mono">(base {b.base})</span></p>
                <p className="mt-2 break-all font-mono text-2xl font-semibold">
                  {b.base === 2 && n >= 0 ? groupBits(format(n, 2)) : format(n, b.base)}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="font-semibold">Step 1 — to decimal</h2>
              {base === 10 ? (
                <p className="mt-2 text-sm text-stone-600">Already in decimal: {n}.</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-stone-600">Multiply each digit by its place value, then add them up.</p>
                  <ul className="mt-3 space-y-1 font-mono text-sm">
                    {toDecimalSteps(text, base).map((s) => <li key={s}>{s}</li>)}
                  </ul>
                  <p className="mt-3 font-mono text-sm font-semibold">Total = {Math.abs(n)}</p>
                </>
              )}
            </Card>

            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Step 2 — decimal to</h2>
                <div className="flex gap-1">
                  {BASES.filter((b) => b.base !== 10).map((b) => (
                    <button key={b.base} onClick={() => setTarget(b.base)}
                      className={`rounded-md px-2.5 py-1 text-xs ${target === b.base ? "bg-accent text-white" : "bg-stone-100"}`}>
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-sm text-stone-600">Divide by {target} again and again. The remainders, read bottom to top, are the answer.</p>
              <table className="mt-3 w-full font-mono text-sm">
                <tbody>
                  {fromDecimalSteps(n, target).map((s, i) => (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="py-1">{s.line}</td>
                      <td className="py-1 text-right font-semibold text-accent">{s.remainder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 font-mono text-sm font-semibold">↑ Read upwards: {format(Math.abs(n), target)}</p>
            </Card>
          </div>

          <Card className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Two's complement (negative numbers)</h2>
              <label className="text-sm">
                Bits{" "}
                <select value={width} onChange={(e) => setWidth(Number(e.target.value))} className="rounded-md border border-stone-300 px-2 py-1">
                  {[4, 8, 16].map((w) => <option key={w}>{w}</option>)}
                </select>
              </label>
            </div>
            <TwosComplement n={n < 0 ? n : -Math.max(1, n)} width={width} typedNegative={n < 0} />
          </Card>
        </>
      )}
    </>
  );
}

function TwosComplement({ n, width, typedNegative }: { n: number; width: number; typedNegative: boolean }) {
  const t = twosComplement(n, width);
  return (
    <div className="mt-3">
      {!typedNegative && <p className="text-sm text-stone-600">Type a negative number (like -45) to see your own. Showing {n}:</p>}
      {!t.fits ? (
        <p className="mt-2 text-sm text-red-600">{n} doesn't fit in {width} bits. The range is −{2 ** (width - 1)} to {2 ** (width - 1) - 1}.</p>
      ) : (
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            [`Write ${-n} in binary`, t.positive],
            ["Flip every bit", t.flipped],
            ["Add 1", t.result],
          ].map(([label, bits], i) => (
            <li key={label} className="rounded-xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">{i + 1}. {label}</p>
              <p className={`mt-1 font-mono text-lg ${i === 2 ? "font-semibold text-accent" : ""}`}>{groupBits(bits, width)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
