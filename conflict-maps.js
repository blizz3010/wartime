// Conflict-map policy for the dashboard.
// Only hosts that were checked and do not send framing blocks are embeddable.
// LiveUAMap's apex mirror (livemapdata.com) is the Ukraine map. Its API host,
// www host, and *.liveuamap.com send X-Frame-Options: SAMEORIGIN (Firefox
// refuses the embed). This file does not proxy those responses or strip headers.
(function (root) {
  const ALLOWED_EMBED_HOSTS = new Set([
    'livemapdata.com',
    'openstreetmap.org',
    'www.openstreetmap.org',
  ]);

  const UKRAINE_REFERENCE = 'https://www.openstreetmap.org/export/embed.html?bbox=22.0,44.0,40.5,52.5&layer=mapnik';
  const IRAN_REFERENCE = 'https://www.openstreetmap.org/export/embed.html?bbox=34.0,23.0,63.5,40.5&layer=mapnik';
  const LEVANT_REFERENCE = 'https://www.openstreetmap.org/export/embed.html?bbox=34.0,29.3,36.8,33.6&layer=mapnik';

  const THEATERS = {
    iran: {
      id: 'iran',
      defaultMapId: 'liveuamap-iran',
      referenceMapId: 'reference',
      maps: [
        {
          id: 'liveuamap-iran',
          label: 'LiveUAMap Iran',
          mode: 'external',
          panelTitle: 'IRAN REGION MAP',
          title: 'LiveUAMap Iran',
          provider: 'LiveUAMap',
          openUrl: 'https://iran.liveuamap.com/',
          showsLiveEvents: false,
          notice: 'OpenStreetMap reference only. No strikes or territorial control are shown. LiveUAMap Iran sends X-Frame-Options: SAMEORIGIN, so Firefox will not display it inside this site, and this page does not bypass that. Iran Strike Map is not embedded.',
          links: [
            { label: 'Open LiveUAMap Iran', url: 'https://iran.liveuamap.com/' },
            { label: 'Open Israel-Palestine LiveUAMap', url: 'https://israelpalestine.liveuamap.com/' },
          ],
        },
        {
          id: 'reference',
          label: 'Region reference',
          mode: 'embed',
          panelTitle: 'IRAN REGION MAP',
          title: 'Iran region reference',
          provider: 'OpenStreetMap',
          attribution: '© OpenStreetMap contributors',
          embedUrl: IRAN_REFERENCE,
          openUrl: 'https://www.openstreetmap.org/#map=5/32.0/48.8',
          showsLiveEvents: false,
          notice: 'OpenStreetMap reference of Iran and the surrounding region. No strikes, control zones, or other live events are drawn on this map.',
          links: [
            { label: 'Open OpenStreetMap', url: 'https://www.openstreetmap.org/#map=5/32.0/48.8' },
            { label: 'Open LiveUAMap Iran', url: 'https://iran.liveuamap.com/' },
          ],
        },
        {
          id: 'israel-palestine',
          label: 'Israel-Palestine',
          mode: 'embed',
          panelTitle: 'LEVANT REGION MAP',
          title: 'Israel-Palestine reference',
          provider: 'OpenStreetMap',
          attribution: '© OpenStreetMap contributors',
          embedUrl: LEVANT_REFERENCE,
          openUrl: 'https://israelpalestine.liveuamap.com/',
          showsLiveEvents: false,
          notice: 'OpenStreetMap reference of Israel and the Levant. The LiveUAMap for this region blocks framing. No live events are drawn here.',
          links: [
            { label: 'Open Israel-Palestine LiveUAMap', url: 'https://israelpalestine.liveuamap.com/' },
          ],
        },
      ],
    },
    ukraine: {
      id: 'ukraine',
      defaultMapId: 'liveuamap-ukraine',
      referenceMapId: 'reference',
      maps: [
        {
          id: 'liveuamap-ukraine',
          label: 'LiveUAMap',
          mode: 'embed',
          panelTitle: 'UKRAINE WAR MAP',
          title: 'Ukraine LiveUAMap',
          provider: 'LiveUAMap',
          attribution: 'LiveUAMap (livemapdata.com)',
          embedUrl: 'https://livemapdata.com/',
          openUrl: 'https://livemapdata.com/',
          showsLiveEvents: true,
          notice: 'Framed from livemapdata.com, which does not send X-Frame-Options. api.livemapdata.com returns 403 with X-Frame-Options: SAMEORIGIN and is not used. This dashboard does not add events of its own.',
          links: [
            { label: 'Open LiveUAMap', url: 'https://livemapdata.com/' },
            { label: 'Open liveuamap.com', url: 'https://liveuamap.com/' },
            { label: 'Open DeepState Map', url: 'https://deepstatemap.live/en' },
          ],
        },
        {
          id: 'reference',
          label: 'Region reference',
          mode: 'embed',
          panelTitle: 'UKRAINE REGION MAP',
          title: 'Ukraine region reference',
          provider: 'OpenStreetMap',
          attribution: '© OpenStreetMap contributors',
          embedUrl: UKRAINE_REFERENCE,
          openUrl: 'https://www.openstreetmap.org/#map=6/48.4/31.2',
          showsLiveEvents: false,
          notice: 'OpenStreetMap reference of Ukraine. No front line, strikes, or control areas are drawn.',
          links: [
            { label: 'Open OpenStreetMap', url: 'https://www.openstreetmap.org/#map=6/48.4/31.2' },
            { label: 'Open LiveUAMap', url: 'https://livemapdata.com/' },
          ],
        },
        {
          id: 'deepstate',
          label: 'DeepState Map',
          mode: 'external',
          panelTitle: 'UKRAINE REGION MAP',
          title: 'DeepStateMAP',
          provider: 'DeepStateMAP',
          openUrl: 'https://deepstatemap.live/en',
          showsLiveEvents: false,
          notice: 'DeepStateMAP is opened from its own site. It does not publish an embed, and its license does not allow redistributing the API. The frame below is an OpenStreetMap reference with no front line drawn.',
          links: [
            { label: 'Open DeepState Map', url: 'https://deepstatemap.live/en' },
            { label: 'Open LiveUAMap', url: 'https://livemapdata.com/' },
          ],
        },
      ],
    },
  };

  function mapHost(url) {
    const parsed = parseHttpsUrl(url);
    return parsed ? parsed.hostname.toLowerCase() : '';
  }

  function parseHttpsUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function embedAllowed(url) {
    const host = mapHost(url);
    if (!host || !ALLOWED_EMBED_HOSTS.has(host)) return false;
    if (host === 'livemapdata.com') {
      const parsed = parseHttpsUrl(url);
      // /en has been observed returning Cloudflare 520 with X-Frame-Options.
      return parsed.pathname === '/' && !parsed.search;
    }
    if (host === 'openstreetmap.org' || host === 'www.openstreetmap.org') {
      const parsed = parseHttpsUrl(url);
      return parsed.pathname === '/export/embed.html';
    }
    return false;
  }

  function getTheater(theaterId) {
    return THEATERS[theaterId] || null;
  }

  function getMap(theaterId, mapId) {
    const theater = getTheater(theaterId);
    if (!theater) return null;
    const id = mapId || theater.defaultMapId;
    return theater.maps.find((map) => map.id === id) || null;
  }

  function referenceFor(theater) {
    return theater.maps.find((map) => map.id === theater.referenceMapId) || null;
  }

  function buildMapView(theaterId, mapId) {
    const theater = getTheater(theaterId);
    const map = getMap(theaterId, mapId);
    if (!theater || !map) return null;
    const links = (map.links || []).filter((link) => parseHttpsUrl(link.url));
    const directEmbed = map.mode === 'embed' && embedAllowed(map.embedUrl);
    if (directEmbed) {
      return {
        theaterId: theater.id,
        mapId: map.id,
        mode: 'embed',
        embedUrl: map.embedUrl,
        openUrl: map.openUrl,
        links,
        panelTitle: map.panelTitle,
        title: map.title,
        frameTitle: map.title,
        provider: map.provider,
        attribution: map.attribution || map.provider,
        notice: map.notice,
        showsLiveEvents: map.showsLiveEvents === true,
        loadingLabel: 'Loading map…',
        errorLabel: 'This map frame did not finish loading. Use the original-map link. No substitute events are shown.',
      };
    }
    const reference = referenceFor(theater);
    const referenceUrl = reference && embedAllowed(reference.embedUrl) ? reference.embedUrl : null;
    return {
      theaterId: theater.id,
      mapId: map.id,
      mode: referenceUrl ? 'reference-fallback' : 'link-only',
      embedUrl: referenceUrl,
      openUrl: map.openUrl,
      links,
      panelTitle: map.panelTitle,
      title: map.title,
      frameTitle: reference ? reference.title : map.title,
      provider: map.provider,
      attribution: reference ? (reference.attribution || '© OpenStreetMap contributors') : '',
      notice: map.notice,
      showsLiveEvents: false,
      loadingLabel: 'Loading reference map…',
      errorLabel: 'The reference map did not finish loading. Use the original-map link. No substitute events are shown.',
    };
  }

  const api = {
    ALLOWED_EMBED_HOSTS,
    THEATERS,
    UKRAINE_REFERENCE,
    IRAN_REFERENCE,
    LEVANT_REFERENCE,
    mapHost,
    embedAllowed,
    getTheater,
    getMap,
    buildMapView,
  };
  root.ConflictMaps = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
