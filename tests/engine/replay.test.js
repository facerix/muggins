import { test } from 'node:test';
import assert from 'node:assert/strict';

import { replayFromLog } from '../../src/engine/replay.js';
import { reducer } from '../../src/engine/reducer.js';
import { start, flip, hold } from '../../src/engine/actions.js';

test('replayFromLog reproduces reducer fold', () => {
  let state = reducer(
    undefined,
    start({
      seed: 2,
      players: [
        { name: 'a', kind: 'human' },
        { name: 'b', kind: 'human' },
      ],
    })
  );
  state = reducer(state, flip('p0'));
  state = reducer(state, hold('p0'));
  assert.deepEqual(replayFromLog(state.log), state);
});
