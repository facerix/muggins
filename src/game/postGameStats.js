/**
 * Read-only adapters over a finished game snapshot, used by the game-over
 * modal: a turn/Muggins counter and a "same seats" roster builder.
 *
 * Pure (no DOM) so callers, components, and Node tests can share them.
 */

const TURN_ADVANCING_TYPES = new Set(['PLAY', 'PLAY_HELD', 'HOLD']);

/**
 * @param {object} state finished game snapshot
 * @returns {{ turnsPlayed: number, mugginsCalls: number }}
 */
export function postGameStats(state) {
  const log = state?.log ?? [];
  return {
    turnsPlayed: log.filter(e => TURN_ADVANCING_TYPES.has(e.type)).length,
    mugginsCalls: log.filter(e => e.type === 'CALL_MUGGINS').length,
  };
}

/**
 * @param {object} state
 * @returns {{ name: string, kind: string }[]}
 */
export function rosterFromState(state) {
  return state.players.map(p => ({ name: p.name, kind: p.kind }));
}
