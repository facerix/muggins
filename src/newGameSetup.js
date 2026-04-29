/**
 * Inputs needed to start a new game: the player-kind options shown in the
 * setup UI, plus a small RNG helper for picking a fresh game seed.
 *
 * Pure (no DOM, no engine state) so it can be imported from the component
 * layer, the page bootstrap, and Node tests alike.
 */

/** @typedef {{ value: string, label: string }} PlayerKindOption */

/** @type {PlayerKindOption[]} */
export const PLAYER_KIND_OPTIONS = [
  { value: 'human', label: 'Human' },
  { value: 'ai-random', label: 'Random AI' },
  { value: 'ai-greedy', label: 'Greedy AI' },
  { value: 'ai-strategist', label: 'Strategist AI' },
];

/** @returns {number} 32-bit unsigned seed */
export function randomSeed() {
  const u32 = new Uint32Array(1);
  crypto.getRandomValues(u32);
  return u32[0];
}
