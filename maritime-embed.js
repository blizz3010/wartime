// VesselFinder's supported embed is /aismap with the parameters their
// aismap.js script writes into an iframe. A map URL without `ra` (the
// embedding page) is rejected with HTTP 400 "Bad request".
(function (root) {
  const EMBED_ORIGIN = 'https://www.vesselfinder.com/aismap';

  function vesselFinderEmbedUrl(lat, lon, zoom, pageUrl) {
    const latitude = Number(lat);
    const longitude = Number(lon);
    let zoomLevel = Number(zoom);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('VesselFinder latitude is out of range');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('VesselFinder longitude is out of range');
    }
    if (!Number.isFinite(zoomLevel)) zoomLevel = 3;
    zoomLevel = Math.min(18, Math.max(3, zoomLevel));
    let referrer = String(pageUrl || '');
    if (!referrer || referrer.indexOf('file://') === 0) referrer = 'testingonly';
    const params = new URLSearchParams({
      zoom: String(zoomLevel),
      lat: String(latitude),
      lon: String(longitude),
      width: '100%',
      height: '600',
      names: 'true',
      track: 'false',
      fleet: 'false',
      fleet_name: 'false',
      fleet_hide_old_positions: 'false',
      clicktoact: 'false',
      store_pos: 'true',
      ra: referrer,
    });
    return EMBED_ORIGIN + '?' + params.toString();
  }

  root.MaritimeEmbed = { EMBED_ORIGIN, vesselFinderEmbedUrl };
})(typeof globalThis !== 'undefined' ? globalThis : this);
