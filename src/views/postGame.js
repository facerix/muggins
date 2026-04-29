import { h } from '/src/domUtils.js';
import { start } from '/src/engine/actions.js';

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

/**
 * @param {HTMLElement} main
 * @param {{
 *   getState: () => object | null,
 *   dispatch: (a: object) => object,
 *   randomSeed: () => number,
 *   onBackToSetup: () => void,
 * }} opts
 */
export function mountPostGameView(main, { getState, dispatch, randomSeed, onBackToSetup }) {
  main.replaceChildren();

  const state = getState();
  if (!state?.winner) return;

  const winnerId = state.winner;
  const winnerName = state.players.find(p => p.id === winnerId)?.name ?? winnerId;
  const { turnsPlayed, mugginsCalls } = postGameStats(state);

  const section = h('section', { className: 'post-game' }, []);

  const title = h('h2', { className: 'post-game__title' }, []);
  title.textContent = 'Game over';
  section.appendChild(title);

  const winnerEl = h('p', { className: 'post-game__winner', role: 'status' }, []);
  winnerEl.textContent = `Winner: ${winnerName}`;
  section.appendChild(winnerEl);

  const stats = h('dl', { className: 'post-game__stats' }, []);
  const dtTurns = h('dt', {}, []);
  dtTurns.textContent = 'Turns played';
  const ddTurns = h('dd', {}, []);
  ddTurns.textContent = String(turnsPlayed);
  const dtMug = h('dt', {}, []);
  dtMug.textContent = 'Muggins calls';
  const ddMug = h('dd', {}, []);
  ddMug.textContent = String(mugginsCalls);
  stats.appendChild(dtTurns);
  stats.appendChild(ddTurns);
  stats.appendChild(dtMug);
  stats.appendChild(ddMug);
  section.appendChild(stats);

  const note = h('p', { className: 'post-game__note u-muted' }, []);
  note.textContent =
    'Finished games are not kept in history on this device (v1). Starting over replaces the saved slot.';
  section.appendChild(note);

  const actions = h('div', { className: 'post-game__actions' }, []);

  const againBtn = h('button', { type: 'button', className: 'btn post-game__btn-primary' }, []);
  againBtn.textContent = 'Play again with same seats';
  againBtn.addEventListener('click', () => {
    const cur = getState();
    if (!cur?.winner) return;
    dispatch(start({ seed: randomSeed(), players: rosterFromState(cur) }));
  });
  actions.appendChild(againBtn);

  const setupBtn = h('button', { type: 'button', className: 'btn' }, []);
  setupBtn.textContent = 'Back to setup';
  setupBtn.addEventListener('click', () => onBackToSetup());
  actions.appendChild(setupBtn);

  section.appendChild(actions);
  main.appendChild(section);
}
