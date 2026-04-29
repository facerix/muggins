import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const mem = new Map();
const ls = {
  getItem(k) {
    return mem.has(k) ? mem.get(k) : null;
  },
  setItem(k, v) {
    mem.set(k, String(v));
  },
};

beforeEach(async () => {
  mem.clear();
  mem.set('items', '[]');
  globalThis.localStorage = ls;
  globalThis.window = globalThis;
  const { default: DataStore } = await import('/src/DataStore.js');
  await DataStore.init();
});

const importRuntime = () => import('/src/game/runtime.js');
const importStart = () => import('/src/engine/actions.js').then(m => m.start);

/**
 * Stand up a fresh game with a non-zero AI delay so the first AI tick is
 * still pending after dispatch — that lets us observe scheduling state without
 * racing the timer.
 */
const startGameWithAiTurn = async () => {
  const runtime = await importRuntime();
  const start = await importStart();
  runtime.resetRuntime();
  runtime.resumeRuntime();
  runtime.configureAiJitterEnabled(false);
  runtime.configureAiDelay(10_000);
  // Seat 0 plays first per START, so put the AI in seat 0.
  runtime.dispatch(
    start({
      seed: 1,
      players: [
        { name: 'Bot', kind: 'ai-random' },
        { name: 'Human', kind: 'human' },
      ],
    })
  );
  return runtime;
};

test('pauseRuntime cancels the pending AI timer and resumeRuntime reschedules it', async () => {
  const runtime = await startGameWithAiTurn();
  assert.equal(runtime.isAiScheduled(), true, 'AI timer should be armed after START');
  assert.equal(runtime.isRuntimePaused(), false);

  runtime.pauseRuntime();
  assert.equal(runtime.isRuntimePaused(), true);
  assert.equal(runtime.isAiScheduled(), false, 'pauseRuntime must clear the pending timer');

  runtime.resumeRuntime();
  assert.equal(runtime.isRuntimePaused(), false);
  assert.equal(runtime.isAiScheduled(), true, 'resumeRuntime must rearm the AI timer');

  runtime.resetRuntime();
});

test('dispatch while paused does not arm the AI timer', async () => {
  const runtime = await importRuntime();
  const start = await importStart();
  runtime.resetRuntime();
  runtime.configureAiJitterEnabled(false);
  runtime.configureAiDelay(10_000);
  runtime.pauseRuntime();

  runtime.dispatch(
    start({
      seed: 1,
      players: [
        { name: 'Bot', kind: 'ai-random' },
        { name: 'Human', kind: 'human' },
      ],
    })
  );
  assert.equal(runtime.isAiScheduled(), false, 'paused dispatch must not schedule AI');

  runtime.resumeRuntime();
  assert.equal(runtime.isAiScheduled(), true, 'resume after a paused dispatch arms the timer');

  runtime.resetRuntime();
});

test('pauseRuntime / resumeRuntime are idempotent', async () => {
  const runtime = await importRuntime();
  runtime.resetRuntime();
  runtime.resumeRuntime();
  runtime.configureAiJitterEnabled(false);
  runtime.configureAiDelay(10_000);

  runtime.pauseRuntime();
  runtime.pauseRuntime();
  assert.equal(runtime.isRuntimePaused(), true);

  runtime.resumeRuntime();
  runtime.resumeRuntime();
  assert.equal(runtime.isRuntimePaused(), false);
});
