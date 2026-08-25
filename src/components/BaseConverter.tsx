import { useState, useCallback } from "react";

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function isValidForBase(ch: string, base: number): boolean {
  const upper = ch.toUpperCase();
  const idx = DIGITS.indexOf(upper);
  return idx >= 0 && idx < base;
}

function valueToDigits(value: bigint, base: number): string {
  if (value === 0n) return "0";
  const negative = value < 0;
  let abs = negative ? -value : value;
  let result = "";
  while (abs > 0n) {
    result = DIGITS[Number(abs % BigInt(base))] + result;
    abs = abs / BigInt(base);
  }
  return negative ? "-" + result : result;
}

function parseInput(raw: string, base: number): { intPart: bigint; fracPart: number; negative: boolean; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { intPart: 0n, fracPart: 0, negative: false, error: null };

  let negative = false;
  let s = trimmed;
  if (s[0] === "-") {
    negative = true;
    s = s.slice(1);
  } else if (s[0] === "+") {
    s = s.slice(1);
  }

  const dotIdx = s.indexOf(".");
  const intStr = dotIdx >= 0 ? s.slice(0, dotIdx) : s;
  const fracStr = dotIdx >= 0 ? s.slice(dotIdx + 1) : "";

  if (!intStr && !fracStr) return { intPart: 0n, fracPart: 0, negative, error: null };

  // Validate characters
  for (const ch of intStr) {
    if (!isValidForBase(ch, base)) {
      return { intPart: 0n, fracPart: 0, negative, error: `Invalid digit '${ch}' for base ${base}` };
    }
  }
  for (const ch of fracStr) {
    if (!isValidForBase(ch, base)) {
      return { intPart: 0n, fracPart: 0, negative, error: `Invalid digit '${ch}' for base ${base}` };
    }
  }

  // Parse integer part
  let intPart = 0n;
  for (const ch of intStr) {
    intPart = intPart * BigInt(base) + BigInt(DIGITS.indexOf(ch.toUpperCase()));
  }

  // Parse fractional part
  let fracPart = 0;
  let denom = 1;
  for (const ch of fracStr) {
    denom *= base;
    fracPart += DIGITS.indexOf(ch.toUpperCase()) / denom;
  }

  return {
    intPart: negative ? -intPart : intPart,
    fracPart: negative ? -fracPart : fracPart,
    negative,
    error: null,
  };
}

function fracToBaseString(frac: number, base: number, maxDigits: number): string {
  if (frac === 0) return "";
  let result = ".";
  let f = Math.abs(frac);
  for (let i = 0; i < maxDigits && f > 0; i++) {
    f *= base;
    const digit = Math.floor(f);
    result += DIGITS[digit];
    f -= digit;
  }
  return result;
}

function formatResult(intPart: bigint, fracPart: number, base: number): string {
  const intStr = valueToDigits(intPart, base);
  if (fracPart === 0) return intStr;
  const fracStr = fracToBaseString(fracPart, base, 16);
  return intStr + fracStr;
}

interface BaseField {
  base: number;
  label: string;
  prefix: string;
}

const BASE_FIELDS: BaseField[] = [
  { base: 2, label: "Binary", prefix: "0b" },
  { base: 8, label: "Octal", prefix: "0o" },
  { base: 10, label: "Decimal", prefix: "" },
  { base: 16, label: "Hexadecimal", prefix: "0x" },
];

export function BaseConverter() {
  const [sourceBase, setSourceBase] = useState(10);
  const [values, setValues] = useState<Record<number, string>>({
    2: "",
    8: "",
    10: "0",
    16: "",
  });
  const [customBase, setCustomBase] = useState(36);
  const [customValue, setCustomValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convertFrom = useCallback((fromBase: number, raw: string) => {
    const { intPart, fracPart, error: parseErr } = parseInput(raw, fromBase);

    if (parseErr) {
      setError(parseErr);
      return;
    }

    setError(null);

    if (!raw.trim()) {
      setValues({ 2: "", 8: "", 10: "", 16: "" });
      setCustomValue("");
      return;
    }

    const newValues: Record<number, string> = {};
    for (const field of BASE_FIELDS) {
      newValues[field.base] = formatResult(intPart, fracPart, field.base);
    }
    setValues(newValues);

    // Custom base
    if (customBase !== 2 && customBase !== 8 && customBase !== 10 && customBase !== 16) {
      setCustomValue(formatResult(intPart, fracPart, customBase));
    }
  }, [customBase]);

  const handleFieldChange = (base: number, value: string) => {
    setValues((prev) => ({ ...prev, [base]: value }));
    setSourceBase(base);
    convertFrom(base, value);
  };

  const handleCustomBaseChange = (newBase: number) => {
    setCustomBase(newBase);
    // Re-convert from source
    const raw = values[sourceBase] ?? "";
    if (raw.trim()) {
      const { intPart, fracPart } = parseInput(raw, sourceBase);
      setCustomValue(formatResult(intPart, fracPart, newBase));
    }
  };

  const handleCustomValueChange = (value: string) => {
    setCustomValue(value);
    setSourceBase(customBase);
    const { intPart, fracPart, error: parseErr } = parseInput(value, customBase);
    if (parseErr) {
      setError(parseErr);
      return;
    }
    setError(null);
    if (!value.trim()) {
      setValues({ 2: "", 8: "", 10: "", 16: "" });
      return;
    }
    const newValues: Record<number, string> = {};
    for (const field of BASE_FIELDS) {
      newValues[field.base] = formatResult(intPart, fracPart, field.base);
    }
    setValues(newValues);
  };

  return (
    <div className="base-converter">
      <div className="calc-card card">
        <div className="base-fields">
          {BASE_FIELDS.map((field) => (
            <div className="field" key={field.base}>
              <label htmlFor={`base-${field.base}`}>
                {field.label}
                <span className="base-tag">{field.base}</span>
              </label>
              <input
                id={`base-${field.base}`}
                type="text"
                autoComplete="off"
                spellCheck={false}
                className="mono-input"
                placeholder={field.prefix ? `${field.prefix}...` : "..."}
                value={values[field.base]}
                onChange={(e) => handleFieldChange(field.base, e.target.value)}
              />
            </div>
          ))}

          <div className="field base-custom-field">
            <label htmlFor="base-custom">
              Custom Base
              <select
                className="base-select"
                value={customBase}
                onChange={(e) => handleCustomBaseChange(Number(e.target.value))}
              >
                {Array.from({ length: 35 }, (_, i) => i + 2)
                  .filter((b) => b !== 2 && b !== 8 && b !== 10 && b !== 16)
                  .map((b) => (
                    <option key={b} value={b}>
                      Base {b}
                    </option>
                  ))}
              </select>
            </label>
            <input
              id="base-custom"
              type="text"
              autoComplete="off"
              spellCheck={false}
              className="mono-input"
              placeholder="..."
              value={customValue}
              onChange={(e) => handleCustomValueChange(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="base-error" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
