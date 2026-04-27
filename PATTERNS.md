# Common Patterns Analysis

This document details the patterns found across all analyzed Facerix projects.

## Projects Analyzed

1. **brain-crack** - Project idea tracker with sync
2. **crusader** - Warhammer 40k crusade tracker
3. **cuisiner** - Meal planning tool
4. **longbox** - Webcomic/blog reading tracker
5. **personnel** - Tabletop army list builder (most complete)
6. **superlatives** - Personal bests tracker
7. **yondr** - Job/relocation comparison tool

## Pattern Evolution

### Early Pattern (Longbox, Superlatives, Crusader, Cuisiner)
- Single `sw.js` file with inline cache lists
- Manual cache management
- Simpler service worker logic
- Basic update handling

### Modern Pattern (Personnel, Brain Crack, Yondr)
- Three-file SW architecture: `sw.js`, `sw-dev.js`, `sw-core.js`
- Shared caching logic via `ServiceWorkerCore`
- Configuration via `CacheConfig`
- Multi-cache strategy (versioned + static)
- Cache-first with background refresh
- Development mode detection
- Comprehensive update management

## Universal Patterns (All 7 Projects)

### 1. Package.json Structure
```json
{
  "name": "project-name",
  "version": "x.x.x",
  "description": "...",
  "main": "index.html",
  "scripts": {
    "start": "live-server --no-browser"
  },
  "author": "Rylee Corradini",
  "license": "MIT",
  "devDependencies": {
    "live-server": "^1.2.2"
  }
}
```

### 2. PWA Manifest Structure
All projects have:
- `name` and `short_name`
- `start_url: "/"`
- `display: "standalone"`
- `orientation: "any"`
- `dir: "auto"`
- `lang: "en-US"`
- `theme_color` and `background_color`
- Icons array with maskable and rounded variants

### 3. .gitignore Pattern
```
.DS_Store
node_modules
```
Some add: `package-lock.json`, `api/db-config.php`, `.plans/*`

### 4. HTML Structure
- DOCTYPE html
- Semantic HTML5
- Meta tags for SEO (description, viewport, theme-color)
- Open Graph tags
- Canonical URL
- Link to manifest.json
- Footer with Facerix attribution
- Module script imports

### 5. CSS Patterns
- Box-sizing reset (`box-sizing: border-box`)
- Flexbox layout (body as flex container)
- Modern CSS nesting
- Utility classes with `u-` prefix
- Responsive design with media queries
- View transitions support

### 6. Service Worker Registration
All use similar pattern:
```javascript
import { serviceWorkerManager } from '/src/ServiceWorkerManager.js';
await serviceWorkerManager.register();
```

## Pattern Comparison by Project

| Pattern | Personnel | Brain Crack | Yondr | Longbox | Superlatives | Crusader | Cuisiner |
|---------|-----------|-------------|-------|---------|--------------|----------|----------|
| sw-core.js | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| sw-dev.js | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| DataStore | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| ServiceWorkerManager | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| UpdateNotification | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| uuid.js | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| domUtils.js | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| ESLint | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Prettier | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| .cursorrules | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| AGENTS.md | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| about.html | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Key Files and Their Purposes

### Core Files (Present in Most Projects)

#### src/DataStore.js
- Singleton EventTarget class
- Manages app data in localStorage
- Emits change events
- UUID-based IDs
- Private fields for encapsulation

**Variations:**
- Personnel: `armyLists` key, `items` property
- Brain Crack: `ideas` key, sync support
- Yondr: `crossroads` key, user settings

#### src/ServiceWorkerManager.js
- Singleton for SW lifecycle
- Dev/prod detection via `isDevelopmentMode()`
- Update checking and notification
- Version management
- Cache clearing

**Evolution:**
- Brain Crack: Simpler version
- Personnel: Most complete with multiple worker detection
- Yondr: Similar to Personnel

#### src/domUtils.js
- `h()` function for DOM creation
- `jsx()` template literal helper
- `isDevelopmentMode()` detection
- Utility functions (pluralize, listify, etc.)

**Consistent across:** Personnel, Brain Crack, Yondr, Longbox, Superlatives

#### src/uuid.js
- `v4()` - Standard UUID v4
- `v4WithTimestamp()` - Timestamp-first UUID

**Identical across all projects that have it**

### Service Worker Files

#### sw-core.js (Modern Pattern)
- `CacheConfig` object with `create()`, `getCoreResources()`, `getStaticAssets()`
- `ServiceWorkerCore` object with caching strategies
- Methods: `handleInstall()`, `handleActivate()`, `handleFetch()`, `handleMessage()`
- Cache strategies: `cacheFirst()`, `cacheFirstWithRefresh()`, `networkFirst()`

**Variations:**
- Personnel: Most complete, includes `cache: 'reload'` for mobile
- Brain Crack: Similar to Personnel
- Yondr: Simpler version with `SW_VERSION` constant

#### sw.js (Production)
- Imports `sw-core.js`
- Sets VERSION constant
- Configures caches via `CacheConfig.create()`
- Event listeners: install, activate, fetch, message

#### sw-dev.js (Development)
- Same as `sw.js` but with `-dev` suffix
- Some include mock server (Brain Crack, Personnel)
- `skipWaiting: true` in some versions

### Components

#### components/UpdateNotification.js
- Web Component (Custom Element)
- Shadow DOM with scoped styles
- Shows update available notification
- Buttons: "Update Now" and "Later"
- Integrates with ServiceWorkerManager

**Consistent across:** Personnel, Brain Crack, Yondr, Longbox, Superlatives

## CSS Patterns

### Universal Utility Classes
```css
.u-hidden { display: none !important; }
.u-flex { display: flex; }
.u-flex-column { flex-direction: column; }
.u-flex-1 { flex: 1; }
.u-center { text-align: center; }
.u-fill-height { height: 100vh; }
.u-fill-width { width: 100%; }
```

### Common Layout
```css
body {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  background-color: #f0f0f0;
  color: #303030;
  font-family: Futura, "Trebuchet MS", Arial, sans-serif;
}

main {
  display: flex;
  flex: 1 1 auto;
  padding: 8px;
  overflow-y: auto;
  background-color: #fafafa;
}

footer, header {
  flex: 0;
  min-height: 50px;
  height: 50px;
  display: flex;
  align-items: center;
}
```

### Button Styles
```css
.btn, button {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.25em 1em;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}
```

## JavaScript Patterns

### Event-Driven Architecture
```javascript
// DataStore emits events
DataStore.addEventListener('change', evt => {
  const { changeType, items } = evt.detail;
  switch (changeType) {
    case 'init': // Initial load
    case 'add': // Item added
    case 'update': // Item updated
    case 'delete': // Item deleted
  }
});
```

### Singleton Pattern
```javascript
let instance;
class MyClass {
  constructor() {
    if (instance) {
      throw new Error('New instance cannot be created!!');
    }
    instance = this;
  }
}
const singleton = Object.freeze(new MyClass());
export default singleton;
```

### Private Fields
```javascript
class MyClass {
  #privateField = [];
  #privateMethod() { }
  
  get publicGetter() {
    return this.#privateField;
  }
}
```

### DOM Creation with h()
```javascript
import { h } from '/src/domUtils.js';

const element = h('div', 
  { className: 'my-class', innerText: 'Hello' },
  [
    h('span', { innerText: 'Child' })
  ]
);
```

## Configuration Files

### ESLint (Personnel Only)
- Flat config format (`eslint.config.js`)
- ES2022 + modules
- Browser and Service Worker globals
- Prettier integration (but disabled)
- Lenient rules (mostly warnings)

### Prettier (Personnel Only)
- Single quotes
- Semicolons
- 2-space tabs
- 100 char line width
- ES5 trailing commas
- Avoid arrow parens for single param

## Documentation Patterns

### .cursorrules (Personnel, Brain Crack)
Short, directive-based:
- Local dev setup
- Do/Don't lists
- Dependency policy

### AGENTS.md (Personnel, Brain Crack, Yondr)
Agent-specific guidance:
- Critical patterns with code examples
- Important files table
- Common tasks
- Things to avoid
- Testing instructions
- Checklists

### README.md
Varies by project:
- Personnel: Comprehensive architecture docs
- Brain Crack: Project concept explanation
- Longbox: User-facing description

## Recommendations for Template

### Include (Core Patterns)
✓ Modern service worker architecture (sw.js + sw-core.js + sw-dev.js)
✓ DataStore singleton pattern
✓ ServiceWorkerManager singleton
✓ UpdateNotification component
✓ domUtils with h() helper
✓ uuid.js utilities
✓ ESLint + Prettier configuration
✓ .cursorrules and AGENTS.md
✓ Comprehensive README

### Exclude (Project-Specific)
✗ Sync/backend support (add when needed)
✗ Touch events (add when needed)
✗ IndexedDB (localStorage sufficient for template)
✗ Custom fonts (project-specific)
✗ Multiple pages/routes (start simple)

### Make Configurable
- App name (in multiple files)
- Theme colors
- Cache prefix
- localStorage keys
- Icon paths
