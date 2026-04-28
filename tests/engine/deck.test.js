import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildDeck, shuffle } from '../../src/engine/deck.js';
import { cardId } from '../../src/engine/card.js';
import { makeRng } from '../../src/engine/rng.js';

test('buildDeck returns 52 cards', () => {
  assert.equal(buildDeck().length, 52);
});

test('buildDeck cards are all unique', () => {
  const deck = buildDeck();
  const ids = new Set(deck.map(cardId));
  assert.equal(ids.size, 52);
});

test('buildDeck has exactly 4 of each rank and 13 of each suit', () => {
  const deck = buildDeck();
  const byRank = new Map();
  const bySuit = new Map();
  for (const c of deck) {
    byRank.set(c.rank, (byRank.get(c.rank) ?? 0) + 1);
    bySuit.set(c.suit, (bySuit.get(c.suit) ?? 0) + 1);
  }
  for (const count of byRank.values()) assert.equal(count, 4);
  for (const count of bySuit.values()) assert.equal(count, 13);
  assert.equal(byRank.size, 13);
  assert.equal(bySuit.size, 4);
});

test('shuffle preserves the multiset of cards', () => {
  const deck = buildDeck();
  const shuffled = shuffle(deck, makeRng(42));
  assert.equal(shuffled.length, 52);
  const before = new Set(deck.map(cardId));
  const after = new Set(shuffled.map(cardId));
  assert.equal(after.size, 52);
  for (const id of before) assert.ok(after.has(id), `lost card ${id}`);
});

test('shuffle is deterministic for the same seed', () => {
  const a = shuffle(buildDeck(), makeRng(42));
  const b = shuffle(buildDeck(), makeRng(42));
  assert.deepEqual(a, b);
});

test('shuffle produces different orderings for different seeds', () => {
  const a = shuffle(buildDeck(), makeRng(1));
  const b = shuffle(buildDeck(), makeRng(2));
  assert.notDeepEqual(a, b);
});

test('shuffle does not return the input order (for any reasonable seed)', () => {
  const deck = buildDeck();
  const shuffled = shuffle(deck, makeRng(42));
  assert.notDeepEqual(shuffled, deck);
});

test('shuffle does not mutate its input', () => {
  const deck = buildDeck();
  const before = deck.slice();
  shuffle(deck, makeRng(42));
  assert.deepEqual(deck, before);
});
