# Facerix Template - Project Structure

```
facerix-template/
├── 📄 Configuration Files
│   ├── package.json              # NPM dependencies and scripts
│   ├── manifest.json             # PWA manifest
│   ├── eslint.config.js          # ESLint configuration
│   ├── .prettierrc.js            # Prettier configuration
│   ├── .prettierignore           # Prettier ignore patterns
│   ├── .gitignore                # Git ignore patterns
│   ├── .gitattributes            # Git line ending handling
│   ├── .cursorrules              # Cursor AI rules
│   └── .htaccess                 # Apache server configuration
│
├── 📱 Application Files
│   ├── index.html                # Main entry page
│   ├── index.js                  # Main JavaScript
│   ├── about.html                # About page
│   ├── about.js                  # About page JavaScript
│   └── main.css                  # Global styles
│
├── ⚙️ Service Workers
│   ├── sw.js                     # Production service worker
│   ├── sw-dev.js                 # Development service worker
│   └── sw-core.js                # Shared caching logic
│
├── 🧰 Core Utilities (/src/)
│   ├── DataStore.js              # Data management singleton (localStorage)
│   ├── ServiceWorkerManager.js  # Service worker lifecycle manager
│   ├── domUtils.js               # DOM helpers (h() function, etc.)
│   └── uuid.js                   # UUID generation utilities
│
├── 🎨 Components (/components/)
│   └── UpdateNotification.js    # Service worker update notification
│
├── 🖼️ Assets
│   ├── icon.svg                  # App icon (placeholder)
│   ├── favicon.ico               # Favicon (placeholder)
│   ├── icons/                    # PWA icons directory
│   │   └── .gitkeep
│   └── images/                   # App images directory
│       └── .gitkeep
│
└── 📚 Documentation
    ├── README.md                 # Project overview and architecture
    ├── AGENTS.md                 # AI assistant guidance
    ├── TEMPLATE_GUIDE.md         # Customization guide
    ├── PATTERNS.md               # Pattern analysis from source projects
    ├── QUICKSTART.md             # Quick start guide
    ├── ANALYSIS_SUMMARY.md       # Analysis summary
    ├── PROJECT_STRUCTURE.md      # This file
    └── LICENSE                   # MIT License
```

## File Sizes

| Category | Files | Total Size |
|----------|-------|------------|
| JavaScript | 11 | ~43 KB |
| HTML | 2 | ~5.5 KB |
| CSS | 1 | ~4 KB |
| Configuration | 7 | ~10 KB |
| Documentation | 7 | ~32 KB |
| **Total** | **33** | **~95 KB** |

## Key Features

### 🚀 Progressive Web App
- Installable on mobile/desktop
- Offline-first with service workers
- App-like experience

### 🎯 Modern JavaScript
- ES6 modules
- Web Components
- Private class fields
- Async/await

### 💾 Data Management
- Singleton DataStore pattern
- EventTarget for reactive updates
- localStorage persistence
- UUID-based IDs

### 🔄 Service Worker
- Multi-cache strategy
- Cache-first with background refresh
- Automatic updates
- Dev/prod environments

### 🛠️ Developer Tools
- ESLint for code quality
- Prettier for formatting
- live-server for development
- Comprehensive documentation

### 🤖 AI-Friendly
- .cursorrules for Cursor AI
- AGENTS.md for coding assistants
- Clear patterns and conventions

## Usage Patterns

### Starting Development
```bash
npm install
npm start
# Visit http://localhost:8080
```

### Code Quality
```bash
npm run format      # Format code
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Service Worker Testing
1. Open DevTools → Application → Service Workers
2. Test offline mode
3. Test update notifications
4. Use about.html debug info

## Architecture Layers

```
┌─────────────────────────────────────┐
│         User Interface              │
│  (HTML + CSS + Web Components)      │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Application Logic              │
│  (index.js + page-specific JS)      │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Core Utilities                │
│  (DataStore, domUtils, uuid)        │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Data Persistence               │
│       (localStorage)                │
└─────────────────────────────────────┘

        ┌──────────────────┐
        │  Service Worker  │
        │   (Offline PWA)  │
        └──────────────────┘
```

## Dependency Graph

```
index.html
  └── index.js
      ├── ServiceWorkerManager.js
      │   └── domUtils.js (isDevelopmentMode)
      └── UpdateNotification.js (Web Component)

about.html
  └── about.js
      ├── ServiceWorkerManager.js
      └── UpdateNotification.js

sw.js / sw-dev.js
  └── sw-core.js
      ├── CacheConfig
      └── ServiceWorkerCore

DataStore.js
  └── uuid.js
```

## Browser Compatibility

- **Modern browsers** with ES6 module support
- **Service Worker** support required for PWA features
- **CSS nesting** support (Chrome 112+, Safari 16.5+, Firefox 117+)
- **localStorage** for data persistence
- **Web Components** (Custom Elements v1)

## Performance Characteristics

- **First load**: ~50-100 KB (depending on assets)
- **Subsequent loads**: Instant (served from cache)
- **Offline**: Fully functional
- **Update check**: Automatic in background
- **Data operations**: Synchronous (localStorage)

## Security Considerations

- **No backend** - Data stored locally only
- **No authentication** - Client-side only
- **HTTPS required** - For service worker registration
- **Same-origin policy** - Service worker scope

## Extensibility Points

1. **Add new pages**: Create HTML + JS, add to sw-core.js
2. **Add components**: Create in /components/, register with customElements
3. **Add utilities**: Create in /src/, export functions
4. **Add backend**: Follow Brain Crack's sync pattern
5. **Add IndexedDB**: Follow Personnel's MetadataStore pattern
6. **Add routing**: Use URL parameters or hash routing

---

**Last Updated**: March 17, 2026  
**Template Version**: 1.0.0
