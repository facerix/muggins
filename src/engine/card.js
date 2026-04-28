// Standard 52-card deck primitives.
// Aces are low (1), kings are high (13); no wrap-around.

export const SUITS = Object.freeze(['C', 'D', 'H', 'S']);
export const RANKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
export const ACE = 1;
export const KING = 13;

export const makeCard = (rank, suit) => ({ rank, suit });

export const isAdjacent = (a, b) => Math.abs(a.rank - b.rank) === 1;

export const cardId = card => `${card.rank}${card.suit}`;
