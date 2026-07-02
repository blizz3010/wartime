// Server-side RSS aggregator — fetches all feeds, parses, filters, deduplicates
// Returns a single JSON array. Vercel CDN caches the response for 5 minutes,
// so even 10,000 visitors only trigger one actual fetch cycle every 5 min.

import { getTheater, parseRSS, fetchWithTimeout } from './lib/utils.js';

export const RSS_FEEDS_IRAN = [
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

export const RSS_FEEDS_UKRAINE = [
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

async function fetchFeed(feed) {
  try {
    const res = await fetchWithTimeout(feed.url, {
      headers: {
        'User-Agent': 'wartime-dashboard/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    }, 6000);
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSS(text, { sourceName: feed.name });
  } catch (err) {
    console.error(`feed fetch failed (${feed.name}):`, err.message);
    return [];
  }
}

// Source credibility tiers — higher = more authoritative for conflict reporting
const SOURCE_WEIGHT = {
  'Reuters': 1.4, 'BBC': 1.3, 'Al Jazeera': 1.2, 'Guardian': 1.2, 'NPR': 1.1,
  'CNN': 1.0, 'NBC': 1.0, 'FOX': 1.0, 'JPost': 1.1, 'Times of Israel': 1.1,
  'Kyiv Independent': 1.3, 'Ukrinform': 1.2,
};

// Compile keywords to regexes anchored at a word boundary so 'war' no longer
// matches 'aware' or 'toward'. The end stays open to preserve stem matching
// ('escalat' → 'escalation', 'iran' → 'iranian'). Cached per keyword array.
const keywordRegexCache = new WeakMap();
function compileKeywords(list) {
  let compiled = keywordRegexCache.get(list);
  if (!compiled) {
    compiled = list.map(k =>
      new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'i'));
    keywordRegexCache.set(list, compiled);
  }
  return compiled;
}

export function scoreItem(item, keywords) {
  const strong = compileKeywords(keywords.STRONG);
  const medium = compileKeywords(keywords.MEDIUM);
  const weak = compileKeywords(keywords.WEAK);
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const full = title + ' ' + desc;

  let score = 0;

  // Keyword scoring — title matches worth 2x description
  const strongTitle = strong.filter(r => r.test(title)).length;
  const strongDesc = strong.filter(r => r.test(desc)).length;
  score += strongTitle * 10 + strongDesc * 5;

  const mediumTitle = medium.filter(r => r.test(title)).length;
  const mediumDesc = medium.filter(r => r.test(desc)).length;
  score += mediumTitle * 4 + mediumDesc * 2;

  const weakHits = weak.filter(r => r.test(full)).length;
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

// Collapse near-duplicate stories syndicated across outlets ("Israel strikes
// Tehran" from BBC vs CNN). Exact-title dedup misses these; without this one
// event multiplies into the threat score once per outlet.
const TITLE_STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'after',
  'over', 'amid', 'into', 'says', 'said', 'that', 'this', 'are', 'was', 'has',
  'have', 'will', 'its', 'his', 'her', 'their', 'more', 'than', 'been', 'not']);

function titleTokens(title) {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length >= 3 && !TITLE_STOPWORDS.has(w))
  );
}

export function dedupeNearDuplicates(items, threshold = 0.6) {
  const kept = [];
  const keptTokens = [];
  for (const item of items) {
    const tokens = titleTokens(item.title);
    const isDup = tokens.size > 0 && keptTokens.some(other => {
      let overlap = 0;
      for (const t of tokens) if (other.has(t)) overlap++;
      const union = tokens.size + other.size - overlap;
      return union > 0 && overlap / union >= threshold;
    });
    if (!isDup) {
      kept.push(item);
      keptTokens.push(tokens);
    }
  }
  return kept;
}

export default async function handler(req, res) {
  try {
    const theater = getTheater(req);
    if (!theater) {
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

    // Collapse syndicated near-duplicates — items are score-sorted, so the
    // highest-scored variant of each story is the one kept
    allItems = dedupeNearDuplicates(allItems);

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
