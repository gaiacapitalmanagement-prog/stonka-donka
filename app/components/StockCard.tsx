"use client";

import { useEffect, useRef, useState } from "react";

export type StockData = {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  sentiment: number;
  currency: string;
  tvSymbol: string;
};

function fearGreedLabel(score: number) {
  if (score >= 75) return { label: "Extreme Greed", color: "bg-green-500" };
  if (score >= 55) return { label: "Greed",         color: "bg-green-400" };
  if (score >= 45) return { label: "Neutral",        color: "bg-yellow-400" };
  if (score >= 25) return { label: "Fear",           color: "bg-orange-400" };
  return             { label: "Extreme Fear",  color: "bg-red-500" };
}

function VerdictBadge({ text }: { text: string }) {
  const upper = text.trimStart().toUpperCase();
  if (upper.startsWith("BUY"))
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">BUY</span>;
  if (upper.startsWith("UNLOAD"))
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">UNLOAD</span>;
  if (upper.startsWith("HOLD"))
    return <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">HOLD</span>;
  return null;
}

export function StockCard({ stock }: { stock: StockData }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const positive = (stock.change ?? 0) >= 0;
  const { label, color } = fearGreedLabel(stock.sentiment);
  const currencyPrefix = stock.currency === "USD" ? "$" : `${stock.currency} `;

  async function openModal() {
    setOpen(true);
    setAnalysis("");
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stock),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnalysis((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch {
      setAnalysis("Analysis unavailable. Check your ANTHROPIC_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    readerRef.current?.cancel();
    readerRef.current = null;
    setOpen(false);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Card */}
      <button
        onClick={openModal}
        className="text-left bg-[#111111] border border-white/8 rounded-xl p-4 flex flex-col gap-3 hover:border-white/25 hover:bg-[#161616] transition-all cursor-pointer w-full"
      >
        <div>
          <span className="text-lg font-bold tracking-tight">{stock.ticker}</span>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{stock.name}</p>
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
            <p className="text-sm text-zinc-600">Data unavailable</p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">52W Position</span>
            <span className="text-xs font-semibold text-zinc-300">{stock.sentiment}</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${stock.sentiment}%` }} />
          </div>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
              <div>
                <span className="font-bold text-lg">{stock.ticker}</span>
                <span className="text-zinc-500 text-sm ml-2">{stock.name}</span>
              </div>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0">
              {/* TradingView chart */}
              <div className="flex-1 min-h-[300px] lg:min-h-0">
                <iframe
                  src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(stock.tvSymbol)}&interval=D&theme=dark&style=1&locale=en&toolbar_bg=%230a0a0a&hide_top_toolbar=0&save_image=0&calendar=0`}
                  className="w-full h-full min-h-[300px]"
                  allowFullScreen
                  title={`${stock.ticker} chart`}
                />
              </div>

              {/* AI analysis panel */}
              <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-white/8 p-5 flex flex-col gap-3 overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">AI Analysis</span>
                  {loading && (
                    <span className="inline-block w-1.5 h-3.5 bg-zinc-400 animate-pulse rounded-sm" />
                  )}
                </div>

                {analysis ? (
                  <>
                    <VerdictBadge text={analysis} />
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {analysis.replace(/^(BUY|HOLD|UNLOAD)\s*/i, "")}
                    </p>
                  </>
                ) : loading ? (
                  <p className="text-sm text-zinc-600 italic">Analyzing...</p>
                ) : null}

                <div className="mt-auto pt-3 border-t border-white/8 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">Price</span>
                    <span className="text-zinc-400">
                      {stock.price != null ? `${currencyPrefix}${stock.price.toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">Daily</span>
                    <span className={stock.change != null && stock.change >= 0 ? "text-green-400" : "text-red-400"}>
                      {stock.change != null ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">52W Position</span>
                    <span className="text-zinc-400">{stock.sentiment}/100</span>
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
