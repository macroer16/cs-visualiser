import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { TOOLS } from "./tools";

// Header + footer shared by every page.
export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-paper/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-mono text-xs text-white">01</span>
            CS Visualiser
          </Link>
          <nav className="flex gap-1 text-sm">
            {TOOLS.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-2.5 py-1.5 transition ${isActive ? "bg-ink text-white" : "text-stone-600 hover:bg-stone-200"}`
                }
              >
                {t.short}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200 py-6 text-sm text-stone-500">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4">
          <p>Built by Victor Benson, Computer Science student at the University of Westminster.</p>
          <Link to="/about" className="hover:text-ink">About</Link>
        </div>
      </footer>
    </div>
  );
}

// Page heading used at the top of every tool.
export function PageTitle({ title, intro, module }: { title: string; intro: string; module: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-wider text-accent">{module}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-stone-600">{intro}</p>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}
