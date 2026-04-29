// <new-game-modal>
//
// Modal form to start a new game (2-4 players, name + kind per row).
//
// `showModal({ initialPlayers?, dismissable })` opens the dialog. When
// `dismissable` is true (game in progress) the dialog can be closed via
// Esc / backdrop / close-X — equivalent to "back to current game" since the
// game board is rendered behind the modal. When `dismissable` is false (fresh
// boot, no game), Esc/backdrop dismissal is suppressed so the only way out is
// to submit. Submitting fires a `submit` CustomEvent with `{ seed, players }`.
//
// Built to mirror the pattern in components/ConfirmationModal.js.

import { h } from '/src/domUtils.js';
import { PLAYER_KIND_OPTIONS, randomSeed } from '/src/newGameSetup.js';

/** @typedef {{ name: string, kind: string }} PlayerDraft */

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

/**
 * @param {number} count
 * @returns {PlayerDraft[]}
 */
function defaultPlayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Player ${i + 1}`,
    kind: 'human',
  }));
}

const CSS = `
:host {
  dialog {
    padding: 0;
    border: none;
    border-radius: 0.5rem;
    min-width: min(420px, 92vw);
    max-width: min(560px, 92vw);
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

  form {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .warning {
    margin: 0;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(201, 162, 39, 0.7);
    background-color: rgba(201, 162, 39, 0.14);
    color: #f0f7f3;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .row-count {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem;
  }

  label.count-label {
    font-weight: bold;
  }

  .players {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .player-row {
    display: grid;
    grid-template-columns: minmax(4.25rem, auto) minmax(0, 1fr) minmax(0, 1.35fr);
    gap: 0.5rem;
    align-items: center;
  }

  .player-slot {
    font-size: 0.85rem;
    color: rgba(240, 247, 243, 0.88);
  }

  input[type="text"],
  select {
    font: inherit;
    color: inherit;
    padding: 0.35rem 0.5rem;
    border-radius: 5px;
    border: 1px solid rgba(240, 247, 243, 0.45);
    background-color: rgba(0, 0, 0, 0.15);
  }

  input[type="text"]:focus-visible,
  select:focus-visible {
    outline: #f0f7f3 auto 1px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }

  button[type="submit"] {
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

  @media (max-width: 575px) {
    .player-row {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
    .player-slot {
      grid-column: 1 / -1;
    }
  }
}
`;

class NewGameModal extends HTMLElement {
  #ready = false;
  #dialog = null;
  #form = null;
  #closeBtn = null;
  #warningBanner = null;
  #countSelect = null;
  #playersHost = null;
  /** @type {PlayerDraft[] | null} */
  #initialPlayers = null;
  #dismissable = false;
  /** @type {{ name: HTMLInputElement, kind: HTMLSelectElement }[]} */
  #rowBindings = [];

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
    title.textContent = 'New game';
    this.#closeBtn = h('button', { type: 'button', className: 'close', title: 'Close' }, []);
    this.#closeBtn.textContent = '×';
    this.#closeBtn.setAttribute('aria-label', 'Close');
    const header = h('header', {}, [title, this.#closeBtn]);

    this.#warningBanner = h('p', { className: 'warning' }, []);
    this.#warningBanner.textContent =
      'A game is in progress. Starting a new game will abandon it. Close this dialog to return to your current game.';

    const countLabel = h(
      'label',
      { className: 'count-label', htmlFor: 'new-game-player-count' },
      []
    );
    countLabel.textContent = 'Players';
    this.#countSelect = h('select', { id: 'new-game-player-count' }, []);
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const opt = h('option', { value: String(n) }, []);
      opt.textContent = String(n);
      this.#countSelect.appendChild(opt);
    }
    const countRow = h('div', { className: 'row-count' }, [countLabel, this.#countSelect]);

    this.#playersHost = h('div', { className: 'players' }, []);

    const startBtn = h('button', { type: 'submit' }, []);
    startBtn.textContent = 'Start game';
    const actions = h('div', { className: 'actions' }, [startBtn]);

    this.#form = h('form', { method: 'dialog', autocomplete: 'off' }, [
      this.#warningBanner,
      countRow,
      this.#playersHost,
      actions,
    ]);

    this.#dialog = h('dialog', {}, [header, this.#form]);
    this.shadowRoot.appendChild(this.#dialog);

    this.#countSelect.addEventListener('change', () => {
      const n = Number.parseInt(this.#countSelect.value, 10);
      if (!Number.isFinite(n)) return;
      this.#buildRows(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, n)));
    });

    this.#closeBtn.addEventListener('click', () => {
      if (this.#dismissable) this.#dialog.close();
    });

    // Esc fires `cancel`. Suppress it when the dialog is required (no game running).
    this.#dialog.addEventListener('cancel', evt => {
      if (!this.#dismissable) evt.preventDefault();
    });

    // Forward dialog close to the host so callers can resume runtime work
    // (e.g. unpausing the AI scheduler) regardless of how the dialog closed.
    this.#dialog.addEventListener('close', () => {
      this.dispatchEvent(new CustomEvent('close'));
    });

    // method="dialog" closes the dialog after submit; we just collect inputs and emit.
    this.#form.addEventListener('submit', () => {
      const players = this.#rowBindings.map(b => ({
        name: b.name.value.trim() || 'Player',
        kind: b.kind.value,
      }));
      this.dispatchEvent(new CustomEvent('submit', { detail: { seed: randomSeed(), players } }));
    });

    this.#ready = true;
  }

  #buildRows(count) {
    this.#playersHost.replaceChildren();
    this.#rowBindings = [];
    const drafts = this.#initialPlayers
      ? Array.from({ length: count }, (_, i) => {
          const nm = this.#initialPlayers[i]?.name;
          const trimmed = typeof nm === 'string' ? nm.trim() : '';
          const name = trimmed || `Player ${i + 1}`;
          const k = this.#initialPlayers[i]?.kind;
          const kind =
            typeof k === 'string' && PLAYER_KIND_OPTIONS.some(o => o.value === k) ? k : 'human';
          return { name, kind };
        })
      : defaultPlayers(count);

    drafts.forEach((draft, idx) => {
      const legend = h('span', { className: 'player-slot' }, []);
      legend.textContent = `Seat ${idx + 1}`;

      const nameInput = h('input', {
        type: 'text',
        autocomplete: 'nickname',
        maxLength: 48,
      });
      nameInput.value = draft.name;
      nameInput.id = `new-game-name-${idx}`;
      nameInput.setAttribute('aria-label', `Name for seat ${idx + 1}`);

      const kindSelect = h('select', { id: `new-game-kind-${idx}` }, []);
      kindSelect.setAttribute('aria-label', `Kind for seat ${idx + 1}`);
      PLAYER_KIND_OPTIONS.forEach(opt => {
        const o = h('option', { value: opt.value }, []);
        o.textContent = opt.label;
        if (opt.value === draft.kind) o.selected = true;
        kindSelect.appendChild(o);
      });

      this.#rowBindings.push({ name: nameInput, kind: kindSelect });
      this.#playersHost.appendChild(
        h('div', { className: 'player-row' }, [legend, nameInput, kindSelect])
      );
    });
  }

  /**
   * Open the modal. Caller controls dismissability based on game state.
   * @param {{ initialPlayers?: PlayerDraft[], dismissable: boolean }} opts
   */
  showModal({ initialPlayers, dismissable }) {
    if (!this.#ready) this.connectedCallback();
    this.#initialPlayers = initialPlayers ?? null;
    this.#dismissable = Boolean(dismissable);

    this.#closeBtn.style.display = this.#dismissable ? '' : 'none';
    this.#warningBanner.style.display = this.#dismissable ? '' : 'none';
    if (this.#dismissable) {
      this.#dialog.setAttribute('closedby', 'any');
    } else {
      this.#dialog.removeAttribute('closedby');
    }

    const initialCount = initialPlayers?.length
      ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, initialPlayers.length))
      : MIN_PLAYERS;
    Array.from(this.#countSelect.options).forEach(o => {
      o.selected = Number(o.value) === initialCount;
    });
    this.#buildRows(initialCount);

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

customElements.define('new-game-modal', NewGameModal);
