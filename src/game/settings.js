/** @typedef {{
 *   [key: string]: string | number | boolean | undefined
 * }} Settings */

/** @type {Settings} */
export const DEFAULT_SETTINGS = {
  aiDelay: 1000,
  aiJitter: true,
  aiPersona: 'random',
  showHints: false,
  cardDesign: 'default',
  sounds: true,
};
