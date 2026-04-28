import { SUITS, RANKS, makeCard } from './card.js';

export const buildDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit));
    }
  }
  return deck;
};

// Fisher-Yates with the supplied RNG. Pure: returns a new array, leaves input intact.
export const shuffle = (cards, rng) => {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.range(i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
};
