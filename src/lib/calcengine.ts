// Pure math utility functions for the scientific calculator.
// No React/UI dependencies.

// ── Fraction Conversion ────────────────────────────────────────────────

export interface Fraction {
  numer: number;
  denom: number;
}

export function toFraction(value: number, maxDenom = 10000): Fraction | null {
  if (!Number.isFinite(value)) return null;
  if (Number.isInteger(value)) return { numer: value, denom: 1 };

  const sign = value < 0 ? -1 : 1;
  let x = Math.abs(value);

  let h1 = 1, h2 = 0;
  let k1 = 0, k2 = 1;

  for (let i = 0; i < 30; i++) {
    const a = Math.floor(x);
    const frac = x - a;

    if (frac < 1e-10) break;

    const h = a * h1 + h2;
    const k = a * k1 + k2;

    if (k > maxDenom) break;

    h2 = h1; h1 = h;
    k2 = k1; k1 = k;

    x = 1 / frac;
  }

  if (k1 === 0) return null;
  return { numer: sign * h1, denom: k1 };
}

export function fractionToMixed(f: Fraction): { whole: number; numer: number; denom: number } {
  const sign = f.numer < 0 ? -1 : 1;
  const absNum = Math.abs(f.numer);
  const whole = Math.floor(absNum / f.denom);
  const numer = absNum - whole * f.denom;
  return { whole: sign * whole, numer, denom: f.denom };
}

// ── DMS (Sexagesimal) Conversion ──────────────────────────────────────

export interface DMS {
  deg: number;
  min: number;
  sec: number;
}

export function decimalToDMS(degrees: number): DMS {
  const sign = degrees < 0 ? -1 : 1;
  const abs = Math.abs(degrees);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60 * 100) / 100;
  return { deg: sign * d, min: m, sec: s === 60 ? 0 : s };
}

export function dmsToDecimal(d: number, m: number, s: number): number {
  const sign = d < 0 ? -1 : 1;
  return sign * (Math.abs(d) + Math.abs(m) / 60 + Math.abs(s) / 3600);
}

export function dmsToString(dms: DMS): string {
  return `${dms.deg}°${dms.min}'${dms.sec.toFixed(2)}"`;
}

// ── Prime Factorization ───────────────────────────────────────────────

export function primeFactors(n: number): number[] {
  if (n < 2 || !Number.isInteger(n)) return [];
  const factors: number[] = [];
  let remaining = n;

  for (const p of [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]) {
    while (remaining % p === 0) {
      factors.push(p);
      remaining /= p;
    }
  }

  if (remaining > 1) {
    let i = 53;
    while (i * i <= remaining) {
      while (remaining % i === 0) {
        factors.push(i);
        remaining /= i;
      }
      i += 2;
    }
    if (remaining > 1) factors.push(remaining);
  }

  return factors;
}

export function isPrime(n: number): boolean {
  if (n < 2 || !Number.isInteger(n)) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

// ── Number Formatting ─────────────────────────────────────────────────

export type FormatMode = "norm" | "fix" | "sci" | "eng";

export function formatNumber(
  value: number,
  mode: FormatMode = "norm",
  decimals = 10,
): string {
  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return "NaN";
    return value > 0 ? "∞" : "-∞";
  }

  if (mode === "fix") {
    return value.toFixed(decimals);
  }

  if (mode === "sci") {
    return value.toExponential(decimals);
  }

  if (mode === "eng") {
    if (value === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const engExp = Math.floor(exp / 3) * 3;
    const mantissa = value / Math.pow(10, engExp);
    const mantStr = mantissa.toFixed(Math.max(0, decimals - Math.floor(Math.abs(mantissa)).toString().length));
    return `${mantStr}e${engExp}`;
  }

  // norm mode
  if (Number.isInteger(value)) return value.toString();
  const absVal = Math.abs(value);
  if (absVal >= 1e10 || (absVal < 1e-4 && absVal > 0)) {
    return value.toExponential(decimals > 10 ? 10 : decimals);
  }
  return parseFloat(value.toPrecision(12)).toString();
}

export function addThousandsSeparators(
  numStr: string,
  separator = ",",
): string {
  const [intPart, decPart] = numStr.split(".");
  const sign = intPart.startsWith("-") ? "-" : "";
  const digits = intPart.replace("-", "");
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return sign + withCommas + (decPart !== undefined ? `.${decPart}` : "");
}

// ── GCD / LCM ─────────────────────────────────────────────────────────

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

// ── Combinatorics ─────────────────────────────────────────────────────

export function nPr(n: number, r: number): number {
  if (r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) return NaN;
  let result = 1;
  for (let i = 0; i < r; i++) {
    result *= (n - i);
    if (!Number.isFinite(result)) return Infinity;
  }
  return result;
}

export function nCr(n: number, r: number): number {
  if (r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) return NaN;
  if (r === 0 || r === n) return 1;
  if (r > n - r) r = n - r;
  let result = 1;
  for (let i = 0; i < r; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

// ── Numerical Derivative ──────────────────────────────────────────────

export function numericalDerivative(
  fn: (x: number) => number,
  x: number,
  h = 1e-8,
): number {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

// ── Numerical Integration (Simpson's Rule) ────────────────────────────

export function numericalIntegral(
  fn: (x: number) => number,
  a: number,
  b: number,
  n = 1000,
): number {
  if (a === b) return 0;
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * fn(a + i * h);
  }
  return (h / 3) * sum;
}

// ── Safe Expression Eval (for simple substitutions only) ───────────────

export function safeEval(expr: string): number {
  const cleaned = expr.replace(/\s+/g, "");
  if (/^[\d+\-*/().eE]+$/.test(cleaned)) {
  const result = Function(`"use strict"; return (${cleaned})`)();
    if (typeof result === "number" && Number.isFinite(result)) return result;
  }
  return NaN;
}
