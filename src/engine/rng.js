// Mulberry32: tiny, deterministic, seedable PRNG.
// State is a uint32 carried through the game state so the reducer stays pure.
// https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32

export const makeRng = initialState => {
  let s = initialState >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range(max) {
      return Math.floor(this.next() * max);
    },
    get state() {
      return s;
    },
  };
};
