import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type TimeHorizon = "intraday" | "swing" | "longterm";

// ── Fetch enriched data from Yahoo Finance ──
async function getEnrichedData(ticker: string) {
  try {
    const [quote, summary] = await Promise.all([
      yf.quote(ticker),
      yf.quoteSummary(ticker, {
        modules: ["assetProfile", "financialData", "defaultKeyStatistics"],
      }).catch(() => null),
    ]);

    return {
      price: quote.regularMarketPrice ?? null,
      change: quote.regularMarketChangePercent ?? null,
      currency: quote.currency ?? "USD",
      volume: quote.regularMarketVolume ?? null,
      avgVolume: quote.averageDailyVolume3Month ?? null,
      marketCap: quote.marketCap ?? null,
      trailingPE: quote.trailingPE ?? null,
      forwardPE: quote.forwardPE ?? null,
      priceToBook: quote.priceToBook ?? null,
      fiftyDayMA: quote.fiftyDayAverage ?? null,
      twoHundredDayMA: quote.twoHundredDayAverage ?? null,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
      epsTrailing: quote.epsTrailingTwelveMonths ?? null,
      epsForward: quote.epsForward ?? null,
      dividendYield: quote.dividendYield ?? null,
      analystRating: quote.averageAnalystRating ?? null,
      // From quoteSummary
      sector: summary?.assetProfile?.sector ?? null,
      industry: summary?.assetProfile?.industry ?? null,
      beta: summary?.defaultKeyStatistics?.beta ?? null,
      shortPercentOfFloat: summary?.defaultKeyStatistics?.shortPercentOfFloat ?? null,
      revenueGrowth: summary?.financialData?.revenueGrowth ?? null,
      profitMargin: summary?.financialData?.profitMargins ?? null,
      debtToEquity: summary?.financialData?.debtToEquity ?? null,
    };
  } catch {
    return null;
  }
}

function formatMarketCap(mc: number | null): string {
  if (mc == null) return "N/A";
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(0)}M`;
  return `$${mc.toLocaleString()}`;
}

function pct(v: number | null): string {
  if (v == null) return "N/A";
  return `${(v * 100).toFixed(1)}%`;
}

function num(v: number | null, decimals = 2): string {
  if (v == null) return "N/A";
  return v.toFixed(decimals);
}

function buildDataBlock(ticker: string, name: string, d: NonNullable<Awaited<ReturnType<typeof getEnrichedData>>>): string {
  const currencyPrefix = d.currency === "USD" ? "$" : `${d.currency} `;
  const priceStr = d.price != null ? `${currencyPrefix}${num(d.price)}` : "N/A";
  const changeStr = d.change != null ? `${d.change >= 0 ? "+" : ""}${num(d.change)}%` : "N/A";

  const low = d.fiftyTwoWeekLow ?? d.price ?? 0;
  const high = d.fiftyTwoWeekHigh ?? d.price ?? 0;
  const weekPos = high > low && d.price != null ? Math.round(((d.price - low) / (high - low)) * 100) : 50;

  const volRatio = d.volume && d.avgVolume ? (d.volume / d.avgVolume).toFixed(2) : "N/A";

  return `${ticker} (${name})
${d.sector ? `Sector: ${d.sector} | Industry: ${d.industry}` : ""}
Price: ${priceStr} | Daily change: ${changeStr}
52-week range: ${currencyPrefix}${num(d.fiftyTwoWeekLow)} – ${currencyPrefix}${num(d.fiftyTwoWeekHigh)} | Position: ${weekPos}/100
50-day MA: ${currencyPrefix}${num(d.fiftyDayMA)} | 200-day MA: ${currencyPrefix}${num(d.twoHundredDayMA)}
Volume: ${d.volume?.toLocaleString() ?? "N/A"} | Avg volume: ${d.avgVolume?.toLocaleString() ?? "N/A"} | Vol ratio: ${volRatio}x
Market cap: ${formatMarketCap(d.marketCap)}
Trailing P/E: ${num(d.trailingPE)} | Forward P/E: ${num(d.forwardPE)} | P/B: ${num(d.priceToBook)}
EPS (TTM): ${num(d.epsTrailing)} | EPS (Fwd): ${num(d.epsForward)}
Revenue growth: ${pct(d.revenueGrowth)} | Profit margin: ${pct(d.profitMargin)} | D/E: ${num(d.debtToEquity, 1)}
Dividend yield: ${d.dividendYield != null ? pct(d.dividendYield / 100) : "N/A"}
Beta: ${num(d.beta)} | Short % of float: ${d.shortPercentOfFloat != null ? pct(d.shortPercentOfFloat) : "N/A"}
Analyst consensus: ${d.analystRating ?? "N/A"}`.trim();
}

function buildPrompt(dataBlock: string, horizon: TimeHorizon): string {
  const horizonFocus: Record<TimeHorizon, string> = {
    intraday: "Focus on momentum, volume vs average, price vs MAs, beta, short squeeze potential.",
    swing: "Focus on technical setup (price vs 50/200 MAs), volume trends, 52W position, short interest.",
    longterm: "Focus on valuation (P/E, P/B), fundamentals (growth, margins, debt), dividend, analyst consensus.",
  };

  return `Sharp stock analyst. Be concise — no filler, no disclaimers.

${horizonFocus[horizon]}

${dataBlock}

Reply in this EXACT format (keep each section to 1 line max):
**Verdict: BUY/HOLD/UNLOAD**
**Why:** 1 sentence — your core reason
**Signals:** 2-3 key data points, comma separated
**Risk:** 1 sentence — biggest risk
**Levels:** key support/resistance prices`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured in .env.local" },
      { status: 500 },
    );
  }

  const { ticker, name, horizon = "longterm" } = await req.json() as {
    ticker: string;
    name: string;
    horizon?: TimeHorizon;
  };

  const client = new Anthropic({ apiKey });

  const data = await getEnrichedData(ticker);
  if (!data || data.price == null) {
    return NextResponse.json(
      { error: `Could not fetch market data for ${ticker}` },
      { status: 400 },
    );
  }

  const dataBlock = buildDataBlock(ticker, name, data);
  const prompt = buildPrompt(dataBlock, horizon);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ analysis: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
