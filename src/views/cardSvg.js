import { ACE, KING, SUITS } from '/src/engine/card.js';
import { CreateSvg } from '/src/domUtils.js';

/**
 * Paint rules for `cardFace` / `cardBack` output. Required inside shadow roots
 * (global styles do not pierce shadow DOM). Safe to inject into light DOM too.
 */
export const PROGRAMMATIC_CARD_SVG_CSS = `
svg.card-face text,
svg.card-back {
  font-family: var(--card-font, Futura, 'Trebuchet MS', Arial, sans-serif);
}

svg.card-face .card-face__rect {
  fill: var(--card-face-bg, #faf9f6);
  stroke: var(--card-border, rgba(26, 26, 26, 0.35));
  stroke-width: 1.1;
}

svg.card-face .card-face__red {
  fill: var(--card-suit-red, #c62828);
}

svg.card-face .card-face__black {
  fill: var(--card-suit-black, #1a1a1a);
}

svg.card-back .card-back__rect {
  fill: var(--card-back-fill, #0d2818);
  stroke: var(--card-back-border, #1a6b3c);
  stroke-width: 1.2;
}

svg.card-back .card-back__ring {
  stroke: var(--card-back-accent, #c9a227);
  stroke-width: 1.35;
  opacity: 0.9;
}

svg.card-back .card-back__dot {
  fill: var(--card-back-accent, #c9a227);
  opacity: 0.75;
}

svg.card-back .card-back__cross {
  stroke: var(--card-back-accent, #c9a227);
  stroke-width: 1.1;
  opacity: 0.45;
}
`;

const SUIT_GLYPH = Object.freeze({
  C: '♣',
  D: '♦',
  H: '♥',
  S: '♠',
});

const RANK_LABEL = Object.freeze({
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
});

export const rankLabel = rank => {
  if (rank >= 2 && rank <= 10) return String(rank);
  return RANK_LABEL[rank] ?? String(rank);
};

const suitToneClass = suit =>
  suit === 'H' || suit === 'D' ? 'card-face__red' : 'card-face__black';

/** 7∶10 viewBox — matches poker / bridge proportion and `<card-pile>` aspect-ratio (56∶80). */
const CARD_VIEW_BOX = '0 0 70 100';

/**
 * Playing-card face: corner rank + suit, large center suit, mirrored corner.
 * Uses a 70×100 viewBox (7∶10); scales with width/height (default 100% to fill host).
 *
 * @param {{ rank: number, suit: string }} card
 * @returns {SVGSVGElement}
 */
export const cardFace = ({ rank, suit }) => {
  if (!Number.isInteger(rank) || rank < ACE || rank > KING) {
    throw new Error(`cardFace: invalid rank ${rank}`);
  }
  if (!SUITS.includes(suit)) {
    throw new Error(`cardFace: invalid suit ${suit}`);
  }

  const rl = rankLabel(rank);
  const glyph = SUIT_GLYPH[suit];
  const tone = suitToneClass(suit);

  const body = `
    <rect class="card-face__rect" x="2" y="2" width="66" height="96" rx="5" />
    <text x="6" y="19" class="card-face__corner ${tone}" font-size="14" font-weight="700">${rl}</text>
    <text x="5.5" y="32" class="card-face__corner ${tone}" font-size="13">${glyph}</text>
    <text x="35" y="61" text-anchor="middle" class="card-face__center ${tone}" font-size="38">${glyph}</text>
    <g transform="translate(70 100) scale(-1 -1)">
      <text x="6" y="19" class="card-face__corner ${tone}" font-size="14" font-weight="700">${rl}</text>
      <text x="5.5" y="32" class="card-face__corner ${tone}" font-size="13">${glyph}</text>
    </g>
  `;

  return CreateSvg(body, '100%', '100%', 'card-face', CARD_VIEW_BOX);
};

/**
 * Programmatic card back (themeable via --card-back-* on :root or host).
 * @returns {SVGSVGElement}
 */
export const cardBack = () => {
  const body = `
    <rect class="card-back__rect" x="2" y="2" width="66" height="96" rx="5" />
    <circle class="card-back__ring" cx="35" cy="50" r="16" fill="none" />
    <circle class="card-back__dot" cx="35" cy="50" r="3.5" />
    <path class="card-back__cross" d="M35 32v36M22 50h26" fill="none" stroke-linecap="round" />
  `;
  return CreateSvg(body, '100%', '100%', 'card-back', CARD_VIEW_BOX);
};
