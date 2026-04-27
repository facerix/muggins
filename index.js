import { serviceWorkerManager } from '/src/ServiceWorkerManager.js';
import '/components/UpdateNotification.js';

customElements.whenDefined('update-notification').then(async () => {
  const updateNotification = document.querySelector('update-notification');

  window.addEventListener('sw-update-available', event => {
    console.log('Service worker update available, showing notification');
    updateNotification.show(event.detail.pendingWorker);
  });

  await serviceWorkerManager.register();
});
