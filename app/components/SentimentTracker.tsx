"use client"

import { useState, useEffect, useRef } from "react"
import { getStockColor } from "../lib/stockColors"

type PostLink = {
  title: string
  url: string
  score: number
}

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

function sentimentLabel(pct: number): { text: string; color: string } {
  if (pct >= 65) return { text: "Bullish", color: "text-green-400" }
  if (pct >= 55) return { text: "Leaning Bullish", color: "text-green-400/70" }
  if (pct >= 45) return { text: "Neutral", color: "text-[var(--text-muted)]" }
  if (pct >= 35) return { text: "Leaning Bearish", color: "text-red-400/70" }
  return { text: "Bearish", color: "text-red-400" }
}

function barColor(pct: number): string {
  if (pct >= 65) return "#22c55e"
  if (pct >= 55) return "#4ade80"
  if (pct >= 45) return "#eab308"
  if (pct >= 35) return "#f97316"
  return "#ef4444"
}

/* ── Sentiment Modal (Reddit posts left, StockTwits right) ── */

function SentimentModal({
  stock,
  onClose,
}: {
  stock: StockSentiment
  onClose: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [onClose])

  const redditPosts = stock.reddit?.topPosts || []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">{stock.ticker}</span>
            <span className="text-[var(--text-faint)] text-sm">{stock.name}</span>
            {stock.explanation && (
              <span className="text-xs text-[var(--text-muted)] italic hidden sm:inline">
                — {stock.explanation}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Reddit posts */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)]">
              r/wallstreetbets
              {stock.reddit && (
                <span className="ml-2 font-normal normal-case tracking-normal text-[var(--text-dim)]">
                  {stock.reddit.mentions} posts &middot; {stock.reddit.bullish}% bullish
                </span>
              )}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {redditPosts.length === 0 ? (
              <p className="text-[var(--text-dim)] text-sm p-4">No posts found</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {redditPosts.map((post, i) => (
                  <a
                    key={i}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 block hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    <p className="text-sm text-[var(--text-secondary)] leading-snug line-clamp-2">
                      {post.title}
                    </p>
                    <p className="text-xs text-[var(--text-dim)] mt-1">
                      {post.score} upvotes
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sentiment Card ── */

function SentimentCard({ stock }: { stock: StockSentiment }) {
  const { text: label, color: labelColor } = sentimentLabel(stock.overall)
  const [showTip, setShowTip] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sc = getStockColor(stock.ticker)

  function handleEnter() {
    timerRef.current = setTimeout(() => setShowTip(true), 300)
  }
  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setShowTip(false)
  }

  return (
    <>
      <div
        className="relative bg-[var(--bg-card)] border rounded-xl p-4 flex flex-col gap-3 transition-all hover:bg-[var(--bg-card-hover)] cursor-pointer"
        style={{ borderColor: sc.border }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={() => setModalOpen(true)}
      >
        {/* AI explanation tooltip on hover */}
        {showTip && stock.explanation && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-[var(--bg-tooltip)] border border-[var(--border-light)] rounded-xl p-3.5 shadow-2xl z-50 pointer-events-none">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-1.5">AI Analysis</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{stock.explanation}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-[var(--bg-tooltip)] border-r border-b border-[var(--border-light)] rotate-45" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-lg font-bold tracking-tight" style={{ color: sc.text }}>{stock.ticker}</span>
            <p className="text-xs text-[var(--text-faint)] mt-0.5 truncate">{stock.name}</p>
          </div>
          {stock.trending && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">
              Trending
            </span>
          )}
        </div>

        {/* Sentiment bar */}
        <div>
          <div className="w-full h-2 bg-[var(--bar-bg)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${stock.overall}%`, backgroundColor: barColor(stock.overall) }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-red-400/60">Bearish</span>
            <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
            <span className="text-[11px] text-green-400/60">Bullish</span>
          </div>
        </div>

        {/* Source breakdown */}
        <div className="space-y-1.5 pt-1 border-t border-[var(--skeleton)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-faint)]">r/wsb</span>
            {stock.reddit ? (
              <span className="text-[var(--text-muted)]">
                {stock.reddit.mentions} posts &middot;{" "}
                <span className="text-green-400/80">{stock.reddit.bullish}%</span>
                {" / "}
                <span className="text-red-400/80">{stock.reddit.bearish}%</span>
              </span>
            ) : (
              <span className="text-[var(--text-dim)]">No data</span>
            )}
          </div>
        </div>
      </div>

      {/* Popup modal with post links */}
      {modalOpen && (
        <SentimentModal stock={stock} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}

/* ── Skeleton ── */

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <div>
          <div className="h-5 bg-[var(--skeleton)] rounded w-16" />
          <div className="h-3 bg-[var(--skeleton)] rounded w-24 mt-1.5" />
        </div>
      </div>
      <div>
        <div className="h-2 bg-[var(--skeleton)] rounded-full w-full" />
        <div className="flex justify-between mt-2">
          <div className="h-3 bg-[var(--skeleton)] rounded w-12" />
          <div className="h-3 bg-[var(--skeleton)] rounded w-16" />
          <div className="h-3 bg-[var(--skeleton)] rounded w-12" />
        </div>
      </div>
      <div className="pt-1 border-t border-[var(--skeleton)] space-y-1.5">
        <div className="h-3 bg-[var(--skeleton)] rounded w-full" />
        <div className="h-3 bg-[var(--skeleton)] rounded w-full" />
      </div>
    </div>
  )
}

/* ── Main export ── */

export function SentimentTracker({ tickers, names }: { tickers: string[]; names: string[] }) {
  const [stocks, setStocks] = useState<StockSentiment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const tickerKey = tickers.join(",")
  const nameKey = names.join(",")

  useEffect(() => {
    if (!tickerKey) { setLoading(false); return }
    setLoading(true)
    setError(false)
    fetch(`/api/sentiment?tickers=${encodeURIComponent(tickerKey)}&names=${encodeURIComponent(nameKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        setStocks(data.stocks || [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [tickerKey, nameKey])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(tickers.length || 5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error || stocks.length === 0) {
    return <p className="text-[var(--text-dim)] text-sm">Sentiment data unavailable right now.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {stocks.map((stock) => (
        <SentimentCard key={stock.ticker} stock={stock} />
      ))}
    </div>
  )
}
