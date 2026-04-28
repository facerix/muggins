import { flip, flipHeld, hold, play } from '../actions.js';
import { legalPlaysFor } from '../legalMoves.js';
import { missedLegalOffenderIfLastHold } from '../mugginsOpportunity.js';

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
 */
export const chooseAction = (state, playerId, _rng) => {
  const hand = state.hands.find(h => h.playerId === playerId);
  if (!hand) throw new Error(`strategist AI: unknown player ${playerId}`);

  if (state.turn.phase === 'flip') {
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
 * True when the last log entry was a HOLD that missed legal plays and this seat may call — not the offender.
 * Only meaningful while the tail is HOLD (runtime should resolve before the next flip).
 */
export const shouldCallMuggins = (state, playerId) => {
  const opp = missedLegalOffenderIfLastHold(state);
  if (!opp) return false;
  if (opp.offenderId === playerId) return false;
  return true;
};
