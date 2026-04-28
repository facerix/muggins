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

### Phase 0.5 — Backfill: existing-utility tests — ✅ Complete (2026-04-28)
- ✅ `tests/unit/uuid.test.js`: `v4()` and `v4WithTimestamp()` against the v4 variant-1 regex; uniqueness across many calls; timestamp-prefix matches `Date.now().toString(16).slice(0, 8)`.
- ✅ `tests/unit/domUtils.test.js`: pure helpers only — `queryParams` (encoding, empty object), `listify` (ordered/unordered, empty array), `pluralize` (singular/plural/zero), `jsx` (number/string/array interpolation, others skipped).
- Skip: `DataStore.js` (defer to Phase 3 — modified there anyway), `ServiceWorkerManager.js` (browser-only, no good Node test path), DOM helpers in `domUtils.js` (`h`, `CreateSvg`, `htmlToMarkdown`, `isDevelopmentMode`).
- **Verify:** `npm test` green; coverage extends across two test directories, validating auto-discovery handles nesting.

### Phase 1 — Engine core (TDD) — ✅ Complete (2026-04-28)
- ✅ `src/engine/card.js`: `SUITS`, `RANKS`, `ACE`/`KING` constants, `makeCard`, `isAdjacent`, `cardId`. (11 tests)
- ✅ `src/engine/rng.js`: Mulberry32 PRNG via `makeRng(seed)` with `.next()`, `.range(max)`, `.state`. State carried in game state for replay determinism. (8 tests)
- ✅ `src/engine/deck.js`: `buildDeck()` (52 unique), `shuffle(cards, rng)` (Fisher-Yates, pure). (8 tests)
- ✅ `src/engine/gameState.js`: `createGame({ seed, players })`. 2/3/4 players supported; 4 display piles; 48 cards dealt round-robin. Throws on invalid player counts. Initial state shape matches the plan sketch. (16 tests)
- ✅ `src/engine/legalMoves.js`: `legalPlaysFor(state, card)` returns `{ type: 'display', pileIndex }` and `{ type: 'opponent', playerId }` targets. Excludes current player's own face-up pile. (10 tests)
- ✅ `src/engine/actions.js`: action creators (`start`, `flip`, `flipHeld`, `play`, `hold`, `callMuggins`) producing the SSE+POST-ready envelope `{ type, payload, by, at? }`.
- ✅ `src/engine/reducer.js`: pure `(state, action) → newState`. Stamps `at` index on dispatch, appends to `state.log`. Validates preconditions and throws on illegal moves. Winner detection on PLAY (HOLD cannot win). Turn rotates after PLAY/HOLD; FLIP_HELD does not rotate. **`CALL_MUGGINS` is a stub:** the handler returns unchanged play state (only the log row is appended); validation and card penalties land in Phase 7. Replay test confirms `log.reduce(reducer, undefined)` reproduces the final state. (22 tests)
- **Result:** 75 new engine tests + 20 backfill = **95 total, all green.** Format clean, lint clean.
- **Addendum (same milestone, after Phase 1 sign-off):** `callMuggins` / `CALL_MUGGINS` were added early so Phase 2 Strategist and the wire envelope can reference the real action type; behavior remains a no-op until Phase 7 replaces the stub.

**Architecture notes captured during build:**
- Engine modules use **relative imports** (`./card.js`) so they run unchanged in Node's test runner and the browser. UI/glue layer keeps `/src/...` web-root paths.
- Player IDs are deterministic `p0`..`p3` (not UUIDs) so replay from action log is fully reproducible. Display names come from caller-supplied input.
- When a player wins, `turn.playerId` stays on the winner and `turn.phase` becomes `'done'` (rather than rotating to next). This makes the winner's seat the natural place to anchor a "you won!" highlight in the UI.

### Phase 2 — AI personas (TDD) — ✅ Complete (2026-04-28)
- ✅ `src/engine/ai/persona.js`: `{ chooseAction(state, playerId, rng), shouldCallMuggins(state, playerId) }` + `personaForKind(kind)`.
- ✅ `src/engine/ai/random.js`: if legal moves exist — 50% play (uniform random target) / 50% hold; flip vs flipHeld deterministic; never calls Muggins.
- ✅ `src/engine/ai/greedy.js`: first legal target from `legalPlaysFor`; never calls Muggins.
- ✅ `src/engine/ai/strategist.js`: opponent piles before center display piles when choosing among legals; `shouldCallMuggins` when log tail is a HOLD that skipped legal plays (**Phase 7** enforcer for `CALL_MUGGINS` payload / penalties — stub reducer unchanged).
- ✅ `src/engine/mugginsOpportunity.js`: `missedLegalOffenderIfLastHold(state)` replays log prefix to detect offender (shared with strategist + future Phase 7).
- ✅ `src/engine/replay.js`: `replayFromLog` helper for deterministic audit.
- ✅ `src/engine/ai/runFullGame.js`: automated match driver — strategist `CALL_MUGGINS` after each HOLD before active AI acts; terminates with winner or errors on loops.
- ✅ Tests: personas + muggins opportunity + replay; **integration:** `tests/engine/ai/fullGame.test.js` — seed `4242` four-AI roster, replay equality; separate determinism twin-run test (`seed 4243`).
- **Verify:** **104 tests** (`npm test` green); `npm run format` / `npm run lint` green. `sw-core.js`: no new shipped UI entrypoints yet (`runFullGame` imported from engine once runtime exists).

### Phase 3 — Persistence + runtime glue — ✅ Complete (2026-04-28)
- ✅ `DataStore.upsertItemById(id, record)` for singleton slots (does not change `addItem` uuid behavior).
- ✅ `src/game/persistence.js`: `setActiveGame(state)`, `getActiveGame()`, `clearActiveGame()`; snapshot is full engine state including `log`.
- ✅ `src/game/runtime.js`: `dispatch` → reducer + strategist `CALL_MUGGINS` resolution (stub reducer) → `setActiveGame` → DataStore `change`; `tickAI` / `configureAiDelay` (default 1000 ms); `hydrateRuntime` / `resetRuntime` / `abandonGame`.
- ✅ `index.js`: `await DataStore.init()` (loads `localStorage`), boot stub — resume via `getActiveGame` + `hydrateRuntime` vs empty setup message.
- ✅ Tests: `tests/game/persistence.test.js`; Node resolves `/src/…` imports via `tests/node-webroot-imports.mjs` + `package.json` `test` script.
- ✅ `sw-core.js::getCoreResources()` extended for engine + glue + `UpdateNotification` used by `index.js`.
- **Verify:** Manually: start a game from the console (`dispatch(start({…}))`), reload, confirm resume message reflects saved turn. `npm test` green (106 tests).

### Phase 4 — Card UI primitives — ✅ Complete (2026-04-28)
- ✅ `src/views/cardSvg.js::cardFace({ rank, suit })`: SVG via `CreateSvg` (24×24 viewBox); corners + center pip; mirrored corner; `rankLabel()` exported. Suit colors from `:root` tokens (`--card-suit-red` / `--card-suit-black`, etc.).
- ✅ `src/views/cardSvg.js::cardBack()`: programmatic back (no `/images/cards-stack.svg` in repo).
- ✅ `components/CardPile.js` → `<card-pile>`: attrs `face` (`up`|`down`), `rank`, `suit`, `count`; ghost stack up to 3 cards behind top; empty state when `count="0"`.
- ✅ `views-test.html` + `card-ui-fixture.js` (companion script deliberately **not** named `*test*.js` so Node’s test runner ignores it). Dev-only; **not** in `sw-core.js`.
- ✅ `main.css`: card tokens + global rules for `svg.card-face` / `svg.card-back` (inherit into shadow roots). `.u-muted` utility; `.views-test__*` layout for the fixture.
- ✅ `sw-core.js`: `/src/views/cardSvg.js`, `/components/CardPile.js`.
- ✅ `tests/unit/cardSvg.test.js`: `rankLabel` coverage.
- **Verify:** Open `http://localhost:8090/views-test.html` at phone- and desktop-width; cards and grid stay coherent.

### Phase 5 — Setup screen — ✅ Complete (2026-04-28)
- ✅ `src/views/setup.js`: `<main>` mounts `mountSetupView` (no in-memory state) or `mountPendingGameView` (hydrated / post-`START`).
- ✅ Form: player count 2–4; each row: name + kind (`Human`, `Random AI`, `Greedy AI`, `Strategist AI`). `randomSeed()` uses `crypto.getRandomValues`.
- ✅ "Start game" → `dispatch(start({ seed, players }))` (reducer + persistence + AI schedule); view refresh.
- ✅ Reload: `getActiveGame()` hydrates runtime → placeholder (Phase 6 swaps in board). "Change setup" → `resetRuntime()` → setup with **Resume game** (persisted snapshot, no Abandon) plus roster prefill from storage.
- ✅ "Resume game" when a snapshot exists but runtime was cleared for setup (above path); full auto-hydrate path does not need it.
- ✅ "Abandon game" → `abandonGame()` → setup (no saved slot).
- ✅ `sw-core.js` lists `/src/views/setup.js`.
- **Verify:** Manually create games of 2/3/4 players with various human-AI mixes; confirm persistence; confirm reload resumes; try Change setup → Resume.

### Phase 6 — Game view + turn loop
- Render board: 4 display piles in the center; player areas around them (CSS grid; `auto-fit` for 2–4).
- Active human turn UI:
  - Big "Flip" button → `dispatch(FLIP)`.
  - After flip, show the card; render highlight on every legal target pile; tap a pile to play, or "Hold" button.
- AI turns: runtime drives them after configured delay; show a small "AI is thinking…" indicator.
- Auto-resume on reload via existing persistence wiring.
- **Verify:** Play complete games hot-seat + AI, 2- and 4-player, on phone and desktop. Confirm no illegal-move UI is reachable.

### Phase 7 — Muggins button
- Replace the **existing `CALL_MUGGINS` stub** in `reducer.js` with real validation and card movement; finalize `callMuggins` payload (offender, etc.) in `actions.js`.
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
| `src/DataStore.js` | `upsertItemById` for reserved ids; active-game helpers live in `src/game/persistence.js` |
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
3. **Card-back asset**: **Programmatic SVG** in `cardBack()` (no stack asset in repo). Themed via `--card-back-*` on `:root`.
4. **Whether `addItem` should honor a provided id** vs. adding a separate singleton API — design choice in Phase 3 (lean toward a separate API to avoid changing existing semantics).

## Verification strategy

- **Unit tests** (`npm test`): every engine and AI module. Goal: full-game replay test from a seed produces a stable winner and stable log.
- **Manual browser testing** at each phase: open `http://localhost:8090`, exercise the new behavior, verify console is clean, verify service worker still updates correctly.
- **Responsive verification**: each UI phase tested at phone (≤575px) and desktop (≥992px) widths via DevTools device toolbar.
- **Persistence verification**: reload mid-game on every phase touching state; confirm resume works.
- **Lint + format gate** before each commit: `npm run format && npm run lint`.
