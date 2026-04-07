// Server-side OSINT/Social aggregator
// Fetches from Reddit (multiple subreddits) and RSS analysis feeds
// CDN-cached so visitors share one response — prevents rate limiting
module.exports = async (req, res) => {
  const theater = (req.query?.theater || 'iran').toLowerCase();
  const VALID_THEATERS = ['iran', 'ukraine'];
  if (!VALID_THEATERS.includes(theater)) {
    return res.status(400).json({ error: 'Invalid theater parameter' });
  }

  const OSINT_SUBS_IRAN = [
    { sub: 'OSINT', queries: ['iran OSINT', 'iran satellite imagery'] },
    { sub: 'geopolitics', queries: ['iran conflict', 'iran war strategy'] },
    { sub: 'worldnews', queries: ['iran breaking', 'iran strike'] },
    { sub: 'CredibleDefense', queries: ['iran', 'strait of hormuz'] },
    { sub: 'MiddleEastNews', queries: ['iran war', 'iran conflict'] },
  ];

  const OSINT_SUBS_UKRAINE = [
    { sub: 'OSINT', queries: ['ukraine OSINT', 'ukraine satellite imagery'] },
    { sub: 'geopolitics', queries: ['ukraine conflict', 'russia ukraine strategy'] },
    { sub: 'worldnews', queries: ['ukraine breaking', 'ukraine strike'] },
    { sub: 'CredibleDefense', queries: ['ukraine', 'russia frontline'] },
    { sub: 'UkrainianConflict', queries: ['ukraine war', 'ukraine conflict'] },
  ];

  const OSINT_SUBS = theater === 'ukraine' ? OSINT_SUBS_UKRAINE : OSINT_SUBS_IRAN;
  const HOT_SUBS = theater === 'ukraine' ? ['OSINT', 'CredibleDefense', 'UkrainianConflict'] : ['OSINT', 'CredibleDefense'];

  const RSS_FEEDS = [
    { name: 'ISW', url: 'https://www.understandingwar.org/rss.xml' },
    { name: 'CSIS', url: 'https://www.csis.org/analysis/feed' },
  ];

  const IRAN_KW = ['iran', 'tehran', 'hormuz', 'persian', 'irgc', 'hezbollah', 'middle east', 'nuclear', 'conflict',
    'missile', 'strike', 'drone', 'houthi', 'centcom', 'natanz', 'fordow', 'khamenei', 'iranian'];

  const UKRAINE_KW = ['ukraine', 'kyiv', 'russia', 'crimea', 'donbas', 'donetsk', 'kherson', 'zaporizhzhia',
    'bakhmut', 'kharkiv', 'frontline', 'zelensky', 'putin', 'nato', 'missile', 'drone', 'strike',
    'offensive', 'wagner', 'mobilization', 'himars', 'patriot', 'kursk', 'belgorod'];

  const RSS_KW = theater === 'ukraine' ? UKRAINE_KW : IRAN_KW;

  function stripHtml(html) {
    return (html || '').replace(/<[^>]*>?/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }

  function parseRSS(xml) {
    const items = [];
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
          title: stripHtml(title.trim()),
          link: link.trim(),
          description: stripHtml(desc.trim()).slice(0, 300),
          pubDate: pubDate.trim(),
        });
      }
    }
    return items;
  }

  try {
    const allPosts = [];
    const seenIds = new Set();

    // --- Reddit fetches (batched with 429 backoff) ---
    const redditItems = [];
    for (const acc of OSINT_SUBS) {
      for (const q of acc.queries) {
        redditItems.push({
          url: `https://www.reddit.com/r/${acc.sub}/search.json?q=${encodeURIComponent(q)}&sort=new&t=week&limit=15&restrict_sr=1`,
          sub: acc.sub,
        });
      }
    }
    for (const sub of HOT_SUBS) {
      redditItems.push({
        url: `https://www.reddit.com/r/${sub}/hot.json?limit=15`,
        sub,
      });
    }

    const fetchRedditItem = (item) =>
      fetch(item.url, {
        headers: { 'User-Agent': 'wartime-dashboard/1.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }).then(r => {
        if (r.status === 429) return { rateLimited: true };
        return r.ok ? r.json() : null;
      }).catch(() => null)
        .then(data => {
          if (data && data.rateLimited) return { data: null, sub: item.sub, rateLimited: true };
          return { data, sub: item.sub };
        });

    const batch1 = redditItems.slice(0, 6);
    const batch2 = redditItems.slice(6);

    // --- RSS fetches (run in parallel with Reddit batch 1) ---
    const rssFetches = RSS_FEEDS.map(async feed => {
      try {
        const r = await fetch(feed.url, {
          headers: { 'User-Agent': 'wartime-dashboard/1.0', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) return { items: [], name: feed.name };
        const xml = await r.text();
        return { items: parseRSS(xml), name: feed.name };
      } catch {
        return { items: [], name: feed.name };
      }
    });

    // Fire batch 1 + RSS in parallel
    const [redditResults1, rssResults] = await Promise.all([
      Promise.allSettled(batch1.map(fetchRedditItem)),
      Promise.allSettled(rssFetches),
    ]);

    // Adaptive delay — back off if batch 1 hit rate limits
    const had429 = redditResults1.some(r => r.status === 'fulfilled' && r.value?.rateLimited);
    await new Promise(r => setTimeout(r, had429 ? 2000 : 500));
    const redditResults2 = await Promise.allSettled(batch2.map(fetchRedditItem));
    const redditResults = [...redditResults1, ...redditResults2];

    // Process Reddit
    for (const result of redditResults) {
      if (result.status !== 'fulfilled' || !result.value?.data) continue;
      const { data, sub } = result.value;
      const children = data?.data?.children || [];
      for (const child of children) {
        const p = child.data;
        if (!p || !p.id) continue;
        if (seenIds.has(p.id)) continue;
        seenIds.add(p.id);

        const isOsint = sub === 'OSINT' || sub === 'CredibleDefense' ||
          (p.title || '').toLowerCase().includes('osint') ||
          (p.title || '').toLowerCase().includes('satellite') ||
          (p.title || '').toLowerCase().includes('analysis');
        const isGeopolitics = sub === 'geopolitics' || sub === 'CredibleDefense';

        allPosts.push({
          id: p.id,
          platform: isOsint ? 'osint' : isGeopolitics ? 'analysis' : 'social',
          platformLabel: isOsint ? 'OSINT' : isGeopolitics ? 'ANALYSIS' : 'SOCIAL',
          author: p.author || 'unknown',
          handle: 'r/' + (p.subreddit || sub),
          text: (p.title || '') + (p.selftext ? ' — ' + p.selftext.slice(0, 200) : ''),
          url: p.permalink ? `https://www.reddit.com${p.permalink}` : '',
          time: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : new Date().toISOString(),
          score: p.score || 0,
          comments: p.num_comments || 0,
          source: 'reddit',
        });
      }
    }

    // Process RSS
    for (const result of rssResults) {
      if (result.status !== 'fulfilled') continue;
      const { items, name } = result.value;
      const filtered = items.filter(i => RSS_KW.some(k => (i.title || '').toLowerCase().includes(k)));
      for (const i of filtered) {
        const id = name + '-' + (i.title || '').slice(0, 50);
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        allPosts.push({
          id,
          platform: 'osint',
          platformLabel: 'ANALYSIS',
          author: name,
          handle: name,
          text: i.title + (i.description ? ' — ' + i.description.slice(0, 200) : ''),
          url: i.link || '',
          time: i.pubDate ? new Date(i.pubDate).toISOString() : new Date().toISOString(),
          score: 0,
          comments: 0,
          source: 'rss',
        });
      }
    }

    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Cache on CDN for 20 minutes, stale-while-revalidate for 40 minutes
    res.setHeader('Cache-Control', 's-maxage=1200, stale-while-revalidate=2400');
    res.status(200).json({
      posts: allPosts.slice(0, 100),
      meta: {
        total: allPosts.length,
        reddit: allPosts.filter(p => p.source === 'reddit').length,
        rss: allPosts.filter(p => p.source === 'rss').length,
        cached: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('osint error:', err);
    res.status(500).json({ error: 'Failed to aggregate OSINT feeds' });
  }
};
