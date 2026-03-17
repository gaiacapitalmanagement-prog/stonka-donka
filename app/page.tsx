import YahooFinance from "yahoo-finance2";
import { StockCard, type StockData } from "./components/StockCard";

const yf = new YahooFinance();

export const revalidate = 300; // refresh every 5 minutes

const STOCKS = [
  { ticker: "ASTS",  name: "AST SpaceMobile",       tvSymbol: "NASDAQ:ASTS" },
  { ticker: "HG.CN", name: "Hydrograph Clean Power", tvSymbol: "CSE:HG"     },
  { ticker: "QS",    name: "QuantumScape",            tvSymbol: "NASDAQ:QS"   },
  { ticker: "RKLB",  name: "Rocket Lab Corp.",        tvSymbol: "NASDAQ:RKLB" },
  { ticker: "SYM",   name: "Symbotic",                tvSymbol: "NASDAQ:SYM"  },
];

type NewsItem = {
  headline: string;
  source: string;
  pubDate: string;
  link: string;
};

async function getQuotes(): Promise<StockData[]> {
  return Promise.all(
    STOCKS.map(async ({ ticker, name, tvSymbol }) => {
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
          tvSymbol,
          price,
          change: q.regularMarketChangePercent ?? null,
          sentiment,
          currency: q.currency ?? "USD",
        };
      } catch {
        return { ticker, name, tvSymbol, price: null, change: null, sentiment: 50, currency: "USD" };
      }
    })
  );
}

async function getNews(): Promise<NewsItem[]> {
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (!finnhubKey) return [];

  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Fetch news for each US-listed ticker in parallel
    const tickers = ["ASTS", "QS", "RKLB", "SYM"];
    const results = await Promise.all(
      tickers.map(async (ticker) => {
        const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fmt(weekAgo)}&to=${fmt(today)}&token=${finnhubKey}`;
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        return res.json() as Promise<
          { headline: string; source: string; datetime: number; url: string }[]
        >;
      })
    );

    // Merge, deduplicate by URL, sort by date descending, take top 8
    const seen = new Set<string>();
    return results
      .flat()
      .sort((a, b) => b.datetime - a.datetime)
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      })
      .slice(0, 8)
      .map((item) => ({
        headline: item.headline,
        source: item.source,
        pubDate: new Date(item.datetime * 1000).toISOString(),
        link: item.url,
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

export default async function Home() {
  const [quotes, news] = await Promise.all([getQuotes(), getNews()]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <header className="border-b border-white/10 px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight">Stonka Donka</h1>
        <p className="text-sm text-zinc-400 mt-0.5">My Stock Intelligence Dashboard</p>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Stock Cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
            Watchlist — click a card to open chart &amp; AI analysis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quotes.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
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
                  <p className="text-sm text-zinc-200 leading-snug">{item.headline}</p>
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
