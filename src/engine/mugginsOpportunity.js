import { legalPlaysFor } from './legalMoves.js';
import { replayFromLog } from './replay.js';

/**
 * After a HOLD, returns whether that hold missed at least one legal play, and who held.
 * Used by strategist `shouldCallMuggins`; Phase 7 will enforce full reducer rules for CALL_MUGGINS.
 *
 * Preconditions: treats the tail of `state.log`: only considers the case where the **last**
 * entry is HOLD (immediate post-hold window before further actions append).
 *
 * @returns {{ offenderId: string } | null}
 */
export const missedLegalOffenderIfLastHold = state => {
  const log = state.log;
  if (log.length < 2) return null;

  const last = log[log.length - 1];
  if (last.type !== 'HOLD') return null;

  const offenderId = last.by;
  const beforeHold = replayFromLog(log.slice(0, -1));
  if (!beforeHold) return null;
  if (beforeHold.turn.phase !== 'decide') return null;
  if (beforeHold.turn.playerId !== offenderId) return null;
  if (!beforeHold.flippedCard) return null;

  const plays = legalPlaysFor(beforeHold, beforeHold.flippedCard);
  if (plays.length === 0) return null;

  return { offenderId };
};
