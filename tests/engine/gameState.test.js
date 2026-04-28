import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../../src/engine/gameState.js';
import { cardId } from '../../src/engine/card.js';

const players2 = [
  { name: 'Alice', kind: 'human' },
  { name: 'Bob', kind: 'ai-greedy' },
];
const players3 = [
  { name: 'A', kind: 'human' },
  { name: 'B', kind: 'ai-greedy' },
  { name: 'C', kind: 'ai-strategist' },
];
const players4 = [
  { name: 'A', kind: 'human' },
  { name: 'B', kind: 'ai-random' },
  { name: 'C', kind: 'ai-greedy' },
  { name: 'D', kind: 'ai-strategist' },
];

const totalCards = state => {
  const inHands = state.hands.reduce((n, h) => n + h.faceDown.length + h.faceUp.length, 0);
  const inDisplay = state.displayPiles.reduce((n, p) => n + p.length, 0);
  return inHands + inDisplay;
};

test('createGame: 2 players each receive 24 face-down cards', () => {
  const s = createGame({ seed: 1, players: players2 });
  assert.equal(s.hands.length, 2);
  assert.equal(s.hands[0].faceDown.length, 24);
  assert.equal(s.hands[1].faceDown.length, 24);
  assert.equal(s.hands[0].faceUp.length, 0);
  assert.equal(s.hands[1].faceUp.length, 0);
});

test('createGame: 3 players each receive 16 face-down cards', () => {
  const s = createGame({ seed: 1, players: players3 });
  assert.equal(s.hands.length, 3);
  for (const h of s.hands) assert.equal(h.faceDown.length, 16);
});

test('createGame: 4 players each receive 12 face-down cards', () => {
  const s = createGame({ seed: 1, players: players4 });
  assert.equal(s.hands.length, 4);
  for (const h of s.hands) assert.equal(h.faceDown.length, 12);
});

test('createGame: 4 display piles each have exactly 1 card', () => {
  const s = createGame({ seed: 1, players: players2 });
  assert.equal(s.displayPiles.length, 4);
  for (const pile of s.displayPiles) assert.equal(pile.length, 1);
});

test('createGame: total card conservation (52 across all piles and hands)', () => {
  for (const players of [players2, players3, players4]) {
    const s = createGame({ seed: 7, players });
    assert.equal(totalCards(s), 52);
  }
});

test('createGame: every card in play is unique', () => {
  const s = createGame({ seed: 7, players: players4 });
  const ids = new Set();
  for (const h of s.hands) for (const c of h.faceDown) ids.add(cardId(c));
  for (const h of s.hands) for (const c of h.faceUp) ids.add(cardId(c));
  for (const p of s.displayPiles) for (const c of p) ids.add(cardId(c));
  assert.equal(ids.size, 52);
});

test('createGame: throws for fewer than 2 players', () => {
  assert.throws(() => createGame({ seed: 1, players: [] }));
  assert.throws(() => createGame({ seed: 1, players: [{ name: 'A', kind: 'human' }] }));
});

test('createGame: throws for more than 4 players', () => {
  const tooMany = Array.from({ length: 5 }, (_, i) => ({
    name: `P${i}`,
    kind: 'human',
  }));
  assert.throws(() => createGame({ seed: 1, players: tooMany }));
});

test('createGame: deterministic for the same seed', () => {
  const a = createGame({ seed: 12345, players: players4 });
  const b = createGame({ seed: 12345, players: players4 });
  assert.deepEqual(a, b);
});

test('createGame: different seeds produce different deals', () => {
  const a = createGame({ seed: 1, players: players2 });
  const b = createGame({ seed: 2, players: players2 });
  assert.notDeepEqual(a.displayPiles, b.displayPiles);
});

test('createGame: assigns sequential player ids p0..pN', () => {
  const s = createGame({ seed: 1, players: players4 });
  assert.deepEqual(
    s.players.map(p => p.id),
    ['p0', 'p1', 'p2', 'p3']
  );
});

test('createGame: preserves player names and kinds', () => {
  const s = createGame({ seed: 1, players: players4 });
  assert.equal(s.players[0].name, 'A');
  assert.equal(s.players[3].kind, 'ai-strategist');
});

test('createGame: turn starts with first player in flip phase', () => {
  const s = createGame({ seed: 1, players: players2 });
  assert.equal(s.turn.playerId, 'p0');
  assert.equal(s.turn.phase, 'flip');
});

test('createGame: initial state has no flipped card, no winner, empty log', () => {
  const s = createGame({ seed: 1, players: players2 });
  assert.equal(s.flippedCard, null);
  assert.equal(s.winner, null);
  assert.deepEqual(s.log, []);
});

test('createGame: records seed and rngState', () => {
  const s = createGame({ seed: 12345, players: players2 });
  assert.equal(s.seed, 12345);
  assert.equal(typeof s.rngState, 'number');
  assert.notEqual(s.rngState, 12345); // shuffle advanced the rng
});

test('createGame: schemaVersion is set', () => {
  const s = createGame({ seed: 1, players: players2 });
  assert.equal(s.schemaVersion, 1);
});
