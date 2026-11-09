// Fortinet's threat map redirects to fortiguard.fortinet.com and sends
// frame-ancestors 'self' https://www.fortinet.com https://fortinet.com.
// Firefox refuses that embed. Bitdefender's public threat map does not
// send X-Frame-Options or frame-ancestors and serves its own live feed.
(function (root) {
  const BITDEFENDER = 'https://threatmap.bitdefender.com/';

  function embedAllowed(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' &&
        parsed.hostname === 'threatmap.bitdefender.com' &&
        (parsed.pathname === '/' || parsed.pathname === '');
    } catch (e) {
      return false;
    }
  }

  root.CyberEmbed = {
    BITDEFENDER,
    embedAllowed,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
