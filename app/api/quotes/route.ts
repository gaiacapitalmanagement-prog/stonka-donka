import { NextRequest, NextResponse } from "next/server"
import YahooFinance from "yahoo-finance2"

const yf = new YahooFinance()

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("tickers") || ""
  const tickers = raw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 15)

  if (tickers.length === 0) {
    return NextResponse.json({ quotes: [] })
  }

  const quotes = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const q = await yf.quote(ticker)
        const price = q.regularMarketPrice ?? null
        const low = q.fiftyTwoWeekLow ?? price ?? 0
        const high = q.fiftyTwoWeekHigh ?? price ?? 0
        const sentiment =
          high > low && price != null
            ? Math.round(((price - low) / (high - low)) * 100)
            : 50
        return {
          ticker,
          price,
          change: q.regularMarketChangePercent ?? null,
          sentiment,
          currency: q.currency ?? "USD",
        }
      } catch {
        return { ticker, price: null, change: null, sentiment: 50, currency: "USD" }
      }
    })
  )

  return NextResponse.json({ quotes })
}
