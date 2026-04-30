import DataStore from '/src/DataStore.js';
import { start } from '/src/engine/actions.js';
import { getActiveGame, ACTIVE_GAME_ID } from '/src/game/persistence.js';
import {
  abandonGame,
  configureAiDelay,
  configureAiJitterEnabled,
  configureAiJitterHalfMs,
  DEV_AI_DELAY_MS_STORAGE_KEY,
  dispatch,
  getState,
  hydrateRuntime,
  pauseRuntime,
  resumeRuntime,
} from '/src/game/runtime.js';
import { isDevelopmentMode } from '/src/domUtils.js';
import { mountGameView } from '/src/views/game.js';
import { randomSeed } from '/src/newGameSetup.js';
import { postGameStats, rosterFromState } from '/src/game/postGameStats.js';
import { serviceWorkerManager } from '/src/ServiceWorkerManager.js';
import '/components/ConfirmationModal.js';
import '/components/GameOverModal.js';
import '/components/NewGameModal.js';
import '/components/UpdateNotification.js';
import '/components/NewGameModal.js';
import '/components/GameOverModal.js';

function bootAiTiming() {
  if (isDevelopmentMode()) {
    const raw = globalThis.localStorage?.getItem(DEV_AI_DELAY_MS_STORAGE_KEY);
    const parsed = raw != null ? Number.parseInt(raw, 10) : 0;
    const ms = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    configureAiDelay(ms);
    configureAiJitterEnabled(false);
  } else {
    configureAiDelay(1000);
    configureAiJitterHalfMs(300);
    configureAiJitterEnabled(true);
  }
}

bootAiTiming();

/**
 * Hydrate reducer runtime from persisted slot when Storage has a snapshot but RAM does not (reload).
 */
function syncHydrateFromStorage() {
  const saved = getActiveGame();
  if (saved && getState() == null) {
    hydrateRuntime(saved);
  }
}

/**
 * Tracks the most recent winner+log key we've already opened the game-over modal for,
 * so subsequent refresh ticks (e.g. from unrelated DataStore writes) don't reopen it
 * after the user dismissed.
 */
let lastWinnerShownFor = null;

/**
 * Render the board (if a game exists) and open whichever modal applies.
 * - No state → empty <main> (green background) + non-dismissable new-game-modal.
 * - State without winner → game board, no modal.
 * - State with winner → final game board behind a dismissable game-over-modal.
 */
function refreshMain() {
  syncHydrateFromStorage();

  const main = document.querySelector('main');
  const newGameModal = document.querySelector('new-game-modal');
  const gameOverModal = document.querySelector('game-over-modal');
  const state = getState();

  if (!state) {
    main.replaceChildren();
    if (typeof main.__cleanupGame === 'function') {
      main.__cleanupGame();
      main.__cleanupGame = undefined;
    }
    gameOverModal.close();
    lastWinnerShownFor = null;

    const persisted = getActiveGame();
    const initialPlayers =
      persisted?.players?.map(p => ({ name: p.name, kind: p.kind })) ?? undefined;
    pauseRuntime();
    newGameModal.showModal({ initialPlayers, dismissable: false });
    return;
  }

  mountGameView(main, { getState, dispatch });

  if (state.winner) {
    const key = `${state.winner}:${state.log.length}`;
    if (lastWinnerShownFor !== key) {
      const winnerName = state.players.find(p => p.id === state.winner)?.name ?? state.winner;
      const { turnsPlayed, mugginsCalls } = postGameStats(state);
      gameOverModal.showModal({ winnerName, turnsPlayed, mugginsCalls });
      lastWinnerShownFor = key;
    }
  } else {
    gameOverModal.close();
    lastWinnerShownFor = null;
  }
}

/** @param {CustomEvent} evt */
function activeGameStorageChanged(evt) {
  const { changeType, affectedRecords } = evt.detail;
  if (changeType === 'init') return false;
  if (changeType === 'delete') {
    const ids = Array.isArray(affectedRecords) ? affectedRecords : [];
    return ids.includes(ACTIVE_GAME_ID);
  }
  if (changeType === 'add' || changeType === 'update') {
    const rec = affectedRecords;
    return Boolean(rec && typeof rec === 'object' && rec.id === ACTIVE_GAME_ID);
  }
  return false;
}

Promise.all([
  customElements.whenDefined('update-notification'),
  customElements.whenDefined('confirmation-modal'),
  customElements.whenDefined('new-game-modal'),
  customElements.whenDefined('game-over-modal'),
]).then(async () => {
  const updateNotification = document.querySelector('update-notification');
  const confirmationModal = document.querySelector('confirmation-modal');
  const newGameModal = document.querySelector('new-game-modal');
  const gameOverModal = document.querySelector('game-over-modal');
  const gameSetupBtn = document.querySelector('#game-setup-btn');
  const abandonBtn = document.querySelector('#game-abandon-btn');

  window.addEventListener('sw-update-available', event => {
    console.log('Service worker update available, showing notification');
    updateNotification.show(event.detail.pendingWorker);
  });

  gameSetupBtn.addEventListener('click', () => {
    confirmationModal.showModal('Are you sure you want to change the game setup?', 'change-setup');
  });

  abandonBtn.addEventListener('click', () => {
    confirmationModal.showModal('Quit this game: are you sure?', 'abandon-game');
  });

  confirmationModal.addEventListener('confirm', event => {
    switch (event.detail.context) {
      case 'change-setup':
        // Don't reset runtime — pause AI scheduling and open the new-game modal
        // dismissable. The board stays mounted underneath; dismissing resumes
        // play, submitting starts a new game (replaces the active slot).
        pauseRuntime();
        newGameModal.showModal({
          initialPlayers: rosterFromState(getState()),
          dismissable: true,
        });
        break;
      case 'abandon-game':
        abandonGame();
        break;
      default:
        break;
    }
  });

  newGameModal.addEventListener('submit', evt => {
    const { seed, players } = evt.detail;
    dispatch(start({ seed, players }));
  });

  // Fires for any close path (Esc, backdrop, ×, submit) — resume after the
  // submit handler has already dispatched, so the new game's AI can schedule.
  newGameModal.addEventListener('close', () => {
    resumeRuntime();
  });

  gameOverModal.addEventListener('play-again', () => {
    const cur = getState();
    if (!cur?.winner) return;
    dispatch(start({ seed: randomSeed(), players: rosterFromState(cur) }));
  });

  gameOverModal.addEventListener('back-to-setup', () => {
    abandonGame();
  });

  await DataStore.init();

  DataStore.addEventListener('change', evt => {
    if (!activeGameStorageChanged(evt)) return;
    refreshMain();
  });

  refreshMain();

  await serviceWorkerManager.register();
});
