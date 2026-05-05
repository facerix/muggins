import DataStore from '/src/DataStore.js';
import { start } from '/src/engine/actions.js';
import { getActiveGame, ACTIVE_GAME_ID } from '/src/game/persistence.js';
import {
  abandonGame,
  configureAiDelay,
  configureAiJitterEnabled,
  dispatch,
  getState,
  hydrateRuntime,
  pauseRuntime,
  resumeRuntime,
} from '/src/game/runtime.js';
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
import '/components/SettingsModal.js';

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
      tiks.success();
      gameOverModal.showModal({ winnerName, turnsPlayed, mugginsCalls });
      lastWinnerShownFor = key;
    }
  } else {
    gameOverModal.close();
    lastWinnerShownFor = null;
  }
}

let tiks = null;
const whenLoaded = Promise.all([
  customElements.whenDefined('update-notification'),
  customElements.whenDefined('confirmation-modal'),
  customElements.whenDefined('new-game-modal'),
  customElements.whenDefined('game-over-modal'),
  customElements.whenDefined('settings-modal'),
  (async () => {
    tiks = await import('./vendor/tiks/tiks.bundle.mjs');
    tiks.init();
  })(),
]);

whenLoaded.then(async () => {
  const updateNotification = document.querySelector('update-notification');
  const confirmationModal = document.querySelector('confirmation-modal');
  const newGameModal = document.querySelector('new-game-modal');
  const gameOverModal = document.querySelector('game-over-modal');
  const settingsModal = document.querySelector('settings-modal');
  const gameSetupBtn = document.querySelector('#game-setup-btn');
  const abandonBtn = document.querySelector('#game-abandon-btn');

  window.addEventListener('sw-update-available', event => {
    tiks.notify();
    console.log('Service worker update available, showing notification');
    updateNotification.show(event.detail.pendingWorker);
  });

  gameSetupBtn.addEventListener('click', () => {
    tiks.pop();
    settingsModal.showModal(DataStore.settings);
  });

  abandonBtn.addEventListener('click', () => {
    tiks.warning();
    confirmationModal.showModal('Quit this game: are you sure?', 'abandon-game');
  });

  confirmationModal.addEventListener('confirm', event => {
    switch (event.detail.context) {
      case 'abandon-game':
        tiks.click();
        abandonGame();
        break;
      default:
        break;
    }
  });

  newGameModal.addEventListener('submit', evt => {
    tiks.pop();
    const { seed, players } = evt.detail;
    dispatch(start({ seed, players }));
  });

  settingsModal.addEventListener('save', evt => {
    tiks.success();
    const { settings } = evt.detail;
    DataStore.updateSettings(settings);

    configureAiDelay(settings.aiDelay);
    configureAiJitterEnabled(settings.aiJitter);
  });

  settingsModal.addEventListener('cancel', () => {
    tiks.click();
  });
  confirmationModal.addEventListener('cancel', () => {
    tiks.click();
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
    const { changeType, affectedRecords } = evt.detail;
    let refresh = false;
    switch (changeType) {
      case 'init':
        refresh = false;
        break;
      case 'delete':
        const ids = Array.isArray(affectedRecords) ? affectedRecords : [];
        refresh = ids.includes(ACTIVE_GAME_ID);
        break;
      case 'add':
      case 'update':
        const rec = affectedRecords;
        refresh = Boolean(rec && typeof rec === 'object' && rec.id === ACTIVE_GAME_ID);
        break;
      default:
        break;
    }

    if (refresh) {
      refreshMain();
    }
  });

  refreshMain();

  await serviceWorkerManager.register();
});
