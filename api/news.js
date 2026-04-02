export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate URL is an RSS feed (basic check)
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const feedRes = await fetch(url, {
      headers: {
        'User-Agent': 'wartime-dashboard/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!feedRes.ok) {
      return res.status(feedRes.status).json({ error: `Feed returned ${feedRes.status}` });
    }

    const text = await feedRes.text();

    // Cache for 5 minutes on Vercel CDN, serve stale for 10 min while revalidating
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch feed: ' + err.message });
  }
}
