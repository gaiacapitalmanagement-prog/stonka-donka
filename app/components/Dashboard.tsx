"use client"

import { useState, useEffect } from "react"
import { useWatchlist } from "../lib/useWatchlist"
import { getStockColor } from "../lib/stockColors"
import { StockCard, type StockData } from "./StockCard"
import { StockSearch } from "./StockSearch"
import { SentimentTracker } from "./SentimentTracker"
import { NewsFeed } from "./NewsFeed"

type QuoteData = {
  ticker: string
  price: number | null
  change: number | null
  sentiment: number
  currency: string
}

export function Dashboard({ userId }: { userId: string }) {
  const { watchlist, isLoaded, addStock, removeStock, isInWatchlist } = useWatchlist(userId)
  const [quotes, setQuotes] = useState<Map<string, QuoteData>>(new Map())
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [newsFilter, setNewsFilter] = useState<string>("all")

  const tickerKey = watchlist.map((s) => s.ticker).join(",")

  useEffect(() => {
    if (!tickerKey) {
      setQuotes(new Map())
      setQuotesLoading(false)
      return
    }
    setQuotesLoading(true)
    fetch(`/api/quotes?tickers=${encodeURIComponent(tickerKey)}`)
      .then((res) => res.json())
      .then((data) => {
        const map = new Map<string, QuoteData>()
        for (const q of data.quotes || []) {
          map.set(q.ticker, q)
        }
        setQuotes(map)
      })
      .catch(() => {})
      .finally(() => setQuotesLoading(false))
  }, [tickerKey])

  // Reset news filter if filtered ticker is removed from watchlist
  useEffect(() => {
    if (newsFilter !== "all" && !watchlist.some((s) => s.ticker === newsFilter)) {
      setNewsFilter("all")
    }
  }, [watchlist, newsFilter])

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        <section>
          <div className="h-4 bg-[var(--skeleton)] rounded w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 h-40" />
            ))}
          </div>
        </section>
      </div>
    )
  }

  const stockData: StockData[] = watchlist.map((s) => {
    const q = quotes.get(s.ticker)
    return {
      ticker: s.ticker,
      name: s.name,
      tvSymbol: s.tvSymbol,
      price: q?.price ?? null,
      change: q?.change ?? null,
      sentiment: q?.sentiment ?? 50,
      currency: q?.currency ?? "USD",
    }
  })

  const tickers = watchlist.map((s) => s.ticker)
  const names = watchlist.map((s) => s.name)
  const newsTickers = newsFilter === "all" ? tickers : [newsFilter]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Stock Cards */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)]">
            Watchlist — click a card to open chart &amp; AI analysis
          </h2>
          <StockSearch onAdd={addStock} isInWatchlist={isInWatchlist} />
        </div>
        {watchlist.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 text-center">
            <p className="text-[var(--text-muted)] text-sm">Your watchlist is empty. Search for stocks above to add them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stockData.map((stock) =>
              quotesLoading && !quotes.has(stock.ticker) ? (
                <div key={stock.ticker} className="animate-pulse bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 h-40" />
              ) : (
                <StockCard
                  key={stock.ticker}
                  stock={stock}
                  onRemove={() => removeStock(stock.ticker)}
                />
              )
            )}
          </div>
        )}
      </section>

      {/* Retail Sentiment Tracker */}
      {tickers.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-4">
            Retail Sentiment — r/wallstreetbets
          </h2>
          <SentimentTracker tickers={tickers} names={names} />
        </section>
      )}

      {/* Infinite-scroll News Feed */}
      {tickers.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)]">
              Latest News — Finnhub &middot; Alpha Vantage &middot; Yahoo Finance
            </h2>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setNewsFilter("all")}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  newsFilter === "all"
                    ? "bg-[var(--text-primary)] text-[var(--bg-page)] font-semibold"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]"
                }`}
              >
                All
              </button>
              {watchlist.map((s) => {
                const sc = getStockColor(s.ticker)
                const active = newsFilter === s.ticker
                return (
                  <button
                    key={s.ticker}
                    onClick={() => setNewsFilter(s.ticker)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${
                      active ? "font-semibold" : "hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: active ? sc.bg : "transparent",
                      color: active ? sc.text : "var(--text-muted)",
                      borderColor: active ? sc.border : "var(--border)",
                    }}
                  >
                    {s.ticker}
                  </button>
                )
              })}
            </div>
          </div>
          <NewsFeed tickers={newsTickers} />
        </section>
      )}
    </div>
  )
}
