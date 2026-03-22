export default async function handler(req, res) {
  const { sub = 'worldnews', q = 'iran', sort = 'new', t = 'week', limit = '15' } = req.query;

  // Sanitize inputs
  const safeSub = sub.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30);
  const safeLimit = Math.min(parseInt(limit) || 15, 50);

  const url = `https://www.reddit.com/r/${safeSub}/search.json?q=${encodeURIComponent(q)}&sort=${sort}&t=${t}&limit=${safeLimit}&restrict_sr=1`;

  try {
    const redditRes = await fetch(url, {
      headers: {
        'User-Agent': 'wartime-dashboard/1.0',
        'Accept': 'application/json',
      },
    });

    if (!redditRes.ok) {
      return res.status(redditRes.status).json({ error: `Reddit returned ${redditRes.status}` });
    }

    const data = await redditRes.json();

    // Cache for 3 minutes
    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=360');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Reddit' });
  }
}
