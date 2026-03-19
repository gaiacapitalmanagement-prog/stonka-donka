"use client"

import { useState, useRef, useEffect } from "react"
import { getStockColor } from "../lib/stockColors"

type SearchResult = {
  ticker: string
  name: string
  exchange: string
  tvSymbol: string
}

export function StockSearch({
  onAdd,
  isInWatchlist,
}: {
  onAdd: (stock: { ticker: string; name: string; tvSymbol: string }) => void
  isInWatchlist: (ticker: string) => boolean
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search stocks to add..."
          className="w-full pl-9 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--border-hover)] transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[var(--text-dim)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          {results.map((r) => {
            const inList = isInWatchlist(r.ticker)
            const sc = getStockColor(r.ticker)
            return (
              <button
                key={r.ticker}
                onClick={() => {
                  if (!inList) {
                    onAdd({ ticker: r.ticker, name: r.name, tvSymbol: r.tvSymbol })
                  }
                  setQuery("")
                  setResults([])
                  setOpen(false)
                }}
                disabled={inList}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                  inList
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[var(--hover-bg)] cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold shrink-0" style={{ color: sc.text }}>
                    {r.ticker}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] truncate">
                    {r.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-dim)] shrink-0">
                    {r.exchange}
                  </span>
                </div>
                <span className={`text-xs shrink-0 ${inList ? "text-[var(--text-dim)]" : "text-green-400"}`}>
                  {inList ? "Added" : "+ Add"}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
