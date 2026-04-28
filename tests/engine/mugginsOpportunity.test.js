import { test } from 'node:test';
import assert from 'node:assert/strict';

import { missedLegalOffenderIfLastHold } from '../../src/engine/mugginsOpportunity.js';
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
