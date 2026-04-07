// Server-side RSS aggregator — fetches all feeds, parses, filters, deduplicates
// Returns a single JSON array. Vercel CDN caches the response for 5 minutes,
// so even 10,000 visitors only trigger one actual fetch cycle every 5 min.

const RSS_FEEDS_IRAN = [
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

const RSS_FEEDS_UKRAINE = [
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/' },
  { name: 'NPR', url: 'https://feeds.npr.org/1004/rss.xml' },
  { name: 'CNN', url: 'https://rss.cnn.com/rss/edition_europe.rss' },
  { name: 'Guardian', url: 'https://www.theguardian.com/world/europe-news/rss' },
  { name: 'FOX', url: 'https://moxie.foxnews.com/google-publisher/world.xml' },
  { name: 'NBC', url: 'https://feeds.nbcnews.com/nbcnews/public/world' },
  { name: 'Kyiv Independent', url: 'https://kyivindependent.com/feed/' },
  { name: 'Ukrinform', url: 'https://www.ukrinform.net/rss/block-lastnews' },
];

// Theater-specific keyword filters
const KEYWORDS_IRAN = {
  STRONG: ['iran','tehran','hormuz','irgc','persian gulf','hezbollah','houthi',
    'centcom','natanz','fordow','basij','quds force','strait of hormuz',
    'operation epic fury','khamenei','iranian','idf','iron dome','arrow-3',
    'thaad','patriot missile','b-2 spirit','f-35','carrier strike group'],
  MEDIUM: ['missile','airstrike','strike','bomb','drone','torpedo',
    'warship','naval','blockade','sanctions','nuclear','enrichment','iaea',
    'ceasefire','escalat','retaliat','deploy','military operation',
    'ultimatum','power plant','infrastructure'],
  WEAK: ['israel','military','attack','conflict','war','pentagon',
    'troops','navy','oil','crude','tanker','refugee','humanitarian',
    'diplomat','sanction','convoy','intercept','casualties','combat',
    'fighter jet','airspace','carrier','submarine','artillery','drone',
    'trump','netanyahu','gulf','qatar','yemen','lebanon','beirut','syria'],
};

const KEYWORDS_UKRAINE = {
  STRONG: ['ukraine','kyiv','zelensky','zelenskyy','crimea','donbas','donetsk',
    'luhansk','kherson','zaporizhzhia','bakhmut','avdiivka','kharkiv',
    'ukrainian','russia invad','russian forces','wagner','black sea',
    'azov','mariupol','dnipro','odesa','mykolaiv','nato','himars',
    'patriot','gepard','leopard','abrams','storm shadow','atacms',
    'kursk','belgorod','putin','kremlin','russian military'],
  MEDIUM: ['missile','airstrike','strike','bomb','drone','artillery',
    'frontline','offensive','counteroffensive','mobilization','conscript',
    'ceasefire','escalat','retaliat','deploy','military operation',
    'sanctions','nuclear','grain deal','ammunition','air defense'],
  WEAK: ['russia','military','attack','conflict','war','pentagon',
    'troops','nato','eu','european','refugee','humanitarian',
    'diplomat','convoy','intercept','casualties','combat',
    'fighter jet','airspace','submarine','tank','armor',
    'trump','europe','baltic','poland','romania','energy','gas'],
};

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
        title: title.trim().replace(/<[^>]*>?/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
        link: link.trim(),
        description: desc.trim().replace(/<[^>]*>?/g, '').slice(0, 500),
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

// Source credibility tiers — higher = more authoritative for conflict reporting
const SOURCE_WEIGHT = {
  'Reuters': 1.4, 'BBC': 1.3, 'Al Jazeera': 1.2, 'Guardian': 1.2, 'NPR': 1.1,
  'CNN': 1.0, 'NBC': 1.0, 'FOX': 1.0, 'JPost': 1.1, 'Times of Israel': 1.1,
  'Kyiv Independent': 1.3, 'Ukrinform': 1.2,
};

function scoreItem(item, keywords) {
  const { STRONG, MEDIUM, WEAK } = keywords;
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const full = title + ' ' + desc;

  let score = 0;

  // Keyword scoring — title matches worth 2x description
  const strongTitle = STRONG.filter(k => title.includes(k)).length;
  const strongDesc = STRONG.filter(k => desc.includes(k)).length;
  score += strongTitle * 10 + strongDesc * 5;

  const mediumTitle = MEDIUM.filter(k => title.includes(k)).length;
  const mediumDesc = MEDIUM.filter(k => desc.includes(k)).length;
  score += mediumTitle * 4 + mediumDesc * 2;

  const weakHits = WEAK.filter(k => full.includes(k)).length;
  score += weakHits * 1;

  // Source credibility multiplier
  const srcWeight = SOURCE_WEIGHT[item.sourceName] || 1.0;
  score *= srcWeight;

  // Temporal decay — articles lose 10% relevance per day after 24h
  if (item.pubDate) {
    const ageHours = (Date.now() - new Date(item.pubDate).getTime()) / 3600000;
    if (ageHours > 24) {
      const daysOld = (ageHours - 24) / 24;
      score *= Math.max(0.3, 1 - daysOld * 0.1);
    }
  }

  return score;
}

function filterByRelevance(allItems, keywords) {
  // Score all items, filter threshold, sort by score
  const scored = allItems.map(item => ({ ...item, _score: scoreItem(item, keywords) }));
  // Minimum score threshold to pass (roughly: 1 medium keyword in title)
  return scored.filter(item => item._score >= 3).sort((a, b) => b._score - a._score);
}

export default async function handler(req, res) {
  try {
    // Determine theater from query param (default: iran)
    const theater = (req.query?.theater || 'iran').toLowerCase();
    const VALID_THEATERS = ['iran', 'ukraine'];
    if (!VALID_THEATERS.includes(theater)) {
      return res.status(400).json({ error: 'Invalid theater parameter' });
    }
    const feeds = theater === 'ukraine' ? RSS_FEEDS_UKRAINE : RSS_FEEDS_IRAN;
    const keywords = theater === 'ukraine' ? KEYWORDS_UKRAINE : KEYWORDS_IRAN;

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(feeds.map(fetchFeed));

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

    // Filter for theater relevance and sort by weighted score
    allItems = filterByRelevance(allItems, keywords);

    // Return max 100 filtered items
    allItems = allItems.slice(0, 100);

    // Cache on Vercel CDN for 5 min, serve stale for 10 min while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      items: allItems,
      feedCount,
      totalFeeds: feeds.length,
      theater,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('news error:', err);
    return res.status(500).json({ error: 'Failed to aggregate feeds' });
  }
}
