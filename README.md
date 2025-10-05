# Dash Show - Project Prioritization Dashboard Showcase

Curated showcase of municipal CIP dashboards, Power BI reports, and visualization patterns for transparent, quantitative project ranking.

## Quick Start
```bash
# Serve locally (any method works)
python -m http.server 8000
# then open http://localhost:8000
```

## Features
- **Static site**: No build tools, no tracking, no frameworks
- **Responsive**: Dark/light theme, mobile-friendly design
- **Interactive**: Search, filter, sort functionality
- **Automated**: Thumbnail generation and content extraction
- **Performance**: Lazy loading, caching, optimized images

## Development
- Single `index.html` file with embedded CSS/JS
- Vanilla JavaScript (ES6+, no frameworks)
- CSS custom properties for theming
- Chrome/Firefox dev tools for debugging
- Validate HTML/CSS manually

## Content Curation
Edit the `SITES` array in `<script>` section to add/remove dashboards:
```javascript
{ title: "Dashboard Name", url: "https://example.com", tags: ["Public CIP"] }
```