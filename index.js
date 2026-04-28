import DataStore from '/src/DataStore.js';
import { start } from '/src/engine/actions.js';
import { getActiveGame } from '/src/game/persistence.js';
import {
  abandonGame,
  dispatch,
  getState,
  hydrateRuntime,
  resetRuntime,
} from '/src/game/runtime.js';
import { mountPendingGameView, mountSetupView } from '/src/views/setup.js';
import { serviceWorkerManager } from '/src/ServiceWorkerManager.js';
import '/components/UpdateNotification.js';

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
 * Decide between setup form and Phase 6 placeholder depending on reducer memory.
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
        refreshMain({ skipHydrateFromStorage: true });
      },
    });
    return;
  }

  const winnerName = state.winner
    ? (state.players.find(p => p.id === state.winner)?.name ?? state.winner)
    : null;
  const summaryLine = state.winner ? `Game over — winner: ${winnerName}` : 'Game in progress';
  const detailLine =
    state.winner == null ? `Turn: ${state.turn.playerId} · ${state.turn.phase}` : null;

  mountPendingGameView(main, {
    summaryLine,
    detailLine,
    onAbandon: () => {
      abandonGame();
      refreshMain({ skipHydrateFromStorage: true });
    },
    onChangeSetup: () => {
      resetRuntime();
      refreshMain({ skipHydrateFromStorage: true });
    },
  });
}

customElements.whenDefined('update-notification').then(async () => {
  const updateNotification = document.querySelector('update-notification');

  window.addEventListener('sw-update-available', event => {
    console.log('Service worker update available, showing notification');
    updateNotification.show(event.detail.pendingWorker);
  });

  await DataStore.init();
  refreshMain();

  await serviceWorkerManager.register();
});
