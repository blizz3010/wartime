import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import '../conflict-maps.js';

const { ConflictMaps } = globalThis;
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function bbox(url) {
  const value = new URL(url).searchParams.get('bbox');
  assert.ok(value, `missing bbox on ${url}`);
  return value.split(',').map(Number);
}

function contains(box, lon, lat) {
  return lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3];
}

test('Ukraine embeds the LiveUAMap host that allows framing', () => {
  const view = ConflictMaps.buildMapView('ukraine');
  assert.equal(view.mode, 'embed');
  assert.equal(view.embedUrl, 'https://livemapdata.com/');
  assert.equal(view.openUrl, 'https://livemapdata.com/');
  assert.equal(view.showsLiveEvents, true);
  assert.equal(ConflictMaps.mapHost(view.embedUrl), 'livemapdata.com');
  assert.ok(view.links.some((link) => link.url === 'https://liveuamap.com/'));
  assert.ok(view.links.some((link) => link.url === 'https://deepstatemap.live/en'));
  assert.match(view.notice, /X-Frame-Options/);
  assert.match(view.notice, /does not add events/);
});

test('api.livemapdata.com and LiveUAMap regional hosts are not embeddable', () => {
  const blocked = [
    'https://api.livemapdata.com/',
    'https://www.livemapdata.com/',
    'https://livemapdata.com/en',
    'https://liveuamap.com/',
    'https://liveuamap.com/frame',
    'https://iran.liveuamap.com/',
    'https://israelpalestine.liveuamap.com/',
    'https://iranstrikemap.com/',
    'https://iranwarmap.com/',
    'https://trackgulf.com/embed.html',
    'https://deepstatemap.live/en',
  ];
  for (const url of blocked) {
    assert.equal(ConflictMaps.embedAllowed(url), false, url);
  }
  assert.equal(ConflictMaps.embedAllowed('http://livemapdata.com/'), false);
  assert.equal(ConflictMaps.embedAllowed('https://livemapdata.com/'), true);
});

test('Iran does not embed a conflict layer and links to the original LiveUAMap', () => {
  const view = ConflictMaps.buildMapView('iran');
  assert.equal(view.mode, 'reference-fallback');
  assert.equal(view.showsLiveEvents, false);
  assert.equal(view.openUrl, 'https://iran.liveuamap.com/');
  assert.equal(view.embedUrl, ConflictMaps.IRAN_REFERENCE);
  assert.match(view.frameTitle, /OpenStreetMap|reference/i);
  assert.doesNotMatch(view.frameTitle, /LiveUAMap/);
  assert.equal(ConflictMaps.embedAllowed(view.embedUrl), true);
  assert.match(view.notice, /No strikes or territorial control/);
  assert.match(view.notice, /Iran Strike Map is not embedded/);
  assert.ok(view.links.some((link) => link.url === 'https://iran.liveuamap.com/'));
  assert.doesNotMatch(view.embedUrl, /iranstrikemap|iranwarmap|livemapdata|liveuamap/i);
});

test('region frames contain the selected theater and not the other capital', () => {
  const iran = bbox(ConflictMaps.buildMapView('iran').embedUrl);
  const ukraine = bbox(ConflictMaps.buildMapView('ukraine', 'reference').embedUrl);
  const levant = bbox(ConflictMaps.buildMapView('iran', 'israel-palestine').embedUrl);
  assert.equal(contains(iran, 51.39, 35.69), true, 'Tehran');
  assert.equal(contains(iran, 56.27, 26.59), true, 'Hormuz');
  assert.equal(contains(iran, 30.52, 50.45), false, 'Kyiv must not sit in the Iran frame');
  assert.equal(contains(ukraine, 30.52, 50.45), true, 'Kyiv');
  assert.equal(contains(ukraine, 51.39, 35.69), false, 'Tehran must not sit in the Ukraine frame');
  assert.equal(contains(levant, 35.21, 31.77), true, 'Jerusalem');
  assert.equal(contains(levant, 51.39, 35.69), false, 'Tehran must not sit in the Levant frame');
});

test('DeepState stays an external link with a reference map and no invented front line', () => {
  const view = ConflictMaps.buildMapView('ukraine', 'deepstate');
  assert.equal(view.mode, 'reference-fallback');
  assert.equal(view.showsLiveEvents, false);
  assert.equal(view.openUrl, 'https://deepstatemap.live/en');
  assert.equal(view.embedUrl, ConflictMaps.UKRAINE_REFERENCE);
  assert.match(view.notice, /no front line/i);
  assert.match(view.notice, /does not publish an embed/);
});

test('every catalog embed is on the allowlist and defaults differ by region', () => {
  const iran = ConflictMaps.buildMapView('iran');
  const ukraine = ConflictMaps.buildMapView('ukraine');
  assert.notEqual(iran.embedUrl, ukraine.embedUrl);
  assert.notEqual(iran.openUrl, ukraine.openUrl);
  for (const theater of Object.values(ConflictMaps.THEATERS)) {
    for (const map of theater.maps) {
      if (map.embedUrl) assert.equal(ConflictMaps.embedAllowed(map.embedUrl), true, map.id);
      assert.equal(typeof map.notice, 'string');
      assert.ok(map.notice.length > 40, map.id);
      for (const link of map.links) {
        assert.equal(new URL(link.url).protocol, 'https:');
      }
    }
  }
});

test('the page does not revive the blocked embed or the stale Iran strike embed', () => {
  assert.match(indexHtml, /src="conflict-maps\.js"/);
  assert.doesNotMatch(indexHtml, /api\.livemapdata\.com/);
  assert.doesNotMatch(indexHtml, /embedUrl:'https:\/\/iranstrikemap\.com/);
  assert.doesNotMatch(indexHtml, /data-embed-url="https:\/\/iranstrikemap\.com/);
  assert.doesNotMatch(indexHtml, /data-embed-url="https:\/\/iranwarmap\.com/);
  assert.match(indexHtml, /ConflictMaps\.buildMapView/);
  assert.match(indexHtml, /dataset\.mapState/);
  assert.ok(indexHtml.indexOf("let currentPanel='overview'") < indexHtml.indexOf('restoreFromHash();'));
  assert.ok(indexHtml.indexOf('let allVideoClips=[]') < indexHtml.indexOf('function switchTheater'));
});
