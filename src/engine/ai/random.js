import { flip, flipHeld, hold, play, playHeld } from '../actions.js';
import { legalPlaysFor } from '../legalMoves.js';

/**
 * Flip phase: 50% PLAY_HELD (uniform random target) vs flip when held-top has any legal play;
 * else flip / flipHeld deterministically.
 * Decide phase: 50% PLAY (uniform target) vs HOLD when legal plays exist for the flipped card; else HOLD.
 */
export const chooseAction = (state, playerId, rng) => {
  const hand = state.hands.find(h => h.playerId === playerId);
  if (!hand) throw new Error(`random AI: unknown player ${playerId}`);

  if (state.turn.phase === 'flip') {
    if (hand.faceUp.length > 0) {
      const top = hand.faceUp[hand.faceUp.length - 1];
      const heldLegals = legalPlaysFor(state, top);
      if (heldLegals.length > 0 && rng.next() < 0.5) {
        const i = rng.range(heldLegals.length);
        return playHeld(playerId, heldLegals[i]);
      }
    }
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
