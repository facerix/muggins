import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAYER_KIND_OPTIONS } from '/src/newGameSetup.js';

test('PLAYER_KIND_OPTIONS covers human + three AI kinds', () => {
  const values = PLAYER_KIND_OPTIONS.map(o => o.value).sort();
  assert.deepEqual(values, ['ai-greedy', 'ai-random', 'ai-strategist', 'human']);
});

test('initialSeatCount defaults to 2 and clamps roster length', () => {
  assert.equal(initialSeatCount(undefined), 2);
  assert.equal(initialSeatCount([]), 2);
  assert.equal(
    initialSeatCount([
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
      { name: 'C', kind: 'human' },
    ]),
    3
  );
  assert.equal(
    initialSeatCount([
      { name: 'A', kind: 'human' },
      { name: 'B', kind: 'human' },
      { name: 'C', kind: 'human' },
      { name: 'D', kind: 'human' },
      { name: 'E', kind: 'human' },
    ]),
    4
  );
});

test('seatDraftsForCount fills defaults or maps initial roster', () => {
  assert.deepEqual(seatDraftsForCount(2, undefined), [
    { name: 'Player 1', kind: 'human' },
    { name: 'Player 2', kind: 'human' },
  ]);
  assert.deepEqual(
    seatDraftsForCount(2, [
      { name: '  x  ', kind: 'ai-greedy' },
      { name: '', kind: 'bogus' },
    ]),
    [
      { name: 'x', kind: 'ai-greedy' },
      { name: 'Player 2', kind: 'human' },
    ]
  );
});
