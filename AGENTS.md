# Repository Guidelines

## Project Structure & Module Organization

All runtime code lives in `index.html`, where markup, styling, and ES6 logic are co-located. `README.md` summarizes quick-start usage; keep it synchronized with UI changes. Planning files `CRUSH.md`, `ENHANCEMENT_PLAN.md`, and `IMPLEMENTATION_PLAN.md` capture backlog context for enhancements. Assets are fetched remotely, so add new dashboard references as URLs rather than local binaries.

## Build, Test, and Development Commands

From the project root, run `python -m http.server 8000` and open `http://localhost:8000` to preview search, filters, and compare mode. For quick formatting validation, execute `npx prettier --check index.html`; use `--write` before committing if adjustments are acceptable. Avoid introducing bundlers or pipelines without discussion, because the site is intentionally lightweight.

## Coding Style & Naming Conventions

HTML and CSS use two-space indentation and descriptive class names such as `compare-slot` and `btn primary`. Keep CSS custom properties grouped within the top-level `:root`; new tokens should follow the existing `--accent-*` naming. JavaScript helpers stay camelCase (`fetchBlurb`), while shared constants remain uppercase (`SITES`, `CACHE_KEY`). Prefer arrow functions and template literals to mirror the prevailing ES6 style.

## Testing Guidelines

Automated tests are not configured, so rely on manual QA in Chromium or Firefox. Exercise the search bar, tag chips, sort dropdown, learning panel, and compare workflow after every data or logic change, ensuring no console errors. Clear `localStorage` between runs when validating cached blurbs (`localStorage.removeItem('pp-showcase-blurbs-v1')`). Use responsive design mode to confirm layouts hold from desktop widths down to 360px.

## Commit & Pull Request Guidelines

Recent commits use concise, imperative subjects (`Transform into educational platform...`). Keep subjects under 72 characters, expand on reasoning in the body if needed, and reference issue IDs when available. Pull requests should outline scope, link supporting discussions, and include before/after screenshots or GIFs whenever UI changes are involved. Document manual test notes and list any new dashboard sources for review.

## Content Curation Workflow

Dashboard entries live in the `SITES` array near the end of `index.html`. Preserve tag casing (`Public CIP`, `Power BI`, `Portfolio Management`, `Visualization Patterns`) so filters remain accurate, and keep descriptions focused on why an example matters. When swapping links, verify the target is publicly accessible, renders preview imagery, and update each `techniques` list to surface distinct design elements.
