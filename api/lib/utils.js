// Shared utilities for WARTIME API endpoints
// Eliminates duplication of parsing, validation, and fetch logic

export const VALID_THEATERS = ['iran', 'ukraine'];

/**
 * Extract and validate the theater query parameter.
 * Returns the theater string or null if invalid.
 */
export function getTheater(req) {
  const theater = (req.query?.theater || 'iran').toLowerCase();
  return VALID_THEATERS.includes(theater) ? theater : null;
}

/**
 * Strip HTML tags and decode common HTML entities.
 */
export function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>?/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/**
 * Parse RSS/XML into an array of item objects.
 * @param {string} xml - Raw XML string
 * @param {object} opts
 * @param {string|null} opts.sourceName - Source label to attach to each item
 * @param {number} opts.descLimit - Max characters for description (default 500)
 */
export function parseRSS(xml, { sourceName = null, descLimit = 500 } = {}) {
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
      const item = {
        title: stripHtml(title.trim()),
        link: link.trim(),
        description: stripHtml(desc.trim()).slice(0, descLimit),
        pubDate: pubDate.trim(),
      };
      if (sourceName) item.sourceName = sourceName;
      items.push(item);
    }
  }
  return items;
}

/**
 * Fetch with an automatic timeout via AbortSignal.
 */
export function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
}

/**
 * Fetch Reddit URLs in two batches with adaptive 429 backoff.
 * @param {Array<{url: string, ...}>} items - Reddit fetch descriptors
 * @param {number} batchSize - Items in first batch (rest go in batch 2)
 * @param {number} timeoutMs - Per-request timeout
 * @returns {Promise<Array<{data: object|null, rateLimited: boolean, ...}>>}
 */
export async function fetchRedditBatched(items, batchSize = 5, timeoutMs = 10000) {
  const doFetch = (item) =>
    fetchWithTimeout(item.url, {
      headers: { 'User-Agent': 'wartime-dashboard/1.0', 'Accept': 'application/json' },
    }, timeoutMs)
      .then(r => {
        if (r.status === 429) return { rateLimited: true };
        return r.ok ? r.json() : null;
      })
      .catch(err => {
        console.error('reddit fetch:', err.message);
        return null;
      })
      .then(data => {
        if (data && data.rateLimited) return { ...item, data: null, rateLimited: true };
        return { ...item, data };
      });

  const batch1 = items.slice(0, batchSize);
  const batch2 = items.slice(batchSize);

  const results1 = await Promise.allSettled(batch1.map(doFetch));
  const had429 = results1.some(r => r.status === 'fulfilled' && r.value?.rateLimited);
  await new Promise(r => setTimeout(r, had429 ? 2000 : 500));
  const results2 = await Promise.allSettled(batch2.map(doFetch));

  return [...results1, ...results2];
}
