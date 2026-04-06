// Server-side video clip aggregator
// Fetches from Reddit (CombatFootage, worldnews, etc.) and YouTube RSS
// CDN-cached so thousands of visitors share one response — prevents rate limiting
//
// Key design: fewer Reddit API calls to avoid 429 rate limits.
// Reddit allows ~10 req/min for unauthenticated. We batch smartly.

// In-memory cache for serverless warm starts (supplements CDN cache)
let memoryCache = null;
let memoryCacheTime = 0;
const MEMORY_CACHE_TTL = 300000; // 5 minutes

module.exports = async (req, res) => {
  const theater = (req.query?.theater || 'iran').toLowerCase();
  const cacheKey = theater;

  // Serve from memory cache if warm and fresh (per theater)
  if (memoryCache && memoryCache._theater === cacheKey && Date.now() - memoryCacheTime < MEMORY_CACHE_TTL) {
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('X-Cache', 'memory-hit');
    return res.status(200).json(memoryCache);
  }

  const REDDIT_FETCHES_IRAN = [
    { url: 'https://www.reddit.com/r/CombatFootage/hot.json?limit=50', sub: 'CombatFootage', isHot: true },
    { url: 'https://www.reddit.com/r/CombatFootage/new.json?limit=30', sub: 'CombatFootage', isNew: true },
    { url: 'https://www.reddit.com/r/CombatFootage/search.json?q=iran&sort=new&t=week&limit=25&restrict_sr=1', sub: 'CombatFootage' },
    { url: 'https://www.reddit.com/r/combatclips/hot.json?limit=25', sub: 'combatclips', isHot: true },
    { url: 'https://www.reddit.com/r/combatclips/new.json?limit=25', sub: 'combatclips', isNew: true },
    { url: 'https://www.reddit.com/r/worldnews/search.json?q=iran+strike+footage+video&sort=new&t=week&limit=15&restrict_sr=1', sub: 'worldnews' },
    { url: 'https://www.reddit.com/r/iran/search.json?q=strike+footage+video+attack&sort=new&t=week&limit=15&restrict_sr=1', sub: 'iran' },
    { url: 'https://www.reddit.com/r/MiddleEastNews/search.json?q=iran+war+video&sort=new&t=week&limit=10&restrict_sr=1', sub: 'MiddleEastNews' },
    { url: 'https://www.reddit.com/r/UkraineWarVideoReport/search.json?q=iran&sort=new&t=week&limit=10&restrict_sr=1', sub: 'UkraineWarVideoReport' },
    { url: 'https://www.reddit.com/r/WarFootage/hot.json?limit=20', sub: 'WarFootage', isHot: true },
  ];

  const REDDIT_FETCHES_UKRAINE = [
    { url: 'https://www.reddit.com/r/CombatFootage/hot.json?limit=50', sub: 'CombatFootage', isHot: true },
    { url: 'https://www.reddit.com/r/CombatFootage/new.json?limit=30', sub: 'CombatFootage', isNew: true },
    { url: 'https://www.reddit.com/r/CombatFootage/search.json?q=ukraine&sort=new&t=week&limit=25&restrict_sr=1', sub: 'CombatFootage' },
    { url: 'https://www.reddit.com/r/UkraineWarVideoReport/hot.json?limit=50', sub: 'UkraineWarVideoReport', isHot: true },
    { url: 'https://www.reddit.com/r/UkraineWarVideoReport/new.json?limit=30', sub: 'UkraineWarVideoReport', isNew: true },
    { url: 'https://www.reddit.com/r/combatclips/hot.json?limit=25', sub: 'combatclips', isHot: true },
    { url: 'https://www.reddit.com/r/worldnews/search.json?q=ukraine+war+footage+video&sort=new&t=week&limit=15&restrict_sr=1', sub: 'worldnews' },
    { url: 'https://www.reddit.com/r/ukraine/search.json?q=strike+footage+video+attack&sort=new&t=week&limit=15&restrict_sr=1', sub: 'ukraine' },
    { url: 'https://www.reddit.com/r/WarFootage/hot.json?limit=20', sub: 'WarFootage', isHot: true },
  ];

  const REDDIT_FETCHES = theater === 'ukraine' ? REDDIT_FETCHES_UKRAINE : REDDIT_FETCHES_IRAN;

  const YT_CHANNELS = [
    'UCNye-wNBqNL5ZzHSJj3l8Bg', // Al Jazeera
    'UCoMdktPbSTixAyNGwb-UYkQ', // Sky News
    'UCQfwfsi5VrQ8yKZ-UWmAEFg', // France 24
    'UCeY0bbntWzzVIaj2z3QigXg', // NBC News
    'UC7fWeaHhqgM4Ry-RMpM2YYw', // TRT World
    'UCknLrEdhRCp1aegoMqRaCZg', // CNN
    'UCYMwmggPTMKg6GijhVsKGlg', // DW News
  ];

  const IRAN_KEYWORDS = ['iran', 'tehran', 'hormuz', 'irgc', 'strike', 'missile', 'war',
    'conflict', 'military', 'bomb', 'nuclear', 'hezbollah', 'houthi', 'navy', 'drone',
    'persian gulf', 'bandar abbas', 'centcom', 'operation', 'combat', 'attack', 'airstrike',
    'bridge', 'bombing', 'footage', 'explosion', 'intercept', 'radar', 'patriot', 'thaad',
    'f-35', 'b-2', 'tomahawk', 'ballistic', 'cruise missile', 'strait'];
  const UKRAINE_KEYWORDS = ['ukraine', 'kyiv', 'russia', 'crimea', 'donbas', 'donetsk',
    'kherson', 'zaporizhzhia', 'bakhmut', 'kharkiv', 'frontline', 'strike', 'missile', 'war',
    'conflict', 'military', 'bomb', 'drone', 'artillery', 'tank', 'armor', 'himars',
    'patriot', 'leopard', 'abrams', 'storm shadow', 'atacms', 'wagner', 'combat', 'attack',
    'footage', 'explosion', 'intercept', 'kursk', 'belgorod', 'offensive'];
  const ACTIVE_KEYWORDS = theater === 'ukraine' ? UKRAINE_KEYWORDS : IRAN_KEYWORDS;

  const BLOCKED = ['meme', 'funny', 'compilation', 'prank', 'reaction', 'minecraft',
    'fortnite', 'gta', 'call of duty', 'edit', 'parody', '#shorts challenge', 'tiktok dance'];

  // Combat-focused subreddits — skip keyword filter for these
  const COMBAT_SUBS = new Set(['combatfootage', 'combatclips', 'warfootage', 'ukrainewarvideoreport']);

  function isBlocked(title) {
    const t = (title || '').toLowerCase();
    return BLOCKED.some(b => t.includes(b));
  }

  try {
    const clips = [];
    const seenUrls = new Set();
    const seenTitles = new Set();

    // --- Staggered Reddit fetches (2 batches to avoid burst rate limit) ---
    const batch1 = REDDIT_FETCHES.slice(0, 5);
    const batch2 = REDDIT_FETCHES.slice(5);

    const fetchReddit = (item) =>
      fetch(item.url, {
        headers: { 'User-Agent': 'wartime-dashboard/1.0 (conflict tracker)', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }).then(r => {
        if (r.status === 429) return { rateLimited: true }; // Rate limited — flag for backoff
        return r.ok ? r.json() : null;
      }).catch(() => null)
        .then(data => {
          if (data && data.rateLimited) return { data: null, sub: item.sub, rateLimited: true };
          return { data, sub: item.sub, isHot: item.isHot, isNew: item.isNew };
        });

    // Fetch batch 1 first
    const results1 = await Promise.allSettled(batch1.map(fetchReddit));
    // Adaptive delay — back off longer if batch 1 hit rate limits
    const had429 = results1.some(r => r.status === 'fulfilled' && r.value?.rateLimited);
    await new Promise(r => setTimeout(r, had429 ? 2000 : 500));
    const results2 = await Promise.allSettled(batch2.map(fetchReddit));

    const redditResults = [...results1, ...results2];

    // --- YouTube RSS fetches (no API key needed, no rate limit issues) ---
    const ytResults = await Promise.allSettled(
      YT_CHANNELS.map(chId =>
        fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`, {
          signal: AbortSignal.timeout(8000),
        }).then(r => r.ok ? r.text() : null).catch(() => null)
      )
    );

    // Process Reddit results
    for (const result of redditResults) {
      if (result.status !== 'fulfilled' || !result.value?.data) continue;
      const { data, sub, isHot, isNew } = result.value;
      const children = data?.data?.children || [];
      const isCombatSub = COMBAT_SUBS.has(sub.toLowerCase());

      for (const child of children) {
        const p = child.data;
        if (!p) continue;

        // Must be a video post (or image from combat subs)
        const isVideo = p.is_video || p.domain === 'v.redd.it' ||
          p.domain === 'youtube.com' || p.domain === 'youtu.be' ||
          p.domain === 'streamable.com' || p.domain === 'gfycat.com' ||
          (p.url && (p.url.includes('youtube.com/watch') || p.url.includes('youtu.be/') ||
            p.url.includes('v.redd.it') || p.url.includes('streamable.com') ||
            p.url.includes('clips.twitch.tv')));
        const isImage = p.post_hint === 'image' || (p.url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(p.url));

        if (!isVideo && !(isImage && isCombatSub)) continue;
        if (isBlocked(p.title)) continue;

        // Relevance check — skip for combat-focused subs (they're all relevant)
        if (!isCombatSub) {
          const titleLower = (p.title || '').toLowerCase();
          if (!ACTIVE_KEYWORDS.some(k => titleLower.includes(k))) continue;
        }

        // Dedupe by URL
        const normUrl = (p.url || '').replace(/[?#].*/, '').toLowerCase();
        if (normUrl && seenUrls.has(normUrl)) continue;
        if (normUrl) seenUrls.add(normUrl);

        // Dedupe by title
        const normTitle = (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
        if (seenTitles.has(normTitle)) continue;
        seenTitles.add(normTitle);

        const ytMatch = (p.url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        clips.push({
          id: p.id,
          videoId: ytMatch ? ytMatch[1] : null,
          redditUrl: `https://www.reddit.com${p.permalink}`,
          videoUrl: p.is_video ? (p.media?.reddit_video?.fallback_url || p.url) : p.url,
          title: p.title,
          author: 'r/' + p.subreddit,
          publishedAt: new Date(p.created_utc * 1000).toISOString(),
          thumbnail: (p.thumbnail && p.thumbnail !== 'self' && p.thumbnail !== 'default')
            ? p.thumbnail
            : (ytMatch ? `https://i.ytimg.com/vi/${ytMatch[1]}/mqdefault.jpg` : ''),
          score: p.score || 0,
          comments: p.num_comments || 0,
          source: 'reddit',
          isYouTube: !!ytMatch,
          isImage: isImage && !isVideo,
        });
      }
    }

    // Process YouTube RSS results
    for (const result of ytResults) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const xml = result.value;
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      for (const entry of entries) {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
        const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
        const authorMatch = entry.match(/<author>\s*<name>([\s\S]*?)<\/name>/);

        const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
        const vidUrl = linkMatch ? linkMatch[1] : '';
        const vidIdMatch = vidUrl.match(/[?&]v=([^&]+)/);
        const videoId = vidIdMatch ? vidIdMatch[1] : '';

        if (!videoId) continue;
        if (isBlocked(title)) continue;

        // Relevance filter
        const titleLower = title.toLowerCase();
        if (!ACTIVE_KEYWORDS.some(k => titleLower.includes(k))) continue;

        // Dedupe against Reddit
        if (seenUrls.has(vidUrl.toLowerCase())) continue;
        seenUrls.add(vidUrl.toLowerCase());
        const normTitle = titleLower.replace(/[^a-z0-9]/g, '').slice(0, 60);
        if (seenTitles.has(normTitle)) continue;
        seenTitles.add(normTitle);

        clips.push({
          id: videoId,
          videoId,
          title,
          author: authorMatch ? authorMatch[1] : '',
          publishedAt: publishedMatch ? publishedMatch[1] : '',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          duration: '',
          views: '0',
          source: 'youtube',
          isYouTube: true,
        });
      }
    }

    // Sort by date (newest first), then by score for Reddit
    clips.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      if (Math.abs(dateA - dateB) < 3600000) return (b.score || 0) - (a.score || 0);
      return dateB - dateA;
    });

    const response = {
      clips: clips.slice(0, 60),
      meta: {
        total: clips.length,
        reddit: clips.filter(c => c.source === 'reddit').length,
        youtube: clips.filter(c => c.source === 'youtube').length,
        cached: new Date().toISOString(),
      },
    };

    // Store in memory cache for warm serverless instances
    response._theater = cacheKey;
    memoryCache = response;
    memoryCacheTime = Date.now();

    // Cache on CDN for 30 minutes, stale-while-revalidate for 1 hour
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json(response);
  } catch (err) {
    // Serve stale memory cache on error
    if (memoryCache) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      res.setHeader('X-Cache', 'memory-stale');
      return res.status(200).json(memoryCache);
    }
    res.status(500).json({ error: 'Failed to aggregate clips', detail: err.message });
  }
};
