import { useMemo, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import { Card, Challenge, PageTitle } from "../components/Layout";
import { markDone, useProgress } from "../lib/progress";

// ----- Model -----
type GateType = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR";
type Gate = { id: string; type: GateType; x: number; y: number };
type Wire = { from: string; to: string; port: number }; // from a source node to input `port` of a target
type Source = { id: string; x: number; y: number };

const GATE_TYPES: GateType[] = ["AND", "OR", "NOT", "NAND", "NOR", "XOR"];
const INPUT_NAMES = ["A", "B", "C"];
const OUTPUT_NAMES = ["Q", "R"];
const W = 80, H = 50;

const inputCount = (t: GateType) => (t === "NOT" ? 1 : 2);
const apply = (t: GateType, a: boolean, b: boolean) =>
  ({ AND: a && b, OR: a || b, NOT: !a, NAND: !(a && b), NOR: !(a || b), XOR: a !== b })[t];

// Fixed positions for the switches (left) and lamps (right).
const inputPos = (i: number, n: number): Source => ({ id: `in-${INPUT_NAMES[i]}`, x: 40, y: 250 + (i - (n - 1) / 2) * 110 });
const outputPos = (i: number) => ({ id: `out-${OUTPUT_NAMES[i]}`, x: 860, y: 190 + i * 130 });

// Where each port sits on the board.
const inPort = (g: Gate, port: number) => ({ x: g.x, y: g.y + (inputCount(g.type) === 1 ? 25 : port === 0 ? 15 : 35) });
const outPort = (g: Gate) => ({ x: g.x + W, y: g.y + 25 });

// Ready-made circuits to explore.
const PRESETS: { name: string; inputs: number; gates: Gate[]; wires: Wire[] }[] = [
  {
    name: "Half adder",
    inputs: 2,
    gates: [{ id: "g1", type: "XOR", x: 380, y: 165 }, { id: "g2", type: "AND", x: 380, y: 295 }],
    wires: [
      { from: "in-A", to: "g1", port: 0 }, { from: "in-B", to: "g1", port: 1 },
      { from: "in-A", to: "g2", port: 0 }, { from: "in-B", to: "g2", port: 1 },
      { from: "g1", to: "out-Q", port: 0 }, { from: "g2", to: "out-R", port: 0 },
    ],
  },
  {
    name: "XOR from NANDs",
    inputs: 2,
    gates: [
      { id: "g1", type: "NAND", x: 230, y: 225 }, { id: "g2", type: "NAND", x: 430, y: 140 },
      { id: "g3", type: "NAND", x: 430, y: 310 }, { id: "g4", type: "NAND", x: 630, y: 225 },
    ],
    wires: [
      { from: "in-A", to: "g1", port: 0 }, { from: "in-B", to: "g1", port: 1 },
      { from: "in-A", to: "g2", port: 0 }, { from: "g1", to: "g2", port: 1 },
      { from: "g1", to: "g3", port: 0 }, { from: "in-B", to: "g3", port: 1 },
      { from: "g2", to: "g4", port: 0 }, { from: "g3", to: "g4", port: 1 },
      { from: "g4", to: "out-Q", port: 0 },
    ],
  },
  {
    name: "Majority vote (3 inputs)",
    inputs: 3,
    gates: [
      { id: "g1", type: "AND", x: 260, y: 120 }, { id: "g2", type: "AND", x: 260, y: 225 },
      { id: "g3", type: "AND", x: 260, y: 330 }, { id: "g4", type: "OR", x: 470, y: 170 }, { id: "g5", type: "OR", x: 650, y: 225 },
    ],
    wires: [
      { from: "in-A", to: "g1", port: 0 }, { from: "in-B", to: "g1", port: 1 },
      { from: "in-B", to: "g2", port: 0 }, { from: "in-C", to: "g2", port: 1 },
      { from: "in-A", to: "g3", port: 0 }, { from: "in-C", to: "g3", port: 1 },
      { from: "g1", to: "g4", port: 0 }, { from: "g2", to: "g4", port: 1 },
      { from: "g4", to: "g5", port: 0 }, { from: "g3", to: "g5", port: 1 },
      { from: "g5", to: "out-Q", port: 0 },
    ],
  },
];

// ----- Simulation -----
function simulate(gates: Gate[], wires: Wire[], inputs: Record<string, boolean>) {
  const byId = new Map(gates.map((g) => [g.id, g]));
  const memo = new Map<string, boolean>();
  const value = (id: string, seen = new Set<string>()): boolean => {
    if (id.startsWith("in-")) return !!inputs[id.slice(3)];
    if (memo.has(id)) return memo.get(id)!;
    if (seen.has(id)) return false; // feedback loop: treat as 0
    seen.add(id);
    const g = byId.get(id);
    if (!g) return false;
    const inVal = (p: number) => {
      const w = wires.find((w) => w.to === id && w.port === p);
      return w ? value(w.from, seen) : false;
    };
    const v = apply(g.type, inVal(0), inVal(1));
    memo.set(id, v);
    return v;
  };
  const output = (name: string) => {
    const w = wires.find((w) => w.to === `out-${name}`);
    return w ? value(w.from) : null;
  };
  return { value, output };
}

// ----- Component -----
export default function Gates() {
  const [nInputs, setNInputs] = useState(2);
  const [gates, setGates] = useState<Gate[]>(PRESETS[0].gates);
  const [wires, setWires] = useState<Wire[]>(PRESETS[0].wires);
  const [inputs, setInputs] = useState<Record<string, boolean>>({ A: true, B: false, C: false });
  const [pending, setPending] = useState<string | null>(null); // source picked, waiting for a target
  const [selected, setSelected] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const nextId = useRef(100);

  const names = INPUT_NAMES.slice(0, nInputs);
  const sources = names.map((_, i) => inputPos(i, nInputs));
  const sim = simulate(gates, wires, inputs);
  const usedOutputs = OUTPUT_NAMES.filter((o) => wires.some((w) => w.to === `out-${o}`));

  // Convert a mouse/touch position into board coordinates.
  const toBoard = (clientX: number, clientY: number) => {
    const pt = svg.current!.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const p = pt.matrixTransform(svg.current!.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const addGate = (type: GateType, x = 420, y = 60 + (gates.length % 6) * 65) => {
    const id = `g${nextId.current++}`;
    setGates((gs) => [...gs, { id, type, x: Math.max(90, Math.min(x, 740)), y: Math.max(10, Math.min(y, 440)) }]);
    setSelected(id);
  };
  const removeGate = (id: string) => {
    setGates((gs) => gs.filter((g) => g.id !== id));
    setWires((ws) => ws.filter((w) => w.from !== id && w.to !== id));
    setSelected(null);
  };
  const connect = (to: string, port: number) => {
    if (!pending || pending === to) return;
    // Each input takes one wire, so a new wire replaces the old one.
    setWires((ws) => [...ws.filter((w) => !(w.to === to && w.port === port)), { from: pending, to, port }]);
    setPending(null);
  };
  const load = (p: (typeof PRESETS)[number]) => {
    setNInputs(p.inputs); setGates(p.gates.map((g) => ({ ...g }))); setWires([...p.wires]); setPending(null); setSelected(null);
  };

  const onPointerMove = (e: RPointerEvent) => {
    if (!drag.current) return;
    const p = toBoard(e.clientX, e.clientY);
    const { id, dx, dy } = drag.current;
    setGates((gs) => gs.map((g) => (g.id === id ? { ...g, x: Math.max(90, Math.min(p.x - dx, 740)), y: Math.max(10, Math.min(p.y - dy, 440)) } : g)));
  };

  // Truth table: try every combination of the switches.
  const table = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 1 << nInputs; i++) {
      const env: Record<string, boolean> = {};
      names.forEach((n, j) => (env[n] = ((i >> (nInputs - 1 - j)) & 1) === 1));
      const s = simulate(gates, wires, env);
      rows.push({ env, outs: usedOutputs.map((o) => s.output(o)) });
    }
    return rows;
  }, [gates, wires, nInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Challenge: make lamp Q behave like XOR using only AND, OR and NOT.
  const done = useProgress().includes("/gates");
  const qIndex = usedOutputs.indexOf("Q");
  const solved = nInputs === 2 && qIndex >= 0 && gates.length > 0 &&
    gates.every((g) => g.type === "AND" || g.type === "OR" || g.type === "NOT") &&
    table.every((r) => !!r.outs[qIndex] === (r.env.A !== r.env.B));
  if (solved && !done) markDone("/gates");

  const pos = (id: string) => {
    if (id.startsWith("in-")) { const s = sources.find((s) => s.id === id); return s ? { x: s.x + 30, y: s.y } : null; }
    const g = gates.find((g) => g.id === id);
    return g ? outPort(g) : null;
  };
  const target = (w: Wire) => {
    if (w.to.startsWith("out-")) { const o = outputPos(OUTPUT_NAMES.indexOf(w.to.slice(4))); return { x: o.x - 28, y: o.y }; }
    const g = gates.find((g) => g.id === w.to);
    return g ? inPort(g, w.port) : null;
  };

  return (
    <>
      <PageTitle
        n="02"
        module="Computer Systems Fundamentals"
        title="Logic gates"
        intro="Drag gates onto the board (or tap to add). To wire: click an output dot, then an input dot. Click the switches to flip inputs — green means 1."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {GATE_TYPES.map((t) => (
          <button key={t} draggable onDragStart={(e) => e.dataTransfer.setData("gate", t)} onClick={() => addGate(t)}
            className="cursor-grab rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm font-semibold shadow-sm hover:border-accent">
            + {t}
          </button>
        ))}
        <span className="mx-2 h-6 w-px bg-stone-300" />
        <label className="text-sm">Inputs{" "}
          <select value={nInputs} onChange={(e) => { const n = Number(e.target.value); setNInputs(n); setWires((ws) => ws.filter((w) => !w.from.startsWith("in-") || INPUT_NAMES.indexOf(w.from.slice(3)) < n)); }}
            className="rounded-md border border-stone-300 px-2 py-1">
            <option>1</option><option>2</option><option>3</option>
          </select>
        </label>
        <select onChange={(e) => { const p = PRESETS.find((p) => p.name === e.target.value); if (p) load(p); e.target.value = ""; }}
          defaultValue="" className="rounded-md border border-stone-300 px-2 py-1 text-sm">
          <option value="" disabled>Load an example…</option>
          {PRESETS.map((p) => <option key={p.name}>{p.name}</option>)}
        </select>
        <button onClick={() => { setGates([]); setWires([]); setPending(null); }} className="rounded-md px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-200">Clear board</button>
      </div>

      <Card className="p-2">
        <svg
          ref={svg}
          viewBox="0 0 900 500"
          className="w-full touch-none select-none"
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const t = e.dataTransfer.getData("gate") as GateType; if (t) { const p = toBoard(e.clientX, e.clientY); addGate(t, p.x - W / 2, p.y - H / 2); } }}
          onClick={() => { setPending(null); setSelected(null); }}
          onKeyDown={(e) => { if ((e.key === "Delete" || e.key === "Backspace") && selected) removeGate(selected); if (e.key === "Escape") setPending(null); }}
          tabIndex={0}
          role="application"
          aria-label="Logic gate board"
        >
          <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#e7e5e4" /></pattern>
          <rect width="900" height="500" fill="url(#dots)" />

          {/* Wires (click one to delete it) */}
          {wires.map((w, i) => {
            const a = pos(w.from), b = target(w);
            if (!a || !b) return null;
            const on = sim.value(w.from);
            const mid = (a.x + b.x) / 2;
            const d = `M${a.x},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}`;
            return (
              <g key={i} onClick={(e) => { e.stopPropagation(); setWires((ws) => ws.filter((_, j) => j !== i)); }} className="cursor-pointer">
                <path d={d} stroke="transparent" strokeWidth="14" fill="none" />
                <path d={d} stroke={on ? "#16a34a" : "#78716c"} strokeWidth={on ? 3.5 : 2.5} fill="none" />
              </g>
            );
          })}

          {/* Input switches */}
          {sources.map((s, i) => {
            const on = inputs[names[i]];
            return (
              <g key={s.id}>
                <g onClick={(e) => { e.stopPropagation(); setInputs({ ...inputs, [names[i]]: !on }); }} className="cursor-pointer"
                  role="switch" aria-checked={on} aria-label={`Input ${names[i]}`}>
                  <rect x={s.x - 28} y={s.y - 22} width="44" height="44" rx="10" fill={on ? "#16a34a" : "#fff"} stroke="#1c1917" strokeWidth="2" />
                  <text x={s.x - 6} y={s.y + 6} textAnchor="middle" className={`font-mono text-lg font-bold ${on ? "fill-white" : "fill-ink"}`}>{on ? 1 : 0}</text>
                  <text x={s.x - 6} y={s.y - 30} textAnchor="middle" className="fill-ink font-bold">{names[i]}</text>
                </g>
                <Port x={s.x + 30} y={s.y} active={pending === s.id} on={on}
                  onClick={() => setPending(pending === s.id ? null : s.id)} label={`Output of input ${names[i]}`} />
              </g>
            );
          })}

          {/* Gates */}
          {gates.map((g) => {
            const out = sim.value(g.id);
            return (
              <g key={g.id}>
                <g transform={`translate(${g.x},${g.y})`}
                  onPointerDown={(e) => { e.stopPropagation(); const p = toBoard(e.clientX, e.clientY); drag.current = { id: g.id, dx: p.x - g.x, dy: p.y - g.y }; setSelected(g.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-move">
                  <GateShape type={g.type} on={out} selected={selected === g.id} />
                  <text x="40" y="66" textAnchor="middle" className="fill-stone-500 font-mono text-[11px]">{g.type}</text>
                </g>
                {selected === g.id && (
                  <g onClick={(e) => { e.stopPropagation(); removeGate(g.id); }} className="cursor-pointer" aria-label="Delete gate">
                    <circle cx={g.x + W - 4} cy={g.y - 6} r="9" fill="#dc2626" />
                    <text x={g.x + W - 4} y={g.y - 2} textAnchor="middle" className="fill-white text-xs font-bold">×</text>
                  </g>
                )}
                {Array.from({ length: inputCount(g.type) }, (_, p) => {
                  const pt = inPort(g, p);
                  return <Port key={p} x={pt.x} y={pt.y} hint={!!pending} onClick={() => connect(g.id, p)} label={`Input ${p + 1} of ${g.type}`} />;
                })}
                <Port x={outPort(g).x} y={outPort(g).y} active={pending === g.id} on={out}
                  onClick={() => setPending(pending === g.id ? null : g.id)} label={`Output of ${g.type}`} />
              </g>
            );
          })}

          {/* Output lamps */}
          {OUTPUT_NAMES.map((o, i) => {
            const p = outputPos(i);
            const v = sim.output(o);
            return (
              <g key={o}>
                <Port x={p.x - 28} y={p.y} hint={!!pending} onClick={() => connect(`out-${o}`, 0)} label={`Output lamp ${o}`} />
                <circle cx={p.x} cy={p.y} r="20" fill={v ? "#facc15" : "#fff"} stroke="#1c1917" strokeWidth="2" />
                {v && <circle cx={p.x} cy={p.y} r="30" fill="#facc15" opacity="0.25" />}
                <text x={p.x} y={p.y - 30} textAnchor="middle" className="fill-ink font-bold">{o}</text>
              </g>
            );
          })}
        </svg>
      </Card>

      <p className="mt-2 text-sm text-stone-500">
        {pending ? "Now click an input dot (left side of a gate, or a lamp) to connect. Esc cancels." : "Tip: click a wire to delete it; select a gate and press Delete (or the red ×) to remove it."}
      </p>

      <Card className="mt-6 overflow-x-auto">
        <h2 className="font-semibold">Truth table (generated from your circuit)</h2>
        {usedOutputs.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Wire something into lamp Q or R to see its truth table.</p>
        ) : (
          <table className="mt-3 text-center font-mono text-sm">
            <thead>
              <tr className="border-b-2 border-stone-300">
                {names.map((n) => <th key={n} className="px-4 py-1.5">{n}</th>)}
                {usedOutputs.map((o) => <th key={o} className="bg-accent/10 px-4 py-1.5 text-accent">{o}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.map((r, i) => {
                const current = names.every((n) => r.env[n] === !!inputs[n]);
                return (
                  <tr key={i} className={`border-b border-stone-100 ${current ? "bg-yellow-50 font-semibold" : ""}`}>
                    {names.map((n) => <td key={n} className="px-4 py-1">{+r.env[n]}</td>)}
                    {r.outs.map((v, j) => <td key={j} className={`px-4 py-1 ${v ? "text-on" : ""}`}>{+!!v}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-stone-500">The highlighted row matches the switches right now.</p>
      </Card>

      <Challenge done={done || solved} title="Build XOR using only AND, OR and NOT gates.">
        <p className="text-sm text-ink/70">
          Clear the board, use 2 inputs, and wire your circuit into lamp Q. Q should light when exactly one switch is on. The truth
          table above checks every case for you. Hint: (A OR B) AND NOT (A AND B).
        </p>
      </Challenge>
    </>
  );
}

// A connection dot. Enlarged invisible hit area makes it easy to tap on a phone.
function Port({ x, y, onClick, active, on, hint, label }: { x: number; y: number; onClick: () => void; active?: boolean; on?: boolean; hint?: boolean; label: string }) {
  return (
    <g onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerDown={(e) => e.stopPropagation()} className="cursor-crosshair" aria-label={label}>
      <circle cx={x} cy={y} r="13" fill="transparent" />
      <circle cx={x} cy={y} r={active || hint ? 7 : 5.5} fill={active ? "#1d4ed8" : on ? "#16a34a" : "#fff"} stroke={hint ? "#1d4ed8" : "#1c1917"} strokeWidth="2" />
    </g>
  );
}

// Standard (ANSI) gate symbols, drawn in an 80×50 box.
function GateShape({ type, on, selected }: { type: GateType; on: boolean; selected: boolean }) {
  const stroke = selected ? "#1d4ed8" : "#1c1917";
  const fill = on ? "#dcfce7" : "#fff";
  const bubble = type === "NOT" || type === "NAND" || type === "NOR";
  const twoInputs = type !== "NOT";
  const body = {
    AND: "M12,5 H38 A20,20 0 0 1 38,45 H12 Z",
    NAND: "M12,5 H38 A20,20 0 0 1 38,45 H12 Z",
    OR: "M10,5 Q34,5 62,25 Q34,45 10,45 Q22,25 10,5 Z",
    NOR: "M10,5 Q34,5 62,25 Q34,45 10,45 Q22,25 10,5 Z",
    XOR: "M14,5 Q38,5 64,25 Q38,45 14,45 Q26,25 14,5 Z",
    NOT: "M14,5 L58,25 L14,45 Z",
  }[type];
  const end = type === "NOT" ? 58 : type === "XOR" ? 64 : type.includes("AND") ? 58 : 62;
  return (
    <g>
      {twoInputs ? (
        <>
          <line x1="0" y1="15" x2="16" y2="15" stroke={stroke} strokeWidth="2" />
          <line x1="0" y1="35" x2="16" y2="35" stroke={stroke} strokeWidth="2" />
        </>
      ) : (
        <line x1="0" y1="25" x2="14" y2="25" stroke={stroke} strokeWidth="2" />
      )}
      <path d={body} fill={fill} stroke={stroke} strokeWidth="2" />
      {type === "XOR" && <path d="M7,5 Q19,25 7,45" fill="none" stroke={stroke} strokeWidth="2" />}
      {bubble && <circle cx={end + 4} cy="25" r="4" fill="#fff" stroke={stroke} strokeWidth="2" />}
      <line x1={bubble ? end + 8 : end} y1="25" x2="80" y2="25" stroke={stroke} strokeWidth="2" />
    </g>
  );
}
