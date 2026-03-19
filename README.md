# Stonka Donka

A personal stock intelligence dashboard built with Next.js 16, Tailwind CSS v4, and Claude AI. Tracks a watchlist of 5 stocks with real-time prices, AI-powered analysis, Reddit sentiment tracking, and an aggregated news feed from multiple sources.

## Features

- **Watchlist** — Live prices and 52-week position for ASTS, HG.CN, QS, RKLB, and SYM via Yahoo Finance
- **AI Analysis** — Click any stock card to get a streaming buy/sell verdict powered by Claude AI
- **Retail Sentiment** — Scrapes r/wallstreetbets for bullish/bearish consensus with AI-generated explanations
- **News Feed** — Infinite-scrolling feed aggregated from Finnhub, Alpha Vantage, Yahoo RSS, and Yahoo Finance search
- **Color-coded stocks** — Each stock has a unique color across all sections for easy identification
- **Light/Dark mode** — Toggle between themes, persisted in localStorage
- **80s Welcome Page** — Synthwave-inspired landing page with animated star fields
- **Google OAuth** — Sign in with Google via NextAuth v5

## Prerequisites

- **Node.js** 18.17 or later
- **npm** (comes with Node.js)
- A Google account (for OAuth sign-in)

## API Keys You Need

You need 4 API keys. All are free tier.

### 1. Google OAuth (required — for sign-in)

This lets users sign in with their Google account.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** user type
   - Fill in the app name (e.g. "Stonka Donka") and your email
   - Add your email as a test user
   - Save
6. Back in Credentials, click **Create Credentials > OAuth client ID**
7. Choose **Web application**
8. Add these URIs:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
9. Click **Create** and copy the **Client ID** and **Client Secret**

These become `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in your `.env.local`.

### 2. Anthropic / Claude API (required — for AI analysis)

Powers the AI stock analysis and sentiment explanations.

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys** in the sidebar
4. Click **Create Key**, give it a name, and copy it

This becomes `ANTHROPIC_API_KEY` in your `.env.local`.

> The app uses Claude Haiku 4.5, which is very cheap — a few cents per day of normal usage.

### 3. Finnhub API (optional — for company news)

Provides company-specific news articles.

1. Go to [finnhub.io](https://finnhub.io/)
2. Sign up for a free account
3. Your API key is shown on the dashboard after sign-up

This becomes `FINNHUB_API_KEY` in your `.env.local`.

### 4. Alpha Vantage API (optional — for news sentiment)

Provides additional news with sentiment scoring.

1. Go to [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. Fill in the form (name, email) and click **Get Free API Key**
3. Copy the key shown on screen

This becomes `ALPHAVANTAGE_API_KEY` in your `.env.local`.

> The news feed also pulls from Yahoo Finance RSS and Yahoo Finance search, which require no API key. If you skip Finnhub and Alpha Vantage, the news feed will still work — just with fewer sources.

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/stonka-donka.git
cd stonka-donka
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

Create a file called `.env.local` in the project root:

```env
# Google OAuth (required)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# NextAuth secret — generate one with: openssl rand -base64 32
AUTH_SECRET=your_random_secret_here

# Claude AI (required for AI features)
ANTHROPIC_API_KEY=your_anthropic_api_key

# News APIs (optional but recommended)
FINNHUB_API_KEY=your_finnhub_api_key
ALPHAVANTAGE_API_KEY=your_alphavantage_api_key
```

To generate `AUTH_SECRET`, run this in your terminal:

```bash
openssl rand -base64 32
```

Or just type any long random string — it's used to encrypt session cookies.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the welcome page. Click the right panel to sign in with Google.

## Project Structure

```
app/
├── welcome/page.tsx       — 80s synthwave landing page
├── login/page.tsx         — Google sign-in page
├── page.tsx               — Main dashboard (server component)
├── layout.tsx             — Root layout with theme detection
├── globals.css            — Theme variables + animations
├── lib/
│   └── stockColors.ts     — Shared stock color definitions
├── components/
│   ├── StockCard.tsx       — Watchlist cards with TradingView chart modal
│   ├── SentimentTracker.tsx— Reddit sentiment cards with post links
│   ├── NewsFeed.tsx        — Infinite-scroll news feed
│   └── ThemeToggle.tsx     — Light/dark mode toggle
└── api/
    ├── analyze/route.ts    — Streaming AI stock analysis
    ├── sentiment/route.ts  — Reddit sentiment + AI explanations
    ├── news/route.ts       — Aggregated news from 4 sources
    └── auth/[...nextauth]/ — NextAuth route handlers
auth.ts                     — NextAuth v5 configuration
proxy.ts                    — Next.js 16 middleware (route protection)
```

## Deployment

### Vercel (recommended)

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the project
3. Add all environment variables from `.env.local` in the Vercel dashboard under **Settings > Environment Variables**
4. Update your Google OAuth redirect URI to `https://your-domain.vercel.app/api/auth/callback/google`
5. Deploy

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4**
- **NextAuth v5** (beta) with Google provider
- **Claude AI** (Haiku 4.5) via Anthropic SDK
- **yahoo-finance2** for live stock data
- **Reddit JSON API** for sentiment scraping
- **Finnhub + Alpha Vantage + Yahoo RSS** for news

## Notes

- Stock prices refresh every 5 minutes (ISR via `revalidate = 300`)
- Sentiment data is cached for 15 minutes server-side
- News is cached for 5 minutes server-side
- The Reddit API is public and requires no auth, but rate limits apply — the app uses a `User-Agent` header to stay compliant
- StockTwits API is currently blocked by Cloudflare bot protection and is not used
- The X/Twitter API requires a paid Basic plan ($100/month) and is not used
