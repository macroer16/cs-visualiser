// The chapters, in learning order: from a single bit up to a working CPU.
export const TOOLS = [
  { n: "01", path: "/bases", short: "bits", title: "Bits & number bases", module: "Computer Systems Fundamentals", blurb: "Everything in a computer is a row of switches. Learn to read them in binary, octal, decimal and hex — and how negatives work." },
  { n: "02", path: "/gates", short: "gates", title: "Logic gates", module: "Computer Systems Fundamentals", blurb: "Wire switches into AND, OR and NOT gates and watch the lamps. Then build XOR yourself." },
  { n: "03", path: "/truth-table", short: "truth tables", title: "Truth tables", module: "Mathematics for Computing", blurb: "Type any Boolean expression and see every possible input at once." },
  { n: "04", path: "/sets", short: "sets", title: "Sets & Venn diagrams", module: "Mathematics for Computing", blurb: "The same logic, drawn as circles: union, intersection, difference and complement." },
  { n: "05", path: "/cpu", short: "the cpu", title: "Fetch, decode, execute", module: "Computer Systems Fundamentals", blurb: "Put it all together: watch a tiny CPU run a real program, one register at a time." },
  { n: "06", path: "/quiz", short: "final test", title: "The final test", module: "Both modules", blurb: "Ten questions across every chapter. Numbers change every time." },
] as const;

export type ChapterPath = (typeof TOOLS)[number]["path"];
