import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeCard } from '../../src/engine/card.js';
import { reducer } from '../../src/engine/reducer.js';
import { start, flip, flipHeld, play, hold } from '../../src/engine/actions.js';

const players2 = [
  { name: 'A', kind: 'human' },
  { name: 'B', kind: 'human' },
];

const newGame = (seed = 1, players = players2) => reducer(undefined, start({ seed, players }));

// Hand-built state where p0 has just one card and a legal play exists,
// so we can drive a deterministic win.
const winnableState = () => ({
  schemaVersion: 1,
  seed: 1,
  rngState: 0,
  players: [
    { id: 'p0', name: 'A', kind: 'human' },
    { id: 'p1', name: 'B', kind: 'human' },
  ],
  hands: [
    { playerId: 'p0', faceDown: [makeCard(5, 'D')], faceUp: [] },
    {
      playerId: 'p1',
      faceDown: [makeCard(2, 'C'), makeCard(3, 'C')],
      faceUp: [],
    },
  ],
  displayPiles: [[makeCard(4, 'C')], [makeCard(7, 'D')], [makeCard(11, 'H')], [makeCard(13, 'S')]],
  turn: { playerId: 'p0', phase: 'flip' },
  flippedCard: null,
  log: [],
  winner: null,
});

// ---------- START ----------

test('START produces an initial state with the action stamped at log[0]', () => {
  const s = newGame();
  assert.equal(s.log.length, 1);
  assert.equal(s.log[0].type, 'START');
  assert.equal(s.log[0].at, 0);
  assert.equal(s.turn.playerId, 'p0');
  assert.equal(s.turn.phase, 'flip');
  assert.equal(s.flippedCard, null);
  assert.equal(s.winner, null);
});

test('START is deterministic for the same seed', () => {
  const a = newGame(42);
  const b = newGame(42);
  assert.deepEqual(a, b);
});

// ---------- FLIP ----------

test('FLIP moves top of faceDown to flippedCard and enters decide phase', () => {
  const s0 = newGame();
  const top = s0.hands[0].faceDown[s0.hands[0].faceDown.length - 1];
  const s1 = reducer(s0, flip('p0'));
  assert.deepEqual(s1.flippedCard, top);
  assert.equal(s1.hands[0].faceDown.length, s0.hands[0].faceDown.length - 1);
  assert.equal(s1.turn.phase, 'decide');
  assert.equal(s1.turn.playerId, 'p0');
});

test('FLIP appends a stamped action to the log with monotonic at-index', () => {
  const s0 = newGame();
  const s1 = reducer(s0, flip('p0'));
  assert.equal(s1.log.length, 2);
  assert.equal(s1.log[1].type, 'FLIP');
  assert.equal(s1.log[1].at, 1);
  assert.equal(s1.log[1].by, 'p0');
});

test('FLIP throws if it is not your turn', () => {
  const s0 = newGame();
  assert.throws(() => reducer(s0, flip('p1')), /not your turn/);
});

test('FLIP throws if not in flip phase', () => {
  const s0 = newGame();
  const s1 = reducer(s0, flip('p0'));
  // s1 is in decide phase; another FLIP is illegal
  assert.throws(() => reducer(s1, flip('p0')), /not flip phase/);
});

test('FLIP throws if face-down is empty', () => {
  const state = {
    ...winnableState(),
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [makeCard(5, 'D')] },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
  };
  assert.throws(() => reducer(state, flip('p0')), /no face-down cards/);
});

// ---------- PLAY ----------

test('PLAY places flipped card on display pile, clears flippedCard, advances turn', () => {
  // Non-winning state: p0 has cards remaining after the play.
  const state = {
    ...winnableState(),
    hands: [
      {
        playerId: 'p0',
        faceDown: [makeCard(9, 'C'), makeCard(5, 'D')],
        faceUp: [],
      },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
  };
  const s1 = reducer(state, flip('p0'));
  // p0 flipped 5D; pile 0 top is 4C → adjacent
  const s2 = reducer(s1, play('p0', { type: 'display', pileIndex: 0 }));
  assert.deepEqual(s2.displayPiles[0][s2.displayPiles[0].length - 1], makeCard(5, 'D'));
  assert.equal(s2.flippedCard, null);
  assert.equal(s2.turn.playerId, 'p1');
  assert.equal(s2.turn.phase, 'flip');
  assert.equal(s2.winner, null);
});

test('PLAY onto opponent face-up adds the card to that opponent', () => {
  const state = {
    ...winnableState(),
    hands: [
      // give p0 a 6D to flip; p1 has 5D as faceUp (adjacent)
      {
        playerId: 'p0',
        faceDown: [makeCard(6, 'D'), makeCard(9, 'C')],
        faceUp: [],
      },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [makeCard(5, 'D')] },
    ],
    displayPiles: [
      [makeCard(13, 'C')],
      [makeCard(13, 'D')],
      [makeCard(13, 'H')],
      [makeCard(13, 'S')],
    ],
  };
  // Flip top of p0 faceDown → 9C (last pushed). To flip 6D, need it last.
  const s = {
    ...state,
    hands: [
      { playerId: 'p0', faceDown: [makeCard(9, 'C'), makeCard(6, 'D')], faceUp: [] },
      ...state.hands.slice(1),
    ],
  };
  const s1 = reducer(s, flip('p0'));
  assert.deepEqual(s1.flippedCard, makeCard(6, 'D'));
  const s2 = reducer(s1, play('p0', { type: 'opponent', playerId: 'p1' }));
  assert.deepEqual(s2.hands[1].faceUp[s2.hands[1].faceUp.length - 1], makeCard(6, 'D'));
  assert.equal(s2.flippedCard, null);
});

test('PLAY throws on illegal target', () => {
  const state = winnableState();
  const s1 = reducer(state, flip('p0'));
  // pile 2 top is 11H, flipped is 5D — not adjacent
  assert.throws(
    () => reducer(s1, play('p0', { type: 'display', pileIndex: 2 })),
    /illegal play target/
  );
});

test('PLAY throws when not in decide phase', () => {
  const state = winnableState();
  // No flip yet; phase is 'flip'
  assert.throws(
    () => reducer(state, play('p0', { type: 'display', pileIndex: 0 })),
    /not decide phase/
  );
});

test("PLAY that empties a player's hands sets winner and phase=done", () => {
  const state = winnableState();
  const s1 = reducer(state, flip('p0'));
  const s2 = reducer(s1, play('p0', { type: 'display', pileIndex: 0 }));
  assert.equal(s2.winner, 'p0');
  assert.equal(s2.turn.phase, 'done');
});

// ---------- HOLD ----------

test("HOLD moves flipped card to current player's face-up and advances turn", () => {
  const s0 = newGame();
  const s1 = reducer(s0, flip('p0'));
  const flipped = s1.flippedCard;
  const s2 = reducer(s1, hold('p0'));
  assert.equal(s2.flippedCard, null);
  assert.deepEqual(s2.hands[0].faceUp[s2.hands[0].faceUp.length - 1], flipped);
  assert.equal(s2.turn.playerId, 'p1');
  assert.equal(s2.turn.phase, 'flip');
});

test('HOLD throws when not in decide phase', () => {
  const s0 = newGame();
  assert.throws(() => reducer(s0, hold('p0')), /not decide phase/);
});

// ---------- FLIP_HELD ----------

test('FLIP_HELD reverses face-up onto a new face-down stack', () => {
  const state = {
    ...winnableState(),
    hands: [
      {
        playerId: 'p0',
        faceDown: [],
        faceUp: [makeCard(2, 'C'), makeCard(3, 'D'), makeCard(4, 'H')],
      },
      { playerId: 'p1', faceDown: [makeCard(7, 'C')], faceUp: [] },
    ],
  };
  const s1 = reducer(state, flipHeld('p0'));
  // After flipping the pile, the bottom (2C) becomes the top.
  assert.deepEqual(s1.hands[0].faceUp, []);
  assert.deepEqual(s1.hands[0].faceDown, [makeCard(4, 'H'), makeCard(3, 'D'), makeCard(2, 'C')]);
  // Turn does NOT advance — player still owes a FLIP this turn.
  assert.equal(s1.turn.playerId, 'p0');
  assert.equal(s1.turn.phase, 'flip');
});

test('FLIP_HELD throws when face-down is not empty', () => {
  const s0 = newGame();
  assert.throws(() => reducer(s0, flipHeld('p0')), /faceDown not empty/);
});

test('FLIP_HELD throws when face-up is also empty', () => {
  const state = {
    ...winnableState(),
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [] },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
  };
  assert.throws(() => reducer(state, flipHeld('p0')), /no face-up cards/);
});

// ---------- Action log + replay ----------

test('Action log is appended in order with monotonic at-indices', () => {
  let s = newGame();
  s = reducer(s, flip('p0'));
  s = reducer(s, hold('p0'));
  s = reducer(s, flip('p1'));
  s = reducer(s, hold('p1'));
  assert.deepEqual(
    s.log.map(a => a.at),
    [0, 1, 2, 3, 4]
  );
  assert.deepEqual(
    s.log.map(a => a.type),
    ['START', 'FLIP', 'HOLD', 'FLIP', 'HOLD']
  );
});

test('Replaying the action log reproduces the final state', () => {
  let s = newGame(7);
  s = reducer(s, flip('p0'));
  s = reducer(s, hold('p0'));
  s = reducer(s, flip('p1'));
  s = reducer(s, hold('p1'));

  // Strip the `at` stamp before replay since the reducer re-stamps anyway.
  const replay = s.log.reduce((acc, action) => reducer(acc, action), undefined);
  assert.deepEqual(replay, s);
});

test('reducer throws when a non-START action is applied to undefined state', () => {
  assert.throws(() => reducer(undefined, flip('p0')), /not been started/);
});

test('reducer throws on unknown action type', () => {
  const s = newGame();
  assert.throws(() => reducer(s, { type: 'NOPE', payload: {}, by: 'p0' }), /Unknown action/);
});
