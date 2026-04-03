// Image proxy for Wikipedia/Wikimedia images
// Avoids hotlink blocking by fetching server-side and caching on Vercel CDN
module.exports = async (req, res) => {
  const file = req.query.file;
  if (!file) {
    res.status(400).send('Missing ?file= parameter');
    return;
  }

  // Sanitize: only allow alphanumeric, dots, underscores, hyphens, parens, spaces
  if (!/^[\w\s.\-()%]+$/.test(file)) {
    res.status(400).send('Invalid filename');
    return;
  }

  const width = parseInt(req.query.w) || 400;
  const url = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(file)}&width=${width}`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'WarTimeDashboard/1.0 (https://wartime-dashboard.vercel.app; contact@example.com)',
      },
      redirect: 'follow',
    });

    if (!resp.ok) {
      res.status(resp.status).send('Upstream error');
      return;
    }

    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await resp.arrayBuffer());

    // Cache on CDN for 7 days, stale-while-revalidate for 30 days
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.status(200).send(buffer);
  } catch (err) {
    res.status(502).send('Fetch failed');
  }
};
