// <player-hand> — player's hand with a draw pile and a discard pile.
//
// Attributes:
//   playerId     player ID
//   name         player name
//   kind         player kind (human, ai-*)
//   drawPile     draw pile (is this count, top card, something else?)
//   discardPile  discard pile (same questions)

import { h } from '/src/domUtils.js';
import './CardPile.js';

const CSS = `
:host {
  display: block;
  width: 100%;
  height: 100%;
}

  .player-hand_container {
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.14);
    border: 1px solid transparent;

    &.active {
      border-color: rgba(201, 162, 39, 0.85);
      box-shadow: 0 0 0 1px rgba(201, 162, 39, 0.35);

      &.is-ai {
        .player-hand__thinking {
          visibility: visible;
          opacity: 1;
          transition: opacity 0.1s ease-in-out;
        }
      }

      &:not(.is-ai) {
        .player-hand__draw-pile {
          cursor: pointer;

          card-pile {
            &:hover,
            &:active {
              transform: scale(1.025);
            }
            transition: transform 0.1s ease-in-out;
          }
        }
      }
    }

    &.flipped {
      .player-hand__discard-pile {
        cursor: pointer;

        card-pile {
          &:hover,
          &:active {
            transform: scale(1.025);
          }
          transition: transform 0.1s ease-in-out;
        }
      }
    }
  }
  
  .player-hand__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35rem 0.65rem;
    margin-bottom: 0.5rem;
  }

  .player-hand__thinking {
    margin-left: auto;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s ease-in-out;
  }
  
  .player-hand__name {
    font-weight: bold;
  }
  
  .player-hand__kind {
    font-size: 0.78rem;
  }
  
  .player-hand__cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: flex-end;
  }

  .player-hand__draw-pile,
  .player-hand__discard-pile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .player-hand__name {
    font-weight: bold;
  }
  .player-hand__kind {
    font-size: 0.78rem;
  }
  .player-hand__mini-label {
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

`;

class PlayerHand extends HTMLElement {
  static observedAttributes = ['playerId', 'name', 'kind'];
  #ready = false;
  #root = null;
  #isActive = false;
  #isFlipped = false;
  #isAI = false;
  #drawPileUI = null;
  #discardPileUI = null;
  #drawPile = null;
  #discardPile = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.#init();
  }

  attributeChangedCallback() {
    this.#isAI = this.kind?.startsWith('ai-') ?? false;
    this.render();
  }

  get playerId() {
    return this.getAttribute('playerId') ?? '';
  }

  set playerId(value) {
    this.setAttribute('playerId', value);
  }

  get name() {
    return this.getAttribute('name') ?? '';
  }

  set name(value) {
    this.setAttribute('name', value);
  }

  get kind() {
    return this.getAttribute('kind') ?? '';
  }

  set kind(value) {
    this.setAttribute('kind', value);
  }

  get drawPile() {
    return this.#drawPile;
  }

  set drawPile(value) {
    this.#drawPile = value;
    this.render();
  }

  get discardPile() {
    return this.#discardPile;
  }

  set discardPile(value) {
    this.#discardPile = value;
    this.render();
  }

  get isActive() {
    return this.#isActive;
  }

  set isActive(value) {
    this.#isActive = value;
    this.render();
  }

  get isFlipped() {
    return this.#isFlipped;
  }

  set isFlipped(value) {
    this.#isFlipped = value;
    this.render();
  }

  get isAI() {
    return this.#isAI;
  }

  #init() {
    if (this.#ready) return;
    this.#isAI = this.kind?.startsWith('ai-') ?? false;
    const styles = document.createElement('style');
    styles.textContent = CSS;
    this.shadowRoot.appendChild(styles);

    this.#drawPileUI = h('card-pile', {
      face: 'down',
      count: this.#drawPile?.length ?? 0,
      draggable: true,
    });
    this.#discardPileUI = h('card-pile', {
      count: this.#discardPile?.length ?? 0,
      rank: this.#discardPile?.[0]?.rank ?? 0,
      suit: this.#discardPile?.[0]?.suit ?? '',
      face: 'up',
    });
    this.#root = h('div', { className: 'player-hand_container' }, [
      h('div', { className: 'player-hand__head' }, [
        h('span', { className: 'player-hand__name', textContent: this.name }),
        h('span', {
          className: 'player-hand__kind u-muted',
          textContent: this.#isAI ? 'AI' : 'Human',
        }),
        h('span', { className: 'player-hand__thinking u-muted u-hidden' }, [
          h('img', {
            src: '/images/thinking.svg',
            alt: 'Thinking...',
            className: 'player-hand__thinking-icon',
            width: '16',
            height: '16',
          }),
        ]),
      ]),
      h('div', { className: 'player-hand__cards' }, [
        h('div', { className: 'player-hand__draw-pile' }, [
          h('span', { className: 'player-hand__mini-label u-muted', textContent: 'Deck' }),
          this.#drawPileUI,
        ]),
        h('div', { className: 'player-hand__discard-pile' }, [
          h('span', { className: 'player-hand__mini-label u-muted', textContent: 'Held' }),
          this.#discardPileUI,
        ]),
      ]),
    ]);
    if (this.isAI) {
      this.#root.classList.add('is-ai');
    }
    this.shadowRoot.appendChild(this.#root);

    this.#drawPileUI.addEventListener('click', () => {
      if (this.isActive && !this.isFlipped && !this.isAI) {
        this.isFlipped = true;
        this.#emit('flipped');
        this.render();
      }
    });
    this.#discardPileUI.addEventListener('click', () => {
      if (this.isActive && this.isFlipped && !this.isAI) {
        this.isFlipped = false;
        this.#emit('held');
        this.render();
      }
    });
    this.#ready = true;
  }

  #emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
  }

  render() {
    if (!this.#ready) {
      this.#init();
    }
    // hydrate the DOM values based on attribute changes
    if (this.#drawPile?.length > 0) {
      this.#drawPileUI.setAttribute('count', this.#drawPile.length);
      this.#drawPileUI.setAttribute('rank', this.#drawPile[0].rank);
      this.#drawPileUI.setAttribute('suit', this.#drawPile[0].suit);
    }
    this.#discardPileUI.setAttribute('count', this.#discardPile?.length ?? 0);
    this.#discardPileUI.setAttribute('rank', this.#discardPile?.[0]?.rank ?? 0);
    this.#discardPileUI.setAttribute('suit', this.#discardPile?.[0]?.suit ?? '');

    // add/remove is-ai class based on AI status
    if (this.isAI) {
      this.#root.classList.add('is-ai');
    } else {
      this.#root.classList.remove('is-ai');
    }

    if (this.isFlipped) {
      this.#drawPileUI.setAttribute('face', 'up');
    } else {
      this.#drawPileUI.setAttribute('face', 'down');
    }

    if (this.isActive) {
      this.#root.classList.add('active');
    } else {
      this.#root.classList.remove('active');
    }

    if (this.isFlipped) {
      this.#root.classList.add('flipped');
    } else {
      this.#root.classList.remove('flipped');
    }
  }
}

customElements.define('player-hand', PlayerHand);
