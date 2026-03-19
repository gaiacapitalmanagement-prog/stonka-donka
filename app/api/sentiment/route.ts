import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const BULLISH = [
  "buy", "calls", "call", "moon", "mooning", "rocket", "bull", "bullish",
  "long", "undervalued", "squeeze", "breakout", "yolo", "tendies",
  "diamond hands", "apes", "going up", "pump", "rally", "dip buy",
  "leaps", "accumulate", "load up",
  "🚀", "💎", "🙌", "📈", "🦍",
]

const BEARISH = [
  "sell", "puts", "put", "crash", "bear", "bearish", "short", "overvalued",
  "dump", "dumping", "bag", "bagholder", "rug pull", "bagholding", "tank",
  "drill", "drilling", "going down", "dead", "worthless", "overpriced",
  "fade", "exit",
  "📉", "🐻", "💀", "🤡",
]

type PostLink = { title: string; url: string; score: number }

type SourceSentiment = {
  mentions: number
  bullish: number
  bearish: number
  neutral: number
  avgScore: number
  topPosts: PostLink[]
}

type StockSentiment = {
  ticker: string
  name: string
  overall: number
  reddit: SourceSentiment | null
  trending: boolean
  explanation: string
}

type StockInput = { ticker: string; name: string }

// ── Cache keyed by sorted ticker string ──
const cacheMap = new Map<string, { data: StockSentiment[]; ts: number }>()
const TTL = 15 * 60_000

function buildSearchTerms(ticker: string, name: string): string[] {
  const terms = [ticker]
  // Add ticker without exchange suffix (e.g. HG.CN -> HG)
  const base = ticker.replace(/\.\w+$/, "")
  if (base !== ticker) terms.push(base)
  // Add company name and individual words longer than 4 chars
  if (name) terms.push(name)
  return terms
}

function analyzeSentiment(text: string): "bullish" | "bearish" | "neutral" {
  const lower = text.toLowerCase()
  const bullHits = BULLISH.filter((kw) => lower.includes(kw)).length
  const bearHits = BEARISH.filter((kw) => lower.includes(kw)).length
  if (bullHits > bearHits) return "bullish"
  if (bearHits > bullHits) return "bearish"
  return "neutral"
}

// ── Reddit: search r/wallstreetbets ──
async function getRedditSentiment(searchTerms: string[]): Promise<SourceSentiment | null> {
  try {
    const query = searchTerms.map((t) => `"${t}"`).join(" OR ")
    const res = await fetch(
      `https://www.reddit.com/r/wallstreetbets/search.json?q=${encodeURIComponent(query)}&sort=new&limit=100&t=month&restrict_sr=true`,
      { headers: { "User-Agent": "StonkaDonka/1.0 (stock-dashboard)" } }
    )
    if (!res.ok) return null
    const ct = res.headers.get("content-type") || ""
    if (!ct.includes("json")) return null

    const data = await res.json()
    const posts = data?.data?.children || []

    let bullish = 0, bearish = 0, neutral = 0, totalScore = 0

    for (const post of posts) {
      const d = post.data
      if (!d) continue
      const text = `${d.title || ""} ${d.selftext || ""} ${d.link_flair_text || ""}`
      const score = Math.max(d.score || 0, 0)
      const weight = Math.max(1, Math.log2(score + 1))
      totalScore += score

      const s = analyzeSentiment(text)
      if (s === "bullish") bullish += weight
      else if (s === "bearish") bearish += weight
      else neutral += weight
    }

    const topPosts: PostLink[] = [...posts]
      .sort((a: any, b: any) => (b.data?.score || 0) - (a.data?.score || 0))
      .slice(0, 10)
      .map((p: any) => ({
        title: p.data?.title || "",
        url: `https://reddit.com${p.data?.permalink || ""}`,
        score: p.data?.score || 0,
      }))

    const total = bullish + bearish + neutral || 1
    return {
      mentions: posts.length,
      bullish: Math.round((bullish / total) * 100),
      bearish: Math.round((bearish / total) * 100),
      neutral: Math.round((neutral / total) * 100),
      avgScore: posts.length > 0 ? Math.round(totalScore / posts.length) : 0,
      topPosts,
    }
  } catch {
    return null
  }
}

// ── WSB hot posts for trending detection ──
async function getWSBHotMentions(stocks: StockInput[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  try {
    const res = await fetch(
      "https://www.reddit.com/r/wallstreetbets/hot.json?limit=100",
      { headers: { "User-Agent": "StonkaDonka/1.0 (stock-dashboard)" } }
    )
    if (!res.ok) return counts
    const ct = res.headers.get("content-type") || ""
    if (!ct.includes("json")) return counts

    const data = await res.json()
    const posts = data?.data?.children || []

    for (const post of posts) {
      const text = `${post.data?.title || ""} ${post.data?.selftext || ""}`.toUpperCase()
      for (const stock of stocks) {
        const terms = buildSearchTerms(stock.ticker, stock.name)
        for (const term of terms) {
          if (text.includes(term.toUpperCase())) {
            counts.set(stock.ticker, (counts.get(stock.ticker) || 0) + 1)
            break
          }
        }
      }
    }
  } catch {
    // silent
  }
  return counts
}

// ── AI explanations (single batched call) ──
async function generateExplanations(results: StockSentiment[]): Promise<Map<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === "your_api_key_here") return new Map()

  try {
    const client = new Anthropic({ apiKey })

    const lines = results
      .map((s) => {
        const r = s.reddit
          ? `Reddit: ${s.reddit.mentions} posts, ${s.reddit.bullish}% bullish`
          : "Reddit: no data"
        return `${s.ticker} (${s.name}): ${s.overall}% bullish overall. ${r}.`
      })
      .join("\n")

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are a sharp retail sentiment analyst. For each stock below, write exactly 1 punchy sentence explaining why retail traders are bullish or bearish based on the social media data. Be specific, blunt, no disclaimers.

${lines}

Format — one per line:
TICKER: sentence`,
        },
      ],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const map = new Map<string, string>()
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z][A-Z0-9.]+):\s*(.+)/)
      if (match) map.set(match[1], match[2])
    }
    return map
  } catch (err) {
    console.error("Failed to generate sentiment explanations:", err)
    return new Map()
  }
}

// ── Aggregate ──
async function getSentiment(stocks: StockInput[]): Promise<StockSentiment[]> {
  const cacheKey = stocks.map((s) => s.ticker).sort().join(",")
  const cached = cacheMap.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL) return cached.data

  const hotMentions = await getWSBHotMentions(stocks)

  const results: StockSentiment[] = await Promise.all(
    stocks.map(async (stock) => {
      const searchTerms = buildSearchTerms(stock.ticker, stock.name)
      const reddit = await getRedditSentiment(searchTerms)
      const overall = reddit ? reddit.bullish : 50

      const hotCount = hotMentions.get(stock.ticker) || 0
      const trending = hotCount >= 3 || (reddit?.mentions || 0) > 30

      return {
        ticker: stock.ticker,
        name: stock.name,
        overall,
        reddit,
        trending,
        explanation: "",
      }
    })
  )

  const explanations = await generateExplanations(results)
  for (const r of results) {
    r.explanation =
      explanations.get(r.ticker) ||
      explanations.get(r.ticker.replace(/\.\w+$/, "")) ||
      ""
  }

  cacheMap.set(cacheKey, { data: results, ts: Date.now() })
  return results
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("tickers") || ""
    const names = request.nextUrl.searchParams.get("names") || ""
    const tickerList = raw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 15)
    const nameList = names.split(",").map((n) => n.trim())

    if (tickerList.length === 0) {
      return NextResponse.json({ stocks: [] })
    }

    const stocks: StockInput[] = tickerList.map((ticker, i) => ({
      ticker,
      name: nameList[i] || ticker,
    }))

    const sentiments = await getSentiment(stocks)
    return NextResponse.json({ stocks: sentiments })
  } catch {
    return NextResponse.json({ stocks: [] }, { status: 500 })
  }
}
