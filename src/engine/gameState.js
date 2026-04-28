import { buildDeck, shuffle } from './deck.js';
import { makeRng } from './rng.js';

const DISPLAY_PILE_COUNT = 4;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

export const createGame = ({ seed, players: playerInputs }) => {
  if (
    !Array.isArray(playerInputs) ||
    playerInputs.length < MIN_PLAYERS ||
    playerInputs.length > MAX_PLAYERS
  ) {
    throw new Error(`expected ${MIN_PLAYERS}-${MAX_PLAYERS} players, got ${playerInputs?.length}`);
  }

  const rng = makeRng(seed);
  const shuffled = shuffle(buildDeck(), rng);

  const players = playerInputs.map((p, i) => ({
    id: `p${i}`,
    name: p.name,
    kind: p.kind,
  }));

  const displayPiles = [];
  for (let i = 0; i < DISPLAY_PILE_COUNT; i++) {
    displayPiles.push([shuffled[i]]);
  }

  const remaining = shuffled.slice(DISPLAY_PILE_COUNT);
  const hands = players.map(p => ({ playerId: p.id, faceDown: [], faceUp: [] }));
  remaining.forEach((card, i) => {
    hands[i % players.length].faceDown.push(card);
  });

  return {
    schemaVersion: 1,
    seed,
    rngState: rng.state,
    players,
    hands,
    displayPiles,
    turn: { playerId: players[0].id, phase: 'flip' },
    flippedCard: null,
    log: [],
    winner: null,
  };
};
