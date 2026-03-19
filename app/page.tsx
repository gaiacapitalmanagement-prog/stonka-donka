import YahooFinance from "yahoo-finance2";
import { StockCard, type StockData } from "./components/StockCard";
import { NewsFeed } from "./components/NewsFeed";
import { SentimentTracker } from "./components/SentimentTracker";
import { ThemeToggle } from "./components/ThemeToggle";
import { auth, signOut } from "@/auth";

const yf = new YahooFinance();

export const revalidate = 300; // refresh every 5 minutes

const STOCKS = [
  { ticker: "ASTS",  name: "AST SpaceMobile",       tvSymbol: "NASDAQ:ASTS" },
  { ticker: "HG.CN", name: "Hydrograph Clean Power", tvSymbol: "CSE:HG"     },
  { ticker: "QS",    name: "QuantumScape",            tvSymbol: "NASDAQ:QS"   },
  { ticker: "RKLB",  name: "Rocket Lab Corp.",        tvSymbol: "NASDAQ:RKLB" },
  { ticker: "SYM",   name: "Symbotic",                tvSymbol: "NASDAQ:SYM"  },
];

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

export default async function Home() {
  const session = await auth();
  const quotes = await getQuotes();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans transition-colors">
      <header className="border-b border-[var(--border-light)] px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stonka Donka</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">My Stock Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-[var(--text-muted)]">{session?.user?.name}</span>
          <form action={async () => {
            "use server"
            await signOut()
          }}>
            <button type="submit" className="text-sm text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Stock Cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-4">
            Watchlist — click a card to open chart &amp; AI analysis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quotes.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>
        </section>

        {/* Retail Sentiment Tracker */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-4">
            Retail Sentiment — r/wallstreetbets
          </h2>
          <SentimentTracker />
        </section>

        {/* Infinite-scroll News Feed */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-4">
            Latest News — Finnhub &middot; Alpha Vantage &middot; Yahoo Finance
          </h2>
          <NewsFeed />
        </section>
      </main>
    </div>
  );
}
