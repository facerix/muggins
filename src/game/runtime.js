import { callMuggins } from '/src/engine/actions.js';
import { missedLegalOffender } from '/src/engine/mugginsOpportunity.js';
import { personaForKind } from '/src/engine/ai/persona.js';
import { reducer } from '/src/engine/reducer.js';
import { makeRng } from '/src/engine/rng.js';
import * as persistence from '/src/game/persistence.js';

let currentState = null;
let aiTimer = null;
/** Base AI think delay (ms). Override with {@link configureAiDelay}. */
let aiDelayMs = 1000;
/** When jitter is on and base delay is positive, delay adds uniform ±this around the base (production feel). */
let aiJitterHalfMs = 300;
/** Production: random delay in [base − half, base + half]; dev/tests: usually off for fixed control. */
let aiJitterEnabled = true;
/** While paused, AI timers are cleared and {@link scheduleAiIfNeeded} is a no-op. */
let isPaused = false;

const resolveStrategistMuggins = state => {
  for (const p of state.players) {
    const persona = personaForKind(p.kind);
    if (!persona?.shouldCallMuggins(state, p.id)) continue;
    if (!missedLegalOffender(state)) continue;
    return reducer(state, callMuggins(p.id));
  }
  return state;
};

/** Deterministic per snapshot; advances with `log.length` after each dispatch. */
const aiRngForState = state => makeRng((state.seed ^ (state.log.length * 0x9e3779b9)) >>> 0);

const clearAiTimer = () => {
  if (aiTimer != null) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
};

/** True while an AI move is scheduled after {@link configureAiDelay} (for UI: “thinking…” indicator). */
export const isAiScheduled = () => aiTimer != null;

const scheduleAiIfNeeded = () => {
  clearAiTimer();
  if (isPaused) return;
  const state = currentState;
  if (!state?.players || state.winner || state.turn.phase === 'done') return;

  const pid = state.turn.playerId;
  const row = state.players.find(p => p.id === pid);
  if (!row) return;
  const persona = personaForKind(row.kind);
  if (!persona) return;

  let delayMs = aiDelayMs;
  if (aiDelayMs > 0 && aiJitterEnabled && aiJitterHalfMs > 0) {
    const spread = aiRngForState(state).range(aiJitterHalfMs * 2 + 1);
    delayMs = aiDelayMs - aiJitterHalfMs + spread;
    delayMs = Math.max(0, delayMs);
  }

  aiTimer = setTimeout(() => {
    aiTimer = null;
    tickAI();
  }, delayMs);
};

export const getState = () => currentState;

/** @param {number} ms base think delay between AI actions (0 = immediate). */
export function configureAiDelay(ms) {
  aiDelayMs = ms;
}

/** @param {boolean} enabled when true (prod default), AI delay varies randomly ± {@link configureAiJitterHalfMs}. */
export function configureAiJitterEnabled(enabled) {
  aiJitterEnabled = Boolean(enabled);
}

/** @param {number} ms half-width of uniform jitter around base delay (default 300 → [base−300, base+300]). */
export function configureAiJitterHalfMs(ms) {
  aiJitterHalfMs = Math.max(0, Number(ms) || 0);
}

/**
 * Apply one action: reduce (plus strategist Muggins resolution) → persist → schedule AI.
 * @param {object} action
 */
export function dispatch(action) {
  let next = action.type === 'START' ? reducer(undefined, action) : reducer(currentState, action);
  next = resolveStrategistMuggins(next);
  currentState = next;
  persistence.setActiveGame(next);
  scheduleAiIfNeeded();
  return next;
}

/** Run one AI step (used by the timer; tests may call with `configureAiDelay(0)` + microtasks). */
export function tickAI() {
  const state = currentState;
  if (!state || state.winner || state.turn.phase === 'done') return;

  const pid = state.turn.playerId;
  const row = state.players.find(p => p.id === pid);
  const persona = personaForKind(row?.kind);
  if (!persona) return;

  const action = persona.chooseAction(state, pid, aiRngForState(state));
  dispatch(action);
}

/**
 * Restore in-memory state from persistence (e.g. on load). Does not write storage again.
 * @param {object} state
 */
export function hydrateRuntime(state) {
  clearAiTimer();
  currentState = state;
  scheduleAiIfNeeded();
}

export function resetRuntime() {
  clearAiTimer();
  currentState = null;
}

/**
 * Suspend AI scheduling (e.g. while a blocking modal is open). Cancels any
 * pending timer so the AI doesn't act behind the modal. Idempotent.
 */
export function pauseRuntime() {
  if (isPaused) return;
  isPaused = true;
  clearAiTimer();
}

/** Resume AI scheduling, immediately rescheduling if it's an AI's turn. Idempotent. */
export function resumeRuntime() {
  if (!isPaused) return;
  isPaused = false;
  scheduleAiIfNeeded();
}

/** True while {@link pauseRuntime} has suppressed AI scheduling. */
export const isRuntimePaused = () => isPaused;

/** Clear storage slot and in-memory runtime (abandon game). */
export function abandonGame() {
  resetRuntime();
  persistence.clearActiveGame();
}
