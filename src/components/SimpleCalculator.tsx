import { useState, useEffect, useRef } from "react";

interface HistoryEntry {
  expression: string;
  result: string;
}

function formatResult(value: number): string {
  if (Number.isNaN(value)) return "Error";
  if (!Number.isFinite(value)) return "Infinity";
  const str = String(value);
  if (str.includes("e")) return str;
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

const PRESET_BASES = [
  { base: 2, label: "log₂" },
  { base: 3, label: "log₃" },
  { base: 10, label: "log₁₀" },
  { base: Math.E, label: "ln" },
] as const;

function normalizeExpression(expr: string): string {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
}

function evaluate(expr: string): number {
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

  function parseMulDiv(): number {
    let value = parseAtom();
    while (true) {
      skip();
      const op = src[i];
      if (op === "*" || op === "/") {
        i++;
        const rhs = parseAtom();
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

export function SimpleCalculator() {
  const [expression, setExpression] = useState("0");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [customBase, setCustomBase] = useState("2");
  const [showCustomLog, setShowCustomLog] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const appendDigit = (digit: string) => {
    if (digit === ".") {
      setExpression((prev) => {
        const lastNumber = prev.split(/[+\-*/×÷−()]/).pop() ?? "";
        if (lastNumber.includes(".")) return prev;
        if (lastNumber === "") return prev + "0.";
        return prev + ".";
      });
      return;
    }
    setExpression((prev) => (prev === "0" ? digit : prev + digit));
  };

  const appendOperator = (op: string) => {
    setExpression((prev) => {
      const last = prev[prev.length - 1];
      if (last === undefined || last === "(") {
        if (op === "-") return prev + "-";
        return prev;
      }
      if ("+−×÷*/".includes(last)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  };

  const appendParen = (paren: string) => {
    setExpression((prev) => {
      if (paren === "(") {
        return prev === "0" ? "(" : prev + "(";
      }
      const open = (prev.match(/\(/g) ?? []).length;
      const close = (prev.match(/\)/g) ?? []).length;
      if (open > close && !"+−×÷*/(".includes(prev[prev.length - 1])) {
        return prev + ")";
      }
      return prev;
    });
  };

  const handleEqual = () => {
    const value = evaluate(expression);
    setHistory((prev) => [{ expression, result: formatResult(value) }, ...prev].slice(0, 12));
    setExpression(formatResult(value));
  };

  const handleClear = () => {
    setExpression("0");
  };

  const handleBackspace = () => {
    setExpression((prev) => {
      if (prev === "0" || prev === "") return "0";
      const next = prev.slice(0, -1);
      return next === "" ? "0" : next;
    });
  };

  const handlePercent = () => {
    setExpression((prev) => {
      const value = evaluate(prev);
      if (Number.isNaN(value)) return prev;
      return formatResult(value / 100);
    });
  };

  const insertLog = (base: number) => {
    setExpression((prev) => {
      const open = prev === "0" ? "" : prev;
      return base === Math.E ? open + "ln(" : open + `log_${formatResult(base)}(`;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (/[0-9]/.test(key)) {
      appendDigit(key);
    } else if (key === ".") {
      appendDigit(".");
    } else if (key === "+" || key === "-" || key === "*" || key === "/") {
      e.preventDefault();
      appendOperator(key);
    } else if (key === "(" || key === ")") {
      appendParen(key);
    } else if (key === "Enter" || key === "=") {
      e.preventDefault();
      handleEqual();
    } else if (key === "Backspace") {
      handleBackspace();
    } else if (key === "Escape") {
      handleClear();
    } else if (key === "%") {
      handlePercent();
    }
  };

  return (
    <div className="simple-calculator">
      <div className="calc-card card">
        <input
          ref={inputRef}
          className="simple-display"
          value={expression}
          readOnly
          onKeyDown={handleKeyDown}
          aria-label="Resultado"
        />

        <div className="simple-logrow">
          {PRESET_BASES.map(({ base, label }) => (
            <button
              key={label}
              type="button"
              className="simple-btn simple-btn-fn simple-btn-log"
              onClick={() => insertLog(base)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className={`simple-btn simple-btn-fn simple-btn-log ${showCustomLog ? "is-active" : ""}`}
            onClick={() => setShowCustomLog((v) => !v)}
          >
            logᵦ
          </button>
        </div>

        {showCustomLog && (
          <form
            className="simple-logcustom"
            onSubmit={(e) => {
              e.preventDefault();
              const base = parseFloat(customBase);
              if (Number.isFinite(base) && base > 0 && base !== 1) insertLog(base);
            }}
          >
            <label>
              Base
              <input
                type="number"
                value={customBase}
                onChange={(e) => setCustomBase(e.target.value)}
                min="0.0001"
                step="any"
                className="simple-logbase-input"
              />
            </label>
            <button type="submit" className="simple-btn simple-btn-op simple-btn-loggo">
              Log
            </button>
          </form>
        )}

        <div className="simple-keypad">
          <button type="button" className="simple-btn simple-btn-ac" onClick={handleClear}>AC</button>
          <button type="button" className="simple-btn simple-btn-del" onClick={handleBackspace}>⌫</button>
          <button type="button" className="simple-btn simple-btn-eq" onClick={handleEqual}>=</button>
          <button type="button" className="simple-btn simple-btn-op" onClick={() => appendOperator("÷")}>÷</button>

          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("7")}>7</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("8")}>8</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("9")}>9</button>
          <button type="button" className="simple-btn simple-btn-op" onClick={() => appendOperator("×")}>×</button>

          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("4")}>4</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("5")}>5</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("6")}>6</button>
          <button type="button" className="simple-btn simple-btn-op" onClick={() => appendOperator("−")}>−</button>

          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("1")}>1</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("2")}>2</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("3")}>3</button>
          <button type="button" className="simple-btn simple-btn-op" onClick={() => appendOperator("+")}>+</button>

          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendParen("(")}>(</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit("0")}>0</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendParen(")")}>)</button>
          <button type="button" className="simple-btn simple-btn-num" onClick={() => appendDigit(".")}>.</button>
        </div>

        {history.length > 0 && (
          <div className="simple-history">
            <div className="simple-history-title">History</div>
            {history.slice(0, 8).map((entry, i) => (
              <button
                key={i}
                type="button"
                className="simple-history-entry"
                onClick={() => setExpression(entry.result)}
              >
                <span className="simple-history-expr">{entry.expression} =</span>
                <span className="simple-history-val">{entry.result}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
