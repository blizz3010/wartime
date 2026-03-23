// Server-side RSS proxy — eliminates dependency on rss2json.com and corsproxy.io
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate URL
  let parsed;
  try {
    parsed = new URL(feedUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid protocol' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Allowlist of RSS feed domains
  const allowedDomains = [
    'aljazeera.com', 'bbci.co.uk', 'bbc.co.uk', 'reutersagency.com', 'reuters.com',
    'npr.org', 'cnn.com', 'theguardian.com', 'jpost.com', 'timesofisrael.com',
    'foxnews.com', 'nbcnews.com', 'understandingwar.org', 'csis.org',
    'centcom.mil', 'radiofarda.com', 'youtube.com',
  ];
  const hostname = parsed.hostname.replace(/^www\./, '');
  if (!allowedDomains.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'wartime-dashboard/1.0 (RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `Upstream returned ${response.status}` });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(text);
  } catch (e) {
    if (e.name === 'AbortError') {
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    return res.status(502).json({ error: 'Failed to fetch feed' });
  }
};
