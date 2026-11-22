// Quiz questions: some are generated fresh each time (so there are endless variations),
// the rest come from a fixed bank. Each has an explanation shown after answering.

import { combinations, evaluate, parse } from "./boolean";

export type Question = { topic: string; prompt: string; options: string[]; answer: number; why: string };

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

// Builds a question with the correct answer mixed in among distinct wrong answers.
function make(topic: string, prompt: string, correct: string, wrong: string[], why: string): Question {
  const options = shuffle([correct, ...[...new Set(wrong)].filter((w) => w !== correct).slice(0, 3)]);
  return { topic, prompt, options, answer: options.indexOf(correct), why };
}

const generators: (() => Question)[] = [
  () => {
    const n = rand(10, 250);
    const b = n.toString(2);
    return make("Number bases", `What is ${n} in binary?`, b,
      [(n + 1).toString(2), (n - 1).toString(2), (n ^ 4).toString(2), (n * 2).toString(2)],
      `Divide by 2 repeatedly and read the remainders from bottom to top: ${n} = ${b}₂.`);
  },
  () => {
    const n = rand(16, 255);
    const h = n.toString(16).toUpperCase();
    return make("Number bases", `Convert ${n} to hexadecimal.`, h,
      [(n + 16).toString(16).toUpperCase(), (n - 1).toString(16).toUpperCase(), n.toString(8), (n + 1).toString(16).toUpperCase()],
      `${n} ÷ 16 = ${Math.floor(n / 16)} r ${n % 16}, so the digits are ${h}.`);
  },
  () => {
    const n = rand(5, 120);
    const b = n.toString(2).padStart(8, "0");
    return make("Number bases", `What is the binary number ${b} in decimal?`, String(n),
      [String(n + 1), String(n * 2), String(n - 2), String(n + 8)],
      `Add the place values of each 1 bit (128, 64, 32, 16, 8, 4, 2, 1): the total is ${n}.`);
  },
  () => {
    const n = rand(1, 100);
    const r = ((256 - n) & 255).toString(2).padStart(8, "0");
    const plain = n.toString(2).padStart(8, "0");
    const flipped = [...plain].map((c) => (c === "0" ? "1" : "0")).join("");
    return make("Two's complement", `What is −${n} in 8-bit two's complement?`, r,
      [flipped, plain, ((256 - n + 1) & 255).toString(2).padStart(8, "0"), "1" + plain.slice(1)],
      `Write ${n} in binary (${plain}), flip every bit (${flipped}), then add 1 → ${r}.`);
  },
  () => {
    const exprs = ["A AND B", "A OR B", "A XOR B", "A NAND B", "A NOR B", "NOT A OR B", "A AND NOT B"];
    const e = exprs[rand(0, exprs.length - 1)];
    const a = Math.random() < 0.5, b = Math.random() < 0.5;
    const out = evaluate(parse(e), { A: a, B: b }) ? "1" : "0";
    return make("Logic gates", `If A = ${+a} and B = ${+b}, what is ${e}?`, out, [out === "1" ? "0" : "1"],
      `Work it out step by step with A = ${+a}, B = ${+b}: the result is ${out}.`);
  },
  () => {
    const e = ["(A AND B) OR C", "A XOR B XOR C", "NOT (A OR B) AND C", "(A OR B) AND NOT C"][rand(0, 3)];
    const tree = parse(e);
    const ones = combinations(["A", "B", "C"]).filter((env) => evaluate(tree, env)).length;
    return make("Truth tables", `In the truth table for ${e}, how many rows output 1?`, String(ones),
      [String(ones + 1), String(Math.max(0, ones - 1)), String(8 - ones), String(ones + 2)],
      `With 3 inputs there are 2³ = 8 rows. Checking each one gives ${ones} rows that output 1.`);
  },
];

const bank: Question[] = [
  make("CPU", "Which register holds the address of the next instruction to fetch?", "Program Counter (PC)",
    ["Memory Data Register (MDR)", "Accumulator (ACC)", "Current Instruction Register (CIR)"],
    "The PC always points to the next instruction. It's copied to the MAR at the start of each fetch, then incremented."),
  make("CPU", "During the fetch stage, where does the instruction go straight after it arrives from memory?", "MDR",
    ["ACC", "PC", "ALU"], "Anything read from memory arrives in the Memory Data Register first, then is copied to the CIR."),
  make("CPU", "Which bus carries the address from the MAR to memory?", "Address bus",
    ["Data bus", "Control bus", "USB bus"], "The address bus is one-way, CPU to memory. The data bus carries the contents back."),
  make("Sets", "If A = {1, 2, 3} and B = {2, 3, 4}, what is A ∩ B?", "{2, 3}",
    ["{1, 2, 3, 4}", "{1}", "{4}"], "Intersection keeps only the elements in both sets."),
  make("Sets", "If A = {1, 2, 3} and B = {2, 3, 4}, what is A − B?", "{1}",
    ["{4}", "{2, 3}", "{1, 4}"], "A − B (difference) keeps what is in A but not in B."),
  make("Sets", "How many subsets does a set with 4 elements have?", "16",
    ["8", "4", "12"], "Each element is either in or out of a subset, so there are 2⁴ = 16 subsets."),
  make("Logic gates", "Which single gate type can be used to build every other gate?", "NAND",
    ["AND", "OR", "XOR"], "NAND (and NOR) are universal gates — e.g. NOT A = A NAND A."),
  make("Logic gates", "What does De Morgan's law say NOT (A AND B) equals?", "NOT A OR NOT B",
    ["NOT A AND NOT B", "A OR B", "A NOR B"], "Break the bar and change the sign: NOT (A AND B) = NOT A OR NOT B."),
  make("Number bases", "How many bits are in a byte, and in a nibble?", "8 and 4",
    ["4 and 8", "8 and 2", "16 and 8"], "A byte is 8 bits; a nibble is half a byte, 4 bits — exactly one hex digit."),
  make("Number bases", "What is the range of an 8-bit two's complement number?", "−128 to 127",
    ["0 to 255", "−127 to 127", "−256 to 255"], "The top bit is worth −128, so the range is −128 up to 127."),
];

export function newQuiz(count = 10): Question[] {
  const generated = Array.from({ length: 6 }, (_, i) => generators[i % generators.length]());
  return shuffle([...generated, ...shuffle(bank).slice(0, count - generated.length)]);
}
