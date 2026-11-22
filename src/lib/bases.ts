// Number base helpers that also return the working, so students can see each step.

export const BASES = [
  { base: 2, name: "Binary", digits: "0-1" },
  { base: 8, name: "Octal", digits: "0-7" },
  { base: 10, name: "Decimal", digits: "0-9" },
  { base: 16, name: "Hex", digits: "0-9, A-F" },
] as const;

const DIGITS = "0123456789ABCDEF";

export function isValid(text: string, base: number): boolean {
  const t = text.trim().toUpperCase().replace(/^-/, "");
  if (!t) return false;
  return [...t].every((c) => DIGITS.indexOf(c) >= 0 && DIGITS.indexOf(c) < base);
}

export function parseIn(text: string, base: number): number {
  const t = text.trim().toUpperCase();
  const neg = t.startsWith("-");
  let n = 0;
  for (const c of t.replace(/^-/, "")) n = n * base + DIGITS.indexOf(c);
  return neg ? -n : n;
}

// Steps for "base → decimal": each digit × base^position.
export function toDecimalSteps(text: string, base: number): string[] {
  const t = text.trim().toUpperCase().replace(/^-/, "");
  return [...t].map((c, i) => {
    const power = t.length - 1 - i;
    const value = DIGITS.indexOf(c);
    return `${c} × ${base}^${power} = ${value} × ${base ** power} = ${value * base ** power}`;
  });
}

// Steps for "decimal → base": repeated division, reading remainders bottom-up.
export function fromDecimalSteps(n: number, base: number): { line: string; remainder: string }[] {
  const steps: { line: string; remainder: string }[] = [];
  let x = Math.abs(n);
  if (x === 0) return [{ line: `0 ÷ ${base} = 0`, remainder: "0" }];
  while (x > 0) {
    const q = Math.floor(x / base);
    const r = x % base;
    steps.push({ line: `${x} ÷ ${base} = ${q} remainder ${r}`, remainder: DIGITS[r] });
    x = q;
  }
  return steps;
}

export function format(n: number, base: number): string {
  return (n < 0 ? "-" : "") + Math.abs(n).toString(base).toUpperCase();
}

// Pad binary into groups of 4 for readability: 101101 → 0010 1101
export function groupBits(bits: string, width?: number): string {
  const padded = width ? bits.padStart(width, "0") : bits.padStart(Math.ceil(bits.length / 4) * 4, "0");
  return padded.replace(/(.{4})(?=.)/g, "$1 ");
}

// Two's complement of a negative number at a given bit width, with the three steps.
export function twosComplement(n: number, width: number) {
  const magnitude = Math.abs(n);
  const positive = magnitude.toString(2).padStart(width, "0");
  const flipped = [...positive].map((b) => (b === "0" ? "1" : "0")).join("");
  const result = ((parseInt(flipped, 2) + 1) & ((1 << width) - 1)).toString(2).padStart(width, "0");
  const fits = magnitude <= 2 ** (width - 1);
  return { positive, flipped, result, fits };
}
