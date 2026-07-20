<div align="center">

<h1>PolyTweetWatch</h1>

<h3>Real-time Tweet Count Tracking & Prediction Dashboard</h3>

<p style="max-width: 600px; margin: 0 auto;">
Track tweet counts across multiple personalities, visualize projections, and discover Polymarket arbitrage opportunities — all in one live dashboard.
</p>

</div>

<p align="center">
  <a href="https://github.com/AlexGuri99/PolyTweetWatch">
    <img src="https://img.shields.io/badge/GitHub-Repo-black.svg?logo=github" alt="GitHub Repository"/>
  </a>
  <a href="https://github.com/AlexGuri99/PolyTweetWatch/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"/>
  </a>
</p>

---

## TL;DR

Real-time dashboard tracking tweet counts from Polymarket prediction markets across **7 personalities** — Elon Musk, Donald Trump, CZ, Ted Cruz, Ali Khamenei, Volodymyr Zelenskyy, and NYC Mayor Zohran Mamdani. Each person gets personalized event detection (SpaceX launches for Elon, news events for others) with tweet rate projections and an arbitrage calculator.

## Features

- **Multi-Person Tracking**: 7 personalities with individual Polymarket tweet count contracts
- **Live Projections**: Baseline and event-adjusted tweet count forecasts
- **Event Detection**: SpaceX/Starlink/Tesla launches for Elon, news-based catalysts for others
- **Velocity Calibration**: Auto-calibrated tweet rate from historical weeks
- **Arbitrage Calculator**: Built-in Dutching calculator for Polymarket markets
- **Auto-Refresh**: Polls every 30 seconds with live countdown timer

## Supported Personalities

| Person | Platform | Data Source |
|--------|----------|-------------|
| Elon Musk | X (Twitter) | Polymarket + SpaceX API |
| Donald Trump | Truth Social | Polymarket + NewsAPI |
| Changpeng Zhao | X (Twitter) | Polymarket + NewsAPI |
| Ted Cruz | X (Twitter) | Polymarket + NewsAPI |
| Ali Khamenei | X (Twitter) | Polymarket + NewsAPI |
| Volodymyr Zelenskyy | X (Twitter) | Polymarket + NewsAPI |
| Mayor Zohran Mamdani | X (Twitter) | Polymarket + NewsAPI |

## Quick Start

### Prerequisites

- Node.js 18+
- A [NewsAPI](https://newsapi.org/register) key (free tier, for non-Elon event detection)

### Installation

```bash
# Clone repository
git clone https://github.com/AlexGuri99/PolyTweetWatch.git
cd PolyTweetWatch

# Install dependencies
npm install

# Set up environment variables
echo "NEWS_API_KEY=your_key_here" > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
PolyTweetWatch/
├── app/                      # Next.js App Router
│   ├── page.js               # Main dashboard (single-page app)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── [slug]/               # Polymarket slug redirects
│   └── api/tracker/          # API route for tweet data & events
├── lib/
│   ├── persons.js            # Person definitions & event configs
│   └── cache.js              # Cache abstraction (Map / Upstash Redis)
├── public/                   # Person icon PNGs
├── .env.local                # Environment variables (gitignored)
├── next.config.ts
└── package.json
```

## Architecture

```
Polymarket API ──┐
                 ├──→ /api/tracker ──→ Dashboard
Space Devs API ──┘       │
                    (Elon only)
NewsAPI ─────────────────┘
                 (other persons)
```

- **Polymarket API**: Fetches tweet count contracts, posts, and historical data
- **Space Devs API**: Upcoming SpaceX launches / Tesla events (Elon only)
- **NewsAPI**: Recent news articles classified into event catalysts (others)
- **Cache Layer**: In-memory Map (dev) or Upstash Redis (production) with 5-min TTL

## Event Detection

### Elon Musk
Uses the [Space Devs Launch Library](https://ll.thespacedevs.com) to fetch upcoming SpaceX launches, Tesla events, and Starlink launches. Each event type applies a tweet rate multiplier over a window:
- **Starship**: 2.10× over 8 hours
- **Falcon / Starlink**: 1.25× over 8 hours
- **Tesla**: 1.75× over 4 hours

### All Other Persons
Uses [NewsAPI](https://newsapi.org) to fetch recent articles (last 3 days). Each article is classified by keyword patterns into event types with specific multipliers:
- **High-impact** (legal, regulatory, crisis): 1.6×–2.0×
- **Medium-impact** (speech, rally, debate): 1.4×–1.8×
- **Low-impact** (media appearance, policy): 1.2×–1.3×

News events are cached for 30 minutes.

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

Set the `NEWS_API_KEY` environment variable in your Vercel project settings.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWS_API_KEY` | No* | NewsAPI key for non-Elon event detection |

\* Non-Elon tabs will show empty events without it.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS v4, Recharts, Lucide Icons
- **Data**: Polymarket API, Space Devs API, NewsAPI
- **Cache**: Upstash Redis (production), in-memory Map (dev)

## License

MIT

---

<div align="center">

**Built with Next.js, React, and Tailwind CSS**

</div>