export type Season = "spring" | "summer" | "autumn" | "winter";

export type SeasonMode = "auto" | Season;

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

// Northern hemisphere (Madrid, Spain). Approximate astronomical season boundaries.
export function seasonForDate(date: Date): Season {
  const day = dayOfYear(date);
  if (day >= 79 && day <= 171) return "spring";
  if (day >= 172 && day <= 265) return "summer";
  if (day >= 266 && day <= 354) return "autumn";
  return "winter";
}

export function effectiveSeason(mode: SeasonMode): Season {
  if (mode === "auto") return seasonForDate(new Date());
  return mode;
}
