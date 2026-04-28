import DataStore from '/src/DataStore.js';

export const ACTIVE_GAME_ID = 'active-game';

/**
 * Persist full engine state (including `log`) under the reserved DataStore id.
 * @param {object} state
 */
export function setActiveGame(state) {
  DataStore.upsertItemById(ACTIVE_GAME_ID, state);
}

/**
 * @returns {object | null} engine state, or null if none
 */
export function getActiveGame() {
  const row = DataStore.getItemById(ACTIVE_GAME_ID);
  if (!row) return null;
  const copy = { ...row };
  delete copy.id;
  return copy;
}

export function clearActiveGame() {
  DataStore.deleteItem(ACTIVE_GAME_ID);
}
