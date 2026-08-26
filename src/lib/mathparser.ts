// Recursive-descent expression parser — no eval() used on user input.
// Extended with: inverse hyperbolic, combinatorics, GCD/LCM, memory variables,
// gradian mode, assignment expressions, and more.

import { gcd, lcm, nPr, nCr } from "./calcengine";

// ── Types ─────────────────────────────────────────────────────────────

export type AngleMode = "deg" | "rad" | "gra";

export interface ParseContext {
  variables: Record<string, number>;
}

type TokenKind =
  | "number"
  | "plus"
  | "minus"
  | "star"
  | "slash"
  | "percent"
  | "caret"
  | "lparen"
  | "rparen"
  | "comma"
  | "semicolon"
  | "name"
  | "equals"
  | "eof";

interface Token {
  kind: TokenKind;
  value: string;
  pos: number;
}

interface Parser {
  tokens: Token[];
  pos: number;
  angleMode: AngleMode;
  ctx: ParseContext;
}

// ── Tokenizer ──────────────────────────────────────────────────────────

const NAME_RE = /[a-zA-Z_][a-zA-Z0-9_]*/y;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    const start = i;

    if (ch >= "0" && ch <= "9") {
      let j = i + 1;
      while (j < input.length && input[j] >= "0" && input[j] <= "9") j++;
      if (j < input.length && input[j] === ".") {
        j++;
        while (j < input.length && input[j] >= "0" && input[j] <= "9") j++;
      }
      if (
        j < input.length &&
        (input[j] === "e" || input[j] === "E")
      ) {
        const ej = j + 1;
        if (
          ej < input.length &&
          (input[ej] === "+" || input[ej] === "-")
        ) {
          j = ej + 1;
        } else {
          j = ej;
        }
        while (j < input.length && input[j] >= "0" && input[j] <= "9") j++;
      }
      tokens.push({ kind: "number", value: input.slice(start, j), pos: start });
      i = j;
      continue;
    }

    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
      NAME_RE.lastIndex = i;
      const m = NAME_RE.exec(input);
      if (m) {
        tokens.push({ kind: "name", value: m[0], pos: start });
        i = m.index + m[0].length;
        continue;
      }
    }

    let kind: TokenKind;
    switch (ch) {
      case "+": kind = "plus"; break;
      case "-": kind = "minus"; break;
      case "*": kind = "star"; break;
      case "/": kind = "slash"; break;
      case "%": kind = "percent"; break;
      case "^": kind = "caret"; break;
      case "(": kind = "lparen"; break;
      case ")": kind = "rparen"; break;
      case ",": kind = "comma"; break;
      case ";": kind = "semicolon"; break;
      case "=": kind = "equals"; break;
      default:
        throw new SyntaxError(`Unexpected character '${ch}' at position ${i}`);
    }
    tokens.push({ kind, value: ch, pos: start });
    i++;
  }

  tokens.push({ kind: "eof", value: "", pos: i });
  return tokens;
}

// ── Helpers ────────────────────────────────────────────────────────────

function peek(p: Parser): Token {
  return p.tokens[p.pos] ?? { kind: "eof", value: "", pos: -1 };
}

function advance(p: Parser): Token {
  const t = p.tokens[p.pos];
  if (t.kind !== "eof") p.pos++;
  return t;
}

function expect(p: Parser, kind: TokenKind): Token {
  const t = peek(p);
  if (t.kind !== kind) {
    throw new SyntaxError(
      `Expected ${kind} but got ${t.kind}${t.value ? `('${t.value}')` : ""} at position ${t.pos}`,
    );
  }
  return advance(p);
}

function toRad(value: number, mode: AngleMode): number {
  switch (mode) {
    case "deg": return (value * Math.PI) / 180;
    case "gra": return (value * Math.PI) / 200;
    case "rad": return value;
  }
}

function fromRad(value: number, mode: AngleMode): number {
  switch (mode) {
    case "deg": return (value * 180) / Math.PI;
    case "gra": return (value * 200) / Math.PI;
    case "rad": return value;
  }
}

function factorial(n: number): number {
  if (n < 0 || !Number.isFinite(n) || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ── Functions ──────────────────────────────────────────────────────────

function applyFn(name: string, args: number[], mode: AngleMode, ctx: ParseContext): number {
  const a = args[0] ?? NaN;
  const b = args[1];

  switch (name) {
    // Trigonometric
    case "sin": return Math.sin(toRad(a, mode));
    case "cos": return Math.cos(toRad(a, mode));
    case "tan": return Math.tan(toRad(a, mode));
    case "asin": return fromRad(Math.asin(a), mode);
    case "acos": return fromRad(Math.acos(a), mode);
    case "atan": return fromRad(Math.atan(a), mode);
    case "atan2": return fromRad(Math.atan2(a, b ?? NaN), mode);

    // Hyperbolic
    case "sinh": return Math.sinh(a);
    case "cosh": return Math.cosh(a);
    case "tanh": return Math.tanh(a);

    // Inverse hyperbolic
    case "asinh": return Math.asinh(a);
    case "acosh": return Math.acosh(a);
    case "atanh": return Math.atanh(a);

    // Logarithmic
    case "log": return Math.log10(a);
    case "ln": return Math.log(a);
    case "log2": return Math.log2(a);
    case "logbase": return b && b > 0 && b !== 1 ? Math.log(a) / Math.log(b) : NaN;

    // Exponential
    case "exp": return Math.exp(a);
    case "exp2": return Math.pow(2, a);
    case "exp10": return Math.pow(10, a);

    // Power / Root
    case "sqrt": return Math.sqrt(a);
    case "cbrt": return Math.cbrt(a);
    case "pow": return Math.pow(a, b ?? NaN);
    case "root": return b && b > 0 ? Math.sign(a) * Math.pow(Math.abs(a), 1 / b) : NaN;

    // Absolute / Rounding
    case "abs": return Math.abs(a);
    case "ceil": return Math.ceil(a);
    case "floor": return Math.floor(a);
    case "round": return Math.round(a);
    case "sign": return Math.sign(a);

    // Factorial / Combinatorics
    case "factorial": return factorial(a);
    case "npr": return nPr(Math.round(a), Math.round(b ?? NaN));
    case "ncr": return nCr(Math.round(a), Math.round(b ?? NaN));

    // Number theory
    case "gcd": return gcd(Math.round(a), Math.round(b ?? NaN));
    case "lcm": return lcm(Math.round(a), Math.round(b ?? NaN));
    case "mod": return b !== undefined ? a % b : NaN;
    case "max": return Math.max(a, b ?? NaN);
    case "min": return Math.min(a, b ?? NaN);

    // Random
    case "rand": return Math.random();
    case "randint": return b !== undefined
      ? Math.floor(Math.random() * (Math.round(b) - Math.round(a) + 1)) + Math.round(a)
      : Math.floor(Math.random() * (Math.round(a) + 1));

    // Angle conversion
    case "rad": return toRad(a, "deg");
    case "deg": return fromRad(a, "rad");
    case "gra": return fromRad(a, "rad") * (200 / 180);
    case "tograd": return a * (200 / 180);
    case "fromgrad": return a * (180 / 200);

    // Numeric calculus
    case "deriv": {
      // deriv(expr, x, [h]) — numerical derivative
      // We evaluate the expression as a function of x
      // Since we can't pass closures easily, we use a simple finite difference
      // The first arg is the value at which to differentiate
      // For simplicity, this is implemented at the UI level
      return NaN;
    }
    case "derivn": {
      // derivn(expr, x) - numeric derivative using central difference
      const h = 1e-8;
      return (a + h * Math.sign(a || 1)); // placeholder, real impl at UI level
    }

    // Memory variable operations
    case "store": {
      // store(varname, value) — but implemented via assignment in parser
      return a;
    }
    case "recall": {
      // recall(varname) — read variable
      const varName = args.length > 0 ? String(Math.round(a)) : "M";
      return ctx.variables[varName] ?? 0;
    }

    default:
      throw new SyntaxError(`Unknown function '${name}'`);
  }
}

function applyPostfix(value: number, kind: "factorial" | "percent"): number {
  if (kind === "factorial") return factorial(value);
  return value / 100;
}

// ── Grammar ────────────────────────────────────────────────────────────
//
// program     → expr (';' expr)*
// expr        → assign
// assign      → NAME '=' assign | term ((+|-) term)*
// term        → unary ((*|/|%) unary)*
// unary       → (-|+) unary | power
// power       → postfix (^ unary)?
// postfix     → atom postfixOp*
// postfixOp   → ! | %
// atom        → number | constant | funcCall | parens | implicitMul
// implicitMul → postfix atom          (e.g. 2π, 2(3+4), (2)(3))
// funcCall    → NAME ( expr (, expr)* )?
// parens      → ( expr )
// number      → [0-9]+ (. [0-9]+)? ([eE] [+-]? [0-9]+)?
// constant    → pi | e | phi | Ans | PreAns | A-F | X | Y | M

function parseProgram(p: Parser): number {
  let result = parseExpr(p);
  while (peek(p).kind === "semicolon") {
    advance(p);
    result = parseExpr(p);
  }
  return result;
}

function parseExpr(p: Parser): number {
  // Check for assignment: NAME = expr
  if (peek(p).kind === "name") {
    const savedPos = p.pos;
    const nameToken = advance(p);
    if (peek(p).kind === "equals") {
      advance(p);
      const value = parseExpr(p);
      const varName = nameToken.value.toLowerCase();
      // Only allow assignment to known memory variables
      const validVars = ["a", "b", "c", "d", "e", "f", "x", "y", "m"];
      if (validVars.includes(varName)) {
        p.ctx.variables[varName] = value;
      }
      return value;
    }
    p.pos = savedPos;
  }

  let left = parseTerm(p);
  while (peek(p).kind === "plus" || peek(p).kind === "minus") {
    const op = advance(p);
    const right = parseTerm(p);
    left = op.kind === "plus" ? left + right : left - right;
  }
  return left;
}

function parseTerm(p: Parser): number {
  let left = parseUnary(p);
  while (
    peek(p).kind === "star" ||
    peek(p).kind === "slash" ||
    peek(p).kind === "percent"
  ) {
    const op = advance(p);
    const right = parseUnary(p);
    switch (op.kind) {
      case "star": left *= right; break;
      case "slash": left /= right; break;
      case "percent": left %= right; break;
    }
  }
  return left;
}

function parseUnary(p: Parser): number {
  const t = peek(p);
  if (t.kind === "minus") {
    advance(p);
    return -parseUnary(p);
  }
  if (t.kind === "plus") {
    advance(p);
    return parseUnary(p);
  }
  return parsePower(p);
}

function parsePower(p: Parser): number {
  let base = parsePostfix(p);
  if (peek(p).kind === "caret") {
    advance(p);
    const exp = parseUnary(p); // right-associative
    base = Math.pow(base, exp);
  }
  return base;
}

function parsePostfix(p: Parser): number {
  let value = parseAtom(p);
  while (peek(p).kind === "name" && (peek(p).value === "!" || peek(p).value === "%")) {
    const op = advance(p);
    value = applyPostfix(value, op.value as "factorial" | "percent");
  }
  return value;
}

function parseAtom(p: Parser): number {
  const t = peek(p);

  // Number
  if (t.kind === "number") {
    advance(p);
    const num = parseFloat(t.value);
    if (!Number.isFinite(num)) throw new SyntaxError(`Invalid number '${t.value}'`);
    if (peek(p).kind === "lparen" || peek(p).kind === "name") {
      return num * parseImplicitMul(p);
    }
    return num;
  }

  // Parenthesized expression
  if (t.kind === "lparen") {
    advance(p);
    const val = parseExpr(p);
    expect(p, "rparen");
    if (peek(p).kind === "lparen" || peek(p).kind === "name") {
      return val * parseImplicitMul(p);
    }
    return val;
  }

  // Named identifier: constant or function
  if (t.kind === "name") {
    const name = t.value.toLowerCase();

    // ── Constants ───────────────────────────────────────
    if (name === "pi" || name === "π") {
      advance(p);
      if (peek(p).kind === "lparen" || peek(p).kind === "name") {
        return Math.PI * parseImplicitMul(p);
      }
      return Math.PI;
    }
    if (name === "e" && peek(p).pos + 1 < p.tokens.length) {
      const next = p.tokens[p.pos + 1];
      if (!next || next.kind !== "number") {
        advance(p);
        if (peek(p).kind === "lparen" || peek(p).kind === "name") {
          return Math.E * parseImplicitMul(p);
        }
        return Math.E;
      }
    }
    if (name === "phi" || name === "φ") {
      advance(p);
      const PHI = (1 + Math.sqrt(5)) / 2;
      if (peek(p).kind === "lparen" || peek(p).kind === "name") {
        return PHI * parseImplicitMul(p);
      }
      return PHI;
    }
    if (name === "c") {
      // Speed of light constant
      advance(p);
      if (peek(p).kind === "lparen" || peek(p).kind === "name") {
        return 299792458 * parseImplicitMul(p);
      }
      return 299792458;
    }

    // ── Memory Variables ────────────────────────────────
    const memVars = ["a", "b", "c", "d", "f", "x", "y", "m"];
    if (memVars.includes(name)) {
      advance(p);
      const val = p.ctx.variables[name] ?? 0;
      if (peek(p).kind === "lparen" || peek(p).kind === "name") {
        return val * parseImplicitMul(p);
      }
      return val;
    }

    if (name === "ans") {
      advance(p);
      const val = p.ctx.variables["_ans"] ?? 0;
      if (peek(p).kind === "lparen" || peek(p).kind === "name") {
        return val * parseImplicitMul(p);
      }
      return val;
    }
    if (name === "preans" || name === "pre_ans") {
      advance(p);
      const val = p.ctx.variables["_preans"] ?? 0;
      if (peek(p).kind === "lparen" || peek(p).kind === "name") {
        return val * parseImplicitMul(p);
      }
      return val;
    }

    // ── Function call ───────────────────────────────────
    advance(p);
    if (peek(p).kind === "lparen") {
      advance(p);
      const args: number[] = [];
      if (peek(p).kind !== "rparen") {
        args.push(parseExpr(p));
        while (peek(p).kind === "comma") {
          advance(p);
          args.push(parseExpr(p));
        }
      }
      expect(p, "rparen");
      const result = applyFn(name, args, p.angleMode, p.ctx);
      if (peek(p).kind === "lparen" || peek(p).kind === "name") {
        return result * parseImplicitMul(p);
      }
      return result;
    }

    throw new SyntaxError(`Unexpected identifier '${t.value}' at position ${t.pos}`);
  }

  throw new SyntaxError(
    `Unexpected token ${t.kind}${t.value ? `('${t.value}')` : ""} at position ${t.pos}`,
  );
}

function parseImplicitMul(p: Parser): number {
  return parsePostfix(p);
}

// ── Public API ─────────────────────────────────────────────────────────

export interface ParseResult {
  value: number;
  error: string | null;
}

export function evaluate(
  input: string,
  angleMode: AngleMode = "deg",
  ctx?: ParseContext,
): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { value: 0, error: null };

  const context: ParseContext = ctx ?? { variables: {} };

  try {
    const tokens = tokenize(trimmed);
    const p: Parser = { tokens, pos: 0, angleMode, ctx: context };
    const result = parseProgram(p);

    if (peek(p).kind !== "eof") {
      const t = peek(p);
      return {
        value: NaN,
        error: `Unexpected '${t.value}' at position ${t.pos}`,
      };
    }

    if (!Number.isFinite(result)) {
      if (Number.isNaN(result)) return { value: result, error: "Result is NaN" };
      return { value: result, error: result > 0 ? "Overflow" : "Underflow" };
    }

    return { value: result, error: null };
  } catch (e) {
    return {
      value: NaN,
      error: e instanceof SyntaxError ? e.message : "Parse error",
    };
  }
}
