export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY not configured' });
  }

  const { q = 'Iran war', sort = 'date', max = '24' } = req.query;

  // Map our sort values to YouTube API order parameter
  const orderMap = { date: 'date', relevance: 'relevance', viewCount: 'viewCount' };
  const order = orderMap[sort] || 'date';

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', q);
    url.searchParams.set('type', 'video');
    url.searchParams.set('order', order);
    url.searchParams.set('maxResults', Math.min(parseInt(max), 50).toString());
    url.searchParams.set('key', apiKey);

    const ytRes = await fetch(url.toString());
    const data = await ytRes.json();

    if (data.error) {
      return res.status(ytRes.status).json({ error: data.error.message });
    }

    // Get video IDs for duration lookup
    const videoIds = (data.items || []).map(i => i.id.videoId).filter(Boolean).join(',');

    let durations = {};
    if (videoIds) {
      const detailUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailUrl.searchParams.set('part', 'contentDetails,statistics');
      detailUrl.searchParams.set('id', videoIds);
      detailUrl.searchParams.set('key', apiKey);

      const detailRes = await fetch(detailUrl.toString());
      const detailData = await detailRes.json();
      (detailData.items || []).forEach(v => {
        durations[v.id] = {
          duration: v.contentDetails?.duration || '',
          views: v.statistics?.viewCount || '0',
        };
      });
    }

    const videos = (data.items || []).map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      author: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      duration: durations[item.id.videoId]?.duration || '',
      views: durations[item.id.videoId]?.views || '0',
    }));

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ videos });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch videos' });
  }
}
