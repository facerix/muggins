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
  resetRuntime,
} from '/src/game/runtime.js';
import { isDevelopmentMode } from '/src/domUtils.js';
import { mountGameView } from '/src/views/game.js';
import { mountSetupView } from '/src/views/setup.js';
import { serviceWorkerManager } from '/src/ServiceWorkerManager.js';
import '/components/UpdateNotification.js';

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
 * Skip when transitioning to setup while a snapshot still exists (Change setup → Resume UX).
 */
function syncHydrateFromStorage(skip) {
  if (skip) return;
  const saved = getActiveGame();
  if (saved && getState() == null) {
    hydrateRuntime(saved);
  }
}

/**
 * Setup vs game board depending on in-memory runtime (`getState()`).
 */
function refreshMain(options = {}) {
  const skipHydrate = Boolean(options.skipHydrateFromStorage);
  syncHydrateFromStorage(skipHydrate);

  const main = document.querySelector('main');
  const state = getState();

  if (!state) {
    const persisted = getActiveGame();
    const initialPlayers =
      persisted?.players?.map(p => ({
        name: p.name,
        kind: p.kind,
      })) ?? undefined;

    mountSetupView(main, {
      initialPlayers,
      hasSavedGame: Boolean(persisted),
      onResume: persisted
        ? () => {
            hydrateRuntime(getActiveGame());
            refreshMain({ skipHydrateFromStorage: true });
          }
        : undefined,
      onSubmit: ({ seed, players }) => {
        dispatch(start({ seed, players }));
      },
    });
    return;
  }

  mountGameView(main, {
    getState,
    dispatch,
    onAbandon: () => {
      abandonGame();
    },
    onChangeSetup: () => {
      resetRuntime();
      refreshMain({ skipHydrateFromStorage: true });
    },
  });
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

customElements.whenDefined('update-notification').then(async () => {
  const updateNotification = document.querySelector('update-notification');

  window.addEventListener('sw-update-available', event => {
    console.log('Service worker update available, showing notification');
    updateNotification.show(event.detail.pendingWorker);
  });

  await DataStore.init();

  DataStore.addEventListener('change', evt => {
    if (!activeGameStorageChanged(evt)) return;
    refreshMain({ skipHydrateFromStorage: true });
  });

  refreshMain();

  await serviceWorkerManager.register();
});
