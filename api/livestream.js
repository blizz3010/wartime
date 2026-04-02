export default async function handler(req, res) {
  const { channelId, liveUrl } = req.query;
  if (!channelId && !liveUrl) {
    return res.status(400).json({ error: 'channelId or liveUrl required' });
  }

  try {
    // Method 1: If a direct live URL is provided, scrape it for the video ID
    if (liveUrl) {
      const videoId = await scrapeVideoId(liveUrl);
      if (videoId) {
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ videoId });
      }
    }

    // Method 2: Try YouTube API if key is available
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey && channelId) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('channelId', channelId);
      url.searchParams.set('type', 'video');
      url.searchParams.set('eventType', 'live');
      url.searchParams.set('maxResults', '1');
      url.searchParams.set('key', apiKey);

      const ytRes = await fetch(url.toString());
      const data = await ytRes.json();
      const liveItem = (data.items || [])[0];
      if (liveItem) {
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
        return res.status(200).json({
          videoId: liveItem.id.videoId,
          title: liveItem.snippet.title,
          channelTitle: liveItem.snippet.channelTitle,
        });
      }
    }

    // Method 3: Scrape the channel's /live page for the current video ID
    if (channelId) {
      const livePageUrl = `https://www.youtube.com/channel/${channelId}/live`;
      const videoId = await scrapeVideoId(livePageUrl);
      if (videoId) {
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({ videoId });
      }
    }

    // No live stream found
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({ videoId: null });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to find live stream' });
  }
}

async function scrapeVideoId(url) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Look for canonical URL with video ID
    const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
    if (canonicalMatch) return canonicalMatch[1];

    // Look for video ID in various page data patterns
    const patterns = [
      /"videoId":"([a-zA-Z0-9_-]{11})"/,
      /watch\?v=([a-zA-Z0-9_-]{11})/,
      /\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) return m[1];
    }

    return null;
  } catch (e) {
    return null;
  }
}
