"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getStockColor } from "../lib/stockColors"

type NewsItem = {
  headline: string
  source: string
  pubDate: string
  link: string
  tickers: string[]
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return "Just now"
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

export function NewsFeed({ tickers }: { tickers: string[] }) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(0)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const tickerKey = tickers.join(",")
  const tickerKeyRef = useRef(tickerKey)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await fetch(`/api/news?page=${pageRef.current}&tickers=${encodeURIComponent(tickerKeyRef.current)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems((prev) => [...prev, ...data.items])
      hasMoreRef.current = data.hasMore
      setHasMore(data.hasMore)
      pageRef.current += 1
    } catch {
      // Keep existing items on error
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  // Reset when tickers change
  useEffect(() => {
    tickerKeyRef.current = tickerKey
    pageRef.current = 0
    hasMoreRef.current = true
    loadingRef.current = false
    setItems([])
    setHasMore(true)
    loadMore()
  }, [tickerKey, loadMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current && hasMoreRef.current) {
          loadMore()
        }
      },
      { rootMargin: "400px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (items.length === 0 && !loading) {
    return <p className="text-[var(--text-dim)] text-sm">No news available right now.</p>
  }

  return (
    <>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] overflow-hidden">
        {items.map((item, i) => (
          <a
            key={`${item.link}-${i}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-[var(--hover-bg)] transition-colors block"
          >
            <div className="flex items-start gap-3 min-w-0">
              {item.tickers?.length > 0 && (
                <div className="flex gap-1 shrink-0 pt-0.5">
                  {item.tickers.map((t) => {
                    const c = getStockColor(t)
                    return (
                      <span
                        key={t}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                      >
                        {t}
                      </span>
                    )
                  })}
                </div>
              )}
              <p className="text-sm text-[var(--text-secondary)] leading-snug min-w-0">
                {item.headline}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-[var(--text-faint)]">{item.source}</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                {timeAgo(item.pubDate)}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {loading && (
        <div className="mt-3 space-y-[1px] rounded-xl overflow-hidden border border-[var(--border)]">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-[var(--bg-card)] px-5 py-4 flex justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-[var(--skeleton)] rounded w-full" />
                <div className="h-3.5 bg-[var(--skeleton)] rounded w-2/3" />
              </div>
              <div className="space-y-2 shrink-0">
                <div className="h-3 bg-[var(--skeleton)] rounded w-16" />
                <div className="h-3 bg-[var(--skeleton)] rounded w-12 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-[var(--text-dim)] text-xs mt-4 pb-2">
          — End of feed —
        </p>
      )}
    </>
  )
}
