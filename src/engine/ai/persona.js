/**
 * AI personas are pure helpers for the Phase 3+ dispatch loop:
 * {@link chooseAction} returns the next action envelope only (no `at`; reducer stamps).
 * {@link shouldCallMuggins} gates strategist CALL_MUGGINS when another player legally could
 * have played before holding.
 *
 * @typedef {{ next(): number, range(max: number): number }} AiRng
 * @typedef {object} AiPersona
 * @property {(state: object, playerId: string, rng: AiRng) => object} chooseAction
 * @property {(state: object, playerId: string) => boolean} shouldCallMuggins
 */

import * as greedy from './greedy.js';
import * as random from './random.js';
import * as strategist from './strategist.js';

const byKind = {
  'ai-greedy': greedy,
  'ai-random': random,
  'ai-strategist': strategist,
};

/** @param {string} kind */
export const personaForKind = kind => byKind[kind] ?? null;
