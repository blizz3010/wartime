import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterByRelevance,
  KEYWORDS_IRAN,
  KEYWORDS_UKRAINE,
  NEWS_MAX_AGE_DAYS,
} from '../api/news.js';

const NOW = Date.parse('2026-08-12T18:18:14Z');

function article(overrides = {}) {
  return {
    title: 'Untitled',
    description: '',
    pubDate: 'Wed, 12 Aug 2026 16:58:16 GMT',
    sourceName: 'Al Jazeera',
    ...overrides,
  };
}

test('Iran feed rejects generic conflict vocabulary without an Iran anchor', () => {
  const items = [article({
    title: 'Drought exposes Nazi-era warship wrecks beneath the Danube',
    description: 'Record-low water levels exposed dozens of wartime vessels in Serbia.',
  })];

  assert.deepEqual(filterByRelevance(items, KEYWORDS_IRAN, NOW), []);
});

test('Iran feed rejects Iran human-interest stories without conflict context', () => {
  const items = [article({
    title: 'Iranian footballers become Australian citizens',
    description: 'The players were granted humanitarian visas after a tournament.',
  })];

  assert.deepEqual(filterByRelevance(items, KEYWORDS_IRAN, NOW), []);
});

test('Iran feed rejects stories that only mention Iran tangentially in the description', () => {
  const items = [article({
    title: 'Netanyahu rejects new Gaza peace plan',
    description: 'The decision affects conflicts in Gaza, Lebanon and Iran.',
    sourceName: 'Guardian',
  })];

  assert.deepEqual(filterByRelevance(items, KEYWORDS_IRAN, NOW), []);
});

test('Iran feed keeps current conflict reporting with both anchor and context', () => {
  const items = [article({
    title: 'Iran remains defiant as it vows to fight US until demands met',
    description: 'IRGC advisers say Iran replaced missiles and drones and cite falling munition stocks.',
  })];

  const filtered = filterByRelevance(items, KEYWORDS_IRAN, NOW);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, items[0].title);
});

test('news feed drops valid but stale articles beyond the freshness window', () => {
  const items = [article({
    title: 'Iran says Hormuz blockade will continue',
    description: 'Tehran discussed the conflict and ongoing naval operations.',
    pubDate: 'Tue, 14 Apr 2026 15:22:43 GMT',
    sourceName: 'NBC',
  })];

  assert.equal(NEWS_MAX_AGE_DAYS, 30);
  assert.deepEqual(filterByRelevance(items, KEYWORDS_IRAN, NOW), []);
});

test('Ukraine scoring remains independent of the Iran-specific gate', () => {
  const items = [article({
    title: 'Ukraine reports new Russian missile attack',
    description: 'Air defenses intercepted missiles near Kyiv.',
  })];

  assert.equal(filterByRelevance(items, KEYWORDS_UKRAINE, NOW).length, 1);
});
