// <confirmation-modal>
//
// Generic "are you sure?" dialog. Caller invokes `showModal(message, context)`
// where `context` is a caller-chosen string that comes back unchanged in the
// `confirm` event. That indirection lets one modal serve multiple destructive
// actions on a page (e.g. delete-force vs. delete-battle) without the modal
// knowing anything about what it's confirming.
//
// Ported from crusader/components/ConfirmationModal.js, restyled to the
// personnel palette.

import { h } from '/src/domUtils.js';

const CSS = `
:host {
  --modal-header-bg-color: #0b1e12;
  --modal-header-text-color: #f0f7f3;
  --modal-bg-color: white;
  --modal-text-color: black;
  --modal-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  --modal-primary-button-bg-color: #1a6b3c;
  --modal-primary-button-text-color: white;
  --modal-backdrop-color: rgba(0, 0, 0, 0.45);

  dialog {
    padding: 0;
    border: none;
    border-radius: 0.5rem;
    min-width: min(360px, 90vw);
    max-width: min(560px, 90vw);
    background-color: var(--modal-bg-color);
    color: var(--modal-text-color);
    box-shadow: var(--modal-box-shadow);

    &[open] {
      display: flex;
      flex-direction: column;
    }
  }

  dialog::backdrop {
    overflow: hidden;
    overscroll-behavior: contain;
    background-color: var(--modal-backdrop-color);
  }

  header {
    background-color: var(--modal-header-bg-color);
    color: var(--modal-header-text-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem 0 1rem;

    h3 {
      margin: 0.75rem 0;
    }

    button {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;

      img {
        height: 1.5em;
        width: 1.5em;
        filter: invert(1);
      }

      &:hover,
      &:focus-visible {
        outline: 1px solid white;
      }
    }
  }

  form {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    p {
      margin: 0;
      line-height: 1.4;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;

      input[type="button"],
      input[type="submit"] {
        font-size: 1rem;
        font-family: inherit;
        padding: 0.5em 1em;
        border-radius: 0.35rem;
        border: 1px solid #c0c0c0;
        background-color: #f0f0f0;
        color: black;
        cursor: pointer;
      }

      input[type="submit"] {
        background-color: var(--modal-primary-button-bg-color);
        border-color: var(--modal-primary-button-bg-color);
        color: var(--modal-primary-button-text-color);
      }

      input[type="button"]:hover,
      input[type="submit"]:hover {
        filter: brightness(1.05);
      }
    }
  }
}
`;

class ConfirmationModal extends HTMLElement {
  #ready = false;
  #message = '';
  #context = 'default';
  #modal = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const styles = document.createElement('style');
    styles.textContent = CSS;
    this.shadowRoot.appendChild(styles);

    this.#modal = h('dialog', { closedby: 'any' }, [
      h('header', {}, [
        h('h3', { innerText: 'Confirmation' }),
        h('button', { id: 'close-modal', type: 'button', title: 'Close' }, [
          h('img', { src: '/images/close.svg', alt: 'close' }),
        ]),
      ]),
      h('form', { method: 'dialog', autocomplete: 'off' }, [
        h('p', { id: 'message', innerText: 'Are you sure?' }),
        h('div', { className: 'actions' }, [
          h('input', { type: 'button', id: 'btnCancel', value: 'Cancel' }),
          h('input', { type: 'submit', id: 'btnOk', value: 'OK' }),
        ]),
      ]),
    ]);
    this.shadowRoot.appendChild(this.#modal);
  }

  #init() {
    const closeHandler = evt => {
      evt.preventDefault();
      this.#modal?.close();
    };
    this.shadowRoot.querySelector('#close-modal').addEventListener('click', closeHandler);
    this.shadowRoot.querySelector('#btnCancel').addEventListener('click', closeHandler);

    this.shadowRoot.querySelector('form').addEventListener('submit', evt => {
      if (evt.submitter?.id === 'btnOk') {
        this.#emit('confirm');
      }
    });
    this.#ready = true;
  }

  #emit(eventName) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: { context: this.#context } }));
  }

  #render() {
    if (this.#ready) {
      this.shadowRoot.querySelector('#message').innerText = this.#message;
    }
  }

  /**
   * @param {string} caption - message body shown to the user.
   * @param {string} context - opaque token echoed back on `confirm`.
   */
  showModal(caption, context) {
    this.#message = caption;
    this.#context = context ?? 'default';
    if (!this.#ready) {
      this.#init();
    }
    this.#render();
    this.#modal?.showModal();
  }
}

customElements.define('confirmation-modal', ConfirmationModal);
