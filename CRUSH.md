# CRUSH.md - Dash Show Project

## Project Overview

Static HTML showcase site displaying municipal Capital Improvement Program (CIP) dashboards, Power BI reports, and visualization patterns. No build tools or frameworks - pure HTML/CSS/JS.

## Commands

- **Local development**: Open `index.html` directly in browser or use any static server

  ```bash
  # Python 3
  python -m http.server 8000

  # Node.js (if available)
  npx serve .

  # VS Code Live Server extension also works
  ```

- **Validation**: No formal testing - validate HTML/CSS manually
  ```bash
  # HTML validation (if validator installed)
  # Check console for JavaScript errors in browser dev tools
  ```

## Code Style Guidelines

### HTML Structure

- Single HTML file with embedded CSS and JavaScript
- Semantic HTML5 elements (`<header>`, `<main>`, `<article>`, `<footer>`)
- Accessibility attributes (`aria-pressed`, `aria-live`, `alt` text)
- No external dependencies except Google Fonts

### CSS Conventions

- CSS custom properties (variables) for theming in `:root`
- Mobile-first responsive design with `@media` queries
- Flexbox and CSS Grid for layouts
- Dark/light theme support via `prefers-color-scheme`
- Class-based styling with BEM-inspired naming
- Smooth transitions and micro-interactions

### JavaScript Patterns

- Modern ES6+ features (arrow functions, destructuring, async/await)
- No frameworks - vanilla DOM manipulation
- Component-like functions for UI elements
- Event delegation and efficient DOM queries
- LocalStorage for caching with TTL
- Lazy loading with IntersectionObserver
- Error handling with try/catch blocks

### Data Management

- Configuration in `SITES` array (title, url, tags)
- Tags: "Public CIP", "Power BI", "Visualization Patterns"
- Client-side filtering, sorting, and search
- Proxied content fetching for CORS bypass

### Performance

- Lazy image loading with fallback chain
- Debounced search/filter operations
- Efficient DOM updates with minimal reflows
- Cached API responses to reduce network calls
