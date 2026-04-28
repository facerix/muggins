import { callMuggins } from '/src/engine/actions.js';
import { missedLegalOffenderIfLastHold } from '/src/engine/mugginsOpportunity.js';
import { personaForKind } from '/src/engine/ai/persona.js';
import { reducer } from '/src/engine/reducer.js';
import { makeRng } from '/src/engine/rng.js';
import * as persistence from '/src/game/persistence.js';

let currentState = null;
let aiTimer = null;
/** Default ~1s so humans can react (Muggins); override with {@link configureAiDelay}. */
let aiDelayMs = 1000;

const resolveStrategistMuggins = state => {
  for (const p of state.players) {
    const persona = personaForKind(p.kind);
    if (!persona?.shouldCallMuggins(state, p.id)) continue;
    const opp = missedLegalOffenderIfLastHold(state);
    if (!opp) continue;
    return reducer(state, callMuggins(p.id, { offenderId: opp.offenderId }));
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

const scheduleAiIfNeeded = () => {
  clearAiTimer();
  const state = currentState;
  if (!state?.players || state.winner || state.turn.phase === 'done') return;

  const pid = state.turn.playerId;
  const row = state.players.find(p => p.id === pid);
  if (!row) return;
  const persona = personaForKind(row.kind);
  if (!persona) return;

  aiTimer = setTimeout(() => {
    aiTimer = null;
    tickAI();
  }, aiDelayMs);
};

export const getState = () => currentState;

/** @param {number} ms think delay between AI actions (0 in dev by default). */
export function configureAiDelay(ms) {
  aiDelayMs = ms;
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

/** Clear storage slot and in-memory runtime (abandon game). */
export function abandonGame() {
  resetRuntime();
  persistence.clearActiveGame();
}
