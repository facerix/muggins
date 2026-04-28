import { legalPlaysFor } from './legalMoves.js';

/**
 * After a HOLD, returns whether that hold missed at least one legal play with the flipped card.
 *
 * Preconditions: treats the tail of `state.log`: only considers the case where the **last**
 * entry is HOLD (immediate post-hold window before further actions append).
 *
 * Recoverable from current state without replay: the just-held card is now on top of the
 * offender's `faceUp`. Display-pile tops and opponent `faceUp` tops are unchanged by HOLD.
 * `legalPlaysFor` excludes the current player's own `faceUp` from opponent targets, so we
 * pass a temp state with `turn.playerId = offenderId` to mirror the decide-phase view.
 *
 * @returns {{ offenderId: string } | null}
 */
export const missedLegalOffenderIfLastHold = state => {
  const log = state.log;
  if (log.length < 2) return null;

  const last = log[log.length - 1];
  if (last.type !== 'HOLD') return null;

  const offenderId = last.by;
  const hand = state.hands.find(h => h.playerId === offenderId);
  if (!hand || hand.faceUp.length === 0) return null;
  const heldCard = hand.faceUp[hand.faceUp.length - 1];

  const tempState = { ...state, turn: { ...state.turn, playerId: offenderId } };
  const plays = legalPlaysFor(tempState, heldCard);
  if (plays.length === 0) return null;

  return { offenderId };
};

/**
 * After a FLIP or FLIP_HELD, returns whether the actor had a legal play available
 * with the top of their face-up (held) pile and chose to flip instead.
 *
 * Held-top at moment-of-decision is recoverable from the current state:
 *   FLIP      → hand.faceUp is unchanged → read faceUp[last].
 *   FLIP_HELD → faceUp moved to faceDown reversed → read faceDown[0].
 * displayPiles, opponent faceUp tops, and turn.playerId are unchanged across both.
 *
 * @returns {{ offenderId: string } | null}
 */
export const missedLegalOffenderIfLastFlip = state => {
  const log = state.log;
  if (log.length < 2) return null;

  const last = log[log.length - 1];
  if (last.type !== 'FLIP' && last.type !== 'FLIP_HELD') return null;

  const offenderId = last.by;
  const hand = state.hands.find(h => h.playerId === offenderId);
  if (!hand) return null;

  let heldTop;
  if (last.type === 'FLIP') {
    if (hand.faceUp.length === 0) return null;
    heldTop = hand.faceUp[hand.faceUp.length - 1];
  } else {
    if (hand.faceDown.length === 0) return null;
    heldTop = hand.faceDown[0];
  }

  // legalPlaysFor uses state.turn.playerId to exclude the actor's own face-up
  // from opponent targets. After FLIP, turn.playerId is still the actor, so the
  // exclusion holds. For the FLIP_HELD case the actor's faceUp is empty, so the
  // exclusion is moot.
  const plays = legalPlaysFor(state, heldTop);
  if (plays.length === 0) return null;

  return { offenderId };
};

/**
 * Combined detection: returns the offender when the most recent log entry was a missed
 * legal play (HOLD with flipped card playable, or FLIP/FLIP_HELD with held-top playable).
 *
 * @returns {{ offenderId: string } | null}
 */
export const missedLegalOffender = state =>
  missedLegalOffenderIfLastHold(state) ?? missedLegalOffenderIfLastFlip(state);
