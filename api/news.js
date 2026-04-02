// Server-side RSS aggregator — fetches all feeds, parses, filters, deduplicates
// Returns a single JSON array. Vercel CDN caches the response for 5 minutes,
// so even 10,000 visitors only trigger one actual fetch cycle every 5 min.

const RSS_FEEDS = [
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/' },
  { name: 'NPR', url: 'https://feeds.npr.org/1004/rss.xml' },
  { name: 'CNN', url: 'https://rss.cnn.com/rss/edition_meast.rss' },
  { name: 'Guardian', url: 'https://www.theguardian.com/world/middleeast/rss' },
  { name: 'JPost', url: 'https://www.jpost.com/rss/rssfeedsmiddleeast' },
  { name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/' },
  { name: 'FOX', url: 'https://moxie.foxnews.com/google-publisher/world.xml' },
  { name: 'NBC', url: 'https://feeds.nbcnews.com/nbcnews/public/world' },
];

// Simple XML to items parser (no dependencies needed)
function parseRSS(xml, sourceName) {
  const items = [];
  // Match <item>...</item> blocks
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const link = (block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/) || [])[1] || '';
    const desc = (block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1] || '';
    const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    if (title.trim()) {
      items.push({
        title: title.trim().replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
        link: link.trim(),
        description: desc.trim().replace(/<[^>]+>/g, '').slice(0, 500),
        pubDate: pubDate.trim(),
        sourceName,
      });
    }
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'wartime-dashboard/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSS(text, feed.name);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    // Fetch all feeds in parallel
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));

    let allItems = [];
    let feedCount = 0;
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        allItems.push(...r.value);
        feedCount++;
      }
    });

    // Deduplicate by normalized title
    const seen = new Set();
    allItems = allItems.filter(item => {
      const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter for Iran/war relevance
    // Strong keywords: one match in title = article passes
    const STRONG = ['iran','tehran','hormuz','irgc','persian gulf','hezbollah','houthi',
      'centcom','natanz','fordow','basij','quds force','strait of hormuz',
      'operation epic fury','khamenei','iranian','idf','iron dome','arrow-3',
      'thaad','patriot missile','b-2 spirit','f-35','carrier strike group'];
    // Medium keywords: one match in title OR two matches anywhere
    const MEDIUM = ['missile','airstrike','strike','bomb','drone','torpedo',
      'warship','naval','blockade','sanctions','nuclear','enrichment','iaea',
      'ceasefire','escalat','retaliat','deploy','military operation'];
    // Weak keywords: need 2+ matches across title+description to qualify
    const WEAK = ['israel','military','attack','conflict','war','pentagon',
      'troops','navy','oil','crude','tanker','refugee','humanitarian',
      'diplomat','sanction','convoy','intercept','casualties','combat',
      'fighter jet','airspace','carrier','submarine','artillery','drone',
      'trump','netanyahu','gulf','qatar','yemen','lebanon','beirut','syria'];

    allItems = allItems.filter(item => {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const full = title + ' ' + desc;

      // Strong keyword in title = instant pass
      if (STRONG.some(k => title.includes(k))) return true;

      // Medium keyword in title = pass
      if (MEDIUM.some(k => title.includes(k))) return true;

      // Medium keyword in description + any other keyword = pass
      const mediumHits = MEDIUM.filter(k => full.includes(k)).length;
      if (mediumHits >= 2) return true;

      // Weak keywords: need 2+ distinct matches to pass
      const weakHits = WEAK.filter(k => full.includes(k)).length;
      if (mediumHits >= 1 && weakHits >= 1) return true;
      if (weakHits >= 3) return true;

      return false;
    });

    // Sort by date (newest first)
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Return max 100 filtered items
    allItems = allItems.slice(0, 100);

    // Cache on Vercel CDN for 5 min, serve stale for 10 min while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      items: allItems,
      feedCount,
      totalFeeds: RSS_FEEDS.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to aggregate feeds: ' + err.message });
  }
}
