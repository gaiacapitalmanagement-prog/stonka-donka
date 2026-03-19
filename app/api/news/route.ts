import { NextRequest, NextResponse } from "next/server"

const PAGE_SIZE = 15

type NewsItem = {
  headline: string
  source: string
  pubDate: string
  link: string
  tickers: string[]
}

// ── Cache keyed by sorted ticker string ──
const cacheMap = new Map<string, { items: NewsItem[]; ts: number }>()
const TTL = 5 * 60_000

function isUSTicker(ticker: string): boolean {
  return !ticker.includes(".")
}

function headlineMentionsTicker(headline: string, ticker: string): boolean {
  const upper = headline.toUpperCase()
  // Check the ticker itself
  if (upper.includes(ticker.toUpperCase())) return true
  // Check without exchange suffix
  const base = ticker.replace(/\.\w+$/, "")
  if (base !== ticker && upper.includes(base.toUpperCase())) return true
  return false
}

// ── Finnhub: company news (US tickers only) ──
async function fetchFinnhub(tickers: string[]): Promise<NewsItem[]> {
  const key = process.env.FINNHUB_API_KEY
  if (!key) return []

  const usTickers = tickers.filter(isUSTicker)
  if (usTickers.length === 0) return []

  const today = new Date()
  const monthAgo = new Date(today.getTime() - 30 * 86_400_000)
  const fmt = (d: Date) => d.toISOString().split("T")[0]

  const results = await Promise.allSettled(
    usTickers.map(async (ticker) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fmt(monthAgo)}&to=${fmt(today)}&token=${key}`
      )
      if (!res.ok) return []
      const data = await res.json()
      return (data as any[])
        .filter((item) => headlineMentionsTicker(item.headline || "", ticker))
        .map((item) => ({
          headline: item.headline,
          source: item.source || "Finnhub",
          pubDate: new Date(item.datetime * 1000).toISOString(),
          link: item.url,
          tickers: [ticker],
        }))
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
}

// ── Alpha Vantage: news sentiment (US tickers only) ──
function parseAVDate(s: string): string | null {
  const m = s.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  if (!m) return null
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

async function fetchAlphaVantage(tickers: string[]): Promise<NewsItem[]> {
  const key = process.env.ALPHAVANTAGE_API_KEY
  if (!key) return []

  const usTickers = tickers.filter(isUSTicker)
  if (usTickers.length === 0) return []

  try {
    const tickerStr = usTickers.join(",")
    const res = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${tickerStr}&limit=200&apikey=${key}`
    )
    if (!res.ok) return []
    const data = await res.json()
    const feed = data?.feed
    if (!Array.isArray(feed)) return []

    return feed
      .map((item: any) => {
        const pubDate = parseAVDate(item.time_published || "")
        if (!pubDate) return null
        const matched = usTickers.filter((t) =>
          (item.ticker_sentiment || []).some((ts: any) => ts.ticker === t)
        )
        return {
          headline: item.title || "",
          source: item.source || "Alpha Vantage",
          pubDate,
          link: item.url || "",
          tickers: matched.length > 0 ? matched : [],
        }
      })
      .filter((x): x is NewsItem => x !== null)
  } catch {
    return []
  }
}

// ── Yahoo RSS feeds (all tickers) ──
async function fetchYahooRSS(tickers: string[]): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`
        )
        if (!res.ok) return []
        const xml = await res.text()

        const items: NewsItem[] = []
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        let match
        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1]
          const title =
            block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || ""
          const link =
            block.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || ""
          const pubDate =
            block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ""

          const parsedDate = pubDate ? new Date(pubDate) : null
          if (title && link && parsedDate && !isNaN(parsedDate.getTime()) && headlineMentionsTicker(title, ticker)) {
            items.push({
              headline: title,
              source: "Yahoo Finance",
              pubDate: parsedDate.toISOString(),
              link,
              tickers: [ticker],
            })
          }
        }
        return items
      } catch {
        return []
      }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
}

// ── Yahoo Finance search via yahoo-finance2 ──
async function fetchYahooSearch(tickers: string[]): Promise<NewsItem[]> {
  try {
    const YahooFinance = (await import("yahoo-finance2")).default
    const yf = new YahooFinance()

    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        try {
          const result = await (yf as any).search(ticker)
          const news = Array.isArray(result?.news) ? result.news : []
          return news
            .filter((item: any) => item.providerPublishTime && headlineMentionsTicker(item.title || "", ticker))
            .map((item: any) => ({
              headline: item.title || "",
              source: item.publisher || "Yahoo Finance",
              pubDate: new Date(item.providerPublishTime * 1000).toISOString(),
              link: item.link || "",
              tickers: [ticker],
            }))
        } catch {
          return []
        }
      })
    )

    return results
      .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
  } catch {
    return []
  }
}

// ── Aggregate, deduplicate, sort ──
async function getAllNews(tickers: string[]): Promise<NewsItem[]> {
  const cacheKey = [...tickers].sort().join(",")
  const cached = cacheMap.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL) return cached.items

  const [finnhub, alphaVantage, yahooRSS, yahooSearch] = await Promise.allSettled([
    fetchFinnhub(tickers),
    fetchAlphaVantage(tickers),
    fetchYahooRSS(tickers),
    fetchYahooSearch(tickers),
  ])

  const all = [
    ...(finnhub.status === "fulfilled" ? finnhub.value : []),
    ...(alphaVantage.status === "fulfilled" ? alphaVantage.value : []),
    ...(yahooRSS.status === "fulfilled" ? yahooRSS.value : []),
    ...(yahooSearch.status === "fulfilled" ? yahooSearch.value : []),
  ]

  // Deduplicate by URL first, then by exact headline — merge tickers
  const seenLinks = new Map<string, NewsItem>()
  const seenHeadlines = new Map<string, NewsItem>()
  const deduped: NewsItem[] = []

  for (const item of all) {
    if (!item.headline || !item.link) continue
    const existing = seenLinks.get(item.link)
    if (existing) {
      for (const t of item.tickers) {
        if (!existing.tickers.includes(t)) existing.tickers.push(t)
      }
      continue
    }
    const normTitle = item.headline.toLowerCase().trim()
    const existingByTitle = seenHeadlines.get(normTitle)
    if (existingByTitle) {
      for (const t of item.tickers) {
        if (!existingByTitle.tickers.includes(t)) existingByTitle.tickers.push(t)
      }
      continue
    }
    seenLinks.set(item.link, item)
    seenHeadlines.set(normTitle, item)
    deduped.push(item)
  }

  deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

  cacheMap.set(cacheKey, { items: deduped, ts: Date.now() })
  return deduped
}

export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") || "0")
    const raw = request.nextUrl.searchParams.get("tickers") || ""
    const tickers = raw.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 15)

    if (tickers.length === 0) {
      return NextResponse.json({ items: [], hasMore: false, total: 0, page: 0 })
    }

    const news = await getAllNews(tickers)
    const start = page * PAGE_SIZE
    const items = news.slice(start, start + PAGE_SIZE)

    return NextResponse.json({
      items,
      hasMore: start + PAGE_SIZE < news.length,
      total: news.length,
      page,
    })
  } catch {
    return NextResponse.json({ items: [], hasMore: false, total: 0, page: 0 }, { status: 500 })
  }
}
