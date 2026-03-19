export const STOCK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ASTS:    { bg: "rgba(59,130,246,0.12)",  text: "#3b82f6", border: "rgba(59,130,246,0.25)" },   // blue
  QS:      { bg: "rgba(168,85,247,0.12)",  text: "#a855f7", border: "rgba(168,85,247,0.25)" },   // purple
  RKLB:    { bg: "rgba(249,115,22,0.12)",  text: "#f97316", border: "rgba(249,115,22,0.25)" },   // orange
  SYM:     { bg: "rgba(16,185,129,0.12)",  text: "#10b981", border: "rgba(16,185,129,0.25)" },   // emerald
  "HG.CN": { bg: "rgba(236,72,153,0.12)",  text: "#ec4899", border: "rgba(236,72,153,0.25)" },   // pink
}

export function getStockColor(ticker: string) {
  return STOCK_COLORS[ticker] ?? { bg: "rgba(255,255,255,0.06)", text: "var(--text-muted)", border: "var(--border)" }
}
