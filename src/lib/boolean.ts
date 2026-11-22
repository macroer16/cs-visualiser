// A small boolean-expression parser (recursive descent).
// Supports: AND OR NOT XOR NAND NOR, symbols & | ! ^ ¬ ∧ ∨ ' (postfix NOT), and brackets.
// Precedence (high → low): NOT, AND/NAND, XOR, OR/NOR.

export type Node =
  | { kind: "var"; name: string }
  | { kind: "const"; value: boolean }
  | { kind: "not"; arg: Node }
  | { kind: "bin"; op: "AND" | "OR" | "XOR" | "NAND" | "NOR"; left: Node; right: Node };

type Token = { type: "var" | "op" | "lp" | "rp" | "const" | "post"; value: string };

const WORD_OPS = ["AND", "OR", "NOT", "XOR", "NAND", "NOR"];
const SYMBOLS: Record<string, string> = {
  "&": "AND", "∧": "AND", "·": "AND", "*": "AND", "∩": "AND",
  "|": "OR", "∨": "OR", "+": "OR", "∪": "OR",
  "!": "NOT", "¬": "NOT", "~": "NOT",
  "^": "XOR", "⊕": "XOR",
};

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "(") { tokens.push({ type: "lp", value: c }); i++; continue; }
    if (c === ")") { tokens.push({ type: "rp", value: c }); i++; continue; }
    if (c === "'") { tokens.push({ type: "post", value: "NOT" }); i++; continue; }
    if (c === "0" || c === "1") { tokens.push({ type: "const", value: c }); i++; continue; }
    if (SYMBOLS[c]) { tokens.push({ type: "op", value: SYMBOLS[c] }); i++; continue; }
    if (/[A-Za-z]/.test(c)) {
      let word = "";
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) word += src[i++];
      const upper = word.toUpperCase();
      if (WORD_OPS.includes(upper)) tokens.push({ type: "op", value: upper });
      else if (upper === "TRUE" || upper === "FALSE") tokens.push({ type: "const", value: upper === "TRUE" ? "1" : "0" });
      else tokens.push({ type: "var", value: word.toUpperCase() });
      continue;
    }
    throw new Error(`Unexpected character "${c}"`);
  }
  return tokens;
}

export function parse(src: string): Node {
  const tokens = tokenize(src);
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (...ops: string[]) => peek()?.type === "op" && ops.includes(peek().value);

  function parseOr(): Node {
    let left = parseXor();
    while (isOp("OR", "NOR")) {
      const op = tokens[pos++].value as "OR" | "NOR";
      left = { kind: "bin", op, left, right: parseXor() };
    }
    return left;
  }
  function parseXor(): Node {
    let left = parseAnd();
    while (isOp("XOR")) {
      pos++;
      left = { kind: "bin", op: "XOR", left, right: parseAnd() };
    }
    return left;
  }
  function parseAnd(): Node {
    let left = parseNot();
    while (isOp("AND", "NAND")) {
      const op = tokens[pos++].value as "AND" | "NAND";
      left = { kind: "bin", op, left, right: parseNot() };
    }
    return left;
  }
  function parseNot(): Node {
    if (isOp("NOT")) { pos++; return { kind: "not", arg: parseNot() }; }
    let node = parseAtom();
    while (peek()?.type === "post") { pos++; node = { kind: "not", arg: node }; }
    return node;
  }
  function parseAtom(): Node {
    const t = peek();
    if (!t) throw new Error("Expression ends too early");
    if (t.type === "var") { pos++; return { kind: "var", name: t.value }; }
    if (t.type === "const") { pos++; return { kind: "const", value: t.value === "1" }; }
    if (t.type === "lp") {
      pos++;
      const inner = parseOr();
      if (peek()?.type !== "rp") throw new Error("Missing closing bracket");
      pos++;
      return inner;
    }
    throw new Error(`Unexpected "${t.value}"`);
  }

  const tree = parseOr();
  if (pos < tokens.length) throw new Error(`Unexpected "${tokens[pos].value}"`);
  return tree;
}

export function evaluate(node: Node, env: Record<string, boolean>): boolean {
  switch (node.kind) {
    case "var": return !!env[node.name];
    case "const": return node.value;
    case "not": return !evaluate(node.arg, env);
    case "bin": {
      const a = evaluate(node.left, env);
      const b = evaluate(node.right, env);
      if (node.op === "AND") return a && b;
      if (node.op === "OR") return a || b;
      if (node.op === "XOR") return a !== b;
      if (node.op === "NAND") return !(a && b);
      return !(a || b); // NOR
    }
  }
}

export function variables(node: Node, out = new Set<string>()): string[] {
  if (node.kind === "var") out.add(node.name);
  if (node.kind === "not") variables(node.arg, out);
  if (node.kind === "bin") { variables(node.left, out); variables(node.right, out); }
  return [...out].sort();
}

// Every combination of inputs, in binary counting order (000, 001, 010 ...).
export function combinations(vars: string[]): Record<string, boolean>[] {
  const rows: Record<string, boolean>[] = [];
  for (let i = 0; i < 1 << vars.length; i++) {
    const env: Record<string, boolean> = {};
    vars.forEach((v, j) => (env[v] = ((i >> (vars.length - 1 - j)) & 1) === 1));
    rows.push(env);
  }
  return rows;
}

// Readable string version of a tree, with brackets only where needed.
export function toText(node: Node): string {
  if (node.kind === "var") return node.name;
  if (node.kind === "const") return node.value ? "1" : "0";
  if (node.kind === "not") {
    const inner = toText(node.arg);
    return node.arg.kind === "var" || node.arg.kind === "const" ? `NOT ${inner}` : `NOT (${inner})`;
  }
  return `(${toText(node.left)} ${node.op} ${toText(node.right)})`;
}

// Sub-expressions (for extra truth-table columns), smallest first, no duplicates.
export function subExpressions(node: Node): Node[] {
  const list: Node[] = [];
  const seen = new Set<string>();
  const walk = (n: Node) => {
    if (n.kind === "not") walk(n.arg);
    if (n.kind === "bin") { walk(n.left); walk(n.right); }
    if (n.kind !== "var" && n.kind !== "const") {
      const key = toText(n);
      if (!seen.has(key)) { seen.add(key); list.push(n); }
    }
  };
  walk(node);
  return list;
}
