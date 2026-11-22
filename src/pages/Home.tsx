import { Link } from "react-router-dom";
import { TOOLS } from "../components/tools";

const ICONS: Record<string, string> = {
  "/bases": "1011",
  "/gates": "&≥1",
  "/truth-table": "A·B",
  "/sets": "A∩B",
  "/cpu": "PC→",
  "/quiz": "?!",
};

export default function Home() {
  return (
    <>
      <section className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">First-year Computer Science</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">See it, click it, get it.</h1>
        <p className="mt-4 text-lg text-stone-600">
          Interactive tools for the topics that are hardest to picture from a lecture slide: binary, logic, sets and how a
          CPU actually runs a program. Free, no sign-up, works on your phone.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
          >
            <span className="w-fit rounded-lg bg-accent/10 px-2.5 py-1.5 font-mono text-sm font-semibold text-accent">
              {ICONS[t.path]}
            </span>
            <h2 className="mt-4 text-lg font-semibold">{t.title}</h2>
            <p className="mt-1 text-xs text-stone-500">{t.module}</p>
            <p className="mt-3 flex-1 text-sm text-stone-600">{t.blurb}</p>
            <span className="mt-4 text-sm font-medium text-accent">Open →</span>
          </Link>
        ))}
      </section>

      <p className="mt-10 text-sm text-stone-500">
        Made for the University of Westminster modules Mathematics for Computing and Computer Systems Fundamentals, but
        useful for any first-year CS course.
      </p>
    </>
  );
}
