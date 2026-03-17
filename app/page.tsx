import YahooFinance from "yahoo-finance2";
import Parser from "rss-parser";

const yf = new YahooFinance();

export const revalidate = 300; // refresh data every 5 minutes

const STOCKS = [
  { ticker: "ASTS",  name: "AST SpaceMobile" },
  { ticker: "HG.V",  name: "Hydrograph Clean Power" },
  { ticker: "QS",    name: "QuantumScape" },
  { ticker: "RKLB",  name: "Rocket Lab Corp." },
  { ticker: "SYM",   name: "Symbotic" },
];

type QuoteResult = {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  sentiment: number;
  currency: string;
};

type NewsItem = {
  headline: string;
  source: string;
  pubDate: string;
  link: string;
};

async function getQuotes(): Promise<QuoteResult[]> {
  return Promise.all(
    STOCKS.map(async ({ ticker, name }) => {
      try {
        const q = await yf.quote(ticker);
        const price = q.regularMarketPrice ?? null;
        const low = q.fiftyTwoWeekLow ?? price ?? 0;
        const high = q.fiftyTwoWeekHigh ?? price ?? 0;
        const sentiment =
          high > low && price != null
            ? Math.round(((price - low) / (high - low)) * 100)
            : 50;
        return {
          ticker,
          name,
          price,
          change: q.regularMarketChangePercent ?? null,
          sentiment,
          currency: q.currency ?? "USD",
        };
      } catch {
        return { ticker, name, price: null, change: null, sentiment: 50, currency: "USD" };
      }
    })
  );
}

async function getNews(): Promise<NewsItem[]> {
  try {
    const parser = new Parser();
    // Use US-listed tickers for Yahoo Finance RSS (HG.V may not appear, that's OK)
    const tickers = ["ASTS", "QS", "RKLB", "SYM"].join(",");
    const feed = await parser.parseURL(
      `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${tickers}&region=US&lang=en-US`
    );
    return feed.items.slice(0, 8).map((item) => ({
      headline: item.title ?? "",
      source: item.creator ?? "Yahoo Finance",
      pubDate: item.pubDate ?? "",
      link: item.link ?? "#",
    }));
  } catch {
    return [];
  }
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fearGreedLabel(score: number) {
  if (score >= 75) return { label: "Extreme Greed", color: "bg-green-500" };
  if (score >= 55) return { label: "Greed",         color: "bg-green-400" };
  if (score >= 45) return { label: "Neutral",        color: "bg-yellow-400" };
  if (score >= 25) return { label: "Fear",           color: "bg-orange-400" };
  return             { label: "Extreme Fear",  color: "bg-red-500" };
}

export default async function Home() {
  const [quotes, news] = await Promise.all([getQuotes(), getNews()]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight">Stonka Donka</h1>
        <p className="text-sm text-zinc-400 mt-0.5">My Stock Intelligence Dashboard</p>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Stock Cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Watchlist
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quotes.map((stock) => {
              const positive = (stock.change ?? 0) >= 0;
              const { label, color } = fearGreedLabel(stock.sentiment);
              const currencyPrefix = stock.currency === "USD" ? "$" : stock.currency + " ";

              return (
                <div
                  key={stock.ticker}
                  className="bg-[#111111] border border-white/8 rounded-xl p-4 flex flex-col gap-3 hover:border-white/20 transition-colors"
                >
                  {/* Ticker + Name */}
                  <div>
                    <span className="text-lg font-bold tracking-tight">{stock.ticker}</span>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{stock.name}</p>
                  </div>

                  {/* Price + Change */}
                  <div>
                    {stock.price != null ? (
                      <>
                        <p className="text-xl font-semibold">
                          {currencyPrefix}{stock.price.toFixed(2)}
                        </p>
                        <p
                          className={`text-sm font-medium mt-0.5 ${
                            positive ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {(stock.change ?? 0).toFixed(2)}%
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-600">Data unavailable</p>
                    )}
                  </div>

                  {/* 52-Week Position (proxy for sentiment) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">52W Position</span>
                      <span className="text-xs font-semibold text-zinc-300">
                        {stock.sentiment}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${stock.sentiment}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500">{label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Latest News */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Latest News
          </h2>
          {news.length === 0 ? (
            <p className="text-zinc-600 text-sm">No news available right now.</p>
          ) : (
            <div className="bg-[#111111] border border-white/8 rounded-xl divide-y divide-white/8">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-white/[0.03] transition-colors"
                >
                  <p className="text-sm text-zinc-200 leading-snug group-hover:text-white">
                    {item.headline}
                  </p>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-zinc-500">{item.source}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{timeAgo(item.pubDate)}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
