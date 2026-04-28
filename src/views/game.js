import { flip, flipHeld, hold, play, playHeld } from '/src/engine/actions.js';
import { legalPlaysFor } from '/src/engine/legalMoves.js';
import { personaForKind } from '/src/engine/ai/persona.js';
import { h, isDevelopmentMode } from '/src/domUtils.js';
import {
  DEV_AI_DELAY_MS_STORAGE_KEY,
  configureAiDelay,
  configureAiJitterEnabled,
  isAiScheduled,
} from '/src/game/runtime.js';
import '/components/CardPile.js';

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
 * @param {{ getState: () => object | null, dispatch: (a: object) => object, onAbandon: () => void, onChangeSetup?: () => void }} opts
 */
export function mountGameView(main, { getState, dispatch, onAbandon, onChangeSetup }) {
  if (typeof main.__cleanupGame === 'function') {
    main.__cleanupGame();
    main.__cleanupGame = undefined;
  }

  main.replaceChildren();

  const state = getState();
  if (!state) return;

  const section = h('section', { className: 'game-board' }, []);

  const winner = state.winner;
  const winnerName = winner ? (state.players.find(p => p.id === winner)?.name ?? winner) : null;

  if (winner) {
    const banner = h('div', {
      className: 'game-board__banner game-board__banner--winner',
      role: 'status',
    });
    banner.textContent = `Winner: ${winnerName}`;
    section.appendChild(banner);
  }

  const aiHint = h('p', {
    className: 'game-board__ai-hint u-muted u-hidden',
    'aria-live': 'polite',
  });
  aiHint.textContent = 'AI is thinking…';

  const toolbar = h('div', { className: 'game-board__toolbar' }, []);
  toolbar.appendChild(aiHint);

  if (isDevelopmentMode()) {
    const raw = globalThis.localStorage?.getItem(DEV_AI_DELAY_MS_STORAGE_KEY);
    const parsed = raw != null ? Number.parseInt(raw, 10) : 0;
    const initialMs = Number.isFinite(parsed) ? Math.min(8000, Math.max(0, parsed)) : 0;

    const devRow = h('div', { className: 'game-board__dev-ai' }, []);
    const devLabel = h(
      'label',
      { className: 'game-board__dev-ai-label', htmlFor: 'game-dev-ai-delay' },
      []
    );
    devLabel.textContent = 'AI delay (ms, dev)';

    const range = h('input', {
      type: 'range',
      id: 'game-dev-ai-delay',
      className: 'game-board__dev-ai-range',
      min: '0',
      max: '8000',
      step: '50',
      value: String(initialMs),
    });

    const valueOut = h('span', { className: 'game-board__dev-ai-value u-muted' }, []);
    valueOut.textContent = String(initialMs);

    const syncDelay = ms => {
      configureAiDelay(ms);
      configureAiJitterEnabled(false);
      globalThis.localStorage?.setItem(DEV_AI_DELAY_MS_STORAGE_KEY, String(ms));
      valueOut.textContent = String(ms);
    };

    range.addEventListener('input', () => {
      const ms = Number.parseInt(range.value, 10);
      syncDelay(Number.isFinite(ms) ? ms : 0);
    });

    devRow.appendChild(devLabel);
    devRow.appendChild(range);
    devRow.appendChild(valueOut);
    toolbar.appendChild(devRow);
  }

  const syncAiHint = () => {
    const s = getState();
    if (!s || s.winner || s.turn.phase === 'done') {
      aiHint.classList.add('u-hidden');
      return;
    }
    const pid = s.turn.playerId;
    const row = s.players.find(p => p.id === pid);
    const isAi = Boolean(row && personaForKind(row.kind));
    const show = isAi && isAiScheduled();
    aiHint.classList.toggle('u-hidden', !show);
  };

  const pulseId = window.setInterval(syncAiHint, 120);
  main.__cleanupGame = () => {
    window.clearInterval(pulseId);
  };
  syncAiHint();

  section.appendChild(toolbar);

  const activePid = state.turn.playerId;
  const activeHuman = !winner && isHumanSeat(state, activePid) && state.turn.phase !== 'done';

  // playCtx: drives the "click a highlighted target" affordance.
  // - decide phase: target plays the flipped card (PLAY).
  // - flip phase with a held-top that has legal targets: target plays the held-top (PLAY_HELD).
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
    } else if (state.turn.phase === 'flip') {
      const hand = state.hands.find(h => h.playerId === activePid);
      const top = hand?.faceUp?.[hand.faceUp.length - 1];
      if (top) {
        const heldLegals = legalPlaysFor(state, top);
        if (heldLegals.length > 0) {
          playCtx = {
            kind: 'held',
            card: top,
            legals: heldLegals,
            dispatchPlay: target => {
              const cur = getState();
              if (!cur || cur.winner) return;
              if (cur.turn.playerId !== activePid || cur.turn.phase !== 'flip') return;
              const curHand = cur.hands.find(h => h.playerId === activePid);
              const curTop = curHand?.faceUp?.[curHand.faceUp.length - 1];
              if (!curTop) return;
              if (!legalPlaysFor(cur, curTop).some(t => targetsEqual(t, target))) return;
              dispatch(playHeld(activePid, target));
            },
          };
        }
      }
    }
  }

  if (activeHuman) {
    const controls = h('div', { className: 'game-board__controls' }, []);

    if (state.turn.phase === 'flip') {
      if (playCtx?.kind === 'held') {
        const hint = h('p', { className: 'game-board__hint u-muted' }, []);
        hint.textContent =
          'Your held card has a legal play — tap a highlighted pile, or flip anyway (Muggins risk).';
        controls.appendChild(hint);
      }

      const hand = state.hands.find(h => h.playerId === activePid);
      if (hand && hand.faceDown.length > 0) {
        const flipBtn = h('button', { type: 'button', className: 'game-board__flip btn' }, []);
        flipBtn.textContent = 'Flip';
        flipBtn.addEventListener('click', () => dispatch(flip(activePid)));
        controls.appendChild(flipBtn);
      } else if (hand && hand.faceDown.length === 0) {
        const fhBtn = h('button', { type: 'button', className: 'game-board__flip-held btn' }, []);
        fhBtn.textContent = 'Flip held pile';
        fhBtn.addEventListener('click', () => dispatch(flipHeld(activePid)));
        controls.appendChild(fhBtn);
      }
    } else if (state.turn.phase === 'decide' && state.flippedCard) {
      const fc = state.flippedCard;
      const reveal = h('div', { className: 'game-board__flipped' }, []);
      const flippedLabel = h('span', { className: 'game-board__mini-label u-muted' }, []);
      flippedLabel.textContent = 'Played card';
      const flippedPile = h('card-pile', {}, []);
      flippedPile.setAttribute('count', '1');
      flippedPile.setAttribute('rank', String(fc.rank));
      flippedPile.setAttribute('suit', fc.suit);
      flippedPile.setAttribute('face', 'up');
      reveal.appendChild(flippedLabel);
      reveal.appendChild(flippedPile);

      const holdBtn = h('button', { type: 'button', className: 'game-board__hold btn' }, []);
      holdBtn.textContent = 'Hold';
      holdBtn.addEventListener('click', () => dispatch(hold(activePid)));

      controls.appendChild(reveal);
      controls.appendChild(holdBtn);
    }

    section.appendChild(controls);
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
    const hid = playerRow.id;
    const hand = state.hands.find(h => h.playerId === hid);
    const isActive = state.turn.playerId === hid && !winner;
    const slot = h('div', { className: 'game-board__player' }, []);
    if (isActive) slot.classList.add('game-board__player--active');

    const head = h('div', { className: 'game-board__player-head' }, []);
    const nameEl = h('span', { className: 'game-board__player-name' }, []);
    nameEl.textContent = playerRow.name;
    head.appendChild(nameEl);
    const badge = h('span', { className: 'game-board__player-kind u-muted' }, []);
    badge.textContent =
      playerRow.kind === 'human'
        ? 'Human'
        : playerRow.kind === 'ai-random'
          ? 'Random AI'
          : playerRow.kind === 'ai-greedy'
            ? 'Greedy AI'
            : playerRow.kind === 'ai-strategist'
              ? 'Strategist AI'
              : playerRow.kind;
    head.appendChild(badge);
    slot.appendChild(head);

    const cardsRow = h('div', { className: 'game-board__player-cards' }, []);

    const stock = h('div', { className: 'game-board__stock' }, []);
    const stockLabel = h('span', { className: 'game-board__mini-label u-muted' }, []);
    stockLabel.textContent = 'Deck';
    const stockPile = h('card-pile', {}, []);
    stockPile.setAttribute('face', 'down');
    stockPile.setAttribute('count', String(hand?.faceDown?.length ?? 0));
    stock.appendChild(stockLabel);
    stock.appendChild(stockPile);

    const held = h('div', { className: 'game-board__held' }, []);
    const heldLabel = h('span', { className: 'game-board__mini-label u-muted' }, []);
    heldLabel.textContent = 'Held';
    const heldUp = hand?.faceUp ?? [];
    const heldTop = heldUp[heldUp.length - 1];
    const heldPile = h('card-pile', {}, []);
    if (!heldTop) {
      heldPile.setAttribute('count', '0');
    } else {
      heldPile.setAttribute('count', String(heldUp.length));
      heldPile.setAttribute('rank', String(heldTop.rank));
      heldPile.setAttribute('suit', String(heldTop.suit));
      heldPile.setAttribute('face', 'up');
    }

    const oppTarget = { type: 'opponent', playerId: hid };
    const canPlayOpp = !!playCtx && playCtx.legals.some(t => targetsEqual(t, oppTarget));

    if (canPlayOpp) {
      held.classList.add('game-board__held--legal');
      held.setAttribute('role', 'button');
      held.tabIndex = 0;
      held.addEventListener('click', () => {
        playCtx.dispatchPlay(oppTarget);
      });
      held.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          held.click();
        }
      });
    }

    // Highlight the active player's own held pile when a PLAY_HELD is available.
    if (playCtx?.kind === 'held' && hid === activePid) {
      held.classList.add('game-board__held--source');
    }

    held.appendChild(heldLabel);
    held.appendChild(heldPile);
    cardsRow.appendChild(stock);
    cardsRow.appendChild(held);
    slot.appendChild(cardsRow);

    playersHost.appendChild(slot);
  });

  section.appendChild(playersHost);

  const foot = h('div', { className: 'game-board__foot' }, []);
  const btns = h('div', { className: 'game-board__foot-buttons' }, []);

  if (typeof onChangeSetup === 'function') {
    const setupBtn = h('button', { type: 'button', className: 'btn' }, []);
    setupBtn.textContent = 'Change setup';
    setupBtn.addEventListener('click', () => onChangeSetup());
    btns.appendChild(setupBtn);
  }

  const abandonBtn = h('button', { type: 'button', className: 'btn' }, []);
  abandonBtn.textContent = 'Abandon game';
  abandonBtn.addEventListener('click', () => onAbandon());
  btns.appendChild(abandonBtn);

  foot.appendChild(btns);
  section.appendChild(foot);

  main.appendChild(section);
}
