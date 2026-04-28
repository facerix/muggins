import { reducer } from './reducer.js';

/** Replays actions from `[START]` through the slice and returns the resulting state. */
export const replayFromLog = log =>
  log.length === 0 ? undefined : log.reduce((acc, a) => reducer(acc, a), undefined);
