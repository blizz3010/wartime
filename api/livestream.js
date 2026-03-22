export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured' });
  }

  const { channelId } = req.query;
  if (!channelId) {
    return res.status(400).json({ error: 'channelId required' });
  }

  try {
    // Search for active live streams on this channel
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('type', 'video');
    url.searchParams.set('eventType', 'live');
    url.searchParams.set('maxResults', '1');
    url.searchParams.set('key', apiKey);

    const ytRes = await fetch(url.toString());
    const data = await ytRes.json();

    if (data.error) {
      return res.status(ytRes.status).json({ error: data.error.message });
    }

    const liveItem = (data.items || [])[0];
    if (liveItem) {
      // Cache for 10 minutes
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
      return res.status(200).json({
        videoId: liveItem.id.videoId,
        title: liveItem.snippet.title,
        channelTitle: liveItem.snippet.channelTitle,
      });
    }

    // No live stream found
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ videoId: null });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to search for live stream' });
  }
}
