// The list of tools, used for the nav bar and the home page grid.
export const TOOLS = [
  { path: "/bases", short: "Bases", title: "Number bases", module: "Computer Systems Fundamentals", blurb: "Type a number and watch it convert between binary, octal, decimal and hex — with every step and two's complement." },
  { path: "/gates", short: "Gates", title: "Logic gates", module: "Computer Systems Fundamentals", blurb: "Drag gates onto a board, wire them up, flip the switches and get the truth table automatically." },
  { path: "/truth-table", short: "Truth tables", title: "Truth table builder", module: "Mathematics for Computing", blurb: "Type an expression like (A AND B) OR NOT C and get its full truth table, column by column." },
  { path: "/sets", short: "Sets", title: "Sets & Venn diagrams", module: "Mathematics for Computing", blurb: "Union, intersection, difference and complement for two or three sets, shaded live on a Venn diagram." },
  { path: "/cpu", short: "CPU", title: "Fetch–decode–execute", module: "Computer Systems Fundamentals", blurb: "Step through a tiny CPU running a program and watch the PC, MAR, MDR, CIR and ACC change." },
  { path: "/quiz", short: "Quiz", title: "Quiz mode", module: "Both modules", blurb: "Ten random questions across every topic, with instant feedback and a score." },
] as const;
