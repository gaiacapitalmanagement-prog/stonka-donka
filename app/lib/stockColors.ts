export type StockColor = { bg: string; text: string; border: string }

const PALETTE: StockColor[] = [
  { bg: "rgba(59,130,246,0.12)",  text: "#3b82f6", border: "rgba(59,130,246,0.25)" },   // blue
  { bg: "rgba(168,85,247,0.12)",  text: "#a855f7", border: "rgba(168,85,247,0.25)" },   // purple
  { bg: "rgba(249,115,22,0.12)",  text: "#f97316", border: "rgba(249,115,22,0.25)" },   // orange
  { bg: "rgba(16,185,129,0.12)",  text: "#10b981", border: "rgba(16,185,129,0.25)" },   // emerald
  { bg: "rgba(236,72,153,0.12)",  text: "#ec4899", border: "rgba(236,72,153,0.25)" },   // pink
  { bg: "rgba(234,179,8,0.12)",   text: "#eab308", border: "rgba(234,179,8,0.25)" },    // yellow
  { bg: "rgba(239,68,68,0.12)",   text: "#ef4444", border: "rgba(239,68,68,0.25)" },    // red
  { bg: "rgba(20,184,166,0.12)",  text: "#14b8a6", border: "rgba(20,184,166,0.25)" },   // teal
  { bg: "rgba(99,102,241,0.12)",  text: "#6366f1", border: "rgba(99,102,241,0.25)" },   // indigo
  { bg: "rgba(244,63,94,0.12)",   text: "#f43f5e", border: "rgba(244,63,94,0.25)" },    // rose
  { bg: "rgba(34,197,94,0.12)",   text: "#22c55e", border: "rgba(34,197,94,0.25)" },    // green
  { bg: "rgba(6,182,212,0.12)",   text: "#06b6d4", border: "rgba(6,182,212,0.25)" },    // cyan
  { bg: "rgba(217,70,239,0.12)",  text: "#d946ef", border: "rgba(217,70,239,0.25)" },   // fuchsia
  { bg: "rgba(251,146,60,0.12)",  text: "#fb923c", border: "rgba(251,146,60,0.25)" },   // amber
  { bg: "rgba(56,189,248,0.12)",  text: "#38bdf8", border: "rgba(56,189,248,0.25)" },   // sky
]

function hashTicker(ticker: string): number {
  let hash = 0
  for (const ch of ticker) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(hash)
}

export function getStockColor(ticker: string): StockColor {
  return PALETTE[hashTicker(ticker) % PALETTE.length]
}
