import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeCard, ACE, KING } from '../../src/engine/card.js';
import { legalPlaysFor } from '../../src/engine/legalMoves.js';

// Build a minimal state by hand so we can isolate legalPlaysFor logic
// from the full createGame flow.
const stateWith = ({ displayPiles, hands, currentId = 'p0' }) => ({
  displayPiles,
  hands,
  turn: { playerId: currentId, phase: 'decide' },
});

test('returns display pile when its top is one rank away', () => {
  const state = stateWith({
    displayPiles: [[makeCard(7, 'C')], [makeCard(2, 'D')], [makeCard(11, 'H')], [makeCard(5, 'S')]],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [] },
    ],
  });

  const targets = legalPlaysFor(state, makeCard(8, 'D'));
  assert.deepEqual(
    targets.filter(t => t.type === 'display').map(t => t.pileIndex),
    [0]
  );
});

test('returns multiple display piles when several tops are adjacent', () => {
  const state = stateWith({
    displayPiles: [
      [makeCard(7, 'C')], // adj to 8
      [makeCard(9, 'D')], // adj to 8
      [makeCard(11, 'H')],
      [makeCard(2, 'S')],
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [] },
    ],
  });
  const targets = legalPlaysFor(state, makeCard(8, 'D'));
  assert.deepEqual(
    targets
      .filter(t => t.type === 'display')
      .map(t => t.pileIndex)
      .sort(),
    [0, 1]
  );
});

test('does not return a display pile when no top is adjacent', () => {
  const state = stateWith({
    displayPiles: [
      [makeCard(2, 'C')],
      [makeCard(5, 'D')],
      [makeCard(11, 'H')],
      [makeCard(13, 'S')],
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [] },
    ],
  });
  const targets = legalPlaysFor(state, makeCard(8, 'D'));
  assert.deepEqual(targets, []);
});

test('returns opponent face-up pile when its top is adjacent', () => {
  const state = stateWith({
    displayPiles: [
      [makeCard(2, 'C')],
      [makeCard(5, 'D')],
      [makeCard(11, 'H')],
      [makeCard(13, 'S')],
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [makeCard(7, 'D')] },
    ],
  });
  const targets = legalPlaysFor(state, makeCard(8, 'D'));
  assert.deepEqual(
    targets.filter(t => t.type === 'opponent'),
    [{ type: 'opponent', playerId: 'p1' }]
  );
});

test("does NOT return current player's own face-up pile", () => {
  const state = stateWith({
    displayPiles: [[makeCard(2, 'C')], [makeCard(2, 'D')], [makeCard(2, 'H')], [makeCard(2, 'S')]],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [makeCard(7, 'D')] }, // would be adjacent if it were legal
      { playerId: 'p1', faceDown: [], faceUp: [] },
    ],
    currentId: 'p0',
  });
  const targets = legalPlaysFor(state, makeCard(8, 'D'));
  assert.equal(
    targets.find(t => t.type === 'opponent' && t.playerId === 'p0'),
    undefined
  );
});

test('skips opponents whose face-up pile is empty', () => {
  const state = stateWith({
    displayPiles: [[makeCard(2, 'C')], [makeCard(2, 'D')], [makeCard(2, 'H')], [makeCard(2, 'S')]],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [] },
      { playerId: 'p2', faceDown: [], faceUp: [makeCard(7, 'D')] },
    ],
    currentId: 'p0',
  });
  const targets = legalPlaysFor(state, makeCard(8, 'D'));
  assert.equal(
    targets.find(t => t.type === 'opponent' && t.playerId === 'p1'),
    undefined
  );
  assert.ok(targets.find(t => t.type === 'opponent' && t.playerId === 'p2'));
});

test('ace is adjacent to 2 (low edge)', () => {
  const state = stateWith({
    displayPiles: [
      [makeCard(ACE, 'C')],
      [makeCard(ACE, 'D')],
      [makeCard(ACE, 'H')],
      [makeCard(ACE, 'S')],
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [] },
    ],
  });
  const targets = legalPlaysFor(state, makeCard(2, 'D'));
  assert.equal(targets.length, 4);
});

test('king is adjacent to queen (high edge)', () => {
  const state = stateWith({
    displayPiles: [
      [makeCard(KING, 'C')],
      [makeCard(KING, 'D')],
      [makeCard(KING, 'H')],
      [makeCard(KING, 'S')],
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [] },
    ],
  });
  const targets = legalPlaysFor(state, makeCard(12, 'D'));
  assert.equal(targets.length, 4);
});

test('ace is NOT adjacent to king (no wrap-around)', () => {
  const state = stateWith({
    displayPiles: [
      [makeCard(KING, 'C')],
      [makeCard(KING, 'D')],
      [makeCard(KING, 'H')],
      [makeCard(KING, 'S')],
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [makeCard(KING, 'C')] },
    ],
  });
  const targets = legalPlaysFor(state, makeCard(ACE, 'D'));
  assert.deepEqual(targets, []);
});

test('returns combined display + opponent targets', () => {
  const state = stateWith({
    displayPiles: [
      [makeCard(7, 'C')], // adj to 8
      [makeCard(2, 'D')],
      [makeCard(11, 'H')],
      [makeCard(5, 'S')],
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [makeCard(9, 'D')] }, // adj to 8
      { playerId: 'p2', faceDown: [], faceUp: [makeCard(2, 'D')] }, // not adj
    ],
  });
  const targets = legalPlaysFor(state, makeCard(8, 'D'));
  assert.equal(targets.length, 2);
  assert.ok(targets.find(t => t.type === 'display' && t.pileIndex === 0));
  assert.ok(targets.find(t => t.type === 'opponent' && t.playerId === 'p1'));
});
