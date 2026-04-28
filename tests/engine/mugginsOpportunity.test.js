import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeCard } from '../../src/engine/card.js';
import {
  missedLegalOffender,
  missedLegalOffenderIfLastFlip,
  missedLegalOffenderIfLastHold,
} from '../../src/engine/mugginsOpportunity.js';
import { reducer } from '../../src/engine/reducer.js';
import { start, flip, hold } from '../../src/engine/actions.js';

test('missedLegalOffenderIfLastHold reports offender when HOLD ignored a legal display play', () => {
  let state = reducer(
    undefined,
    start({
      seed: 0,
      players: [
        { name: 'a', kind: 'human' },
        { name: 'b', kind: 'human' },
      ],
    })
  );
  state = reducer(state, flip('p0'));
  // Decide phase has adjacent play to pile 0 (see reducer tests / winnableState pattern)
  const legalsExist = !!state.flippedCard;
  assert.ok(legalsExist);
  state = reducer(state, hold('p0'));
  assert.deepEqual(missedLegalOffenderIfLastHold(state), { offenderId: 'p0' });
});

test('missedLegalOffenderIfLastHold is null when last action is not HOLD', () => {
  let state = reducer(
    undefined,
    start({
      seed: 0,
      players: [
        { name: 'a', kind: 'human' },
        { name: 'b', kind: 'human' },
      ],
    })
  );
  state = reducer(state, flip('p0'));
  assert.equal(missedLegalOffenderIfLastHold(state), null);
});

// ---------- missedLegalOffenderIfLastFlip ----------

const startedState = (overrides = {}) => {
  // A state with a real START log entry plus hand-crafted hands/piles.
  // The flip detector reads from the post-flip state directly (no replay), so the
  // log only needs length ≥ 2 and the right tail action type.
  return {
    schemaVersion: 1,
    seed: 1,
    rngState: 0,
    players: [
      { id: 'p0', name: 'A', kind: 'human' },
      { id: 'p1', name: 'B', kind: 'human' },
    ],
    hands: [
      { playerId: 'p0', faceDown: [makeCard(9, 'C')], faceUp: [makeCard(5, 'H')] },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
    displayPiles: [
      [makeCard(4, 'C')],
      [makeCard(7, 'D')],
      [makeCard(11, 'H')],
      [makeCard(13, 'S')],
    ],
    turn: { playerId: 'p0', phase: 'decide' },
    flippedCard: makeCard(9, 'C'),
    log: [
      { type: 'START', payload: {}, by: 'system', at: 0 },
      { type: 'FLIP', payload: {}, by: 'p0', at: 1 },
    ],
    winner: null,
    ...overrides,
  };
};

test('missedLegalOffenderIfLastFlip flags FLIP when held-top had a legal play', () => {
  // p0 held top = 5H, pile 0 top = 4C → adjacent. Flipping was the missed play.
  assert.deepEqual(missedLegalOffenderIfLastFlip(startedState()), { offenderId: 'p0' });
});

test('missedLegalOffenderIfLastFlip is null when held-top had no legal play', () => {
  const s = startedState({
    hands: [
      { playerId: 'p0', faceDown: [makeCard(9, 'C')], faceUp: [makeCard(5, 'H')] },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
    displayPiles: [
      [makeCard(13, 'C')],
      [makeCard(13, 'D')],
      [makeCard(13, 'H')],
      [makeCard(13, 'S')],
    ],
  });
  assert.equal(missedLegalOffenderIfLastFlip(s), null);
});

test('missedLegalOffenderIfLastFlip is null when offender had no held card', () => {
  const s = startedState({
    hands: [
      { playerId: 'p0', faceDown: [makeCard(9, 'C')], faceUp: [] },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
  });
  assert.equal(missedLegalOffenderIfLastFlip(s), null);
});

test('missedLegalOffenderIfLastFlip flags FLIP_HELD when reversed-top had a legal play', () => {
  // After FLIP_HELD, faceDown = old-faceUp reversed; the previous held-top is faceDown[0].
  // We craft so faceDown[0] = 5H, adjacent to pile 0 top 4C.
  const s = startedState({
    hands: [
      {
        playerId: 'p0',
        faceDown: [makeCard(5, 'H'), makeCard(8, 'S')], // [0] is held-top before flip-held
        faceUp: [],
      },
      { playerId: 'p1', faceDown: [makeCard(2, 'C')], faceUp: [] },
    ],
    turn: { playerId: 'p0', phase: 'flip' },
    flippedCard: null,
    log: [
      { type: 'START', payload: {}, by: 'system', at: 0 },
      { type: 'FLIP_HELD', payload: {}, by: 'p0', at: 1 },
    ],
  });
  assert.deepEqual(missedLegalOffenderIfLastFlip(s), { offenderId: 'p0' });
});

test('missedLegalOffender returns offender from either source', () => {
  // HOLD-source still works
  let state = reducer(
    undefined,
    start({
      seed: 0,
      players: [
        { name: 'a', kind: 'human' },
        { name: 'b', kind: 'human' },
      ],
    })
  );
  state = reducer(state, flip('p0'));
  state = reducer(state, hold('p0'));
  assert.deepEqual(missedLegalOffender(state), { offenderId: 'p0' });

  // FLIP-source works
  assert.deepEqual(missedLegalOffender(startedState()), { offenderId: 'p0' });
});
