# Facerix Template - Documentation Index

Welcome to the Facerix App Template! This index will help you navigate the documentation.

## 🚀 Getting Started

**Start here if you want to use this template:**

1. **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
   - Copy template
   - Install dependencies
   - Basic customization
   - Start development

## 📖 Understanding the Template

**Read these to understand what you're working with:**

2. **[README.md](README.md)** - Project overview and architecture
   - What this template is
   - Architecture decisions
   - Project structure
   - Development commands

3. **[PATTERNS.md](PATTERNS.md)** - Pattern analysis from source projects
   - What patterns were found
   - How they evolved
   - Why they were chosen
   - Pattern comparison

4. **[ANALYSIS_SUMMARY.md](ANALYSIS_SUMMARY.md)** - Analysis summary
   - Source projects analyzed
   - Pattern evolution timeline
   - What was included/excluded
   - Key decisions

5. **[COMPARISON.md](COMPARISON.md)** - Detailed project comparison
   - Feature matrix
   - Code metrics
   - Pattern maturity
   - Migration paths

## 🛠️ Customizing Your App

**Read these when building your app:**

6. **[TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md)** - Comprehensive customization guide
   - Customization checklist
   - Architecture decisions
   - Optional enhancements
   - Common patterns

7. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Structure overview
   - Directory layout
   - File purposes
   - Dependency graph
   - Architecture layers

## 🤖 AI Coding Assistant

**Use these when working with AI assistants:**

8. **[AGENTS.md](AGENTS.md)** - AI assistant guidance
   - Critical patterns
   - Code examples
   - Important files
   - Common tasks
   - Things to avoid

9. **[.cursorrules](.cursorrules)** - Cursor AI rules
   - Development setup
   - Do/Don't lists
   - Dependency policy

## 📁 File Organization

### Application Files
- `index.html` / `index.js` - Main entry point
- `about.html` / `about.js` - About page
- `main.css` - Global styles
- `manifest.json` - PWA manifest

### Service Workers
- `sw.js` - Production service worker
- `sw-dev.js` - Development service worker
- `sw-core.js` - Shared caching logic

### Core Utilities (/src/)
- `DataStore.js` - Data management
- `ServiceWorkerManager.js` - SW lifecycle
- `domUtils.js` - DOM helpers
- `uuid.js` - UUID generation

### Components (/components/)
- `UpdateNotification.js` - Update UI

### Configuration
- `package.json` - NPM configuration
- `eslint.config.js` - Linting rules
- `.prettierrc.js` - Formatting rules
- `.gitignore` - Git ignore patterns
- `.htaccess` - Apache configuration

## 🎯 Quick Reference

### Common Commands
```bash
npm install          # Install dependencies
npm start            # Start dev server (port 8080)
npm run lint         # Check code quality
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code
npm run format:check # Check formatting
```

### Common Tasks

**Add a new page:**
1. Create `page.html` and `page.js`
2. Add to `sw-core.js` → `getCoreResources()`
3. Link from navigation

**Add a component:**
1. Create `components/MyComponent.js`
2. Define custom element
3. Import in page JS
4. Use `<my-component>` tag

**Customize data:**
1. Edit `src/DataStore.js`
2. Change localStorage key
3. Add custom methods
4. Update change events

**Change theme:**
1. Update `manifest.json` colors
2. Update `main.css` --accent-color
3. Update `index.html` meta theme-color

## 📚 Documentation Map

```
INDEX.md (you are here)
├── Quick Start
│   └── QUICKSTART.md ..................... 5-minute setup guide
│
├── Understanding
│   ├── README.md ......................... Project overview
│   ├── PATTERNS.md ....................... Pattern analysis
│   ├── ANALYSIS_SUMMARY.md ............... Analysis summary
│   └── COMPARISON.md ..................... Project comparison
│
├── Customization
│   ├── TEMPLATE_GUIDE.md ................. Customization guide
│   └── PROJECT_STRUCTURE.md .............. Structure overview
│
└── AI Assistance
    ├── AGENTS.md ......................... AI assistant guidance
    └── .cursorrules ...................... Cursor AI rules
```

## 🎓 Learning Path

### Beginner
1. Read [QUICKSTART.md](QUICKSTART.md)
2. Follow the steps to create your first app
3. Read [README.md](README.md) for overview
4. Experiment with the template

### Intermediate
1. Read [TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md)
2. Understand [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
3. Customize DataStore for your needs
4. Add custom components

### Advanced
1. Read [PATTERNS.md](PATTERNS.md)
2. Read [COMPARISON.md](COMPARISON.md)
3. Understand service worker architecture
4. Add backend sync (Brain Crack pattern)
5. Add IndexedDB (Personnel pattern)

## 🔍 Finding Information

**"How do I...?"**
- Start development → [QUICKSTART.md](QUICKSTART.md)
- Customize the template → [TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md)
- Understand the architecture → [README.md](README.md)
- Work with AI assistants → [AGENTS.md](AGENTS.md)

**"What is...?"**
- This template → [README.md](README.md)
- The file structure → [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- The patterns used → [PATTERNS.md](PATTERNS.md)
- The source projects → [COMPARISON.md](COMPARISON.md)

**"Why...?"**
- These patterns → [PATTERNS.md](PATTERNS.md)
- This architecture → [ANALYSIS_SUMMARY.md](ANALYSIS_SUMMARY.md)
- No framework → [README.md](README.md) → Architecture Decisions

## 💡 Tips

- **Start simple** - Don't add features until you need them
- **Follow patterns** - Stick to established conventions
- **Use utilities** - Leverage h(), uuid, etc.
- **Test offline** - PWAs should work offline
- **Format code** - Run `npm run format` regularly
- **Read AGENTS.md** - Especially if using AI assistants

## 🆘 Troubleshooting

**Service worker issues** → [QUICKSTART.md](QUICKSTART.md) → Troubleshooting
**Linting errors** → Run `npm run lint:fix`
**Module errors** → Check import paths start with `/`
**Cache issues** → Use about.html "Clear all caches" button

## 📞 Support

- Check documentation files (you have 9 of them!)
- Review source projects in `/Users/rylee/projects/`
- Personnel is the most complete reference

## 🎉 You're Ready!

Start with [QUICKSTART.md](QUICKSTART.md) and build something awesome!

---

**Template Version**: 1.0.0  
**Last Updated**: March 17, 2026  
**Created By**: Rylee Corradini
