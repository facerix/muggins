import { createGame } from './gameState.js';
import { legalPlaysFor } from './legalMoves.js';

const stamp = (action, atIndex) => ({ ...action, at: atIndex });

const findHand = (state, playerId) => state.hands.find(h => h.playerId === playerId);

const replaceHand = (state, playerId, updater) => ({
  ...state,
  hands: state.hands.map(h => (h.playerId === playerId ? updater(h) : h)),
});

const checkWinner = state => {
  for (const hand of state.hands) {
    if (hand.faceDown.length === 0 && hand.faceUp.length === 0) {
      return hand.playerId;
    }
  }
  return null;
};

const advanceTurn = state => {
  if (state.winner) {
    return { ...state, turn: { ...state.turn, phase: 'done' } };
  }
  const idx = state.players.findIndex(p => p.id === state.turn.playerId);
  const next = state.players[(idx + 1) % state.players.length];
  return { ...state, turn: { playerId: next.id, phase: 'flip' } };
};

const apply = (state, action) => {
  switch (action.type) {
    case 'FLIP': {
      if (state.turn.playerId !== action.by) throw new Error('not your turn');
      if (state.turn.phase !== 'flip') throw new Error('not flip phase');
      const hand = findHand(state, action.by);
      if (!hand) throw new Error(`unknown player: ${action.by}`);
      if (hand.faceDown.length === 0) {
        throw new Error('no face-down cards; FLIP_HELD first');
      }

      const flipped = hand.faceDown[hand.faceDown.length - 1];
      const next = replaceHand(state, action.by, h => ({
        ...h,
        faceDown: h.faceDown.slice(0, -1),
      }));
      return {
        ...next,
        flippedCard: flipped,
        turn: { ...state.turn, phase: 'decide' },
      };
    }

    case 'FLIP_HELD': {
      if (state.turn.playerId !== action.by) throw new Error('not your turn');
      if (state.turn.phase !== 'flip') {
        throw new Error('FLIP_HELD only allowed in flip phase');
      }
      const hand = findHand(state, action.by);
      if (!hand) throw new Error(`unknown player: ${action.by}`);
      if (hand.faceDown.length > 0) {
        throw new Error('faceDown not empty; cannot flip held');
      }
      if (hand.faceUp.length === 0) {
        throw new Error('no face-up cards to flip');
      }

      const newFaceDown = hand.faceUp.slice().reverse();
      return replaceHand(state, action.by, h => ({
        ...h,
        faceDown: newFaceDown,
        faceUp: [],
      }));
    }

    case 'PLAY': {
      if (state.turn.playerId !== action.by) throw new Error('not your turn');
      if (state.turn.phase !== 'decide') throw new Error('not decide phase');
      if (!state.flippedCard) throw new Error('no flipped card');

      const { target } = action.payload;
      const legals = legalPlaysFor(state, state.flippedCard);
      const isLegal = legals.some(
        t =>
          t.type === target?.type &&
          (t.type === 'display' ? t.pileIndex === target.pileIndex : t.playerId === target.playerId)
      );
      if (!isLegal) throw new Error('illegal play target');

      const flipped = state.flippedCard;
      let next = { ...state, flippedCard: null };
      if (target.type === 'display') {
        next = {
          ...next,
          displayPiles: next.displayPiles.map((pile, i) =>
            i === target.pileIndex ? [...pile, flipped] : pile
          ),
        };
      } else {
        next = replaceHand(next, target.playerId, h => ({
          ...h,
          faceUp: [...h.faceUp, flipped],
        }));
      }
      next = { ...next, winner: checkWinner(next) };
      return advanceTurn(next);
    }

    case 'HOLD': {
      if (state.turn.playerId !== action.by) throw new Error('not your turn');
      if (state.turn.phase !== 'decide') throw new Error('not decide phase');
      if (!state.flippedCard) throw new Error('no flipped card');

      const flipped = state.flippedCard;
      const next = replaceHand({ ...state, flippedCard: null }, action.by, h => ({
        ...h,
        faceUp: [...h.faceUp, flipped],
      }));
      return advanceTurn(next);
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

export const reducer = (state, action) => {
  if (action.type === 'START') {
    const initial = createGame(action.payload);
    return { ...initial, log: [stamp(action, 0)] };
  }
  if (!state) throw new Error('Game has not been started');
  const stamped = stamp(action, state.log.length);
  const next = apply(state, stamped);
  return { ...next, log: [...state.log, stamped] };
};
