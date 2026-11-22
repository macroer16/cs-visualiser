import { useEffect, useState } from "react";
import { Card, Challenge, PageTitle } from "../components/Layout";
import { markDone, useProgress } from "../lib/progress";
import { SAMPLE, SUBTRACT, describe, initial, step } from "../lib/cpu";
import type { CpuState, Register } from "../lib/cpu";

const PROGRAMS = [SAMPLE, SUBTRACT];
const REGISTERS: { key: Register; name: string; job: string }[] = [
  { key: "PC", name: "Program Counter", job: "address of the next instruction" },
  { key: "MAR", name: "Memory Address Register", job: "address being read or written" },
  { key: "MDR", name: "Memory Data Register", job: "data just read or about to be written" },
  { key: "CIR", name: "Current Instruction Register", job: "instruction being decoded" },
  { key: "ACC", name: "Accumulator", job: "result of the last calculation" },
];

export default function Cpu() {
  const [program, setProgram] = useState(0);
  const [cpu, setCpu] = useState<CpuState>(() => initial(PROGRAMS[0].memory));
  const [playing, setPlaying] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [guess, setGuess] = useState<number | null>(null);
  const done = useProgress().includes("/cpu");
  const solved = guess === 12;
  if (solved && !done) markDone("/cpu");

  const codeLength = PROGRAMS[program].memory.indexOf(0) + 1; // instructions end at the first HLT

  const doStep = () => setCpu((c) => { const n = step(c); setLog((l) => [n.explanation, ...l].slice(0, 30)); return n; });
  const reset = (p = program) => { setPlaying(false); setCpu(initial(PROGRAMS[p].memory)); setLog([]); };

  // Auto-play: one micro-step every 1.4 seconds until the CPU halts.
  useEffect(() => {
    if (!playing) return;
    if (cpu.phase === "halted") { setPlaying(false); return; }
    const t = setTimeout(doStep, 1400);
    return () => clearTimeout(t);
  }, [playing, cpu]);

  return (
    <>
      <PageTitle
        n="05"
        module="Computer Systems Fundamentals"
        title="Fetch–decode–execute"
        intro="A tiny CPU runs a real program one micro-step at a time. Watch which register changes (highlighted) and read what's happening underneath."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={doStep} disabled={cpu.phase === "halted"} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Step</button>
        <button onClick={() => setPlaying(!playing)} disabled={cpu.phase === "halted"} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={() => reset()} className="rounded-lg bg-stone-200 px-4 py-2 text-sm">Reset</button>
        <select value={program} onChange={(e) => { const p = Number(e.target.value); setProgram(p); reset(p); }} className="rounded-lg border border-stone-300 px-2 py-2 text-sm">
          {PROGRAMS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
        </select>
      </div>

      <div className="mb-4 flex gap-2" aria-label="Current phase">
        {(["fetch", "decode", "execute"] as const).map((p) => (
          <span key={p} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${cpu.phase === p ? "bg-accent text-white" : "bg-stone-200 text-stone-500"}`}>{p}</span>
        ))}
        {cpu.phase === "halted" && <span className="rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700">Halted</span>}
      </div>

      <Card className="mb-6 border-accent/40 bg-accent/5">
        <p className="text-base leading-relaxed" aria-live="polite">{cpu.explanation}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_auto_1fr]">
        {/* CPU */}
        <Card>
          <h2 className="font-semibold">CPU</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {REGISTERS.map((r) => {
              const hot = cpu.changed.includes(r.key);
              const v = cpu[r.key];
              return (
                <div key={r.key} className={`rounded-xl border-2 p-3 transition-all duration-500 ${hot ? "scale-[1.03] border-accent bg-accent/10" : "border-stone-200"}`}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm font-bold">{r.key}</span>
                    <span className="font-mono text-2xl font-semibold tabular-nums">{v}</span>
                  </div>
                  <p className="text-xs text-stone-500">{r.name}</p>
                  {r.key === "CIR" && cpu.CIR > 0 && <p className="mt-1 font-mono text-xs text-accent">= {describe(cpu.CIR)}</p>}
                  {r.key !== "CIR" && <p className="mt-1 text-[11px] text-stone-400">{r.job}</p>}
                </div>
              );
            })}
            <div className="rounded-xl border-2 border-dashed border-stone-200 p-3">
              <p className="font-mono text-sm font-bold">ALU + CU</p>
              <p className="text-xs text-stone-500">Arithmetic Logic Unit does the maths; the Control Unit decodes and directs.</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">Output</p>
            <p className="mt-1 min-h-8 rounded-lg bg-stone-900 px-3 py-1.5 font-mono text-lg text-green-400">{cpu.output.join("  ") || "—"}</p>
          </div>
        </Card>

        {/* Buses */}
        <div className="flex flex-row justify-center gap-6 lg:flex-col" aria-hidden>
          {(["address", "data"] as const).map((b) => (
            <div key={b} className="flex flex-col items-center gap-1">
              <div className={`h-2 w-24 rounded-full transition-colors lg:h-2 lg:w-20 ${cpu.bus === b ? "animate-pulse bg-accent" : "bg-stone-300"}`} />
              <span className={`text-xs ${cpu.bus === b ? "font-semibold text-accent" : "text-stone-400"}`}>{b} bus</span>
            </div>
          ))}
        </div>

        {/* Memory */}
        <Card>
          <h2 className="font-semibold">Memory (RAM)</h2>
          <table className="mt-3 w-full font-mono text-sm">
            <thead><tr className="text-left text-xs text-stone-500"><th className="py-1">Addr</th><th>Value</th><th>Means</th></tr></thead>
            <tbody>
              {cpu.memory.map((v, i) => (
                <tr key={i} className={`border-t border-stone-100 transition-colors ${cpu.memHighlight === i ? "bg-accent/15" : ""} ${i === cpu.PC && cpu.phase !== "halted" ? "font-bold" : ""}`}>
                  <td className="py-1">{i}{i === cpu.PC && cpu.phase !== "halted" && <span className="ml-1 text-accent">◀ PC</span>}</td>
                  <td>{v}</td>
                  <td className="text-stone-500">{i < codeLength ? describe(v) : "data"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-stone-500">Instructions are stored as numbers: the hundreds digit is the opcode (1 LDA, 2 ADD, 3 SUB, 4 STA, 5 OUT, 0 HLT), the rest is the address.</p>
        </Card>
      </div>

      {log.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-semibold">History</h2>
          <ol className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm text-stone-600">
            {log.map((l, i) => <li key={log.length - i}>{log.length - i}. {l}</li>)}
          </ol>
        </Card>
      )}
      <Challenge done={done || solved} title="Predict it: what will the “Subtract: 20 − 8” program output?">
        <p className="text-sm text-ink/70">Read the memory table for that program (LDA 6, SUB 7, …) and work it out before you run it.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[28, 12, 8, 20].map((n) => (
            <button key={n} onClick={() => setGuess(n)}
              className={`rounded-lg border-2 border-ink px-4 py-2 font-mono font-bold ${guess === n ? (n === 12 ? "bg-on text-white" : "bg-pink") : "bg-white hover:bg-hi"}`}>
              {n}
            </button>
          ))}
        </div>
        {guess !== null && guess !== 12 && <p className="mt-2 text-sm">Not quite — the ACC starts with memory[6] = 20, then SUB takes away memory[7]. Try again, or run it.</p>}
      </Challenge>
    </>
  );
}
