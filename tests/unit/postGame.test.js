import assert from 'node:assert/strict';
import test from 'node:test';

import { postGameStats, rosterFromState } from '/src/game/postGameStats.js';

test('postGameStats counts turn-advancing actions and Muggins', () => {
  const state = {
    log: [
      { type: 'START', by: 'system' },
      { type: 'FLIP', by: 'p0' },
      { type: 'HOLD', by: 'p0' },
      { type: 'CALL_MUGGINS', by: 'p1' },
      { type: 'PLAY', by: 'p1' },
      { type: 'PLAY_HELD', by: 'p2' },
    ],
  };
  assert.deepEqual(postGameStats(state), { turnsPlayed: 3, mugginsCalls: 1 });
});

test('postGameStats handles empty log', () => {
  assert.deepEqual(postGameStats({ log: [] }), { turnsPlayed: 0, mugginsCalls: 0 });
});

test('rosterFromState maps to start() player drafts', () => {
  const state = {
    players: [
      { id: 'p0', name: 'A', kind: 'human' },
      { id: 'p1', name: 'B', kind: 'ai-greedy' },
    ],
  };
  assert.deepEqual(rosterFromState(state), [
    { name: 'A', kind: 'human' },
    { name: 'B', kind: 'ai-greedy' },
  ]);
});
