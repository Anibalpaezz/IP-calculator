import { useState, useMemo, useCallback, useRef } from "react";
import { evaluate, type AngleMode, type ParseContext } from "../lib/mathparser";
import {
  formatNumber,
  addThousandsSeparators,
  toFraction,
  fractionToMixed,
  decimalToDMS,
  dmsToString,
  type FormatMode,
  primeFactors,
} from "../lib/calcengine";

// ── Types ─────────────────────────────────────────────────────────────

type SciMode = "trig" | "log" | "pow" | "comb" | "mem" | "util";

interface HistoryEntry {
  expression: string;
  result: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

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

const MEM_VARS = ["a", "b", "c", "d", "f", "x", "y", "m"] as const;

// ── Component ─────────────────────────────────────────────────────────

export function ScientificCalculator() {
  const [expression, setExpression] = useState("");
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const [sciMode, setSciMode] = useState<SciMode>("trig");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [variables, setVariables] = useState<Record<string, number>>({});
  const [showMemPanel, setShowMemPanel] = useState(false);
  const [memEditVar, setMemEditVar] = useState<string | null>(null);
  const [memEditValue, setMemEditValue] = useState("");
  const [formatMode, setFormatMode] = useState<FormatMode>("norm");
  const [formatDecimals, setFormatDecimals] = useState(6);
  const [showFraction, setShowFraction] = useState(false);
  const [showMixed, setShowMixed] = useState(false);
  const [showDMS, setShowDMS] = useState(false);
  const [showThousandSep, setShowThousandSep] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ctx: ParseContext = useMemo(() => ({ variables }), [variables]);

  const { value: previewValue, error: previewError } = useMemo(() => {
    if (!expression.trim()) return { value: 0, error: null };
    return evaluate(expression, angleMode, ctx);
  }, [expression, angleMode, ctx]);

  const rawResult = useMemo(() => {
    if (!expression.trim()) return "0";
    if (previewError) return "?";
    return formatNumber(previewValue, formatMode, formatDecimals);
  }, [expression, previewValue, previewError, formatMode, formatDecimals]);

  const resultDisplay = useMemo(() => {
    let display = rawResult;
    if (showThousandSep && display !== "?" && display !== "NaN" && !display.includes("e")) {
      display = addThousandsSeparators(display);
    }
    return display;
  }, [rawResult, showThousandSep]);

  const fractionDisplay = useMemo(() => {
    if (!showFraction || previewError || !Number.isFinite(previewValue)) return null;
    const f = toFraction(previewValue);
    if (!f) return null;
    if (showMixed) {
      const m = fractionToMixed(f);
      if (m.whole === 0 && m.numer === 0) return "0";
      if (m.numer === 0) return `${m.whole}`;
      return `${m.whole} ${m.numer}/${m.denom}`;
    }
    return `${f.numer}/${f.denom}`;
  }, [showFraction, showMixed, previewValue, previewError]);

  const dmsDisplay = useMemo(() => {
    if (!showDMS || previewError || !Number.isFinite(previewValue)) return null;
    return dmsToString(decimalToDMS(previewValue));
  }, [showDMS, previewValue, previewError]);

  const insert = useCallback(
    (text: string) => {
      insertAtCursor(inputRef.current, text, expression, setExpression);
    },
    [expression],
  );

  const pushUndo = useCallback(
    (currentExpr: string) => {
      setUndoStack((prev) => [...prev.slice(-50), currentExpr]);
      setRedoStack([]);
    },
    [],
  );

  const handleAC = useCallback(() => {
    if (expression) pushUndo(expression);
    setExpression("");
  }, [expression, pushUndo]);

  const handleDEL = useCallback(() => {
    if (expression) pushUndo(expression);
    deleteAtCursor(inputRef.current, expression, setExpression);
  }, [expression, pushUndo]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [...r, expression]);
    setExpression(prev);
  }, [undoStack, expression]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, expression]);
    setExpression(next);
  }, [redoStack, expression]);

  const handleEqual = useCallback(() => {
    if (!expression.trim()) return;
    const { value, error: evalErr } = evaluate(expression, angleMode, ctx);
    if (evalErr) return;
    const display = formatNumber(value, formatMode, formatDecimals);
    setHistory((prev) => [{ expression, result: display }, ...prev].slice(0, 50));
    setVariables((prev) => ({
      ...prev,
      _preans: prev._ans ?? 0,
      _ans: value,
    }));
    setExpression(display);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        const pos = display.length;
        el.selectionStart = el.selectionEnd = pos;
      }
    });
  }, [expression, angleMode, ctx, formatMode, formatDecimals]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleEqual();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleAC();
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    },
    [handleEqual, handleAC, handleUndo, handleRedo],
  );

  const storeToVar = useCallback(
    (varName: string) => {
      if (previewError || !Number.isFinite(previewValue)) return;
      setVariables((prev) => ({ ...prev, [varName]: previewValue }));
    },
    [previewValue, previewError],
  );

  const recallVar = useCallback(
    (varName: string) => {
      const val = variables[varName];
      if (val !== undefined) {
        insert(val.toString());
      }
    },
    [variables, insert],
  );

  const handleMemSave = useCallback(() => {
    if (memEditVar && memEditValue) {
      const num = parseFloat(memEditValue);
      if (Number.isFinite(num)) {
        setVariables((prev) => ({ ...prev, [memEditVar]: num }));
      }
    }
    setMemEditVar(null);
    setMemEditValue("");
  }, [memEditVar, memEditValue]);

  const resetMemory = useCallback(() => {
    setVariables({});
  }, []);

  const renderFunctionPanel = () => {
    switch (sciMode) {
      case "trig":
        return (
          <>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("sin(")}>sin</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("cos(")}>cos</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("tan(")}>tan</button>
              <button type="button" className="sci-btn sci-btn-const" onClick={() => insert("pi")}>π</button>
              <button type="button" className="sci-btn sci-btn-const" onClick={() => insert("e")}>e</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("asin(")}>sin⁻¹</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("acos(")}>cos⁻¹</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("atan(")}>tan⁻¹</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("atan2(")}>atan2</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("rad(")}>→rad</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("sinh(")}>sinh</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("cosh(")}>cosh</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("tanh(")}>tanh</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("deg(")}>→deg</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("grad(")}>→gra</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("asinh(")}>sinh⁻¹</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("acosh(")}>cosh⁻¹</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("atanh(")}>tanh⁻¹</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("tograd(")}>→grad</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("fromgrad(")}>frmgra</button>
            </div>
          </>
        );

      case "log":
        return (
          <>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("log(")}>log</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("ln(")}>ln</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("log2(")}>log₂</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("exp(")}>eˣ</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("exp2(")}>2ˣ</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("exp10(")}>10ˣ</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("logbase(")}>log_b</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("abs(")}>|x|</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("ceil(")}>⌈x⌉</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("floor(")}>⌊x⌋</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("round(")}>round</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("sign(")}>sign</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("max(")}>max</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("min(")}>min</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("mod(")}>mod</button>
            </div>
          </>
        );

      case "pow":
        return (
          <>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^2")}>x²</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^")}>xʸ</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("sqrt(")}>√</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("cbrt(")}>∛</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("root(")}>ʸ√x</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^0.5")}>x^½</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^(1/3)")}>x^⅓</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^3")}>x³</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^(-1)")}>x⁻¹</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^(-0.5)")}>x^-½</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("!")}>n!</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("%")}>%</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("pow(")}>pow</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("1/")}>1/x</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("^(-2)")}>x⁻²</button>
            </div>
          </>
        );

      case "comb":
        return (
          <>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("npr(")}>nPr</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("ncr(")}>nCr</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("!")}>n!</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("gcd(")}>MCD</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("lcm(")}>MCM</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("rand()")}>rand</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("randint(")}>R.int</button>
              <button type="button" className="sci-btn sci-btn-const" onClick={() => insert("pi")}>π</button>
              <button type="button" className="sci-btn sci-btn-const" onClick={() => insert("e")}>e</button>
              <button type="button" className="sci-btn sci-btn-const" onClick={() => insert("phi")}>φ</button>
            </div>
          </>
        );

      case "mem":
        return (
          <>
            <div className="sci-grid">
              {MEM_VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="sci-btn sci-btn-mem"
                  onClick={() => recallVar(v)}
                >
                  {v.toUpperCase()}
                  {variables[v] !== undefined && (
                    <span className="sci-mem-val">{formatNumber(variables[v], "norm", 6)}</span>
                  )}
                </button>
              ))}
              <button
                type="button"
                className="sci-btn sci-btn-mem"
                onClick={() => recallVar("_ans")}
              >
                Ans
                {variables._ans !== undefined && (
                  <span className="sci-mem-val">{formatNumber(variables._ans, "norm", 6)}</span>
                )}
              </button>
            </div>
            <div className="sci-grid">
              {MEM_VARS.map((v) => (
                <button
                  key={`st-${v}`}
                  type="button"
                  className="sci-btn sci-btn-mem-store"
                  onClick={() => storeToVar(v)}
                >
                  STO {v.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                className="sci-btn sci-btn-mem-store"
                onClick={() => {
                  if (Number.isFinite(previewValue) && !previewError) {
                    setVariables((prev) => ({ ...prev, M: (prev.M ?? 0) + previewValue }));
                  }
                }}
              >
                M+
              </button>
            </div>
            <div className="sci-grid">
              <button
                type="button"
                className="sci-btn sci-btn-fn"
                onClick={() => {
                  if (Number.isFinite(previewValue) && !previewError) {
                    setVariables((prev) => ({ ...prev, M: (prev.M ?? 0) - previewValue }));
                  }
                }}
              >
                M−
              </button>
              <button
                type="button"
                className="sci-btn sci-btn-fn"
                onClick={() => recallVar("M")}
              >
                MR
              </button>
              <button
                type="button"
                className="sci-btn sci-btn-fn"
                onClick={() => setVariables((prev) => ({ ...prev, M: 0 }))}
              >
                MC
              </button>
              <button
                type="button"
                className="sci-btn sci-btn-fn"
                onClick={resetMemory}
              >
                Reset
              </button>
              <button
                type="button"
                className="sci-btn sci-btn-fn"
                onClick={() => setShowMemPanel(!showMemPanel)}
              >
                {showMemPanel ? "Hide" : "Panel"}
              </button>
            </div>
          </>
        );

      case "util":
        return (
          <>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("floor(")}>⌊x⌋</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("ceil(")}>⌈x⌉</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("abs(")}>|x|</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("round(")}>rnd</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("sign(")}>sgn</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("deriv(")}>d/dx</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("integral(")}>∫ dx</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("mod(")}>mod</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("gcd(")}>MCD</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("lcm(")}>MCM</button>
            </div>
            <div className="sci-grid">
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("rand()")}>rand</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("randint(")}>R.int</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("npr(")}>nPr</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("ncr(")}>nCr</button>
              <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert("!")}>n!</button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="scientific-calculator">
      <div className="calc-card card">
        {/* Top controls row: Angle mode + Format + Display toggles */}
        <div className="sci-top-controls">
          <div className="sci-angle-toggle">
            {(["deg", "rad", "gra"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`angle-btn ${angleMode === m ? "is-active" : ""}`}
                onClick={() => setAngleMode(m)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="sci-format-toggle">
            {(["norm", "fix", "sci"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`format-btn ${formatMode === m ? "is-active" : ""}`}
                onClick={() => setFormatMode(m)}
              >
                {m === "norm" ? "NORM" : m === "fix" ? "FIX" : "SCI"}
              </button>
            ))}
            {formatMode === "fix" && (
              <select
                className="sci-decimals-select"
                value={formatDecimals}
                onChange={(e) => setFormatDecimals(Number(e.target.value))}
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Display toggles row */}
        <div className="sci-display-toggles">
          <button
            type="button"
            className={`sci-toggle-btn ${showFraction ? "is-active" : ""}`}
            onClick={() => setShowFraction(!showFraction)}
          >
            Frac
          </button>
          {showFraction && (
            <button
              type="button"
              className={`sci-toggle-btn ${showMixed ? "is-active" : ""}`}
              onClick={() => setShowMixed(!showMixed)}
            >
              {showMixed ? "Improper" : "Mixed"}
            </button>
          )}
          <button
            type="button"
            className={`sci-toggle-btn ${showDMS ? "is-active" : ""}`}
            onClick={() => setShowDMS(!showDMS)}
          >
            DMS
          </button>
          <button
            type="button"
            className={`sci-toggle-btn ${showThousandSep ? "is-active" : ""}`}
            onClick={() => setShowThousandSep(!showThousandSep)}
          >
            ,000
          </button>
        </div>

        {/* Expression input */}
        <div className="sci-display">
          <textarea
            ref={inputRef}
            className="sci-expression"
            value={expression}
            onChange={(e) => {
              pushUndo(expression);
              setExpression(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type expression..."
            rows={2}
            autoComplete="off"
            spellCheck={false}
          />
          <div className={`sci-result ${previewError ? "sci-error" : ""}`}>
            {resultDisplay}
          </div>
          {fractionDisplay && (
            <div className="sci-result-secondary">{fractionDisplay}</div>
          )}
          {dmsDisplay && (
            <div className="sci-result-secondary">{dmsDisplay}</div>
          )}
        </div>

        {/* Mode selector */}
        <div className="sci-mode-selector">
          {([
            ["trig", "TRIG"],
            ["log", "LOG"],
            ["pow", "POW"],
            ["comb", "CPB"],
            ["mem", "MEM"],
            ["util", "UTIL"],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`sci-mode-btn ${sciMode === mode ? "is-active" : ""}`}
              onClick={() => setSciMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Function panel */}
        <div className="sci-fn-panel">{renderFunctionPanel()}</div>

        {/* Memory panel (collapsible) */}
        {showMemPanel && (
          <div className="sci-mem-panel">
            <div className="sci-mem-panel-title">Memory Variables</div>
            <div className="sci-mem-grid">
              {[...MEM_VARS, "_ans", "_preans"].map((v) => (
                <div key={v} className="sci-mem-item">
                  <span className="sci-mem-name">{v === "_ans" ? "Ans" : v === "_preans" ? "Pre" : v.toUpperCase()}:</span>
                  {memEditVar === v ? (
                    <input
                      className="sci-mem-input"
                      value={memEditValue}
                      onChange={(e) => setMemEditValue(e.target.value)}
                      onBlur={handleMemSave}
                      onKeyDown={(e) => { if (e.key === "Enter") handleMemSave(); }}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="sci-mem-value"
                      onClick={() => {
                        setMemEditVar(v);
                        setMemEditValue((variables[v] ?? 0).toString());
                      }}
                    >
                      {variables[v] !== undefined ? formatNumber(variables[v], "norm", 8) : "—"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control row */}
        <div className="sci-controls">
          <button type="button" className="sci-btn sci-btn-ac" onClick={handleAC}>AC</button>
          <button type="button" className="sci-btn sci-btn-del" onClick={handleDEL}>⌫</button>
          <button type="button" className="sci-btn sci-btn-undo" onClick={handleUndo} disabled={undoStack.length === 0}>↶</button>
          <button type="button" className="sci-btn sci-btn-undo" onClick={handleRedo} disabled={redoStack.length === 0}>↷</button>
          <button type="button" className="sci-btn sci-btn-paren" onClick={() => insert("(")}>(</button>
          <button type="button" className="sci-btn sci-btn-paren" onClick={() => insert(")")}>)</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert(",")}>,</button>
          <button type="button" className="sci-btn sci-btn-fn" onClick={() => insert(";")}>;</button>
          <button type="button" className="sci-btn sci-btn-eq" onClick={handleEqual}>=</button>
        </div>

        {/* Number pad */}
        <div className="sci-grid sci-numpad">
          {[7, 8, 9].map((n) => (
            <button key={n} type="button" className="sci-btn sci-btn-num" onClick={() => insert(String(n))}>{n}</button>
          ))}
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("/")}>÷</button>
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("*")}>×</button>
          {[4, 5, 6].map((n) => (
            <button key={n} type="button" className="sci-btn sci-btn-num" onClick={() => insert(String(n))}>{n}</button>
          ))}
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("-")}>−</button>
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("+")}>+</button>
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" className="sci-btn sci-btn-num" onClick={() => insert(String(n))}>{n}</button>
          ))}
          <button type="button" className="sci-btn sci-btn-op" onClick={() => insert("^")}>^</button>
          <button type="button" className="sci-btn sci-btn-rand" onClick={() => insert(Math.random().toFixed(6))}>ℝ</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert("0")}>0</button>
          <button type="button" className="sci-btn sci-btn-num" onClick={() => insert(".")}>.</button>
          <button
            type="button"
            className="sci-btn sci-btn-num sci-btn-ans"
            onClick={() => { const v = variables._ans; if (v !== undefined) insert(v.toString()); }}
          >
            Ans
          </button>
          <button
            type="button"
            className="sci-btn sci-btn-fn"
            onClick={() => { const factors = primeFactors(Math.round(previewValue)); if (factors.length > 0) setExpression(factors.join("×")); }}
          >
            Fact
          </button>
          <button
            type="button"
            className="sci-btn sci-btn-num sci-btn-ans"
            onClick={() => { const v = variables._ans; if (v !== undefined) insert(v.toString()); }}
          >
            Ans
          </button>
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
