# Muggins

Online PWA implementation of the Muggins card game. See [docs/how-to-play.md](docs/how-to-play.md) for rules.

## Game Domain

- **Deck**: standard 52 cards, aces low, kings high, no wrap-around
- **Display piles**: 4 shared face-up piles; play a card one higher or lower than the top card
- **Player hand**: face-down stack + face-up held pile; when face-down is empty, flip the held pile
- **Muggins rule**: any player may call out a missed legal move — every other player gives the offender one card
- **Win condition**: first player with no cards remaining (neither stack) wins

## Coding Standards

- ES modules (`import`/`export`) over HTML script tags
- Use `h()` from `/src/domUtils.js` for all DOM creation — never `createElement` directly
- All data through `DataStore` — no ad-hoc localStorage access
- No frameworks; no new dependencies without approval
- Small files and diffs; avoid repo-wide rewrites unless asked
- Modern CSS over utility frameworks

## Dev Server

`npm start` — live-server on port 8090
