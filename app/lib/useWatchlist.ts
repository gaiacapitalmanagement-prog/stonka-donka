"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export type WatchlistStock = {
  ticker: string
  name: string
  tvSymbol: string
}

const MAX_STOCKS = 15

const DEFAULTS: WatchlistStock[] = [
  { ticker: "ASTS",   name: "AST SpaceMobile",       tvSymbol: "NASDAQ:ASTS" },
  { ticker: "HG.CN",  name: "Hydrograph Clean Power", tvSymbol: "CSE:HG" },
  { ticker: "QS",     name: "QuantumScape",           tvSymbol: "NASDAQ:QS" },
  { ticker: "RKLB",   name: "Rocket Lab Corp.",       tvSymbol: "NASDAQ:RKLB" },
  { ticker: "SYM",    name: "Symbotic",               tvSymbol: "NASDAQ:SYM" },
]

function storageKey(userId: string) {
  return `stonka-watchlist-${userId}`
}

function readStorage(userId: string): WatchlistStock[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function useWatchlist(userId: string) {
  const [list, setList] = useState<WatchlistStock[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const userIdRef = useRef(userId)

  useEffect(() => {
    userIdRef.current = userId
    setList(readStorage(userId))
    setIsLoaded(true)
  }, [userId])

  const addStock = useCallback((stock: WatchlistStock) => {
    setList((prev) => {
      if (prev.length >= MAX_STOCKS) return prev
      if (prev.some((s) => s.ticker === stock.ticker)) return prev
      const next = [...prev, stock]
      localStorage.setItem(storageKey(userIdRef.current), JSON.stringify(next))
      return next
    })
  }, [])

  const removeStock = useCallback((ticker: string) => {
    setList((prev) => {
      const next = prev.filter((s) => s.ticker !== ticker)
      localStorage.setItem(storageKey(userIdRef.current), JSON.stringify(next))
      return next
    })
  }, [])

  const isInWatchlist = useCallback(
    (ticker: string) => list.some((s) => s.ticker === ticker),
    [list]
  )

  return { watchlist: list, isLoaded, addStock, removeStock, isInWatchlist }
}
