import '/components/CardPile.js';
import '/components/PlayerHand.js';
import { createGame } from '/src/engine/gameState.js';
import { h } from '/src/domUtils.js';

const makeSection = title => {
  const grid = h('div', { className: 'views-test__grid' }, []);
  const sec = h('details', { className: 'views-test__section' }, [
    h('summary', { className: 'views-test__title', textContent: title }),
    grid,
  ]);
  return { sec, grid };
};

const cell = (labelText, pileEl) => {
  const wrap = h('div', { className: 'views-test__cell' }, [
    h('span', { className: 'views-test__label', textContent: labelText }),
    pileEl,
  ]);
  return wrap;
};

const mount = () => {
  let activePlayerHand = null;
  const root = document.getElementById('fixture-root');
  if (!root) return;

  const game = createGame({
    seed: 4242,
    players: [
      { name: 'North', kind: 'human' },
      { name: 'East', kind: 'ai-random' },
    ],
  });

  const { sec: s1, grid: matrix } = makeSection('Suit + rank matrix');
  const demoRanks = [1, 2, 10, 11, 12, 13];
  const demoSuits = ['H', 'D', 'C', 'S'];
  for (const suit of demoSuits) {
    for (const rank of demoRanks) {
      const pile = document.createElement('card-pile');
      pile.setAttribute('face', 'up');
      pile.setAttribute('rank', String(rank));
      pile.setAttribute('suit', suit);
      pile.setAttribute('count', '1');
      matrix.appendChild(cell(`${rank}${suit}`, pile));
    }
  }

  const { sec: s2, grid: g2 } = makeSection('Display piles (seed 4242)');
  game.displayPiles.forEach((pile, i) => {
    const top = pile[pile.length - 1];
    const el = document.createElement('card-pile');
    el.setAttribute('face', 'up');
    el.setAttribute('rank', String(top.rank));
    el.setAttribute('suit', top.suit);
    el.setAttribute('count', String(pile.length));
    g2.appendChild(cell(`Pile ${i + 1} (${pile.length})`, el));
  });

  const { sec: s3, grid: g3 } = makeSection('Stacks, backs & hand samples');
  const addPile = (label, configure) => {
    const el = document.createElement('card-pile');
    configure(el);
    g3.appendChild(cell(label, el));
  };

  addPile('Face-down ×5', el => {
    el.setAttribute('face', 'down');
    el.setAttribute('count', '5');
  });
  addPile('Face-down ×1', el => {
    el.setAttribute('face', 'down');
    el.setAttribute('count', '1');
  });
  addPile('Empty pile', el => {
    el.setAttribute('count', '0');
  });

  const hand = game.hands[0];
  const downTop = hand.faceDown[hand.faceDown.length - 1];
  if (downTop) {
    addPile(`p0 face-down (${hand.faceDown.length})`, el => {
      el.setAttribute('face', 'down');
      el.setAttribute('count', String(Math.min(5, hand.faceDown.length)));
    });
    addPile('p0 top as face-up', el => {
      el.setAttribute('face', 'up');
      el.setAttribute('rank', String(downTop.rank));
      el.setAttribute('suit', downTop.suit);
      el.setAttribute('count', '3');
    });
  }

  const g4 = h('div', { className: 'hands-test__grid' }, []);
  const s4 = h('section', { className: 'hands-test__section' }, [
    h('h2', { className: 'hands-test__title', textContent: 'Player hands' }),
    g4,
  ]);

  const player1 = game.players[0];
  const player1Hand = game.hands.find(h => h.playerId === player1.id);
  const hand1 = h('player-hand', { playerId: player1.id, name: player1.name, kind: player1.kind });
  hand1.drawPile = player1Hand.faceDown;
  hand1.discardPile = player1Hand.faceUp;

  g4.appendChild(
    h('div', { className: 'u-flex u-flex-column gap-2' }, [
      hand1,
      h('button', { className: 'btn', innerText: 'Activate' }),
    ])
  );

  const player2 = game.players[1];
  const player2Hand = game.hands.find(h => h.playerId === player2.id);
  const hand2 = h('player-hand', { playerId: player2.id, name: player2.name, kind: player2.kind });
  hand2.drawPile = player2Hand.faceDown;
  hand2.discardPile = player2Hand.faceUp;
  g4.appendChild(
    h('div', { className: 'u-flex u-flex-column gap-2' }, [
      hand2,
      h('button', { className: 'btn', innerText: 'Activate' }),
    ])
  );

  g4.addEventListener('click', e => {
    if (e.target.matches('button')) {
      if (activePlayerHand) {
        activePlayerHand.isActive = false;
      }
      activePlayerHand = e.target.parentElement.querySelector('player-hand');
      activePlayerHand.isActive = true;
    }
  });
  g4.addEventListener('flipped', e => {
    console.log('flipped', e.detail, e.target);
    const activePlayerDrawPile = activePlayerHand.drawPile;
    const activePlayerDiscardPile = activePlayerHand.discardPile;
    const flippedCard = activePlayerDrawPile[0];
    console.log('flippedCard:', flippedCard);
  });
  g4.addEventListener('held', e => {
    console.log('held', e.detail, e.target);
    const activePlayerDrawPile = activePlayerHand.drawPile;
    const activePlayerDiscardPile = activePlayerHand.discardPile;
    const flippedCard = activePlayerDrawPile.shift();
    activePlayerDiscardPile.unshift(flippedCard);
    activePlayerHand.setAttribute('rank', String(flippedCard.rank));
    activePlayerHand.setAttribute('suit', flippedCard.suit);
    activePlayerHand.setAttribute('count', String(activePlayerDiscardPile.length));
  });

  root.append(s1, s2, s3, s4);
};

const whenLoaded = () =>
  Promise.all([customElements.whenDefined('card-pile'), customElements.whenDefined('player-hand')]);

whenLoaded().then(() => {
  mount();
});
