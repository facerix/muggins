// <game-over-modal>
//
// Modal shown when `state.winner` is set. Displays the winner's name and a
// short stats list, plus two actions: "Play again with same seats" and
// "Back to setup". Always dismissable; once dismissed the user sees the
// final board read-only and there is no affordance to reopen.
//
// `showModal({ winnerName, turnsPlayed, mugginsCalls })` opens the dialog.
// Buttons fire bare `play-again` or `back-to-setup` CustomEvents — the host
// owns the runtime calls (dispatch / abandonGame / randomSeed).
//
// Built to mirror the pattern in components/ConfirmationModal.js.

import { h } from '/src/domUtils.js';

const CSS = `
:host {
  dialog {
    padding: 0;
    border: none;
    border-radius: 0.5rem;
    min-width: min(360px, 92vw);
    max-width: min(520px, 92vw);
    background-color: #163d24;
    color: #f0f7f3;
    font-family: Futura, 'Trebuchet MS', Arial, sans-serif;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
    overscroll-behavior: contain;

    &[open] {
      display: flex;
      flex-direction: column;
    }
  }

  dialog::backdrop {
    overflow: hidden;
    overscroll-behavior: contain;
    background-color: rgba(0, 0, 0, 0.45);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.5rem 0.5rem 1rem;
    background-color: rgba(0, 0, 0, 0.25);

    h3 {
      margin: 0.5rem 0;
      font-family: 'Arial Black', 'Arial Bold', Gadget, sans-serif;
      font-variant: common-ligatures small-caps;
    }

    button.close {
      background: none;
      border: none;
      padding: 0.1rem 0.4rem;
      cursor: pointer;
      color: inherit;
      font-size: 1.5rem;
      line-height: 1;

      &:hover,
      &:focus-visible {
        outline: 1px solid currentColor;
      }
    }
  }

  .body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .winner {
    margin: 0;
    font-size: clamp(1.1rem, 3.2vw, 1.35rem);
    font-weight: 600;
  }

  dl.stats {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.35rem 1rem;
    margin: 0 auto;
    text-align: left;
    max-width: 16rem;
  }

  dl.stats dt {
    margin: 0;
    font-weight: 600;
  }

  dl.stats dd {
    margin: 0;
  }

  .note {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
    color: rgba(240, 247, 243, 0.72);
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  @media (min-width: 480px) {
    .actions {
      flex-direction: row;
      justify-content: center;
      flex-wrap: wrap;
    }
  }

  button.action {
    font: inherit;
    font-variant: common-ligatures small-caps;
    padding: 0.4em 1.25em;
    border-radius: 5px;
    border: 1px solid rgba(240, 247, 243, 0.6);
    background-color: rgba(240, 247, 243, 0.12);
    color: inherit;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      outline: #f0f7f3 auto 1px;
      background-color: rgba(240, 247, 243, 0.22);
    }
  }

  button.action.primary {
    font-weight: 600;
    background-color: rgba(240, 247, 243, 0.2);
  }
}
`;

class GameOverModal extends HTMLElement {
  #ready = false;
  #dialog = null;
  #winnerEl = null;
  #turnsEl = null;
  #mugginsEl = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.#ready) return;

    const styles = document.createElement('style');
    styles.textContent = CSS;
    this.shadowRoot.appendChild(styles);

    const title = h('h3', {}, []);
    title.textContent = 'Game over';
    const closeBtn = h('button', { type: 'button', className: 'close', title: 'Close' }, []);
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close');
    const header = h('header', {}, [title, closeBtn]);

    this.#winnerEl = h('p', { className: 'winner', role: 'status' }, []);

    const dtTurns = h('dt', {}, []);
    dtTurns.textContent = 'Turns played';
    this.#turnsEl = h('dd', {}, []);
    const dtMug = h('dt', {}, []);
    dtMug.textContent = 'Muggins calls';
    this.#mugginsEl = h('dd', {}, []);
    const stats = h('dl', { className: 'stats' }, [dtTurns, this.#turnsEl, dtMug, this.#mugginsEl]);

    const note = h('p', { className: 'note' }, []);
    note.textContent =
      'Finished games are not kept in history on this device (v1). Starting over replaces the saved slot.';

    const playAgainBtn = h('button', { type: 'button', className: 'action primary' }, []);
    playAgainBtn.textContent = 'Play again with same seats';
    const setupBtn = h('button', { type: 'button', className: 'action' }, []);
    setupBtn.textContent = 'Back to setup';
    const actions = h('div', { className: 'actions' }, [playAgainBtn, setupBtn]);

    const body = h('div', { className: 'body' }, [this.#winnerEl, stats, note, actions]);

    this.#dialog = h('dialog', { closedby: 'any' }, [header, body]);
    this.shadowRoot.appendChild(this.#dialog);

    closeBtn.addEventListener('click', () => this.#dialog.close());

    playAgainBtn.addEventListener('click', () => {
      this.#dialog.close();
      this.dispatchEvent(new CustomEvent('play-again'));
    });
    setupBtn.addEventListener('click', () => {
      this.#dialog.close();
      this.dispatchEvent(new CustomEvent('back-to-setup'));
    });

    this.#ready = true;
  }

  /**
   * Open the modal with the given match summary.
   * @param {{ winnerName: string, turnsPlayed: number, mugginsCalls: number }} opts
   */
  showModal({ winnerName, turnsPlayed, mugginsCalls }) {
    if (!this.#ready) this.connectedCallback();
    this.#winnerEl.textContent = `Winner: ${winnerName}`;
    this.#turnsEl.textContent = String(turnsPlayed);
    this.#mugginsEl.textContent = String(mugginsCalls);

    if (this.#dialog.open) this.#dialog.close();
    this.#dialog.showModal();
  }

  close() {
    this.#dialog?.close();
  }

  get isOpen() {
    return Boolean(this.#dialog?.open);
  }
}

customElements.define('game-over-modal', GameOverModal);
