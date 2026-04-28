import { h } from '/src/domUtils.js';

/** @typedef {{ name: string, kind: string }} PlayerDraft */

export const PLAYER_KIND_OPTIONS = [
  { value: 'human', label: 'Human' },
  { value: 'ai-random', label: 'Random AI' },
  { value: 'ai-greedy', label: 'Greedy AI' },
  { value: 'ai-strategist', label: 'Strategist AI' },
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;

/** @returns {number} 32-bit unsigned seed */
export function randomSeed() {
  const u32 = new Uint32Array(1);
  crypto.getRandomValues(u32);
  return u32[0];
}

/**
 * @param {number} count
 * @returns {PlayerDraft[]}
 */
function defaultPlayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Player ${i + 1}`,
    kind: 'human',
  }));
}

/**
 * New game form in `<main>` (2–4 players, name + kind per row).
 * @param {HTMLElement} main
 * @param {{ onSubmit: (detail: { seed: number, players: PlayerDraft[] }) => void, hasSavedGame?: boolean, onResume?: () => void, initialPlayers?: PlayerDraft[] }} opts
 */
export function mountSetupView(main, { onSubmit, hasSavedGame, onResume, initialPlayers }) {
  main.replaceChildren();

  const section = h('section', { className: 'setup' }, []);
  const header = h('h2', { className: 'setup__title' }, []);
  header.textContent = 'New game';

  const countRow = h('div', { className: 'setup__row setup__row--count' }, []);
  const countLabel = h('label', { className: 'setup__label', htmlFor: 'setup-player-count' }, []);
  countLabel.textContent = 'Players';
  const countSelect = h(
    'select',
    { id: 'setup-player-count', className: 'setup__select setup__select--count' },
    []
  );

  const initialCount = initialPlayers?.length
    ? Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, initialPlayers.length))
    : MIN_PLAYERS;

  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
    const opt = h('option', { value: String(n) }, []);
    opt.textContent = String(n);
    if (n === initialCount) opt.selected = true;
    countSelect.appendChild(opt);
  }

  countRow.appendChild(countLabel);
  countRow.appendChild(countSelect);

  const rowsHost = h('div', { className: 'setup__players' }, []);

  /** @type {{ name: HTMLInputElement, kind: HTMLSelectElement }[]} */
  let rowBindings = [];

  const buildRows = count => {
    rowsHost.replaceChildren();
    rowBindings = [];
    const drafts = initialPlayers
      ? Array.from({ length: count }, (__, i) => {
          const nm = initialPlayers[i]?.name;
          const trimmed = typeof nm === 'string' ? nm.trim() : '';
          const name = trimmed || `Player ${i + 1}`;
          const k = initialPlayers[i]?.kind;
          const kind =
            typeof k === 'string' && PLAYER_KIND_OPTIONS.some(o => o.value === k) ? k : 'human';
          return { name, kind };
        })
      : defaultPlayers(count);
    drafts.forEach((draft, idx) => {
      const wrap = h('div', { className: 'setup__player-row' }, []);
      const legend = h('span', { className: 'setup__player-slot' }, []);
      legend.textContent = `Seat ${idx + 1}`;

      const nameInput = h('input', {
        type: 'text',
        className: 'setup__input',
        autocomplete: 'nickname',
        maxLength: 48,
      });
      nameInput.value = draft.name;
      nameInput.id = `setup-name-${idx}`;
      nameInput.setAttribute('aria-label', `Name for seat ${idx + 1}`);

      const kindSelect = h('select', { className: 'setup__select', id: `setup-kind-${idx}` }, []);
      kindSelect.setAttribute('aria-label', `Kind for seat ${idx + 1}`);
      PLAYER_KIND_OPTIONS.forEach(opt => {
        const o = h('option', { value: opt.value }, []);
        o.textContent = opt.label;
        if (opt.value === draft.kind) o.selected = true;
        kindSelect.appendChild(o);
      });

      rowBindings.push({ name: nameInput, kind: kindSelect });

      wrap.appendChild(legend);
      wrap.appendChild(nameInput);
      wrap.appendChild(kindSelect);
      rowsHost.appendChild(wrap);
    });
  };

  buildRows(initialCount);

  countSelect.addEventListener('change', () => {
    const n = Number.parseInt(countSelect.value, 10);
    if (!Number.isFinite(n)) return;
    buildRows(Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, n)));
  });

  let resumePara = null;
  if (hasSavedGame && typeof onResume === 'function') {
    resumePara = h('div', { className: 'setup__resume-banner' }, []);
    const resumeBtn = h('button', { type: 'button', className: 'setup__resume-btn btn' }, []);
    resumeBtn.textContent = 'Resume game';
    resumeBtn.addEventListener('click', () => onResume());
    const hint = h('p', { className: 'setup__resume-hint u-muted' }, []);
    hint.textContent =
      'A saved game is on device. Resume to continue without changing any settings.';
    resumePara.appendChild(hint);
    resumePara.appendChild(resumeBtn);
  }

  const startBtn = h('button', { type: 'submit', className: 'setup__start btn' }, []);
  startBtn.textContent = 'Start game';

  const form = h('form', { className: 'setup__form', noValidate: false }, []);

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const seed = randomSeed();
    const players = rowBindings.map(b => ({
      name: b.name.value.trim() || 'Player',
      kind: b.kind.value,
    }));
    onSubmit({ seed, players });
  });

  form.appendChild(countRow);
  form.appendChild(rowsHost);
  form.appendChild(startBtn);

  section.appendChild(header);
  if (resumePara) section.appendChild(resumePara);
  section.appendChild(form);

  main.appendChild(section);
}

/**
 * Placeholder until Phase 6 game board — active game loaded in memory but no board UI yet.
 * @param {HTMLElement} main
 * @param {{ summaryLine: string, detailLine?: string | null, onAbandon: () => void }} opts
 */
export function mountPendingGameView(main, { summaryLine, detailLine, onAbandon, onChangeSetup }) {
  main.replaceChildren();
  const section = h('section', { className: 'pending-game' }, []);
  const h2 = h('h2', { className: 'pending-game__title' }, []);
  h2.textContent = summaryLine;

  section.appendChild(h2);

  if (detailLine) {
    const p = h('p', { className: 'pending-game__detail u-muted' }, []);
    p.textContent = detailLine;
    section.appendChild(p);
  }

  const note = h('p', { className: 'pending-game__hint u-muted' }, []);
  note.textContent = 'Playing surface and turns ship in Phase 6.';
  section.appendChild(note);

  const btns = h('div', { className: 'pending-game__buttons' }, []);

  if (typeof onChangeSetup === 'function') {
    const changeSetup = h('button', { type: 'button', className: 'pending-game__setup btn' }, []);
    changeSetup.textContent = 'Change setup';
    changeSetup.addEventListener('click', () => onChangeSetup());
    btns.appendChild(changeSetup);
  }

  const abandon = h('button', { type: 'button', className: 'pending-game__abandon btn' }, []);
  abandon.textContent = 'Abandon game';
  abandon.addEventListener('click', () => onAbandon());
  btns.appendChild(abandon);

  section.appendChild(btns);

  main.appendChild(section);
}
