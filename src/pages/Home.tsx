import { useState } from "react";
import { Link } from "react-router-dom";
import { TOOLS } from "../components/tools";
import { useProgress } from "../lib/progress";

// The hook: eight switches you can flip right away. Then the path from bits to a CPU.
const PLACE = [128, 64, 32, 16, 8, 4, 2, 1];

function Switches() {
  const [bits, setBits] = useState([0, 0, 1, 0, 1, 0, 1, 0]); // 42
  const value = bits.reduce((s, b, i) => s + b * PLACE[i], 0);
  const flip = (i: number) => setBits(bits.map((b, j) => (j === i ? 1 - b : b)));

  return (
    <div className="sheet p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="font-mono text-xs text-ink/60">click the switches ↓</p>
        <p className="text-right">
          <span className="block font-mono text-xs text-ink/60">= decimal</span>
          <span className="text-6xl font-extrabold tabular-nums leading-none">{value}</span>
        </p>
      </div>
      <div className="mt-5 grid grid-cols-8 gap-1.5 sm:gap-3">
        {bits.map((b, i) => (
          <button key={i} onClick={() => flip(i)} aria-pressed={!!b} aria-label={`Bit worth ${PLACE[i]}`}
            className="group flex flex-col items-center gap-2">
            <span className={`relative h-16 w-full rounded-lg border-2 border-ink transition sm:h-20 ${b ? "bg-on" : "bg-white"}`}>
              <span className={`absolute left-1/2 h-6 w-[60%] -translate-x-1/2 rounded-md border-2 border-ink bg-white transition-all sm:h-7 ${b ? "top-1" : "bottom-1"}`} />
            </span>
            <span className="font-mono text-lg font-bold">{b}</span>
            <span className="font-mono text-[10px] text-ink/50 sm:text-xs">{PLACE[i]}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink/70">
        {value === 0 ? "All off: that's zero." : (
          <>Add up the place values of the switches that are on: {PLACE.filter((_, i) => bits[i]).join(" + ")} = <b>{value}</b>. That&apos;s binary.</>
        )}
      </p>
    </div>
  );
}

export default function Home() {
  const done = useProgress();
  const next = TOOLS.find((t) => !done.includes(t.path)) ?? TOOLS[0];

  return (
    <>
      <section className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-hand text-2xl text-accent">first-year computer science, but you can touch it</p>
          <h1 className="mt-2 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            From a <span className="hl">switch</span> to a working <span className="hl">CPU</span>.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink/75">
            Six short chapters. Flip bits, wire gates, shade Venn diagrams and step through a processor — each one ends with a small
            challenge. No sign-up. Your progress saves in this browser.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to={next.path} className="sheet inline-block bg-accent px-5 py-3 font-semibold text-white transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--color-ink)]">
              {done.length === 0 ? "Start chapter 01 →" : done.length === 6 ? "Revisit chapter 01 →" : `Continue: chapter ${next.n} →`}
            </Link>
            <span className="font-mono text-sm text-ink/60">{done.length}/6 challenges done</span>
          </div>
        </div>
        <Switches />
      </section>

      <section className="mt-20">
        <h2 className="text-3xl font-extrabold tracking-tight">The path</h2>
        <ol className="relative mt-8 space-y-5 border-l-2 border-dashed border-ink/40 pl-8 sm:pl-10">
          {TOOLS.map((t) => {
            const isDone = done.includes(t.path);
            return (
              <li key={t.path} className="relative">
                <span className={`absolute -left-[49px] top-3 grid h-8 w-8 place-items-center rounded-full border-2 border-ink font-mono text-xs font-bold sm:-left-[57px] ${isDone ? "bg-on text-white" : "bg-white"}`}>
                  {isDone ? "✓" : t.n}
                </span>
                <Link to={t.path} className="sheet group block p-5 transition hover:-translate-y-0.5 hover:bg-hi/30">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-2xl font-extrabold tracking-tight">{t.title}</h3>
                    <span className="font-mono text-xs text-ink/55">{t.module}</span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-ink/75">{t.blurb}</p>
                  <span className="mt-3 inline-block font-mono text-sm font-bold text-accent group-hover:underline">{isDone ? "done — revisit" : "open chapter"} →</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="mt-14 max-w-2xl text-ink/70">
        Built for the University of Westminster modules <i>Mathematics for Computing</i> and <i>Computer Systems Fundamentals</i>, but it
        works for any first-year course. <Link to="/about" className="underline underline-offset-2">Why I made it →</Link>
      </p>
    </>
  );
}
