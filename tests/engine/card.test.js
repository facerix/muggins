import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SUITS, RANKS, ACE, KING, makeCard, isAdjacent, cardId } from '../../src/engine/card.js';

test('SUITS exposes the four standard suits', () => {
  assert.deepEqual([...SUITS].sort(), ['C', 'D', 'H', 'S']);
});

test('RANKS exposes 13 contiguous values, ace low (1) through king (13)', () => {
  assert.equal(RANKS.length, 13);
  assert.equal(Math.min(...RANKS), 1);
  assert.equal(Math.max(...RANKS), 13);
  assert.equal(ACE, 1);
  assert.equal(KING, 13);
});

test('makeCard returns a plain object with rank and suit', () => {
  const c = makeCard(7, 'H');
  assert.equal(c.rank, 7);
  assert.equal(c.suit, 'H');
});

test('isAdjacent: cards differing by one rank are adjacent', () => {
  assert.equal(isAdjacent(makeCard(2, 'C'), makeCard(3, 'D')), true);
  assert.equal(isAdjacent(makeCard(7, 'S'), makeCard(8, 'S')), true);
  assert.equal(isAdjacent(makeCard(KING, 'D'), makeCard(12, 'C')), true);
});

test('isAdjacent: order does not matter', () => {
  assert.equal(isAdjacent(makeCard(8, 'S'), makeCard(7, 'S')), true);
});

test('isAdjacent: ace is adjacent to two', () => {
  assert.equal(isAdjacent(makeCard(ACE, 'C'), makeCard(2, 'D')), true);
});

test('isAdjacent: ace is NOT adjacent to king (no wrap)', () => {
  assert.equal(isAdjacent(makeCard(ACE, 'C'), makeCard(KING, 'D')), false);
});

test('isAdjacent: same rank is not adjacent', () => {
  assert.equal(isAdjacent(makeCard(5, 'C'), makeCard(5, 'D')), false);
});

test('isAdjacent: distance > 1 is not adjacent', () => {
  assert.equal(isAdjacent(makeCard(3, 'C'), makeCard(5, 'D')), false);
  assert.equal(isAdjacent(makeCard(ACE, 'C'), makeCard(3, 'D')), false);
});

test('cardId encodes rank and suit into a stable string', () => {
  assert.equal(cardId(makeCard(1, 'S')), '1S');
  assert.equal(cardId(makeCard(13, 'H')), '13H');
});

test('cardId values are unique across the full 52-card space', () => {
  const ids = new Set();
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      ids.add(cardId(makeCard(rank, suit)));
    }
  }
  assert.equal(ids.size, 52);
});
