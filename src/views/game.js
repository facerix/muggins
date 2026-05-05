import { callMuggins, flip, flipHeld, hold, play } from '/src/engine/actions.js';
import { legalPlaysFor } from '/src/engine/legalMoves.js';
import { h } from '/src/domUtils.js';
import '/components/CardPile.js';
import '/components/PlayerHand.js';

/** @param {{ type: string } & object} a @param {{ type: string } & object} b */
function targetsEqual(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  return a.type === 'display' ? a.pileIndex === b.pileIndex : a.playerId === b.playerId;
}

/**
 * @param {object} state
 * @param {string} playerId
 */
function isHumanSeat(state, playerId) {
  const row = state.players.find(p => p.id === playerId);
  return row?.kind === 'human';
}

/**
 * @param {HTMLElement} main
 * @param {{ getState: () => object | null, dispatch: (a: object) => object, uiFrozen?: boolean }} opts
 */
export function mountGameView(main, { getState, dispatch, uiFrozen }) {
  if (typeof main.__cleanupGame === 'function') {
    main.__cleanupGame();
    main.__cleanupGame = undefined;
  }

  main.replaceChildren();

  const state = getState();
  if (!state) return;

  const section = h('section', { className: 'game-board' }, []);
  if (uiFrozen) {
    section.classList.add('game-board--frozen');
    section.setAttribute('inert', '');
  }

  const activePid = state.turn.playerId;
  const activeHuman = isHumanSeat(state, activePid) && state.turn.phase !== 'done';

  main.__cleanupGame = () => {};

  // Muggins button: active human in flip phase when the previous log entry is a
  // potentially-muggable action (HOLD/FLIP/FLIP_HELD) by another player. Engine validates
  // on click; mis-calls penalize the caller (per docs/how-to-play.md § Bad calls).
  const lastEntry = state.log[state.log.length - 1];
  const muggableTail =
    lastEntry &&
    (lastEntry.type === 'HOLD' || lastEntry.type === 'FLIP' || lastEntry.type === 'FLIP_HELD') &&
    lastEntry.by !== activePid;
  if (activeHuman && state.turn.phase === 'flip' && muggableTail) {
    const mugBtn = h('button', { type: 'button', className: 'game-board__muggins btn' }, []);
    mugBtn.textContent = 'Muggins!';
    mugBtn.addEventListener('click', () => dispatch(callMuggins(activePid)));
    section.appendChild(mugBtn);
  }

  // playCtx: drives the "click a highlighted target" affordance.
  // Currently only active in the decide phase: target plays the flipped card (PLAY).
  // TODO: re-add PLAY_HELD targeting behind hint-mode setting.
  let playCtx = null;
  if (activeHuman) {
    if (state.turn.phase === 'decide' && state.flippedCard) {
      playCtx = {
        kind: 'flipped',
        card: state.flippedCard,
        legals: legalPlaysFor(state, state.flippedCard),
        dispatchPlay: target => {
          const cur = getState();
          if (!cur || cur.winner) return;
          if (cur.turn.playerId !== activePid || cur.turn.phase !== 'decide') return;
          if (!cur.flippedCard) return;
          if (!legalPlaysFor(cur, cur.flippedCard).some(t => targetsEqual(t, target))) return;
          dispatch(play(activePid, target));
        },
      };
    }
  }

  const center = h('div', { className: 'game-board__center' }, []);
  const pilesGrid = h('div', { className: 'game-board__piles' }, []);

  state.displayPiles.forEach((pile, pileIndex) => {
    const top = pile[pile.length - 1];
    const wrap = h('div', { className: 'game-board__pile-slot' }, []);
    const label = h('span', { className: 'game-board__pile-label u-muted' }, []);
    label.textContent = `Center ${pileIndex + 1}`;

    const cp = h('card-pile', {}, []);
    if (!top) {
      cp.setAttribute('count', '0');
    } else {
      cp.setAttribute('count', String(pile.length));
      cp.setAttribute('rank', String(top.rank));
      cp.setAttribute('suit', top.suit);
      cp.setAttribute('face', 'up');
    }

    const target = { type: 'display', pileIndex };
    const playable = !!playCtx && playCtx.legals.some(t => targetsEqual(t, target));

    if (playable) {
      wrap.classList.add('game-board__pile-slot--legal');
      wrap.setAttribute('role', 'button');
      wrap.tabIndex = 0;
      wrap.addEventListener('click', () => {
        playCtx.dispatchPlay(target);
      });
      wrap.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          wrap.click();
        }
      });
    }

    wrap.appendChild(label);
    wrap.appendChild(cp);
    pilesGrid.appendChild(wrap);
  });

  center.appendChild(pilesGrid);
  section.appendChild(center);

  const playersHost = h('div', { className: 'game-board__players' }, []);

  state.players.forEach(playerRow => {
    const hand = state.hands.find(h => h.playerId === playerRow.id);
    const isActive = state.turn.playerId === playerRow.id;
    const isDeciding = isActive && state.turn.phase === 'decide' && !!state.flippedCard;

    const ph = h('player-hand', {});
    ph.setAttribute('name', playerRow.name);
    ph.setAttribute('kind', playerRow.kind);
    ph.setAttribute('playerId', playerRow.id);
    // During the decide phase the flipped card has left hand.faceDown and lives
    // in state.flippedCard.  Prepend it back so the component can show it face-up.
    ph.drawPile = isDeciding
      ? [state.flippedCard, ...(hand?.faceDown ?? [])]
      : hand?.faceDown ?? [];
    ph.discardPile = hand?.faceUp ?? [];
    ph.isActive = isActive;
    ph.isFlipped = isDeciding;

    ph.addEventListener('flipped', () => {
      const cur = getState();
      if (!cur || cur.winner) return;
      const curHand = cur.hands.find(h => h.playerId === playerRow.id);
      if (!curHand) return;
      if (curHand.faceDown.length > 0) {
        dispatch(flip(playerRow.id));
      } else {
        dispatch(flipHeld(playerRow.id));
      }
    });

    ph.addEventListener('held', () => {
      dispatch(hold(playerRow.id));
    });

    playersHost.appendChild(ph);
  });

  section.appendChild(playersHost);

  main.appendChild(section);
}
