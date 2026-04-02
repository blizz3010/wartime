# WARTIME — Iran Conflict Dashboard

Real-time conflict intelligence dashboard monitoring US-Israel military operations against Iran. Aggregates live maps, news feeds, video clips, OSINT, maritime/air traffic tracking, military order of battle, and damage assessments from public sources.

**Live site:** [wartime-dashboard.vercel.app](https://wartime-dashboard.vercel.app)

## Features

- **Live News Feed** — Aggregates 10 RSS sources (Al Jazeera, BBC, Reuters, CNN, etc.) with keyword filtering and categorization (Strikes, Military, Diplomacy, Maritime, Nuclear, Humanitarian, Oil)
- **Auto-Updating Dashboard** — News-based scoring engine that dynamically updates Threat Level, DEFCON, and Strait of Hormuz traffic status
- **Carrier Group Detail Panel** — Click the ticker to expand detailed info on all 3 deployed carrier strike groups
- **Live War Map** — LiveUAMap embed with Iran, Israel-Palestine, and global views
- **Maritime Tracking** — VesselFinder embed focused on Strait of Hormuz and Persian Gulf
- **Air Traffic** — ADS-B Exchange and FlightRadar24 embeds
- **Video Clips** — YouTube and Reddit video aggregation with content filtering
- **Live Streams** — 10 news channel live streams with PiP mini-player
- **OSINT / Social** — Reddit OSINT feeds + ISW/CSIS analysis RSS
- **Forces Page** — Side-by-side Coalition vs Iran force comparison with detailed breakdowns
- **Assets Page** — Iranian Naval Fleet tracker (Operation Epic Fury), military base status, infrastructure damage assessment, nuclear facility status
- **Impact Dashboard** — Conflict statistics, infrastructure capacity bars, timeline, cyber operations log
- **Breaking News Marquee** — Auto-detected from headlines
- **Dark theme** with CRT scanline overlay and night vision mode

## Project Structure

```
wartime/
├── index.html          # Single-page app (all HTML, CSS, JS)
├── api/
│   ├── livestream.js   # YouTube livestream discovery (serverless)
│   ├── reddit.js       # Reddit search proxy (serverless)
│   └── videos.js       # YouTube video search (serverless)
├── vercel.json         # Vercel deployment config
├── .gitignore          # Excludes .env, .env.local, .vercel
└── README.md
```

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS — no build step, no framework
- **Styling:** CSS variables, JetBrains Mono + DM Sans fonts
- **Backend:** Vercel serverless functions (Node.js)
- **Data Sources:** RSS feeds (via rss2json + CORS proxy fallbacks), YouTube Data API, Reddit JSON API, embedded maps (LiveUAMap, VesselFinder, ADS-B Exchange, FlightRadar24)

## Deployment

Deployed on [Vercel](https://vercel.com). The only required environment variable:

| Variable | Description |
|---|---|
| `YOUTUBE_API_KEY` | Google/YouTube Data API v3 key — used server-side only for video search and livestream discovery |

The YouTube API key is **never exposed to the client**. It's accessed via `process.env.YOUTUBE_API_KEY` in the serverless functions only.

### Deploy Your Own

1. Fork this repo
2. Import into Vercel
3. Add `YOUTUBE_API_KEY` as an environment variable in Vercel project settings
4. Deploy

The site works without the YouTube API key — video clips and livestream auto-detection will fall back to RSS-based discovery.

## Security

- No API keys, credentials, or secrets in source code or git history
- YouTube API key is server-side only (Vercel env vars)
- `.gitignore` excludes `.env`, `.env.local`, `.vercel`
- Reddit proxy uses public API (no auth required)
- Input sanitization on all API proxy parameters
- Safe to make repository public

## Data Sources

All data is aggregated from publicly available sources:

- **News:** Al Jazeera, BBC, Reuters, NPR, CNN, Guardian, Jerusalem Post, Times of Israel, FOX, NBC
- **Maps:** LiveUAMap, VesselFinder, ADS-B Exchange, FlightRadar24
- **Video:** YouTube Data API, Reddit video posts
- **OSINT:** Reddit (r/OSINT, r/CombatFootage, r/worldnews, r/geopolitics, r/CredibleDefense), ISW, CSIS
- **Military Data:** Open-source reporting from ISW, CENTCOM, IISS Military Balance, Janes, ACLED

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `1-9, 0` | Switch tabs |
| `R` | Refresh current feed |
| `N` | Toggle night vision mode |
| `?` | Show keyboard shortcuts |

## License

Open source. Use freely.

## Disclaimer

This is an open-source conflict intelligence aggregator. Not affiliated with any government or military organization. All figures are estimates based on open-source reporting. Intended for informational purposes only.
