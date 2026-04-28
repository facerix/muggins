# AGENTS.md

Agent-specific guidance for the **Muggins card game** PWA. See [README.md](README.md) for architecture overview and [docs/how-to-play.md](docs/how-to-play.md) for game rules.

## Game Domain

- **Standard 52-card deck**, aces low, kings high, no wrap-around
- **Display piles**: 4 face-up shared piles in the center; players play onto them (one higher or lower)
- **Player hand**: a face-down stack + a face-up pile (held cards); when face-down is empty, flip face-up pile
- **Muggins rule**: any player can call out a missed legal move — penalty is one card from every other player
- **Win condition**: first player with no cards remaining (neither stack) wins

## Critical Patterns

### DataStore
```javascript
import DataStore from '/src/DataStore.js';

DataStore.addEventListener('change', evt => {
  const { changeType, items, affectedRecords } = evt.detail;
  // changeType: 'init' | 'add' | 'update' | 'delete'
  // items: full current array
  // affectedRecords: only the changed items
});

const items = DataStore.items;
DataStore.updateItem(item);
```

Window events emitted by ServiceWorkerManager:
- `sw-update-available` → `detail: { registration, pendingWorker }`
- `sw-update-progress` → `detail: { status }`

### DOM Creation
```javascript
import { h } from '/src/domUtils.js';

// Always use h() - never createElement directly
const el = h('div', { className: 'foo', id: '123' }, [child1, child2]);

// h() doesn't allow inline dataset manipulation, do it using the JS APIs
el.dataset.id = '456';
```

### Web Components
- `/components/` directory
- Shadow DOM, `<style>` tag, kebab-case tags
- Register with `customElements.define()`

## Important Files

| File | Purpose |
|------|---------|
| `src/DataStore.js` | Central data store (localStorage) |
| `src/domUtils.js` | `h()` helper, `isDevelopmentMode()` |
| `src/ServiceWorkerManager.js` | Service worker lifecycle |
| `src/uuid.js` | UUID generation |
| `sw-core.js` | Shared service worker logic |
| `sw.js` | Production service worker |
| `sw-dev.js` | Development service worker |

## Common Tasks

**Adding an item:** Create object → `DataStore.addItem()` → listen for "change" to re-render.

**Service Worker:** Automatically detects dev mode via `isDevelopmentMode()` in `domUtils.js`.

## Naming Conventions

| Type | Convention |
|------|------------|
| HTML/CSS files | `lowercase.html` |
| JS modules | `camelCase.js` |
| Classes / Components | `PascalCase.js` |
| Web Component tags | `kebab-case` |
| CSS utility classes | `.u-prefix` |
| Private class fields | `#fieldName` |
| Constants | `UPPER_SNAKE` |

## Adding New Files

When adding new JS/HTML/CSS files, register them in `sw-core.js` → `getCoreResources()` so they're cached by the service worker.

## Things to Avoid

1. ❌ Frameworks (React, Vue, etc.)
2. ❌ Using `createElement` (use `h()`)
3. ❌ Bypassing DataStore for data operations
4. ❌ Adding heavy dependencies without approval
5. ❌ Import paths without a leading `/` — always use `/src/foo.js`, never `src/foo.js`

## Troubleshooting

**Service worker not updating:** DevTools → Application → Service Workers → Unregister, then hard refresh (Cmd+Shift+R).

**Module not found:** Check import path starts with `/`. Example: `/src/domUtils.js` not `src/domUtils.js`.

## Testing

Use @Browser at `http://localhost:8090` (assume server is already running). Verify UI, interactions, console, service worker.

## Checklist

**Before:** Offline support? DataStore? Using `h()`?

**After:** `npm run format` → `npm run lint` → fix lint → test in browser
