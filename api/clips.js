// Server-side video clip aggregator
// Fetches from Reddit (multiple subs including CombatFootage) and YouTube RSS
// CDN-cached so thousands of visitors share one response
module.exports = async (req, res) => {
  const REDDIT_SUBS = ['CombatFootage', 'worldnews', 'iran', 'MiddleEastNews', 'geopolitics'];
  const REDDIT_QUERIES = ['iran war', 'iran strike footage', 'iran US military'];
  const YT_CHANNELS = [
    'UCNye-wNBqNL5ZzHSJj3l8Bg', // Al Jazeera
    'UCoMdktPbSTixAyNGwb-UYkQ', // Sky News
    'UCQfwfsi5VrQ8yKZ-UWmAEFg', // France 24
    'UCeY0bbntWzzVIaj2z3QigXg', // NBC News
    'UC7fWeaHhqgM4Ry-RMpM2YYw', // TRT World
    'UCknLrEdhRCp1aegoMqRaCZg', // CNN
  ];
  const IRAN_KEYWORDS = ['iran', 'tehran', 'hormuz', 'irgc', 'strike', 'missile', 'war',
    'conflict', 'military', 'bomb', 'nuclear', 'hezbollah', 'houthi', 'navy', 'drone',
    'persian gulf', 'bandar abbas', 'centcom', 'operation', 'combat', 'attack', 'airstrike'];
  const BLOCKED = ['meme', 'funny', 'compilation', 'prank', 'reaction', 'minecraft',
    'fortnite', 'gta', 'call of duty', 'edit', 'parody', '#shorts challenge'];

  function isBlocked(title) {
    const t = (title || '').toLowerCase();
    return BLOCKED.some(b => t.includes(b));
  }

  try {
    const timeRange = req.query.t || 'week';
    const clips = [];
    const seenUrls = new Set();
    const seenTitles = new Set();

    // --- Reddit fetches ---
    const redditFetches = [];
    for (const sub of REDDIT_SUBS) {
      for (const q of REDDIT_QUERIES) {
        redditFetches.push(
          fetch(`https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&sort=new&t=${timeRange}&limit=15&restrict_sr=1`, {
            headers: { 'User-Agent': 'wartime-dashboard/1.0', 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000),
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        );
      }
    }

    // --- Also fetch CombatFootage hot posts (not just search) ---
    redditFetches.push(
      fetch('https://www.reddit.com/r/CombatFootage/hot.json?limit=25', {
        headers: { 'User-Agent': 'wartime-dashboard/1.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    );

    // --- YouTube RSS fetches (no API key needed) ---
    const ytFetches = YT_CHANNELS.map(chId =>
      fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`, {
        signal: AbortSignal.timeout(8000),
      }).then(r => r.ok ? r.text() : null).catch(() => null)
    );

    const [redditResults, ytResults] = await Promise.all([
      Promise.allSettled(redditFetches),
      Promise.allSettled(ytFetches),
    ]);

    // Process Reddit results
    for (const result of redditResults) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const data = result.value;
      const children = data?.data?.children || [];
      for (const child of children) {
        const p = child.data;
        if (!p) continue;
        // Must be a video post
        const isVideo = p.is_video || p.domain === 'v.redd.it' ||
          p.domain === 'youtube.com' || p.domain === 'youtu.be' ||
          (p.url && (p.url.includes('youtube.com/watch') || p.url.includes('youtu.be/') ||
            p.url.includes('v.redd.it') || p.url.includes('streamable.com')));
        // OR image post from CombatFootage (satellite imagery, aftermath photos)
        const isImage = p.post_hint === 'image' || (p.url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(p.url));
        const isCombatFootage = (p.subreddit || '').toLowerCase() === 'combatfootage';
        if (!isVideo && !(isImage && isCombatFootage)) continue;
        if (isBlocked(p.title)) continue;

        // Iran relevance check for non-CombatFootage subs
        if (!isCombatFootage) {
          const titleLower = (p.title || '').toLowerCase();
          if (!IRAN_KEYWORDS.some(k => titleLower.includes(k))) continue;
        }

        // Dedupe
        const normUrl = (p.url || '').replace(/[?#].*/, '').toLowerCase();
        if (normUrl && seenUrls.has(normUrl)) continue;
        if (normUrl) seenUrls.add(normUrl);
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
      // Simple regex XML parsing (no DOM parser on server)
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

        // Iran relevance filter
        const titleLower = title.toLowerCase();
        if (!IRAN_KEYWORDS.some(k => titleLower.includes(k))) continue;

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

    // Cache on CDN for 30 minutes, stale-while-revalidate for 1 hour
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json({
      clips: clips.slice(0, 50),
      meta: {
        total: clips.length,
        reddit: clips.filter(c => c.source === 'reddit').length,
        youtube: clips.filter(c => c.source === 'youtube').length,
        cached: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to aggregate clips', detail: err.message });
  }
};
