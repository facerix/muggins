# Muggins — v1 Development Plan

## Context

The repo currently holds a Facerix PWA scaffold (DataStore, service worker, `h()`/`CreateSvg`, two web components, `<main>` empty) and the game rules in `docs/how-to-play.md`. There is no game code, no domain model, no test framework, and no persisted game state. We need a phased development plan to bring the actual Muggins card game online as a v1 (hot-seat + AI) and leave a clean path to v2 (online multiplayer over PHP).

## Decisions (already made together)

| Topic | Decision |
|------|---------|
| v1 player model | Hot-seat + AI, 2–4 players, any human/AI mix |
| AI personas | Three: **Random**, **Greedy**, **Strategist** |
| Muggins enforcement | Manual call button for humans; Strategist persona also calls |
| Card rendering | Programmatic SVG (rank + suit), themable via CSS — customization extensible later |
| Test runner | Node's built-in (`node:test`, `node:assert`) — zero new deps |
| Persistence | Auto-persist via DataStore, single record with reserved id `'active-game'` |
| Hot-seat handoff | No privacy interstitial at v1 (defer) |
| v2 transport target | **SSE + POST** on PHP backend (committed); v1 engine shapes action envelopes accordingly |
| v2 readiness rigor | Pure-reducer engine, seeded RNG (state field), JSON action log, no DOM/`Date.now`/`Math.random` inside reducer |
| Scope appetite | Phased open-ended; every phase leaves the app shippable |
| Layout | Responsive from day one, mobile and desktop both first-class |
| Undo / take-back | **None** at v1 (consistent with manual Muggins, simpler wire format) |

## Architecture overview

```
/
├── src/
│   ├── engine/                    # PURE — works in Node and browser
│   │   ├── card.js                # rank/suit constants, helpers
│   │   ├── deck.js                # buildDeck(), shuffle(rng)
│   │   ├── rng.js                 # seeded PRNG (Mulberry32, ~5 lines)
│   │   ├── actions.js             # action creators + envelope shape
│   │   ├── reducer.js             # (state, action) → newState
│   │   ├── legalMoves.js          # legal plays / muggins detection
│   │   ├── selectors.js           # derived views (top of pile, winner, etc.)
│   │   ├── gameState.js           # createGame(opts), state shape
│   │   └── ai/
│   │       ├── persona.js         # interface: chooseAction, shouldCallMuggins
│   │       ├── random.js
│   │       ├── greedy.js
│   │       └── strategist.js
│   ├── game/                      # GLUE — browser only
│   │   ├── runtime.js             # dispatch loop, AI scheduling, persistence wiring
│   │   └── persistence.js         # active-game slot on DataStore
│   ├── views/                     # UI — browser only
│   │   ├── cardSvg.js             # programmatic SVG card face
│   │   ├── setup.js               # pre-game form (players, personas)
│   │   ├── game.js                # board, hands, action affordances
│   │   └── postGame.js            # winner screen
│   └── (existing) DataStore.js, domUtils.js, ServiceWorkerManager.js, uuid.js
├── components/
│   └── (new web components as needed: card-pile, player-hand, muggins-button)
├── tests/
│   └── engine/*.test.js           # node:test, run via `node --test`
├── index.html, index.js           # entry — mounts setup or resumes active game
└── main.css                       # extends existing theme
```

### Import-path rule (important)

- **Engine modules** import each other with **relative paths** (`./card.js`) so they work in Node's test runner *and* the browser.
- **UI/glue modules** continue using **absolute web-root paths** (`/src/engine/reducer.js`) per existing AGENTS.md convention.

### State shape (sketch)

```js
{
  schemaVersion: 1,
  seed: 0xABCD1234,             // initial RNG seed — replayable
  rngState: <number>,            // current PRNG state, advanced as actions fire
  players: [{ id, name, kind: 'human' | 'ai-random' | 'ai-greedy' | 'ai-strategist' }],
  hands: [{ playerId, faceDown: Card[], faceUp: Card[] }],
  displayPiles: [Card[], Card[], Card[], Card[]],
  turn: { playerId, phase: 'flip' | 'decide' | 'awaiting-muggins' | 'done' },
  flippedCard: Card | null,      // current player's just-flipped top card
  log: Action[],                 // append-only; the v2 wire format
  winner: playerId | null,
}
```

### Action envelope

```js
{ type: 'PLAY' | 'HOLD' | 'CALL_MUGGINS' | 'START' | 'FLIP_HELD' | ...,
  payload: {...},
  by: playerId,                  // who issued
  at: <log index>,               // monotonic, set on dispatch
}
```

This envelope is what SSE will push and POST will accept in v2 — verbatim.

## Phases

Each phase ends in a state where the app is committable, lints, tests pass, and no UI regressions exist.

### Phase 0 — Test runner & scaffold (foundation) — ✅ Complete (2026-04-28)
- ✅ Added `"test": "node --test"` to `package.json`. Uses Node's auto-discovery (recursive `**/*.test.{cjs,mjs,js}`, skips `node_modules` natively) — simpler and more shell-portable than the originally-planned glob.
- ✅ Added `"type": "module"` to `package.json` to align with the project's ES-modules-everywhere posture and silence Node's `MODULE_TYPELESS_PACKAGE_JSON` warning.
- ✅ Converted `.prettierrc.js` from CJS (`module.exports`) to ESM (`export default`) to work under `"type": "module"`.
- ✅ Created `src/engine/`, `src/game/`, `src/views/` with `.gitkeep` placeholders.
- ✅ Smoke test at `tests/engine/smoke.test.js` confirms the runner is wired.
- Pre-existing prettier drift in `about.js` and `src/ServiceWorkerManager.js` was reformatted as a side effect of the format step.
- `sw-core.js::getCoreResources()` registration not yet needed (no new shipped files yet).

### Phase 0.5 — Backfill: existing-utility tests
Targeted regression coverage on existing pure code, keeping zero-dep posture:
- `tests/unit/uuid.test.js`: `v4()` and `v4WithTimestamp()` against the v4 variant-1 regex; uniqueness across many calls; timestamp-prefix matches `Date.now().toString(16).slice(0, 8)`.
- `tests/unit/domUtils.test.js`: pure helpers only — `queryParams` (encoding, empty object), `listify` (ordered/unordered, empty array), `pluralize` (singular/plural/zero), `jsx` (number/string/array interpolation, others skipped).
- Skip: `DataStore.js` (defer to Phase 3 — modified there anyway), `ServiceWorkerManager.js` (browser-only, no good Node test path), DOM helpers in `domUtils.js` (`h`, `CreateSvg`, `htmlToMarkdown`, `isDevelopmentMode`).
- **Verify:** `npm test` green; coverage extends across two test directories, validating auto-discovery handles nesting.

### Phase 1 — Engine core (TDD)
Tests written first for each module:
- `card.js`: rank order, suit constants, `isAdjacent(a, b)` (one higher or lower, no wrap).
- `rng.js`: same seed → same sequence; sequence advances state.
- `deck.js`: `buildDeck()` returns 52 unique cards; `shuffle(deck, rng)` is deterministic per seed.
- `gameState.js::createGame({ seed, players })`:
  - 4 cards to display piles (face-up).
  - Remaining 48 dealt evenly across 2–4 players (handles uneven remainders by giving spares to first players).
- `legalMoves.js::legalPlaysFor(state, card)`: returns list of `{ pileType, pileId }` targets across all display piles + every other player's face-up pile top.
- `reducer.js`:
  - `START` → produces initial state.
  - `FLIP` → moves top of `faceDown` to `flippedCard`.
  - `PLAY { target }` → places `flippedCard` onto target if legal, else throws.
  - `HOLD` → places `flippedCard` onto own face-up pile.
  - `FLIP_HELD` → when `faceDown` empty, flip face-up pile back to face-down.
  - Turn advances correctly; winner detected when both piles empty.
- **Verify:** Run `npm test`; all engine tests pass. No browser code yet.

### Phase 2 — AI personas (TDD)
- `ai/persona.js`: documented shape `{ chooseAction(state, playerId, rng), shouldCallMuggins(state, playerId) }`.
- `ai/random.js`: 50% chance to play if legal, else hold; never calls Muggins.
- `ai/greedy.js`: always plays a legal card if one exists; never calls Muggins.
- `ai/strategist.js`: prefers plays onto opponents' face-up piles; calls Muggins when legal play was missed by another player.
- Integration test: run a full game with 4 AI personas, deterministic seed, assert it terminates with a single winner and a reproducible log.
- **Verify:** `npm test` green; deterministic full-game replay test included.

### Phase 3 — Persistence + runtime glue
- `src/game/persistence.js`:
  - Reserve id `'active-game'` for the current game record. Add a small extension to `DataStore` to allow setting/replacing a record by a *given* id (today `addItem` overwrites with a new uuid). Keep API minimal: `setActiveGame(state)`, `getActiveGame()`, `clearActiveGame()`.
  - Snapshot includes the full action log (state.log).
- `src/game/runtime.js`:
  - `dispatch(action)`: validate → reduce → persist → emit change event.
  - `tickAI()`: if active player is AI, schedule `chooseAction` after a configurable delay (default ~1000 ms — gives humans time to call Muggins on AI mistakes).
  - Auto-resume: on app load, if `getActiveGame()` returns a state, render the game view; else render setup.
- **Verify:** Manually exercise via dev console: create state, persist, reload page, confirm state survives. Round-trip unit test in `tests/`.

### Phase 4 — Card UI primitives
- `src/views/cardSvg.js::cardFace({ rank, suit })`: returns an SVG element via existing `CreateSvg`. Layout: corner rank + suit glyph, large center suit, mirrored corner. Suit colors via CSS custom properties on `:root` (theme-friendly).
- `src/views/cardSvg.js::cardBack()`: programmatic back (or use existing `/images/cards-stack.svg`).
- New web component `<card-pile>` in `components/`: renders a stack with the top card visible (face-up or face-down).
- Static fixture page `views-test.html` (dev-only, not registered in service worker) that renders a known game state for visual verification across breakpoints.
- **Verify:** Open fixture page on phone-width and desktop-width; confirm rendering, no layout breaks.

### Phase 5 — Setup screen
- Render at `<main>` when no active game exists.
- Form: 2–4 player rows; each row has a name input and a kind selector (`Human`, `Random AI`, `Greedy AI`, `Strategist AI`).
- "Start game" → builds initial state via `createGame({ seed: cryptoRandom(), players })`, persists via `setActiveGame`, swaps view.
- "Resume game" button visible if a saved game exists.
- "Abandon game" clears active game and returns to setup.
- **Verify:** Manually create games of 2/3/4 players with various human-AI mixes; confirm persistence; confirm reload resumes.

### Phase 6 — Game view + turn loop
- Render board: 4 display piles in the center; player areas around them (CSS grid; `auto-fit` for 2–4).
- Active human turn UI:
  - Big "Flip" button → `dispatch(FLIP)`.
  - After flip, show the card; render highlight on every legal target pile; tap a pile to play, or "Hold" button.
- AI turns: runtime drives them after configured delay; show a small "AI is thinking…" indicator.
- Auto-resume on reload via existing persistence wiring.
- **Verify:** Play complete games hot-seat + AI, 2- and 4-player, on phone and desktop. Confirm no illegal-move UI is reachable.

### Phase 7 — Muggins button
- Decide false-call penalty (open question — see below). Recommend: **no penalty for a wrong call** to keep UX low-stakes; simply ignore. Confirm before implementing.
- "Muggins!" affordance visible to every *human* seat, callable any time another player has just held.
- On press: engine validates whether the most recent `HOLD` action had a legal play available at the moment it was dispatched (using the action log + state replay or a stored `legalAtFlip` field on the action). If yes → each other player gives the offender one card from their face-down pile.
- Strategist persona issues `CALL_MUGGINS` via runtime when it spots a miss; gated by the same engine validator.
- **Verify:** Engine unit tests for valid + invalid Muggins detection; manual playtest with a Random AI seat (susceptible to Muggins) and a Strategist (will call).

### Phase 8 — Win screen + new game
- When `state.winner` is set, runtime swaps to `views/postGame.js`: winner name, simple stats (turns played, Muggins calls), "Play again with same seats" / "Back to setup" buttons.
- Past games are NOT retained at v1 (single-slot persistence). Note as a future enhancement.
- **Verify:** Confirm post-game view renders; restart flow works.

### Phase 9 — Polish (optional, post-MVP)
Each item independently shippable:
- Dealing/playing animations via View Transitions API (already enabled in `main.css`).
- Mobile-friendly layout refinements after real-device playtesting.
- AI think indicator with persona-specific speed.
- Sound effect hooks (no assets bundled by default).
- Accessibility pass: focus order, ARIA labels on cards/piles, keyboard play.

## Key files to modify (existing)

| File | Change |
|------|--------|
| `package.json` | Add `test` script |
| `src/DataStore.js` | Add minimal `setActiveGame` / `getActiveGame` / `clearActiveGame` API (or fix `addItem` to honor a provided id) |
| `index.js` | Boot logic: resume vs setup |
| `index.html` | Possibly add a `<game-board>` mount point or keep `<main>` |
| `main.css` | Add board grid + card styles; respect existing theme tokens |
| `sw-core.js::getCoreResources()` | Register every new JS/HTML/CSS file as it ships |
| `AGENTS.md` | Document engine vs UI import-path rule once Phase 1 lands |

## Existing utilities to reuse (do not reimplement)

- `h()` and `CreateSvg()` from `src/domUtils.js` — all DOM creation.
- `isDevelopmentMode()` from `src/domUtils.js` — gate dev-only fixture page.
- `v4WithTimestamp()` from `src/uuid.js` — player ids, action ids if needed.
- DataStore `change` event pattern — runtime emits via DataStore so views can subscribe uniformly.
- `<update-notification>`, `<confirmation-modal>` web components in `components/`.
- View Transitions already declared in `main.css` — animations layer on without setup.

## Open questions to resolve before the affected phase

1. **False-Muggins penalty** (blocks Phase 7). Rules in `docs/how-to-play.md` are silent. Recommend no penalty (call simply fails). Confirm before Phase 7.
2. **AI think delay default** (Phase 3 / Phase 6). Recommend 1000 ms default with a dev-mode override; revisit after playtesting.
3. **Card-back asset**: programmatic SVG vs. existing `/images/cards-stack.svg` — settle in Phase 4.
4. **Whether `addItem` should honor a provided id** vs. adding a separate singleton API — design choice in Phase 3 (lean toward a separate API to avoid changing existing semantics).

## Verification strategy

- **Unit tests** (`npm test`): every engine and AI module. Goal: full-game replay test from a seed produces a stable winner and stable log.
- **Manual browser testing** at each phase: open `http://localhost:8090`, exercise the new behavior, verify console is clean, verify service worker still updates correctly.
- **Responsive verification**: each UI phase tested at phone (≤575px) and desktop (≥992px) widths via DevTools device toolbar.
- **Persistence verification**: reload mid-game on every phase touching state; confirm resume works.
- **Lint + format gate** before each commit: `npm run format && npm run lint`.
