// A tiny accumulator CPU (like the Little Man Computer) that runs one micro-step at a time,
// so the fetch-decode-execute cycle can be animated register by register.

export const OPCODES = { HLT: 0, LDA: 1, ADD: 2, SUB: 3, STA: 4, OUT: 5 } as const;
export type Mnemonic = keyof typeof OPCODES;
const NAMES = Object.keys(OPCODES) as Mnemonic[];

// Each memory cell holds opcode * 100 + address, e.g. 108 = LDA 8.
export const encode = (op: Mnemonic, addr = 0) => OPCODES[op] * 100 + addr;
export const decode = (word: number) => ({ op: NAMES[Math.floor(word / 100)] ?? "HLT", addr: word % 100 });

export type Register = "PC" | "MAR" | "MDR" | "CIR" | "ACC";
export type Phase = "fetch" | "decode" | "execute" | "halted";

export type CpuState = {
  PC: number; MAR: number; MDR: number; CIR: number; ACC: number;
  memory: number[];
  output: number[];
  phase: Phase;
  micro: number;          // which micro-step of the current phase we're on
  changed: Register[];    // registers touched by the last step (for highlighting)
  bus: "address" | "data" | null;
  memHighlight: number | null;
  explanation: string;
};

// Example program: load two numbers, add them, store and output the result.
export const SAMPLE: { label: string; memory: number[] } = {
  label: "Add two numbers: 7 + 5",
  memory: [encode("LDA", 6), encode("ADD", 7), encode("STA", 8), encode("OUT"), encode("HLT"), 0, 7, 5, 0, 0],
};

export const SUBTRACT: { label: string; memory: number[] } = {
  label: "Subtract: 20 − 8",
  memory: [encode("LDA", 6), encode("SUB", 7), encode("STA", 8), encode("OUT"), encode("HLT"), 0, 20, 8, 0, 0],
};

export function initial(memory: number[]): CpuState {
  return {
    PC: 0, MAR: 0, MDR: 0, CIR: 0, ACC: 0,
    memory: [...memory], output: [],
    phase: "fetch", micro: 0, changed: [], bus: null, memHighlight: null,
    explanation: "Press Step to begin. The Program Counter (PC) holds 0, the address of the first instruction.",
  };
}

export function step(s: CpuState): CpuState {
  const n: CpuState = { ...s, memory: [...s.memory], output: [...s.output], changed: [], bus: null, memHighlight: null };
  if (s.phase === "halted") return { ...n, explanation: "The CPU has halted. Press Reset to run again." };

  if (s.phase === "fetch") {
    if (s.micro === 0) {
      n.MAR = s.PC; n.changed = ["MAR"]; n.bus = "address"; n.micro = 1;
      n.explanation = `FETCH 1: copy the PC (${s.PC}) into the Memory Address Register. The address bus carries it to memory.`;
    } else if (s.micro === 1) {
      n.MDR = s.memory[s.MAR]; n.changed = ["MDR"]; n.bus = "data"; n.memHighlight = s.MAR; n.micro = 2;
      n.explanation = `FETCH 2: memory sends the contents of address ${s.MAR} (${s.memory[s.MAR]}) along the data bus into the Memory Data Register.`;
    } else if (s.micro === 2) {
      n.CIR = s.MDR; n.changed = ["CIR"]; n.micro = 3;
      n.explanation = `FETCH 3: copy the MDR into the Current Instruction Register, so the CPU can work out what it means.`;
    } else {
      n.PC = s.PC + 1; n.changed = ["PC"]; n.phase = "decode"; n.micro = 0;
      n.explanation = `FETCH 4: increment the PC to ${s.PC + 1}, ready for the next instruction.`;
    }
    return n;
  }

  const { op, addr } = decode(s.CIR);

  if (s.phase === "decode") {
    n.phase = "execute"; n.changed = ["CIR"];
    const meaning: Record<Mnemonic, string> = {
      LDA: `load the value at address ${addr} into the accumulator`,
      ADD: `add the value at address ${addr} to the accumulator`,
      SUB: `subtract the value at address ${addr} from the accumulator`,
      STA: `store the accumulator into address ${addr}`,
      OUT: "output the accumulator",
      HLT: "stop the program",
    };
    n.explanation = `DECODE: the control unit splits ${s.CIR} into opcode ${OPCODES[op]} (${op}) and address ${addr}. It means: ${meaning[op]}.`;
    return n;
  }

  // EXECUTE — memory instructions take two micro-steps (address, then data).
  if (op === "HLT") {
    n.phase = "halted";
    n.explanation = "EXECUTE: HLT — the program is finished.";
    return n;
  }
  if (op === "OUT") {
    n.output.push(s.ACC); n.phase = "fetch"; n.changed = ["ACC"];
    n.explanation = `EXECUTE: OUT — the accumulator value ${s.ACC} is sent to the output.`;
    return n;
  }
  if (s.micro === 0) {
    n.MAR = addr; n.changed = ["MAR"]; n.bus = "address"; n.micro = 1;
    n.explanation = `EXECUTE 1: put the operand address ${addr} into the MAR.`;
    return n;
  }
  n.micro = 0; n.phase = "fetch";
  if (op === "STA") {
    n.MDR = s.ACC; n.memory[addr] = s.ACC; n.changed = ["MDR"]; n.bus = "data"; n.memHighlight = addr;
    n.explanation = `EXECUTE 2: copy the ACC (${s.ACC}) into the MDR and write it to memory address ${addr}.`;
    return n;
  }
  const value = s.memory[addr];
  n.MDR = value; n.bus = "data"; n.memHighlight = addr;
  if (op === "LDA") n.ACC = value;
  if (op === "ADD") n.ACC = s.ACC + value;
  if (op === "SUB") n.ACC = s.ACC - value;
  n.changed = ["MDR", "ACC"];
  n.explanation =
    op === "LDA"
      ? `EXECUTE 2: read ${value} from address ${addr} into the MDR, then load it into the ACC.`
      : `EXECUTE 2: read ${value} from address ${addr}. The ALU calculates ${s.ACC} ${op === "ADD" ? "+" : "−"} ${value} = ${n.ACC} and stores it in the ACC.`;
  return n;
}

export const describe = (word: number) => {
  const { op, addr } = decode(word);
  return op === "HLT" && word === 0 ? "HLT / 0" : op === "OUT" || op === "HLT" ? op : `${op} ${addr}`;
};
