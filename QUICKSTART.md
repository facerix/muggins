# Quick Start Guide

Get your new Facerix app running in 5 minutes.

## 1. Copy Template

```bash
cp -r facerix-template my-new-app
cd my-new-app
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Customize Basic Info

### package.json
```json
{
  "name": "my-app-name",
  "description": "My awesome app"
}
```

### manifest.json
```json
{
  "name": "My App Name",
  "short_name": "MyApp",
  "description": "My awesome app",
  "theme_color": "#2EC6FE",
  "background_color": "#f3f4f5"
}
```

### index.html
- Update `<title>` tag
- Update meta description
- Update canonical URL
- Update Open Graph tags
- Replace "App Name" with your app name

## 4. Update Service Worker

### sw-core.js
```javascript
// Line 10: Update cache prefix
create(version, prefix = 'myapp-cache-') {

// Lines 19-26: Add your app's files
getCoreResources() {
  return [
    '/',
    '/index.html',
    '/index.js',
    // ... add your files here
  ];
}
```

### sw.js and sw-dev.js
```javascript
// Update VERSION constant
const VERSION = '1.0.0';
```

## 5. Start Development

```bash
npm start
```

Visit http://localhost:8080

## 6. Customize Your App

### Add Data Fields to DataStore
Edit `src/DataStore.js`:
```javascript
// Change localStorage key
window.localStorage.getItem('myDataKey')

// Add custom methods
addMyItem(item) {
  // your logic
}
```

### Add Components
Create new files in `components/`:
```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>/* styles */</style>
      <div>/* content */</div>
    `;
  }
}

customElements.define('my-component', MyComponent);
```

### Add Styles
Edit `main.css`:
```css
:root {
  --accent-color: #yourcolor;
}
```

## 7. Add Icons

Generate PWA icons (use a tool like https://realfavicongenerator.net/):
- `icons/icon512_maskable.png`
- `icons/icon512_rounded.png`
- `icons/icon-192x192.png`
- `favicon.ico`
- `icon.svg`

## 8. Test

1. Open http://localhost:8080
2. Open DevTools → Application → Service Workers
3. Verify service worker is registered
4. Test offline mode
5. Test install prompt (mobile/desktop)

## 9. Format & Lint

```bash
npm run format
npm run lint
```

Fix any linting errors:
```bash
npm run lint:fix
```

## 10. Initialize Git

```bash
git init
git add .
git commit -m "Initial commit from facerix-template"
```

## Next Steps

- Read [TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md) for customization details
- Read [PATTERNS.md](PATTERNS.md) to understand the patterns
- Read [AGENTS.md](AGENTS.md) for AI coding assistant guidance
- Check [README.md](README.md) for architecture overview

## Common Customizations

### Change App Name Everywhere
Search and replace in:
- `package.json` - name field
- `manifest.json` - name, short_name
- `index.html` - title, meta tags
- `about.html` - title, content
- `sw-core.js` - cache prefix
- `src/ServiceWorkerManager.js` - log prefix

### Change Theme Color
Update in:
- `manifest.json` - theme_color
- `main.css` - :root --accent-color
- `index.html` - meta theme-color

### Add More Pages
1. Create `newpage.html` and `newpage.js`
2. Add to `sw-core.js` → `getCoreResources()`
3. Link from main navigation

### Add API Integration
See Brain Crack's sync pattern:
- Create API client in `/api/`
- Add to DataStore for sync support
- Add mock server to `sw-dev.js` (optional)

## Troubleshooting

### Service Worker Not Updating
1. Open DevTools → Application → Service Workers
2. Click "Unregister"
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Or use "Clear all caches" button on about page

### Linting Errors
```bash
npm run lint:fix
```

### Module Not Found
Check that file paths start with `/` for absolute paths:
```javascript
import { h } from '/src/domUtils.js'; // ✓ correct
import { h } from 'src/domUtils.js';  // ✗ wrong
```

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
