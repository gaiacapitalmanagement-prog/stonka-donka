import { NextRequest, NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"

const yf = new YahooFinance()

// Map Yahoo exchange codes to TradingView prefixes
const EXCHANGE_MAP: Record<string, string> = {
  NMS: "NASDAQ", NGM: "NASDAQ", NCM: "NASDAQ", NAQ: "NASDAQ",
  NYQ: "NYSE", NYS: "NYSE", NY: "NYSE",
  CNQ: "CSE", NEO: "NEO",
  TOR: "TSX", VAN: "TSXV",
  LSE: "LSE", LON: "LSE",
  ASX: "ASX",
  FRA: "FWB",
}

function buildTvSymbol(symbol: string, exchange?: string): string {
  if (!exchange) return symbol
  const prefix = EXCHANGE_MAP[exchange]
  if (prefix) return `${prefix}:${symbol}`
  return symbol
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    const result = await (yf as any).search(q)
    const quotes = result?.quotes || []

    const results = quotes
      .filter((quote: any) => quote.symbol && (quote.quoteType === "EQUITY" || quote.quoteType === "ETF"))
      .slice(0, 10)
      .map((quote: any) => ({
        ticker: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || "",
        tvSymbol: buildTvSymbol(quote.symbol, quote.exchange),
      }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
