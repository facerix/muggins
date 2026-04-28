import { flip, flipHeld, hold, play, playHeld } from '../actions.js';
import { legalPlaysFor } from '../legalMoves.js';
import { missedLegalOffender } from '../mugginsOpportunity.js';

const prioritizeTargets = legals => {
  const opponents = [];
  const displays = [];
  for (const t of legals) {
    if (t.type === 'opponent') opponents.push(t);
    else displays.push(t);
  }
  return [...opponents, ...displays];
};

/**
 * Prefers opponent face-up piles over display piles; ties keep `legalPlaysFor` ordering within each group.
 * In flip phase, plays the held-top first if it has any legal target (else flips).
 */
export const chooseAction = (state, playerId, _rng) => {
  const hand = state.hands.find(h => h.playerId === playerId);
  if (!hand) throw new Error(`strategist AI: unknown player ${playerId}`);

  if (state.turn.phase === 'flip') {
    if (hand.faceUp.length > 0) {
      const top = hand.faceUp[hand.faceUp.length - 1];
      const heldLegals = prioritizeTargets(legalPlaysFor(state, top));
      if (heldLegals.length > 0) return playHeld(playerId, heldLegals[0]);
    }
    if (hand.faceDown.length > 0) return flip(playerId);
    return flipHeld(playerId);
  }

  if (state.turn.phase !== 'decide' || state.turn.playerId !== playerId) {
    throw new Error('strategist AI: chooseAction outside decide phase for active player');
  }

  const card = state.flippedCard;
  if (!card) throw new Error('strategist AI: decide phase without flippedCard');

  const legals = prioritizeTargets(legalPlaysFor(state, card));
  if (legals.length === 0) return hold(playerId);
  return play(playerId, legals[0]);
};

/**
 * True when the last log entry exposes a missed legal play (HOLD with playable flipped card,
 * or FLIP / FLIP_HELD with playable held-top), and this seat is not the offender.
 * Only meaningful at the immediate post-action window; runtime resolves before the next action.
 */
export const shouldCallMuggins = (state, playerId) => {
  const opp = missedLegalOffender(state);
  if (!opp) return false;
  if (opp.offenderId === playerId) return false;
  return true;
};
