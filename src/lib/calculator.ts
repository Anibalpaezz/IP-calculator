export function formatResult(value: number): string {
  if (Number.isNaN(value)) return "Error";
  if (!Number.isFinite(value)) return "Infinity";
  const str = String(value);
  if (str.includes("e")) return str;
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

function normalizeExpression(expr: string): string {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
}

export function evaluate(expr: string): number {
  const src = normalizeExpression(expr);
  let i = 0;

  function skip() {
    while (i < src.length && src[i] === " ") i++;
  }

  function parseNumber(): number {
    skip();
    const start = i;
    if (src[i] === "-") i++;
    while (i < src.length && /[0-9.]/.test(src[i])) i++;
    const num = parseFloat(src.slice(start, i));
    return Number.isNaN(num) ? NaN : num;
  }

  function parseAtom(): number {
    skip();
    if (src.startsWith("ln(", i)) {
      i += 3;
      const inner = parseAddSub();
      skip();
      if (src[i] === ")") {
        i++;
        return inner > 0 ? Math.log(inner) : NaN;
      }
      return NaN;
    }
    if (src.startsWith("sqrt(", i)) {
      i += 5;
      const inner = parseAddSub();
      skip();
      if (src[i] === ")") {
        i++;
        return Math.sqrt(inner);
      }
      return NaN;
    }
    if (src.startsWith("cbrt(", i)) {
      i += 5;
      const inner = parseAddSub();
      skip();
      if (src[i] === ")") {
        i++;
        return Math.cbrt(inner);
      }
      return NaN;
    }
    if (src.startsWith("exp(", i)) {
      i += 4;
      const inner = parseAddSub();
      skip();
      if (src[i] === ")") {
        i++;
        return Math.exp(inner);
      }
      return NaN;
    }
    const logMatch = /^log_(\d+(?:\.\d+)?)\(/;
    const rest = src.slice(i);
    const m = logMatch.exec(rest);
    if (m) {
      i += m[0].length;
      const inner = parseAddSub();
      skip();
      if (src[i] === ")") {
        i++;
        const base = parseFloat(m[1]);
        if (inner > 0 && base > 0 && base !== 1) return Math.log(inner) / Math.log(base);
        return NaN;
      }
      return NaN;
    }
    if (src[i] === "(") {
      i++;
      const val = parseAddSub();
      skip();
      if (src[i] === ")") {
        i++;
        return val;
      }
      return NaN;
    }
    return parseNumber();
  }

  function parsePower(): number {
    const base = parseAtom();
    skip();
    if (src[i] === "^") {
      i++;
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseMulDiv(): number {
    let value = parsePower();
    while (true) {
      skip();
      const op = src[i];
      if (op === "*" || op === "/") {
        i++;
        const rhs = parsePower();
        value = op === "*" ? value * rhs : rhs === 0 ? NaN : value / rhs;
      } else {
        break;
      }
    }
    return value;
  }

  function parseAddSub(): number {
    let value = parseMulDiv();
    while (true) {
      skip();
      const op = src[i];
      if (op === "+" || op === "-") {
        i++;
        const rhs = parseMulDiv();
        value = op === "+" ? value + rhs : value - rhs;
      } else {
        break;
      }
    }
    return value;
  }

  const result = parseAddSub();
  skip();
  return i === src.length ? result : NaN;
}
