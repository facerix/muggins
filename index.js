import DataStore from '/src/DataStore.js';
import { h } from '/src/domUtils.js';
import { getActiveGame } from '/src/game/persistence.js';
import { hydrateRuntime } from '/src/game/runtime.js';
import { serviceWorkerManager } from '/src/ServiceWorkerManager.js';
import '/components/UpdateNotification.js';

const renderBootMain = () => {
  const main = document.querySelector('main');
  main.replaceChildren();
  const saved = getActiveGame();
  if (saved) {
    hydrateRuntime(saved);
    const winnerName = saved.winner
      ? (saved.players.find(p => p.id === saved.winner)?.name ?? saved.winner)
      : null;
    const line = saved.winner
      ? `Active game loaded — winner: ${winnerName}`
      : `Active game loaded — turn ${saved.turn.playerId} (${saved.turn.phase})`;
    const p1 = h('p', null, []);
    p1.textContent = line;
    const p2 = h('p', { className: 'u-muted' }, []);
    p2.textContent =
      'Board and setup UI arrive in Phases 5–6. In the console: import `/src/game/runtime.js` and call `dispatch` with actions from `/src/engine/actions.js`.';
    main.appendChild(h('div', { className: 'boot-game-stub' }, [p1, p2]));
  } else {
    const p1 = h('p', null, []);
    p1.textContent = 'No active game saved.';
    const p2 = h('p', { className: 'u-muted' }, []);
    p2.textContent = 'Player setup lands in Phase 5.';
    main.appendChild(h('div', { className: 'boot-setup-stub' }, [p1, p2]));
  }
};

customElements.whenDefined('update-notification').then(async () => {
  const updateNotification = document.querySelector('update-notification');

  window.addEventListener('sw-update-available', event => {
    console.log('Service worker update available, showing notification');
    updateNotification.show(event.detail.pendingWorker);
  });

  await DataStore.init();
  renderBootMain();

  await serviceWorkerManager.register();
});
