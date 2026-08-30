import { describe, expect, it } from "vitest";
import { evaluate, formatResult } from "./calculator";

describe("evaluate - powers and roots", () => {
  it("computes powers", () => {
    expect(evaluate("2^3")).toBe(8);
    expect(evaluate("5^2")).toBe(25);
  });

  it("computes right-associative powers", () => {
    expect(evaluate("2^3^2")).toBe(512);
  });

  it("respects operator precedence", () => {
    expect(evaluate("2+3*2^2")).toBe(14);
    expect(evaluate("(2+3)^2")).toBe(25);
  });

  it("computes square and cube roots", () => {
    expect(evaluate("sqrt(16)")).toBe(4);
    expect(evaluate("cbrt(27)")).toBe(3);
  });

  it("still computes logarithms", () => {
    expect(evaluate("log_2(8)")).toBe(3);
    expect(evaluate("log_10(100)")).toBe(2);
    expect(evaluate("ln(10)")).toBeCloseTo(Math.log(10));
  });

  it("normalizes display operators", () => {
    expect(evaluate("6÷3")).toBe(2);
    expect(evaluate("6×3")).toBe(18);
  });
});

describe("formatResult", () => {
  it("formats plain numbers", () => {
    expect(formatResult(8)).toBe("8");
  });
});
