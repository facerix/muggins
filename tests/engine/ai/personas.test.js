import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeCard } from '../../../src/engine/card.js';
import { makeRng } from '../../../src/engine/rng.js';
import { reducer } from '../../../src/engine/reducer.js';
import { start, flip, hold } from '../../../src/engine/actions.js';
import * as greedy from '../../../src/engine/ai/greedy.js';
import * as random from '../../../src/engine/ai/random.js';
import * as strategist from '../../../src/engine/ai/strategist.js';

const minimal2p = [
  { name: 'a', kind: 'human' },
  { name: 'b', kind: 'human' },
];

test('greedy chooses PLAY when a legal adjacent play exists', () => {
  let state = reducer(undefined, start({ seed: 0, players: minimal2p }));
  state = reducer(state, flip('p0'));
  assert.equal(state.turn.phase, 'decide');
  const rng = makeRng(1);
  const action = greedy.chooseAction(state, 'p0', rng);
  assert.equal(action.type, 'PLAY');
  assert.deepEqual(action.payload.target, { type: 'display', pileIndex: 3 });
});

test('random uses rng: same state can yield PLAY or HOLD when legals exist', () => {
  let state = reducer(undefined, start({ seed: 0, players: minimal2p }));
  state = reducer(state, flip('p0'));

  let plays = 0;
  let holds = 0;
  for (let i = 0; i < 60; i += 1) {
    const a = random.chooseAction(state, 'p0', makeRng(i));
    if (a.type === 'PLAY') plays += 1;
    else if (a.type === 'HOLD') holds += 1;
  }
  assert.ok(plays > 0 && holds > 0, 'expected mixture of PLAY and HOLD over rng seeds');
});

test('strategist prefers opponent pile over display when both exist', () => {
  const state = {
    schemaVersion: 1,
    seed: 1,
    rngState: 0,
    players: [
      { id: 'p0', name: 'A', kind: 'ai-strategist' },
      { id: 'p1', name: 'B', kind: 'human' },
    ],
    hands: [
      { playerId: 'p0', faceDown: [makeCard(6, 'D'), makeCard(9, 'C')], faceUp: [] },
      { playerId: 'p1', faceDown: [], faceUp: [makeCard(5, 'D')] },
    ],
    displayPiles: [
      [makeCard(13, 'C')],
      [makeCard(13, 'D')],
      [makeCard(13, 'H')],
      [makeCard(13, 'S')],
    ],
    turn: { playerId: 'p0', phase: 'decide' },
    flippedCard: makeCard(6, 'D'),
    log: [],
    winner: null,
  };

  const action = strategist.chooseAction(state, 'p0', makeRng(0));
  assert.equal(action.type, 'PLAY');
  assert.deepEqual(action.payload.target, { type: 'opponent', playerId: 'p1' });
});

test('strategist shouldCallMuggins when last HOLD missed a legal play', () => {
  let state = reducer(undefined, start({ seed: 0, players: minimal2p }));
  state = reducer(state, flip('p0'));
  state = reducer(state, hold('p0'));

  assert.equal(strategist.shouldCallMuggins(state, 'p1'), true);
  assert.equal(strategist.shouldCallMuggins(state, 'p0'), false);
});

// ---------- flip-phase: PLAY_HELD preference ----------

const heldTopPlayableState = (turnPhase = 'flip') => ({
  schemaVersion: 1,
  seed: 1,
  rngState: 0,
  players: [
    { id: 'p0', name: 'A', kind: 'ai-greedy' },
    { id: 'p1', name: 'B', kind: 'human' },
  ],
  hands: [
    {
      playerId: 'p0',
      faceDown: [makeCard(9, 'C')],
      faceUp: [makeCard(8, 'S'), makeCard(5, 'H')], // top is 5H, adjacent to 4C on pile 0
    },
    { playerId: 'p1', faceDown: [], faceUp: [makeCard(6, 'D')] }, // 5H also adjacent to 6D
  ],
  displayPiles: [[makeCard(4, 'C')], [makeCard(13, 'D')], [makeCard(13, 'H')], [makeCard(13, 'S')]],
  turn: { playerId: 'p0', phase: turnPhase },
  flippedCard: null,
  log: [],
  winner: null,
});

test('greedy plays held-top in flip phase when a legal target exists', () => {
  const action = greedy.chooseAction(heldTopPlayableState(), 'p0', makeRng(0));
  assert.equal(action.type, 'PLAY_HELD');
});

test('greedy falls back to FLIP when held-top has no legal target', () => {
  const s = heldTopPlayableState();
  s.displayPiles = [
    [makeCard(13, 'C')],
    [makeCard(13, 'D')],
    [makeCard(13, 'H')],
    [makeCard(13, 'S')],
  ];
  s.hands[1].faceUp = []; // no opponent target either
  const action = greedy.chooseAction(s, 'p0', makeRng(0));
  assert.equal(action.type, 'FLIP');
});

test('strategist prefers PLAY_HELD with opponent target over display target', () => {
  const action = strategist.chooseAction(heldTopPlayableState(), 'p0', makeRng(0));
  assert.equal(action.type, 'PLAY_HELD');
  assert.deepEqual(action.payload.target, { type: 'opponent', playerId: 'p1' });
});

test('random can pick PLAY_HELD or FLIP in flip phase when held-top is playable', () => {
  const s = heldTopPlayableState();
  let playHeldCount = 0;
  let flipCount = 0;
  for (let i = 0; i < 60; i += 1) {
    const a = random.chooseAction(s, 'p0', makeRng(i));
    if (a.type === 'PLAY_HELD') playHeldCount += 1;
    else if (a.type === 'FLIP') flipCount += 1;
  }
  assert.ok(playHeldCount > 0 && flipCount > 0, 'expected mixture of PLAY_HELD and FLIP');
});

test('strategist shouldCallMuggins when last FLIP missed a held-top play', () => {
  // Hand-built post-FLIP state with playable held-top.
  const s = {
    schemaVersion: 1,
    seed: 1,
    rngState: 0,
    players: [
      { id: 'p0', name: 'A', kind: 'human' },
      { id: 'p1', name: 'B', kind: 'ai-strategist' },
    ],
    hands: [
      { playerId: 'p0', faceDown: [], faceUp: [makeCard(5, 'H')] },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
    displayPiles: [
      [makeCard(4, 'C')],
      [makeCard(13, 'D')],
      [makeCard(13, 'H')],
      [makeCard(13, 'S')],
    ],
    turn: { playerId: 'p0', phase: 'decide' },
    flippedCard: makeCard(9, 'C'),
    log: [
      { type: 'START', payload: {}, by: 'system', at: 0 },
      { type: 'FLIP', payload: {}, by: 'p0', at: 1 },
    ],
    winner: null,
  };
  assert.equal(strategist.shouldCallMuggins(s, 'p1'), true);
  assert.equal(strategist.shouldCallMuggins(s, 'p0'), false);
});
