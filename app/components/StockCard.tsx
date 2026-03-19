"use client";

import { useEffect, useRef, useState } from "react";
import { getStockColor } from "../lib/stockColors";

export type StockData = {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  sentiment: number;
  currency: string;
  tvSymbol: string;
};

type TimeHorizon = "intraday" | "swing" | "longterm";

const HORIZON_LABELS: Record<TimeHorizon, { label: string; short: string }> = {
  intraday: { label: "Intraday", short: "Today's move" },
  swing:    { label: "Swing",    short: "Days to weeks" },
  longterm: { label: "Long-term", short: "Months to years" },
};

function fearGreedLabel(score: number) {
  if (score >= 75) return { label: "Extreme Greed", color: "bg-green-500" };
  if (score >= 55) return { label: "Greed",         color: "bg-green-400" };
  if (score >= 45) return { label: "Neutral",        color: "bg-yellow-400" };
  if (score >= 25) return { label: "Fear",           color: "bg-orange-400" };
  return             { label: "Extreme Fear",  color: "bg-red-500" };
}

function VerdictBadge({ text }: { text: string }) {
  const upper = text.toUpperCase();
  if (upper.includes("VERDICT: BUY") || upper.includes("VERDICT:BUY"))
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">BUY</span>;
  if (upper.includes("VERDICT: HOLD") || upper.includes("VERDICT:HOLD"))
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">HOLD</span>;
  if (upper.includes("VERDICT: UNLOAD") || upper.includes("VERDICT:UNLOAD"))
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">UNLOAD</span>;
  return null;
}

/* Parse AI response into structured sections with styled headers */
function AnalysisBody({ text }: { text: string }) {
  // Split into lines, render headers (lines with **Label:**) differently
  const lines = text.split("\n").filter((l) => l.trim());

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Match **Something:** or **Something**
        const headerMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)/);
        if (headerMatch) {
          const label = headerMatch[1].toUpperCase();
          const content = headerMatch[2];
          // Skip the verdict line — it's shown as a badge
          if (label === "VERDICT") return null;
          return (
            <div key={i}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-color,#3b82f6)]">
                {label}
              </span>
              {content && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-0.5">{content}</p>
              )}
            </div>
          );
        }
        // Regular line
        return (
          <p key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export function StockCard({ stock, onRemove }: { stock: StockData; onRemove?: () => void }) {
  const [open, setOpen] = useState(false);
  const [horizon, setHorizon] = useState<TimeHorizon>("longterm");
  const [analyses, setAnalyses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isDark = useTheme();

  const positive = (stock.change ?? 0) >= 0;
  const { label, color } = fearGreedLabel(stock.sentiment);
  const currencyPrefix = stock.currency === "USD" ? "$" : `${stock.currency} `;
  const sc = getStockColor(stock.ticker);

  const cacheKey = `${stock.ticker}-${horizon}`;
  const analysis = analyses[cacheKey] || "";

  async function fetchAnalysis(key: string, h: TimeHorizon, force = false) {
    if (!force && analyses[key]) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: stock.ticker, name: stock.name, horizon: h }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAnalyses((prev) => ({ ...prev, [key]: data.analysis || "No analysis returned." }));
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setAnalyses((prev) => ({ ...prev, [key]: "Analysis unavailable. Check your ANTHROPIC_API_KEY." }));
    } finally {
      setLoading(false);
    }
  }

  function refreshAnalysis() {
    fetchAnalysis(cacheKey, horizon, true);
  }

  function openModal() {
    setOpen(true);
    fetchAnalysis(cacheKey, horizon);
  }

  function closeModal() {
    abortRef.current?.abort();
    setOpen(false);
  }

  // Fetch analysis when horizon changes while modal is open
  useEffect(() => {
    if (open) {
      const key = `${stock.ticker}-${horizon}`;
      fetchAnalysis(key, horizon);
    }
  }, [horizon, open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const tvTheme = isDark ? "dark" : "light";
  const tvToolbarBg = isDark ? "%230a0a0a" : "%23ffffff";

  return (
    <>
      {/* Card */}
      <div className="relative w-full">
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-faint)] hover:text-red-400 hover:border-red-400/50 transition-colors text-xs flex items-center justify-center cursor-pointer"
            title="Remove from watchlist"
          >
            ✕
          </button>
        )}
        <button
          onClick={openModal}
          className="text-left bg-[var(--bg-card)] border rounded-xl p-4 flex flex-col gap-3 hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer w-full"
          style={{ borderColor: sc.border }}
        >
        <div>
          <span className="text-lg font-bold tracking-tight" style={{ color: sc.text }}>{stock.ticker}</span>
          <p className="text-xs text-[var(--text-faint)] mt-0.5 truncate">{stock.name}</p>
        </div>
        <div>
          {stock.price != null ? (
            <>
              <p className="text-xl font-semibold">
                {currencyPrefix}{stock.price.toFixed(2)}
              </p>
              <p className={`text-sm font-medium mt-0.5 ${positive ? "text-green-400" : "text-red-400"}`}>
                {positive ? "+" : ""}{(stock.change ?? 0).toFixed(2)}%
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--text-dim)]">Data unavailable</p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--text-faint)]">52W Position</span>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">{stock.sentiment}</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--bar-bg)] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${stock.sentiment}%` }} />
          </div>
          <p className="text-xs text-[var(--text-faint)]">{label}</p>
        </div>
      </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg" style={{ color: sc.text }}>{stock.ticker}</span>
                <span className="text-[var(--text-faint)] text-sm">{stock.name}</span>
              </div>
              <button
                onClick={closeModal}
                className="text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0">
              {/* TradingView chart */}
              <div className="flex-1 min-h-[300px] lg:min-h-0">
                <iframe
                  key={tvTheme}
                  src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(stock.tvSymbol)}&interval=D&theme=${tvTheme}&style=1&locale=en&toolbar_bg=${tvToolbarBg}&hide_top_toolbar=0&save_image=0&calendar=0`}
                  className="w-full h-full min-h-[300px]"
                  allowFullScreen
                  title={`${stock.ticker} chart`}
                />
              </div>

              {/* AI analysis panel */}
              <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border)] flex flex-col overflow-hidden">
                {/* Time horizon selector */}
                <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-dim)] mb-2">Time Horizon</p>
                  <div className="flex gap-1">
                    {(["intraday", "swing", "longterm"] as TimeHorizon[]).map((h) => (
                      <button
                        key={h}
                        onClick={() => setHorizon(h)}
                        className={`flex-1 text-xs py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                          horizon === h
                            ? "bg-[var(--text-primary)] text-[var(--bg-page)] font-semibold"
                            : "bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {HORIZON_LABELS[h].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-dim)] mt-1.5">{HORIZON_LABELS[horizon].short}</p>
                </div>

                {/* Analysis content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)]">AI Analysis</span>
                      {loading && (
                        <span className="inline-block w-1.5 h-3.5 bg-[var(--text-muted)] animate-pulse rounded-sm" />
                      )}
                    </div>
                    {analysis && !loading && (
                      <button
                        onClick={refreshAnalysis}
                        className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Refresh analysis"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {analysis ? (
                    <>
                      <VerdictBadge text={analysis} />
                      <AnalysisBody text={analysis} />
                    </>
                  ) : loading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-5 bg-[var(--skeleton)] rounded w-16" />
                      <div className="h-3 bg-[var(--skeleton)] rounded w-full" />
                      <div className="h-3 bg-[var(--skeleton)] rounded w-4/5" />
                      <div className="h-3 bg-[var(--skeleton)] rounded w-full" />
                      <div className="h-3 bg-[var(--skeleton)] rounded w-3/5" />
                    </div>
                  ) : null}
                </div>

                {/* Quick stats footer */}
                <div className="px-4 py-3 border-t border-[var(--border)] space-y-1 shrink-0">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-dim)]">Price</span>
                    <span className="text-[var(--text-muted)]">
                      {stock.price != null ? `${currencyPrefix}${stock.price.toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-dim)]">Daily</span>
                    <span className={stock.change != null && stock.change >= 0 ? "text-green-400" : "text-red-400"}>
                      {stock.change != null ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-dim)]">52W Position</span>
                    <span className="text-[var(--text-muted)]">{stock.sentiment}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
