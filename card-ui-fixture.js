import '/components/CardPile.js';
import { createGame } from '/src/engine/gameState.js';
import { h } from '/src/domUtils.js';

const makeSection = title => {
  const grid = h('div', { className: 'views-test__grid' }, []);
  const sec = h('section', { className: 'views-test__section' }, [
    h('h2', { className: 'views-test__title', textContent: title }),
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
  const root = document.getElementById('fixture-root');
  if (!root) return;

  const game = createGame({
    seed: 4242,
    players: [
      { name: 'North', kind: 'human' },
      { name: 'East', kind: 'human' },
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

  root.append(s1, s2, s3);
};

mount();
