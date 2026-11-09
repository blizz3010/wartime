import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import '../cyber-embed.js';

const { CyberEmbed } = globalThis;
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('only the Bitdefender threat map is embeddable', () => {
  assert.equal(CyberEmbed.embedAllowed(CyberEmbed.BITDEFENDER), true);
  for (const url of [
    'https://threatmap.fortiguard.com/',
    'https://fortiguard.fortinet.com/threat-map',
    'https://www.fortiguard.com/threat-map',
    'https://cybermap.kaspersky.com/',
    'https://threatmap.checkpoint.com/',
    'https://horizon.netscout.com/',
    'https://radar.cloudflare.com/',
    'https://www.digitalattackmap.com/',
    'http://threatmap.bitdefender.com/',
  ]) {
    assert.equal(CyberEmbed.embedAllowed(url), false, url);
  }
});

test('the cyber panel does not iframe Fortinet and names the Bitdefender source', () => {
  assert.match(indexHtml, /src="cyber-embed\.js"/);
  assert.match(indexHtml, /CyberEmbed\.embedAllowed/);
  assert.match(indexHtml, /CyberEmbed\.BITDEFENDER/);
  assert.doesNotMatch(indexHtml, /f\.src='https:\/\/threatmap\.fortiguard\.com/);
  assert.doesNotMatch(indexHtml, /setCyberSrc\('https:\/\/threatmap\.fortiguard\.com\//);
  assert.doesNotMatch(indexHtml, /setCyberSrc\('https:\/\/www\.digitalattackmap\.com\//);
  assert.match(indexHtml, /frame-ancestors/);
  assert.match(indexHtml, /not the selected theater/);
});
