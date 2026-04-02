# WARTIME — Iran Conflict Dashboard

Real-time conflict intelligence dashboard monitoring US-Israel military operations against Iran. Aggregates live maps, news feeds, video clips, OSINT, maritime/air traffic tracking, military order of battle, and damage assessments from public sources.

**Live site:** [wartime-dashboard.vercel.app](https://wartime-dashboard.vercel.app)

## Features

- **Live News Feed** — Server-side RSS aggregation from 10 sources (Al Jazeera, BBC, Reuters, CNN, NPR, Guardian, JPost, Times of Israel, FOX, NBC) with 3-tier relevance filtering and auto-categorization (Strikes, Military, Diplomacy, Maritime, Nuclear, Humanitarian, Oil)
- **News-Based Scoring Engine** — Dynamically updates Threat Level (6 tiers), DEFCON (1-5), and Strait of Hormuz status from headline analysis with time-decay weighting (recent articles count more)
- **Clickable Ticker Panels** — Click any ticker item (Hormuz, Oil, Threat, DEFCON, Markets) to expand scoring breakdowns, level scales, and context
- **Carrier Group Detail** — Click the Carrier Groups ticker to see all 3 deployed CSGs with ship photos, air wings, escorts, and deployment locations
- **Live War Map** — LiveUAMap embed with Iran, Israel-Palestine, and global views
- **Maritime Tracking** — VesselFinder embed focused on Strait of Hormuz and Persian Gulf
- **Air Traffic** — ADS-B Exchange and FlightRadar24 embeds
- **Video Clips** — Curated conflict video sources
- **Live Streams** — 10 news channel live streams with server-side video ID discovery and PiP mini-player
- **OSINT / Social** — Reddit OSINT feeds (r/OSINT, r/CombatFootage, r/worldnews, r/geopolitics, r/CredibleDefense) + ISW/CSIS analysis
- **Forces Page** — Sub-page navigation:
  - *Force Comparison* — Full-width side-by-side Coalition vs Iran grid (12 categories: personnel, aircraft, missiles, naval, drones, cyber, etc.)
  - *Support Nations* — UK, Saudi Arabia, UAE, Bahrain with role breakdowns and disclaimer
  - *Proxy Breakdown* — Hezbollah, Houthis, Iraqi PMF, Syrian Militias with status badges and stats
  - *Weapons Systems* — US Air Power, US Missiles, Iranian Missiles, Israeli Systems with color-coded borders
  - *Casualties* — Split into Iran & Proxy / Coalition / Humanitarian sections
- **Assets Page** — Sub-page navigation (defaults to Naval Fleet):
  - *Naval Fleet* — 21 Iranian vessels with status (destroyed/damaged/operational), ship photos from Wikimedia Commons, kill attribution (weapon + unit), grayscale filter on destroyed ships
  - *Military Bases* — 6 Iranian bases with damage status, summary bar, color-coded borders
  - *Infrastructure* — 20 targets across air bases, naval bases, missile sites, air defense, C2, oil/energy with damage percentage bars
  - *Nuclear Facilities* — 6 facilities (Natanz, Fordow, Isfahan, Arak, Bushehr, Parchin) with strike status and IAEA context
- **Impact Dashboard** — Sub-page navigation:
  - *Overview* — 8 key conflict metrics + infrastructure capacity bars
  - *Infrastructure* — Expanded card view with status badges per sector (Power Grid, Internet, Airports, etc.)
  - *Timeline* — 20 key events from Feb 28 through Mar 22
  - *Cyber Warfare* — 8 operations with actor, target, and detail (USCYBERCOM, Unit 8200, APT33, etc.)
- **Breaking News Marquee** — Auto-detected from headlines
- **Dark theme** with CRT scanline overlay and night vision mode

## Project Structure

```
wartime/
├── index.html          # Single-page app (all HTML, CSS, JS)
├── api/
│   ├── news.js         # RSS aggregator — fetches all 10 feeds, filters, deduplicates (CDN-cached 5 min)
│   ├── livestream.js   # YouTube livestream video ID discovery via page scraping (no API key needed)
│   ├── reddit.js       # Reddit search proxy (serverless)
│   └── videos.js       # YouTube video search (serverless, optional)
├── vercel.json         # Vercel deployment config
├── .gitignore          # Excludes .env, .env.local, .vercel
└── README.md
```

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS — no build step, no framework
- **Styling:** CSS variables, CSS Grid layouts, JetBrains Mono + DM Sans fonts
- **Backend:** Vercel serverless functions (Node.js)
- **News:** Server-side RSS aggregation with Vercel CDN caching (5 min TTL) — all visitors share one cached response
- **Scoring:** Weighted keyword analysis with time-decay (6h/24h/48h/72h+ brackets), separate tuning per indicator
- **Live Streams:** Server-side HTML scraping for YouTube video ID extraction (no API key required)
- **Data:** RSS feeds, Reddit JSON API, embedded maps (LiveUAMap, VesselFinder, ADS-B Exchange, FlightRadar24)

## Deployment

Deployed on [Vercel](https://vercel.com). No environment variables required — the dashboard works fully out of the box.

### Deploy Your Own

1. Fork this repo
2. Import into Vercel
3. Deploy

That's it. The server-side API routes (`/api/news`, `/api/livestream`, `/api/reddit`) are Vercel serverless functions that run automatically.

### Optional Environment Variables

| Variable | Description |
|---|---|
| `YOUTUBE_API_KEY` | Google/YouTube Data API v3 key — enables video search on the Video Clips page. Not required; the page shows curated sources without it. |

## Architecture

### News Pipeline
```
RSS Feeds (10 sources)
  → /api/news.js (Vercel serverless)
    → Fetch all feeds in parallel
    → Parse XML server-side
    → 3-tier relevance filter (STRONG/MEDIUM/WEAK keywords)
    → Deduplicate by title
    → CDN cache (5 min TTL, 10 min stale-while-revalidate)
  → Client renders, categorizes, scores
```

Every visitor gets the same cached JSON response. Even with thousands of users, RSS sources are only hit once every 5 minutes.

### Scoring Engine
```
News articles → keyword matching (80+ weighted terms)
  → Time decay (100% → 80% → 50% → 30% → 15% by age)
  → Separate calculations:
    - Threat Level: escalation - de-escalation + military*0.15
    - DEFCON: escalation - de-escalation*0.5 + military*0.1
    - Hormuz: traffic open signals - closure signals
  → Dashboard indicators update automatically
```

### Sub-Page Navigation
Forces, Assets, and Impact pages use a sub-page system — each sub-nav button swaps between dedicated views rather than scrolling through a long page. This allows each section to have its own full-width layout.

## Security

- No API keys, credentials, or secrets in source code or git history
- `.gitignore` excludes `.env`, `.env.local`, `.vercel`
- Reddit proxy uses public API (no auth required)
- Livestream discovery uses page scraping (no API key required)
- News aggregation uses direct RSS fetch server-side (no third-party proxy dependency)
- Input sanitization on all API proxy parameters
- Safe to make repository public

## Data Sources

All data is aggregated from publicly available sources:

- **News:** Al Jazeera, BBC, Reuters, NPR, CNN, Guardian, Jerusalem Post, Times of Israel, FOX, NBC
- **Maps:** LiveUAMap, VesselFinder, ADS-B Exchange, FlightRadar24
- **Video:** YouTube (curated sources), Reddit video posts
- **OSINT:** Reddit (r/OSINT, r/CombatFootage, r/worldnews, r/geopolitics, r/CredibleDefense), ISW, CSIS
- **Military Data:** Open-source reporting from ISW, CENTCOM, IISS Military Balance, Janes, ACLED
- **Ship Photos:** Wikimedia Commons

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
