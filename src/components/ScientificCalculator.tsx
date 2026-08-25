import { useState, useMemo, useCallback, useRef } from "react";
import { evaluate } from "../lib/mathparser";

interface HistoryEntry {
  expression: string;
  result: string;
}

function insertAtCursor(
  el: HTMLTextAreaElement | null,
  text: string,
  expression: string,
  setExpression: (v: string) => void,
) {
  if (!el) {
    setExpression(expression + text);
    return;
  }
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const newExpr = expression.slice(0, start) + text + expression.slice(end);
  setExpression(newExpr);
  requestAnimationFrame(() => {
    el.focus();
    el.selectionStart = el.selectionEnd = start + text.length;
  });
}

function deleteAtCursor(
  el: HTMLTextAreaElement | null,
  expression: string,
  setExpression: (v: string) => void,
) {
  if (!el) {
    setExpression(expression.slice(0, -1));
    return;
  }
  const start = el.selectionStart;
  const end = el.selectionEnd;
  if (start !== end) {
    const newExpr = expression.slice(0, start) + expression.slice(end);
    setExpression(newExpr);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start;
    });
  } else if (start > 0) {
    const newExpr = expression.slice(0, start - 1) + expression.slice(start);
    setExpression(newExpr);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start - 1;
    });
  }
}

function formatNum(value: number): string {
  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return "NaN";
    return value > 0 ? "Infinity" : "-Infinity";
  }
  return Number.isInteger(value)
    ? value.toString()
    : parseFloat(value.toPrecision(12)).toString();
}

export function ScientificCalculator() {
  const [expression, setExpression] = useState("");
  const [angleMode, setAngleMode] = useState<"deg" | "rad">("deg");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { value: previewValue, error: previewError } = useMemo(() => {
    if (!expression.trim()) return { value: 0, error: null };
    return evaluate(expression, angleMode);
  }, [expression, angleMode]);

  const resultDisplay = useMemo(() => {
    if (!expression.trim()) return "0";
    if (previewError) return "?";
    return formatNum(previewValue);
  }, [expression, previewValue, previewError]);

  const handleAC = useCallback(() => {
    setExpression("");
  }, []);

  const handleDEL = useCallback(() => {
    deleteAtCursor(inputRef.current, expression, setExpression);
  }, [expression]);

  const handleEqual = useCallback(() => {
    if (!expression.trim()) return;
    const { value, error: evalErr } = evaluate(expression, angleMode);
    if (evalErr) return;
    const display = formatNum(value);
    setHistory((prev) => [{ expression, result: display }, ...prev].slice(0, 50));
  }, [expression, angleMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleEqual();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleAC();
      }
    },
    [handleEqual, handleAC],
  );

  const insert = useCallback(
    (text: string) => {
      insertAtCursor(inputRef.current, text, expression, setExpression);
    },
    [expression],
  );

  return (
    <div className="scientific-calculator">
      <div className="calc-card card">
        {/* Angle mode toggle */}
        <div className="sci-angle-toggle">
          <button
            type="button"
            className={`angle-btn ${angleMode === "deg" ? "is-active" : ""}`}
            onClick={() => setAngleMode("deg")}
          >
            DEG
          </button>
          <button
            type="button"
            className={`angle-btn ${angleMode === "rad" ? "is-active" : ""}`}
            onClick={() => setAngleMode("rad")}
          >
            RAD
          </button>
        </div>

        {/* Expression input */}
        <div className="sci-display">
          <textarea
            ref={inputRef}
            className="sci-expression"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type expression..."
            rows={2}
            autoComplete="off"
            spellCheck={false}
          />
          <div className={`sci-result ${previewError ? "sci-error" : ""}`}>
            {resultDisplay}
          </div>
        </div>

        {/* Control row */}
        <div className="sci-controls">
          <button type="button" className="sci-btn sci-btn-ac" onClick={handleAC}>
            AC
          </button>
          <button type="button" className="sci-btn sci-btn-del" onClick={handleDEL}>
            ⌫
          </button>
          <button type="button" className="sci-btn sci-btn-paren" onClick={() => insert("(")}>
            (
          </button>
          <button type="button" className="sci-btn sci-btn-paren" onClick={() => insert(")")}>
            )
          </button>
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("/")}>
            ÷
          </button>
        </div>

        {/* Scientific functions row 1 */}
        <div className="sci-grid">
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("sin(")}>sin</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("cos(")}>cos</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("tan(")}>tan</button>
          <button type="button" className="sci-btn sci-btn-const" onClick={() => insert("pi")}>π</button>
          <button type="button" className="sci-btn sci-btn-const" onClick={() => insert("e")}>e</button>
        </div>

        {/* Scientific functions row 2 */}
        <div className="sci-grid">
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("asin(")}>sin⁻¹</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("acos(")}>cos⁻¹</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("atan(")}>tan⁻¹</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^2")}>x²</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^")}>xʸ</button>
        </div>

        {/* Scientific functions row 3 */}
        <div className="sci-grid">
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("log(")}>log</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("ln(")}>ln</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("sqrt(")}>√</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("!")}>n!</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("%")}>%</button>
        </div>

        {/* Number pad */}
        <div className="sci-grid sci-numpad">
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("7")}>7</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("8")}>8</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("9")}>9</button>
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("*")}>×</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("4")}>4</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("5")}>5</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("6")}>6</button>
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("-")}>−</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("1")}>1</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("2")}>2</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("3")}>3</button>
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("+")}>+</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("0")}>0</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert(".")}>.</button>
          <button
            type="button"
            className="sci-btn sci-btn-num"
            onClick={() => {
              if (resultDisplay !== "0" && resultDisplay !== "?" && resultDisplay !== "NaN" && resultDisplay !== "Infinity" && resultDisplay !== "-Infinity") {
                insert(resultDisplay);
              }
            }}
          >
            Ans
          </button>
          <button type="button" className="sci-btn sci-btn-eq" onClick={handleEqual}>=</button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="sci-history">
            <div className="sci-history-title">History</div>
            {history.slice(0, 8).map((entry, i) => (
              <button
                key={i}
                type="button"
                className="sci-history-entry"
                onClick={() => {
                  setExpression(entry.result);
                  inputRef.current?.focus();
                }}
              >
                <span className="sci-history-expr">{entry.expression} =</span>
                <span className="sci-history-val">{entry.result}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
