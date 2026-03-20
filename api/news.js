const RSS_FEEDS = [
  { name: 'Al Jazeera', cls: 'src-aljazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'BBC', cls: 'src-bbc', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml' },
  { name: 'Reuters', cls: 'src-reuters', url: 'https://feeds.reuters.com/reuters/worldNews' },
  { name: 'NPR', cls: 'src-npr', url: 'https://feeds.npr.org/1004/rss.xml' },
  { name: 'Guardian', cls: 'src-guardian', url: 'https://www.theguardian.com/world/middleeast/rss' },
  { name: 'JPost', cls: 'src-jpost', url: 'https://www.jpost.com/Rss/RssFeedsMiddleEast.aspx' },
];

function parseRSSXml(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    const title = get('title');
    const link = get('link') || block.match(/<link\s*\/?>(.*?)<\/link>|<link>(.*?)<\/link>/i)?.[1] || '';
    const pubDate = get('pubDate');
    if (title) items.push({ title, link: link.trim(), pubDate });
  }
  return items;
}

async function fetchFeed(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WarDashboard/1.0)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSSXml(text).map(item => ({ ...item, sourceName: feed.name, sourceCls: feed.cls }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
    let allItems = [];
    results.forEach(r => { if (r.status === 'fulfilled') allItems.push(...r.value); });

    // Deduplicate by normalized title
    const seen = new Set();
    allItems = allItems.filter(item => {
      const key = item.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Filter for conflict-related keywords
    const keywords = ['iran','tehran','hormuz','hezbollah','israel','strike','missile','war','bomb','attack','military','pentagon','trump','irgc','khamenei','netanyahu','gulf','naval','drone','oil','crude','strait','conflict','lebanon','beirut','nuclear','sanction'];
    let filtered = allItems.filter(item => {
      const text = item.title.toLowerCase();
      return keywords.some(k => text.includes(k));
    });

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    if (filtered.length === 0) filtered = allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 30);

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({
      items: filtered.slice(0, 80),
      feedCount: results.filter(r => r.status === 'fulfilled' && r.value.length > 0).length,
      totalFeeds: RSS_FEEDS.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch news', items: [] });
  }
}
