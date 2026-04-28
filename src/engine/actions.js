// Action creators producing the wire envelope shape:
//   { type, payload, by, at? }
// `at` is the monotonic log index, stamped by the reducer at dispatch time.

export const start = ({ seed, players }) => ({
  type: 'START',
  payload: { seed, players },
  by: 'system',
});

export const flip = playerId => ({
  type: 'FLIP',
  payload: {},
  by: playerId,
});

export const flipHeld = playerId => ({
  type: 'FLIP_HELD',
  payload: {},
  by: playerId,
});

export const play = (playerId, target) => ({
  type: 'PLAY',
  payload: { target },
  by: playerId,
});

export const playHeld = (playerId, target) => ({
  type: 'PLAY_HELD',
  payload: { target },
  by: playerId,
});

export const hold = playerId => ({
  type: 'HOLD',
  payload: {},
  by: playerId,
});

/**
 * Caller declares the call; reducer derives the offender from the log tail and validates.
 * Invalid calls (no offense, or self-call) are bad calls — the caller pays the penalty.
 */
export const callMuggins = playerId => ({
  type: 'CALL_MUGGINS',
  payload: {},
  by: playerId,
});
