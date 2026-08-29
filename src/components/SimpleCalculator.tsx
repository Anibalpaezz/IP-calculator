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

export function SimpleCalculator() {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commitOperation = () => {
    if (operator && previous !== null) {
      const a = parseFloat(previous);
      const b = parseFloat(display);
      let result: number;
      switch (operator) {
        case "+":
          result = a + b;
          break;
        case "-":
          result = a - b;
          break;
        case "*":
          result = a * b;
          break;
        case "/":
          result = b === 0 ? NaN : a / b;
          break;
        default:
          result = b;
      }
      const text = `${formatResult(a)} ${
        operator === "*" ? "×" : operator === "/" ? "÷" : operator
      } ${formatResult(b)} =`;
      setHistory((prev) => [{ expression: text, result: formatResult(result) }, ...prev].slice(0, 12));
      setDisplay(formatResult(result));
      setPrevious(null);
      setOperator(null);
      setOverwrite(true);
    }
  };

  const inputDigit = (digit: string) => {
    if (overwrite) {
      setDisplay(digit === "." ? "0." : digit);
      setOverwrite(false);
    } else {
      if (digit === "." && display.includes(".")) return;
      setDisplay(display === "0" && digit !== "." ? digit : display + digit);
    }
  };

  const chooseOperator = (op: string) => {
    if (operator && previous !== null && !overwrite) {
      commitOperation();
      const current = display;
      setPrevious(current);
    } else {
      setPrevious(display);
    }
    setOperator(op);
    setOverwrite(true);
  };

  const handleEqual = () => {
    commitOperation();
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevious(null);
    setOperator(null);
    setOverwrite(true);
  };

  const toggleSign = () => {
    if (!display || display === "0") return;
    setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  };

  const handlePercent = () => {
    const value = parseFloat(display);
    if (Number.isNaN(value)) return;
    setDisplay(formatResult(value / 100));
    setOverwrite(true);
  };

  const handleBackspace = () => {
    if (overwrite) return;
    const next = display.slice(0, -1);
    setDisplay(next === "" || next === "-" ? "0" : next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (/[0-9]/.test(key)) {
      inputDigit(key);
    } else if (key === ".") {
      inputDigit(".");
    } else if (key === "+" || key === "-" || key === "*" || key === "/") {
      e.preventDefault();
      chooseOperator(key === "*" ? "*" : key === "/" ? "/" : key);
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
          value={display}
          readOnly
          onKeyDown={handleKeyDown}
          aria-label="Resultado"
        />

        {previous !== null && operator && (
          <div className="simple-subdisplay">
            {formatResult(parseFloat(previous))} {operator === "*" ? "×" : operator === "/" ? "÷" : operator}
          </div>
        )}

        <div className="simple-keypad">
          <button className="simple-btn simple-btn-fn" onClick={handleClear}>AC</button>
          <button className="simple-btn simple-btn-fn" onClick={toggleSign}>±</button>
          <button className="simple-btn simple-btn-fn" onClick={handlePercent}>%</button>
          <button className="simple-btn simple-btn-op" onClick={() => chooseOperator("/")}>÷</button>

          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("7")}>7</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("8")}>8</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("9")}>9</button>
          <button className="simple-btn simple-btn-op" onClick={() => chooseOperator("*")}>×</button>

          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("4")}>4</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("5")}>5</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("6")}>6</button>
          <button className="simple-btn simple-btn-op" onClick={() => chooseOperator("-")}>−</button>

          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("1")}>1</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("2")}>2</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("3")}>3</button>
          <button className="simple-btn simple-btn-op" onClick={() => chooseOperator("+")}>+</button>

          <button className="simple-btn simple-btn-fn" onClick={handleBackspace}>⌫</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit("0")}>0</button>
          <button className="simple-btn simple-btn-num" onClick={() => inputDigit(".")}>.</button>
          <button className="simple-btn simple-btn-eq" onClick={handleEqual}>=</button>
        </div>

        {history.length > 0 && (
          <div className="simple-history">
            <div className="simple-history-title">History</div>
            {history.slice(0, 8).map((entry, i) => (
              <div key={i} className="simple-history-entry">
                <span className="simple-history-expr">{entry.expression}</span>
                <span className="simple-history-val">{entry.result}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
