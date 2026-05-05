// <settings-modal>
//
// Dialog for user settings. Caller invokes `showModal()` to open the modal.
//
import { h, isDevelopmentMode } from '/src/domUtils.js';
import { DEFAULT_SETTINGS } from '/src/game/settings.js';

const formatAiDelay = value => {
  const humanReadable = Number(value) / 1000;
  return `${humanReadable}s`;
};

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

  [hidden] {
    display: none !important;
  }

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

    fieldset {
      padding: 0.5rem;
      border: 1px solid #c0c0c0;
      border-radius: 0.35rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        display: inline-flex;
        align-items: center;

        input,
        select {
          margin-left: auto;
        }

        .delay-caption {
          margin-left: 0.25rem;
          flex: 0 0 2rem;
          text-align: right;
          font-variant: tabular-nums;
        }
      }
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

class SettingsModal extends HTMLElement {
  #ready = false;
  #settings = DEFAULT_SETTINGS;
  #form = null;
  #modal = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const styles = document.createElement('style');
    styles.textContent = CSS;
    this.shadowRoot.appendChild(styles);

    const devMode = isDevelopmentMode();
    const aiDelayRange = h('input', {
      type: 'range',
      name: 'aiDelay',
      id: 'aiDelay',
      value: this.#settings.aiDelay,
      min: 0,
      max: 10000,
      step: 100,
    });
    const aiDelayCaption = h('span', {
      innerText: formatAiDelay(this.#settings.aiDelay),
      className: 'delay-caption',
      id: 'aiDelayValue',
    });
    aiDelayRange.addEventListener('input', evt => {
      aiDelayCaption.innerText = formatAiDelay(evt.target.value);
    });

    this.#form = h('form', { method: 'dialog', autocomplete: 'off' }, [
      h('fieldset', { className: 'ai-settings', hidden: !devMode }, [
        h('legend', { innerText: 'AI' }),
        h('label', { innerText: 'Thinking delay' }, [aiDelayRange, aiDelayCaption]),
        h('label', { innerText: 'Thinking jitter' }, [
          h('input', {
            type: 'checkbox',
            name: 'aiJitter',
            id: 'aiJitter',
            checked: this.#settings.aiJitter,
          }),
        ]),
        h('label', { innerText: 'Default Persona' }, [
          h('select', { name: 'aiPersona', id: 'aiPersona', value: this.#settings.aiPersona }, [
            h('option', { value: 'random', innerText: 'Random Rusty' }),
            h('option', { value: 'greedy', innerText: 'Greedy Gil' }),
            h('option', { value: 'strategist', innerText: 'Strategic Sally' }),
          ]),
        ]),
      ]),
      h('fieldset', { className: 'sound-settings' }, [
        h('legend', { innerText: 'Sound Effects' }),
        h('label', { innerText: 'Sound Effects' }, [
          h('input', {
            type: 'checkbox',
            name: 'soundEffects',
            id: 'soundEffects',
            checked: this.#settings.sounds,
          }),
        ]),
      ]),
      h('fieldset', { className: 'hints-settings' }, [
        h('legend', { innerText: 'Hints' }),
        h('label', { innerText: 'Show hints' }, [
          h('input', {
            type: 'checkbox',
            name: 'showHints',
            id: 'showHints',
            checked: this.#settings.showHints,
          }),
        ]),
      ]),
      h('fieldset', { className: 'card-design-settings' }, [
        h('legend', { innerText: 'Card Design' }),
        h('label', { innerText: 'Card Design' }, [
          h('select', { name: 'cardDesign', id: 'cardDesign', value: this.#settings.cardDesign }, [
            h('option', { value: 'default', innerText: 'Default' }),
            h('option', { value: 'custom', innerText: 'Custom' }),
          ]),
        ]),
      ]),
      h('div', { className: 'actions' }, [
        h('input', { type: 'button', id: 'btnCancel', value: 'Cancel' }),
        h('input', { type: 'submit', id: 'btnSave', value: 'Save' }),
      ]),
    ]);

    this.#modal = h('dialog', { closedby: 'any' }, [
      h('header', {}, [
        h('h3', { innerText: 'Settings' }),
        h('button', { id: 'close-modal', type: 'button', title: 'Close' }, [
          h('img', { src: '/images/close.svg', alt: 'close' }),
        ]),
      ]),
      this.#form,
    ]);
    this.shadowRoot.appendChild(this.#modal);
  }

  #init() {
    const closeHandler = evt => {
      evt.preventDefault();
      this.#emit('cancel');
      this.#modal?.close();
    };
    this.shadowRoot.querySelector('#close-modal').addEventListener('click', closeHandler);
    this.shadowRoot.querySelector('#btnCancel').addEventListener('click', closeHandler);
    this.#modal.addEventListener('cancel', closeHandler);

    this.shadowRoot.querySelector('form').addEventListener('submit', evt => {
      if (evt.submitter?.id === 'btnSave') {
        this.#handleSave();
      }
    });
    this.#ready = true;
  }

  #emit(eventName) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: { settings: this.#settings } }));
  }

  #handleSave() {
    const fd = new window.FormData(this.#form);
    const aiDelay = Number(fd.get('aiDelay'));
    this.#settings = {
      aiDelay: Number.isFinite(aiDelay) ? aiDelay : DEFAULT_SETTINGS.aiDelay,
      aiJitter: fd.get('aiJitter') === 'on',
      aiPersona: String(fd.get('aiPersona') ?? DEFAULT_SETTINGS.aiPersona),
      showHints: fd.get('showHints') === 'on',
      cardDesign: String(fd.get('cardDesign') ?? DEFAULT_SETTINGS.cardDesign),
    };
    this.#emit('save');
    this.#modal?.close();
  }

  #hydrate() {
    this.shadowRoot.querySelector('#aiDelay').value = this.#settings.aiDelay;
    this.shadowRoot.querySelector('#aiJitter').checked = this.#settings.aiJitter;
    this.shadowRoot.querySelector('#aiPersona').value = this.#settings.aiPersona;
    this.shadowRoot.querySelector('#showHints').checked = this.#settings.showHints;
    this.shadowRoot.querySelector('#cardDesign').value = this.#settings.cardDesign;
  }

  #render() {
    if (this.#ready) {
      this.#hydrate();
    }
  }

  /**
   * @param {Settings} [settings] - user's current settings
   */
  showModal(settings) {
    this.#settings = settings ?? DEFAULT_SETTINGS;
    if (!this.#ready) {
      this.#init();
    }
    this.#render();
    this.#modal?.showModal();
  }
}

customElements.define('settings-modal', SettingsModal);
