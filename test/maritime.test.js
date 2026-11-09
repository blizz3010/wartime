import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import '../maritime-embed.js';

const { MaritimeEmbed } = globalThis;
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const PAGE = 'https://wartime-dashboard.vercel.app/';

function params(url) {
  return new URL(url).searchParams;
}

test('embed URL is the official VesselFinder map and carries the page referrer', () => {
  const url = MaritimeEmbed.vesselFinderEmbedUrl(26.3, 56.7, 8, PAGE);
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, MaritimeEmbed.EMBED_ORIGIN);
  assert.equal(params(url).get('lat'), '26.3');
  assert.equal(params(url).get('lon'), '56.7');
  assert.equal(params(url).get('zoom'), '8');
  assert.equal(params(url).get('ra'), PAGE);
  assert.equal(params(url).get('names'), 'true');
  assert.equal(params(url).get('track'), 'false');
  assert.equal(params(url).get('fleet'), 'false');
});

test('Iran and Ukraine maritime views are different sourced embeds', () => {
  const hormuz = MaritimeEmbed.vesselFinderEmbedUrl(26.59, 56.27, 10, PAGE);
  const blackSea = MaritimeEmbed.vesselFinderEmbedUrl(44, 33.5, 7, PAGE);
  assert.notEqual(params(hormuz).get('lat'), params(blackSea).get('lat'));
  assert.notEqual(params(hormuz).get('lon'), params(blackSea).get('lon'));
  assert.equal(params(hormuz).get('ra'), params(blackSea).get('ra'));
});

test('zoom is kept inside the provider range and file URLs are not sent', () => {
  const url = MaritimeEmbed.vesselFinderEmbedUrl(26, 56, 99, 'file:///tmp/index.html');
  assert.equal(params(url).get('zoom'), '18');
  assert.equal(params(url).get('ra'), 'testingonly');
  assert.throws(() => MaritimeEmbed.vesselFinderEmbedUrl(120, 56, 8, PAGE));
});

test('the page builds the embed instead of the referrer-less URL that returns 400', () => {
  assert.match(indexHtml, /src="maritime-embed\.js"/);
  assert.match(indexHtml, /MaritimeEmbed\.vesselFinderEmbedUrl/);
  assert.doesNotMatch(indexHtml, /aismap\?lat=/);
  assert.doesNotMatch(indexHtml, /width=1600&height=900&names=true/);
});
