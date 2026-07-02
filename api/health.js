// Feed health monitor — checks every RSS source for the requested theater
// and reports per-feed status, item count, and latency. Makes silently dead
// feeds (HTTP errors, timeouts, or feeds that return zero items) visible.
// CDN-cached 5 min so health checks add no meaningful load to the sources.

import { getTheater, parseRSS, fetchWithTimeout } from './lib/utils.js';
import { RSS_FEEDS_IRAN, RSS_FEEDS_UKRAINE } from './news.js';

async function checkFeed(feed) {
  const started = Date.now();
  try {
    const res = await fetchWithTimeout(feed.url, {
      headers: {
        'User-Agent': 'wartime-dashboard/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    }, 6000);
    const ms = Date.now() - started;
    if (!res.ok) {
      return { name: feed.name, url: feed.url, ok: false, status: res.status, items: 0, ms };
    }
    const text = await res.text();
    const items = parseRSS(text, { sourceName: feed.name });
    return {
      name: feed.name,
      url: feed.url,
      // A 200 with zero parseable items is a dead feed in practice
      ok: items.length > 0,
      status: res.status,
      items: items.length,
      ms,
      newestItem: items[0]?.pubDate || null,
    };
  } catch (err) {
    return {
      name: feed.name,
      url: feed.url,
      ok: false,
      status: 0,
      items: 0,
      ms: Date.now() - started,
      error: err.name === 'TimeoutError' ? 'timeout' : err.message,
    };
  }
}

export default async function handler(req, res) {
  try {
    const theater = getTheater(req);
    if (!theater) {
      return res.status(400).json({ error: 'Invalid theater parameter' });
    }
    const feeds = theater === 'ukraine' ? RSS_FEEDS_UKRAINE : RSS_FEEDS_IRAN;

    const results = await Promise.all(feeds.map(checkFeed));
    const healthy = results.filter(f => f.ok).length;

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      theater,
      checkedAt: new Date().toISOString(),
      healthy,
      total: results.length,
      feeds: results,
    });
  } catch (err) {
    console.error('health error:', err);
    return res.status(500).json({ error: 'Health check failed' });
  }
}
