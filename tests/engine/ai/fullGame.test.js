import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeRng } from '../../../src/engine/rng.js';
import { replayFromLog } from '../../../src/engine/replay.js';
import { runFullAutomatedGame } from '../../../src/engine/ai/runFullGame.js';

const PLAYERS_SEED_4242 = [
  { name: 'Ada', kind: 'ai-random' },
  { name: 'Bea', kind: 'ai-greedy' },
  { name: 'Coe', kind: 'ai-strategist' },
  { name: 'Deb', kind: 'ai-strategist' },
];

test('4 AI personas: full game terminates with exactly one winner and stable log', () => {
  const seed = 4242;
  const rng = makeRng(seed ^ 0xdeadbeef);
  const finished = runFullAutomatedGame({ seed, rng, players: PLAYERS_SEED_4242 });

  assert.ok(finished.players.some(p => p.id === finished.winner));
  assert.equal(typeof finished.turn.playerId, 'string');
  assert.equal(finished.turn.phase, 'done');

  const replayed = replayFromLog(finished.log);
  assert.deepEqual(replayed, finished);
});

test('full game replay is deterministic for identical seed', () => {
  const players = [
    { name: 'Ada', kind: 'ai-greedy' },
    { name: 'Bea', kind: 'ai-greedy' },
    { name: 'Coe', kind: 'ai-random' },
    { name: 'Deb', kind: 'ai-strategist' },
  ];
  const seed = 4243;
  const rngMix = seed ^ 0xdeadbeef;
  const a = runFullAutomatedGame({ seed, rng: makeRng(rngMix), players });
  const b = runFullAutomatedGame({ seed, rng: makeRng(rngMix), players });
  assert.deepEqual(a.log, b.log);
  assert.equal(a.winner, b.winner);
});
