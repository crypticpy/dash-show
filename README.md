# Dash Show - Project Prioritization Dashboard Showcase

Curated showcase of **40+ examples** across four categories:

- **Public CIP**: Municipal Capital Improvement Program dashboards
- **Power BI**: Government analytics and reporting dashboards
- **Portfolio Management**: Enterprise project prioritization tools
- **Visualization Patterns**: Decision matrices, scoring models, and ranking charts

## Quick Start

```bash
# Serve locally (any method works)
python -m http.server 8000
# then open http://localhost:8000
```

## Features

- **Static site**: No build tools, no tracking, no frameworks
- **Responsive**: Dark/light theme, mobile-friendly design
- **Interactive**: Search, filter, sort functionality across 4 categories
- **Automated**: Thumbnail generation and content extraction
- **Performance**: Lazy loading, caching, optimized images
- **Comprehensive**: 20 municipal CIP examples + 20 enterprise prioritization tools

## Content Categories

### Public CIP (20 examples)

Municipal dashboards showing capital projects, infrastructure planning, and budget tracking for transparent government operations.

### Power BI (5 examples)

Government analytics dashboards demonstrating data visualization best practices for public sector reporting.

### Portfolio Management (20 examples)

Enterprise project prioritization tools featuring:

- WSJF (Weighted Shortest Job First) scoring
- Value × effort matrices
- AHP (Analytic Hierarchy Process)
- MCDA (Multi-Criteria Decision Analysis)
- Portfolio bubble charts and heatmaps
- Efficient frontier analysis

### Visualization Patterns (2 examples)

Gallery collections showcasing dashboard design patterns and visualization best practices.

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
