import { callMuggins, start } from '../actions.js';
import { makeRng } from '../rng.js';
import { reducer } from '../reducer.js';
import { missedLegalOffender } from '../mugginsOpportunity.js';
import { personaForKind } from './persona.js';

const MAX_STEPS = 100_000;

/**
 * Drives a full match using {@link personaForKind}; humans are not supported.
 * Resolves strategist CALL_MUGGINS attempts after each HOLD before the next flip.
 *
 * @param {{ seed: number, players: Array<{ name: string, kind: string }>, rng?: ReturnType<typeof makeRng> }} opts
 */
export const runFullAutomatedGame = ({ seed, players, rng }) => {
  const aiRng = rng ?? makeRng(seed ^ 0xdeadbeef);
  let state = reducer(undefined, start({ seed, players }));
  let steps = 0;

  while (!state.winner && steps < MAX_STEPS) {
    steps += 1;
    state = resolveStrategistMuggins(state);
    if (state.winner) break;
    if (state.turn.phase === 'done') break;

    const pid = state.turn.playerId;
    const row = state.players.find(x => x.id === pid);
    const persona = personaForKind(row?.kind);
    if (!persona) {
      throw new Error(`runFullAutomatedGame: non-AI player at ${pid}`);
    }
    const action = persona.chooseAction(state, pid, aiRng);
    state = reducer(state, action);
  }

  if (steps >= MAX_STEPS) {
    throw new Error(`runFullAutomatedGame: exceeded ${MAX_STEPS} steps — possible loop`);
  }
  if (!state.winner) {
    throw new Error('runFullAutomatedGame: ended without a winner');
  }
  return state;
};

const resolveStrategistMuggins = state => {
  for (const p of state.players) {
    const persona = personaForKind(p.kind);
    if (!persona?.shouldCallMuggins(state, p.id)) continue;
    if (!missedLegalOffender(state)) continue;
    return reducer(state, callMuggins(p.id));
  }
  return state;
};
