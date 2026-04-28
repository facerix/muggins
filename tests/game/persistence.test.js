import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

const mem = new Map();

const ls = {
  getItem(k) {
    return mem.has(k) ? mem.get(k) : null;
  },
  setItem(k, v) {
    mem.set(k, String(v));
  },
};

beforeEach(() => {
  mem.clear();
  mem.set('items', '[]');
  globalThis.localStorage = ls;
  globalThis.window = globalThis;
});

test('persistence: active-game round-trip through DataStore', async () => {
  const { default: DataStore } = await import('../../src/DataStore.js');
  await DataStore.init();

  const { setActiveGame, getActiveGame, clearActiveGame } =
    await import('../../src/game/persistence.js');

  const snapshot = {
    schemaVersion: 1,
    seed: 99,
    rngState: 1,
    players: [{ id: 'p0', name: 'A', kind: 'human' }],
    hands: [{ playerId: 'p0', faceDown: [], faceUp: [] }],
    displayPiles: [[], [], [], []],
    turn: { playerId: 'p0', phase: 'flip' },
    flippedCard: null,
    log: [{ type: 'START', by: 'system', at: 0, payload: {} }],
    winner: null,
  };

  setActiveGame(snapshot);
  const back = getActiveGame();
  assert.deepEqual(back, snapshot);

  clearActiveGame();
  assert.equal(getActiveGame(), null);
});

test('runtime: dispatch persists; hydrateRuntime restores memory state', async () => {
  const { default: DataStore } = await import('../../src/DataStore.js');
  await DataStore.init();

  const { start } = await import('../../src/engine/actions.js');
  const runtime = await import('../../src/game/runtime.js');
  const { getActiveGame } = await import('../../src/game/persistence.js');

  runtime.configureAiDelay(0);
  runtime.resetRuntime();

  runtime.dispatch(
    start({
      seed: 42,
      players: [
        { name: 'A', kind: 'ai-greedy' },
        { name: 'B', kind: 'ai-greedy' },
      ],
    })
  );

  assert.equal(runtime.getState().seed, 42);
  assert.deepEqual(getActiveGame().players, runtime.getState().players);

  runtime.resetRuntime();
  assert.equal(runtime.getState(), null);

  runtime.hydrateRuntime(getActiveGame());
  assert.equal(runtime.getState().seed, 42);

  runtime.resetRuntime();
});
