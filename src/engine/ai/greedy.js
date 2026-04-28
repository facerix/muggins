import { flip, flipHeld, hold, play } from '../actions.js';
import { legalPlaysFor } from '../legalMoves.js';

/** Always plays whenever a legal move exists; otherwise holds. Lowest-index legal target wins. */
export const chooseAction = (state, playerId, _rng) => {
  const hand = state.hands.find(h => h.playerId === playerId);
  if (!hand) throw new Error(`greedy AI: unknown player ${playerId}`);

  if (state.turn.phase === 'flip') {
    if (hand.faceDown.length > 0) return flip(playerId);
    return flipHeld(playerId);
  }

  if (state.turn.phase !== 'decide' || state.turn.playerId !== playerId) {
    throw new Error('greedy AI: chooseAction outside decide phase for active player');
  }

  const card = state.flippedCard;
  if (!card) throw new Error('greedy AI: decide phase without flippedCard');

  const legals = legalPlaysFor(state, card);
  if (legals.length === 0) return hold(playerId);
  return play(playerId, legals[0]);
};

export const shouldCallMuggins = () => false;
