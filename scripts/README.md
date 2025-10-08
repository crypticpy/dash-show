# JavaScript Modules Documentation

This directory contains the modular ES6 JavaScript for the Dashboard Showcase application. All inline JavaScript has been extracted from `index.html` and organized into focused, testable modules.

## Module Overview

### Core Utilities
- **utils.js** (96 lines) - Pure utility functions with zero dependencies
- **state.js** (88 lines) - State management and localStorage persistence
- **api.js** (137 lines) - Data fetching, caching, and blurb hydration

### UI Components
- **filters.js** (219 lines) - Search, filter, and sort logic
- **cards.js** (326 lines) - Card rendering and tag controls
- **detail-modal.js** (277 lines) - Detail view modal management
- **learning-mode.js** (629 lines) - Learning panel and onboarding

### Application Entry
- **main.js** (460 lines) - Application orchestration and initialization

## Quick Reference

### utils.js
```javascript
import { $, $$, escapeHtml, truncate, hostname, screenshotURL, faviconURL } from './utils.js';
```

### state.js
```javascript
import { getCurrentRole, setCurrentRole, getNotes, saveNotes, hasSeenOnboarding } from './state.js';
```

### api.js
```javascript
import { fetchBlurb, hydrateBlurbs, clearCache } from './api.js';
```

### filters.js
```javascript
import { applyFilters, updateFilterStates, clearAllFilters } from './filters.js';
```

### cards.js
```javascript
import { cardTemplate, createChip, populateTagControls, setupLazyImages, getCategoryIcon } from './cards.js';
```

### detail-modal.js
```javascript
import { openDetailModal, closeDetailModal, createDetailHandlers, enableDetailKeyboard } from './detail-modal.js';
```

### learning-mode.js
```javascript
import { renderRole, createLearningHandlers, createOnboardingHandlers, printChecklist } from './learning-mode.js';
```

### main.js
```javascript
// Entry point - no exports, imports all other modules
```

## Dependency Graph

```
utils.js (foundation)
  ↓
├─ api.js (fetching & caching)
├─ state.js (state management)
└─ filters.js (filtering logic)
     ↓
   cards.js (card rendering)
     ↓
   ├─ detail-modal.js (detail view)
   └─ learning-mode.js (learning panel)
        ↓
      main.js (orchestration)
```

## Code Standards

All modules follow these standards:
- ✅ Single Responsibility Principle
- ✅ Functions under 50 lines
- ✅ Files under 500 lines
- ✅ Comprehensive JSDoc comments
- ✅ No global variables
- ✅ Pure functions where possible
- ✅ Clear, descriptive naming
- ✅ ES6+ features throughout

## Testing

While no tests are currently implemented, the modular structure makes testing straightforward:

```javascript
// Example unit test structure
import { escapeHtml } from './utils.js';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
```

## Adding New Features

When adding new features:
1. Identify the appropriate module (or create a new one)
2. Add exports with JSDoc comments
3. Update dependencies in main.js
4. Keep functions focused and under 50 lines
5. Maintain zero global variables
6. Document in this README

## Performance Considerations

- IntersectionObserver for lazy image loading
- localStorage caching with 7-day TTL
- Efficient DOM manipulation (minimize reflows)
- Event delegation where appropriate
- Module loading via native ES6 (no bundler required)

## Browser Support

Requires modern browsers with ES6 module support:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

For older browsers, add a build step with Babel or similar transpiler.

---

**Total Lines**: 2,232 lines
**Modules**: 8 files
**Dependencies**: Zero (vanilla JavaScript)
**Build Required**: No (native ES6 modules)
