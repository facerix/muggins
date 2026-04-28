import { isAdjacent } from './card.js';

// Returns the set of legal play targets for `card` given the current state.
// Targets are { type: 'display', pileIndex } or { type: 'opponent', playerId }.
// Note: a player can never play onto their own face-up pile.
export const legalPlaysFor = (state, card) => {
  const out = [];

  state.displayPiles.forEach((pile, i) => {
    const top = pile[pile.length - 1];
    if (top && isAdjacent(card, top)) {
      out.push({ type: 'display', pileIndex: i });
    }
  });

  const currentId = state.turn.playerId;
  for (const hand of state.hands) {
    if (hand.playerId === currentId) continue;
    const top = hand.faceUp[hand.faceUp.length - 1];
    if (top && isAdjacent(card, top)) {
      out.push({ type: 'opponent', playerId: hand.playerId });
    }
  }

  return out;
};
