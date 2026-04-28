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

export const hold = playerId => ({
  type: 'HOLD',
  payload: {},
  by: playerId,
});

/** Payload shape finalized in Phase 7 (offender, penalty routing). */
export const callMuggins = (playerId, payload = {}) => ({
  type: 'CALL_MUGGINS',
  payload,
  by: playerId,
});
