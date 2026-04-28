import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAYER_KIND_OPTIONS } from '../../src/views/setup.js';

test('PLAYER_KIND_OPTIONS covers human + three AI kinds', () => {
  const values = PLAYER_KIND_OPTIONS.map(o => o.value).sort();
  assert.deepEqual(values, ['ai-greedy', 'ai-random', 'ai-strategist', 'human']);
});
