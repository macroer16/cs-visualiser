import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { TOOLS } from "./tools";
import { useProgress } from "../lib/progress";

// Header + footer shared by every page.
export default function Layout() {
  const { pathname } = useLocation();
  const done = useProgress();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-3">
          <Link to="/" className="shrink-0 text-xl font-extrabold tracking-tight">
            cs<span className="text-accent">/</span>visualiser
          </Link>
          <nav className="flex gap-1 font-mono text-[13px]">
            {TOOLS.map((t) => (
              <NavLink key={t.path} to={t.path}
                className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 transition ${isActive ? "bg-ink text-paper" : "hover:bg-hi"}`}>
                <span className="opacity-60">{t.n}</span>
                {t.short}
                {done.includes(t.path) && <span className="text-on" aria-label="completed">✓</span>}
              </NavLink>
            ))}
          </nav>
          <span className="ml-auto hidden shrink-0 font-mono text-xs text-ink/60 md:block">{done.length}/6 done</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-5 text-sm">
          <p>Made by <a href="https://victor-benson.vercel.app" className="font-semibold underline decoration-accent decoration-2 underline-offset-2">Victor Benson</a>, first-year CS at the University of Westminster.</p>
          <Link to="/about" className="underline underline-offset-2">About</Link>
        </div>
      </footer>
    </div>
  );
}

// Chapter heading: big outlined number, title, one-line intro.
export function PageTitle({ n, title, intro, module }: { n?: string; title: string; intro: string; module: string }) {
  return (
    <div className="mb-8 flex items-start gap-5">
      {n && (
        <span aria-hidden className="hidden select-none font-extrabold leading-[0.8] text-transparent sm:block"
          style={{ fontSize: 96, WebkitTextStroke: "2px var(--color-ink)" }}>{n}</span>
      )}
      <div className="max-w-3xl">
        <p className="font-mono text-xs text-ink/60">{n ? `chapter ${n} · ` : ""}{module}</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-lg text-ink/75">{intro}</p>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`sheet p-5 ${className}`}>{children}</div>;
}

// A small task at the end of each chapter. Completing it ticks the chapter off.
export function Challenge({ done, title, children }: { done: boolean; title: string; children: ReactNode }) {
  return (
    <section className={`sheet mt-8 p-5 ${done ? "bg-[#e9f8ef]" : "bg-hi/40"}`} aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs font-bold uppercase tracking-wider">{done ? "✓ challenge complete" : "challenge"}</p>
        {done && <span className="font-hand text-2xl text-on">nice one!</span>}
      </div>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
