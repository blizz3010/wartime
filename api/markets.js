// Server-side market data aggregator
// Fetches stock indices, commodities, and FX from Yahoo Finance
// CDN-cached for 5 minutes — all visitors share one response
module.exports = async (req, res) => {
  const theater = (req.query?.theater || 'iran').toLowerCase();
  const VALID_THEATERS = ['iran', 'ukraine'];
  if (!VALID_THEATERS.includes(theater)) {
    return res.status(400).json({ error: 'Invalid theater parameter' });
  }

  // Yahoo Finance tickers per theater
  const TICKERS_COMMON = [
    { symbol: 'BZ=F', name: 'Brent Crude', unit: '/bbl', category: 'commodity', baseline: 75 },
    { symbol: 'CL=F', name: 'WTI Crude', unit: '/bbl', category: 'commodity', baseline: 70 },
    { symbol: 'NG=F', name: 'Natural Gas', unit: '/MMBtu', category: 'commodity', baseline: 2.5 },
    { symbol: 'GC=F', name: 'Gold', unit: '/oz', category: 'commodity', baseline: 2000 },
    { symbol: 'DX-Y.NYB', name: 'US Dollar Index', unit: '', category: 'fx', baseline: 104 },
    { symbol: '^VIX', name: 'VIX (Fear Index)', unit: '', category: 'volatility', baseline: 15 },
  ];

  const TICKERS_IRAN = [
    { symbol: '^GSPC', name: 'S&P 500', unit: '', category: 'index', baseline: 5500 },
    { symbol: 'ZW=F', name: 'Wheat', unit: '/bu', category: 'commodity', baseline: 650 },
    { symbol: 'USO', name: 'US Oil Fund', unit: '', category: 'etf', baseline: 75 },
  ];

  const TICKERS_UKRAINE = [
    { symbol: 'IMOEX.ME', name: 'MOEX Russia', unit: '', category: 'index', baseline: 3300, note: 'Moscow Exchange' },
    { symbol: '^GSPC', name: 'S&P 500', unit: '', category: 'index', baseline: 5500 },
    { symbol: 'ERUS', name: 'Russia ETF (ERUS)', unit: '', category: 'etf', baseline: 30, note: 'iShares MSCI Russia (halted)' },
    { symbol: 'ZW=F', name: 'Wheat', unit: '/bu', category: 'commodity', baseline: 650 },
    { symbol: 'ZC=F', name: 'Corn', unit: '/bu', category: 'commodity', baseline: 480 },
    { symbol: 'TTF=F', name: 'EU Nat Gas (TTF)', unit: '/MWh', category: 'commodity', baseline: 30, note: 'European benchmark' },
    { symbol: 'USDRUB=X', name: 'USD/RUB', unit: '₽', category: 'fx', baseline: 75, note: 'Ruble exchange rate' },
    { symbol: 'USDUAH=X', name: 'USD/UAH', unit: '₴', category: 'fx', baseline: 37, note: 'Hryvnia exchange rate' },
  ];

  const tickers = [...TICKERS_COMMON, ...(theater === 'ukraine' ? TICKERS_UKRAINE : TICKERS_IRAN)];

  // Fetch quote data from Yahoo Finance v8 API
  async function fetchYahooQuote(ticker) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker.symbol)}?range=1mo&interval=1d&includePrePost=false`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; wartime-dashboard/1.0)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) return { ...ticker, error: true, status: r.status };
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      if (!result) return { ...ticker, error: true };

      const meta = result.meta || {};
      const closes = result.indicators?.quote?.[0]?.close || [];
      const timestamps = result.timestamp || [];

      // Current price
      const price = meta.regularMarketPrice || closes[closes.length - 1] || null;
      const prevClose = meta.chartPreviousClose || meta.previousClose || null;

      // Build sparkline from daily closes (last 30 days)
      const sparkline = closes
        .filter(c => c !== null)
        .map(c => Math.round(c * 100) / 100);

      // Calculate changes
      const dayChange = price && prevClose ? ((price - prevClose) / prevClose * 100) : null;
      const firstClose = sparkline.length > 0 ? sparkline[0] : null;
      const monthChange = price && firstClose ? ((price - firstClose) / firstClose * 100) : null;

      // War impact score: how far from pre-war baseline
      const warImpact = price && ticker.baseline
        ? ((price - ticker.baseline) / ticker.baseline * 100)
        : null;

      return {
        symbol: ticker.symbol,
        name: ticker.name,
        unit: ticker.unit,
        category: ticker.category,
        note: ticker.note || null,
        baseline: ticker.baseline,
        price: price ? Math.round(price * 100) / 100 : null,
        prevClose: prevClose ? Math.round(prevClose * 100) / 100 : null,
        dayChange: dayChange ? Math.round(dayChange * 100) / 100 : null,
        monthChange: monthChange ? Math.round(monthChange * 100) / 100 : null,
        warImpact: warImpact ? Math.round(warImpact * 100) / 100 : null,
        sparkline,
        currency: meta.currency || 'USD',
        marketState: meta.regularMarketTime
          ? (Date.now() / 1000 - meta.regularMarketTime < 3600 ? 'open' : 'closed')
          : 'unknown',
        error: false,
      };
    } catch (e) {
      return { ...ticker, error: true, errorMsg: e.message };
    }
  }

  try {
    // Fetch all tickers in parallel
    const results = await Promise.allSettled(tickers.map(fetchYahooQuote));
    const quotes = results.map(r => r.status === 'fulfilled' ? r.value : { error: true });

    // Compute theater "Market Stress Score" (0-100)
    // Based on: VIX level, oil spike, currency moves, index drops
    const vix = quotes.find(q => q.symbol === '^VIX');
    const oil = quotes.find(q => q.symbol === 'BZ=F');
    const sp500 = quotes.find(q => q.symbol === '^GSPC');

    let stressScore = 0;
    // VIX contribution (0-30 points): VIX > 30 = max stress
    if (vix?.price) stressScore += Math.min(30, Math.max(0, (vix.price - 15) * 2));
    // Oil spike contribution (0-25 points): >40% above baseline = max
    if (oil?.warImpact) stressScore += Math.min(25, Math.max(0, oil.warImpact * 0.6));
    // S&P drop contribution (0-20 points): >10% month drop = max
    if (sp500?.monthChange) stressScore += Math.min(20, Math.max(0, -sp500.monthChange * 2));

    // Theater-specific scoring
    if (theater === 'ukraine') {
      const rub = quotes.find(q => q.symbol === 'USDRUB=X');
      const moex = quotes.find(q => q.symbol === 'IMOEX.ME');
      // Ruble weakness (0-15 points): >30% above baseline = max
      if (rub?.warImpact) stressScore += Math.min(15, Math.max(0, rub.warImpact * 0.5));
      // MOEX drop (0-10 points)
      if (moex?.warImpact) stressScore += Math.min(10, Math.max(0, -moex.warImpact * 0.2));
    } else {
      // Iran: oil premium is bigger factor
      if (oil?.warImpact) stressScore += Math.min(10, Math.max(0, oil.warImpact * 0.3));
      // Gold flight to safety (0-15 points)
      const gold = quotes.find(q => q.symbol === 'GC=F');
      if (gold?.warImpact) stressScore += Math.min(15, Math.max(0, gold.warImpact * 0.5));
    }

    stressScore = Math.min(100, Math.round(stressScore));
    const stressLevel = stressScore >= 75 ? 'EXTREME' : stressScore >= 50 ? 'HIGH' : stressScore >= 25 ? 'ELEVATED' : 'LOW';

    // Cache on CDN for 5 minutes, stale-while-revalidate for 10 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
      quotes: quotes.filter(q => !q.error),
      errors: quotes.filter(q => q.error).map(q => q.symbol || q.name),
      stress: {
        score: stressScore,
        level: stressLevel,
        components: {
          vix: vix?.price || null,
          oilImpact: oil?.warImpact || null,
          sp500Month: sp500?.monthChange || null,
        },
      },
      theater,
      cached: new Date().toISOString(),
    });
  } catch (err) {
    console.error('markets error:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
};
