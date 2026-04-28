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
