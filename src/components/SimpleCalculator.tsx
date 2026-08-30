import { useState, useEffect, useRef } from "react";
import { evaluate, formatResult } from "../lib/calculator";

interface HistoryEntry {
  expression: string;
  result: string;
}

type FunctionCategory = "log" | "pow";

interface CategoryButton {
  label: string;
  /** Texto a insertar en la expresión (reemplaza el "0" inicial). */
  text: string;
  /** Botón que depende de un valor configurable (p.ej. la base del log). */
  custom?: boolean;
}

interface CategoryDef {
  id: FunctionCategory;
  label: string;
  buttons: CategoryButton[];
}

const LOG_BUTTONS: CategoryButton[] = [
  { label: "log₂", text: "log_2(" },
  { label: "log₃", text: "log_3(" },
  { label: "log₁₀", text: "log_10(" },
  { label: "ln", text: "ln(" },
  { label: "logᵦ", text: "", custom: true },
];

const POW_BUTTONS: CategoryButton[] = [
  { label: "x²", text: "^2" },
  { label: "x³", text: "^3" },
  { label: "xⁿ", text: "^(" },
  { label: "√x", text: "sqrt(" },
  { label: "∛x", text: "cbrt(" },
];

const CATEGORIES: CategoryDef[] = [
  { id: "log", label: "Log", buttons: LOG_BUTTONS },
  { id: "pow", label: "Pow", buttons: POW_BUTTONS },
];

export function SimpleCalculator() {
  const [expression, setExpression] = useState("0");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [customBase, setCustomBase] = useState("2");
  const [showCustomLog, setShowCustomLog] = useState(false);
  const [activeCat, setActiveCat] = useState<FunctionCategory>("log");

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
      if ("+−×÷*/^".includes(last)) {
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

  const insertText = (text: string) => {
    setExpression((prev) => {
      const open = prev === "0" ? "" : prev;
      return open + text;
    });
  };

  const insertLog = (base: number) => {
    insertText(base === Math.E ? "ln(" : `log_${formatResult(base)}(`);
  };

  const selectCategory = (cat: FunctionCategory) => {
    setActiveCat(cat);
    setShowCustomLog(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (/[0-9]/.test(key)) {
      appendDigit(key);
    } else if (key === ".") {
      appendDigit(".");
    } else if (key === "+" || key === "-" || key === "*" || key === "/" || key === "^") {
      e.preventDefault();
      appendOperator(key === "^" ? "^" : key);
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
      <div className="simple-layout">
        <aside className="func-panel" aria-label="Categorías de funciones">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`func-cat ${cat.id === activeCat ? "is-active" : ""}`}
              onClick={() => selectCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </aside>

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
            {CATEGORIES.find((c) => c.id === activeCat)!.buttons.map((btn) => {
              if (btn.custom) {
                return (
                  <button
                    key={btn.label}
                    type="button"
                    className={`simple-btn simple-btn-fn simple-btn-log ${showCustomLog ? "is-active" : ""}`}
                    onClick={() => setShowCustomLog((v) => !v)}
                  >
                    {btn.label}
                  </button>
                );
              }
              return (
                <button
                  key={btn.label}
                  type="button"
                  className="simple-btn simple-btn-fn simple-btn-log"
                  onClick={() => insertText(btn.text)}
                >
                  {btn.label}
                </button>
              );
            })}
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
    </div>
  );
}
