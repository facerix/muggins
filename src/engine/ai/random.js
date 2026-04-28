import { flip, flipHeld, hold, play } from '../actions.js';
import { legalPlaysFor } from '../legalMoves.js';

/**
 * Flip / flipHeld deterministically when required; after flip — 50% play vs hold if any legal play exists,
 * picking a uniformly random legal target when playing.
 */
export const chooseAction = (state, playerId, rng) => {
  const hand = state.hands.find(h => h.playerId === playerId);
  if (!hand) throw new Error(`random AI: unknown player ${playerId}`);

  if (state.turn.phase === 'flip') {
    if (hand.faceDown.length > 0) return flip(playerId);
    return flipHeld(playerId);
  }

  if (state.turn.phase !== 'decide' || state.turn.playerId !== playerId) {
    throw new Error('random AI: chooseAction outside decide phase for active player');
  }

  const card = state.flippedCard;
  if (!card) throw new Error('random AI: decide phase without flippedCard');

  const legals = legalPlaysFor(state, card);
  if (legals.length === 0) return hold(playerId);

  if (rng.next() < 0.5) return hold(playerId);
  const i = rng.range(legals.length);
  return play(playerId, legals[i]);
};

export const shouldCallMuggins = () => false;
