// <card-pile> — small stack with the top card visible (face-up or face-down).
//
// Attributes:
//   face      "up" | "down" (default "up")
//   rank      1–13 when face up (required with suit)
//   suit      C | D | H | S when face up
//   count     stack size (default 1); 0 shows an empty placeholder

import { ACE, KING, SUITS } from '/src/engine/card.js';
import { PROGRAMMATIC_CARD_SVG_CSS, cardBack, cardFace } from '/src/views/cardSvg.js';
import { h } from '/src/domUtils.js';

const CSS = `
${PROGRAMMATIC_CARD_SVG_CSS}

:host {
  display: block;
  width: min(4.5rem, 22vw);
  aspect-ratio: 56 / 80;
  box-sizing: border-box;
}

.pile {
  position: relative;
  width: 100%;
  height: 100%;
}

.pile__stack {
  position: relative;
  width: 100%;
  height: 100%;
}

.pile__layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.pile__layer :is(svg.card-face, svg.card-back) {
  display: block;
  width: 100%;
  height: 100%;
  flex: 1;
}

.pile__layer--ghost {
  z-index: 0;
}

.pile__layer--top {
  z-index: 1;
}

.pile__layer--empty {
  z-index: 1;
  border: 2px dashed var(--card-empty-border, rgba(240, 247, 243, 0.45));
  border-radius: 0.35rem;
  background: var(--card-empty-bg, rgba(0, 0, 0, 0.12));
  align-items: center;
  justify-content: center;
  cursor: default;
}

.pile__empty-label {
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--card-empty-label, rgba(240, 247, 243, 0.65));
}
`;

class CardPile extends HTMLElement {
  static observedAttributes = ['face', 'rank', 'suit', 'count'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const face = this.getAttribute('face') === 'down' ? 'down' : 'up';
    const countRaw = this.getAttribute('count');
    const count = countRaw == null ? 1 : Math.max(0, parseInt(countRaw, 10) || 0);
    const rankAttr = this.getAttribute('rank');
    const suit = this.getAttribute('suit');

    const styleEl = h('style', null, []);
    styleEl.textContent = CSS;

    const stack = h('div', { className: 'pile__stack' });
    const ghostCount = count > 0 ? Math.min(count - 1, 3) : 0;

    for (let i = 0; i < ghostCount; i++) {
      const offset = 2 * (ghostCount - i);
      const layer = h('div', { className: 'pile__layer pile__layer--ghost' });
      layer.style.transform = `translate(${offset}px, ${offset}px)`;
      layer.appendChild(cardBack());
      stack.appendChild(layer);
    }

    const top = h('div', {
      className: `pile__layer pile__layer--top${count === 0 ? ' pile__layer--empty' : ''}`,
    });

    if (count === 0) {
      const label = h('span', { className: 'pile__empty-label' }, []);
      label.textContent = 'Empty';
      top.appendChild(label);
    } else if (face === 'down') {
      top.appendChild(cardBack());
    } else {
      const rank = parseInt(rankAttr, 10);
      const valid =
        suit && SUITS.includes(suit) && Number.isInteger(rank) && rank >= ACE && rank <= KING;
      if (!valid) {
        const err = h('span', { className: 'pile__empty-label' }, []);
        err.textContent = 'Need rank & suit';
        top.classList.add('pile__layer--empty');
        top.appendChild(err);
      } else {
        top.appendChild(cardFace({ rank, suit }));
      }
    }

    stack.appendChild(top);

    const root = h('div', { className: 'pile' }, [stack]);
    this.shadowRoot.replaceChildren(styleEl, root);
  }
}

customElements.define('card-pile', CardPile);
