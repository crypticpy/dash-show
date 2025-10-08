/**
 * Filter and Sort Module
 * Manages search, tag filtering, chip selection, and card sorting logic.
 * Updates UI state and visibility based on filter criteria.
 */

import { $$, $ } from "./utils.js";

/**
 * Apply all active filters to card grid
 * Handles search query, dropdown selection, chip toggles, and sorting
 * Updates hero summary and empty state visibility
 * @param {Object} options - Filter configuration
 * @param {HTMLInputElement} options.searchInput - Search text input
 * @param {HTMLSelectElement} options.tagSelect - Tag dropdown select
 * @param {HTMLSelectElement} options.sortSelect - Sort dropdown select
 * @param {HTMLElement} options.grid - Card grid container
 * @param {number} options.totalSites - Total number of sites
 */
export function applyFilters({ searchInput, tagSelect, sortSelect, grid, totalSites }) {
  const query = searchInput.value.trim().toLowerCase();
  const selectTag = tagSelect.value;
  const pressedChips = $$('.chip[aria-pressed="true"]').map((c) => c.dataset.tag);

  const cards = $$(".card", grid);
  const visibleCards = [];

  cards.forEach((card) => {
    const title = card.dataset.title || "";
    const domain = card.dataset.domain || "";
    const tags = (card.dataset.tags || "").split("|").filter(Boolean);

    const matchesQuery = cardMatchesQuery(query, title, domain, tags);
    const matchesSelect = cardMatchesSelect(selectTag, tags);
    const matchesChips = cardMatchesChips(pressedChips, tags);

    const isVisible = matchesQuery && matchesSelect && matchesChips;

    if (isVisible) {
      card.style.display = "";
      visibleCards.push(card);
    } else {
      card.style.display = "none";
    }
  });

  updateHeroSummary(totalSites, visibleCards.length);
  updateEmptyState(grid, visibleCards.length);
  applySorting(sortSelect.value, visibleCards, grid);
}

/**
 * Check if card matches search query
 * @param {string} query - Lowercase search query
 * @param {string} title - Card title
 * @param {string} domain - Card domain
 * @param {Array<string>} tags - Card tags
 * @returns {boolean} True if card matches query
 */
function cardMatchesQuery(query, title, domain, tags) {
  if (!query) return true;
  return (
    title.includes(query) ||
    domain.includes(query) ||
    tags.some((t) => t.includes(query))
  );
}

/**
 * Check if card matches dropdown selection
 * @param {string} selectTag - Selected tag value ('all' or specific tag)
 * @param {Array<string>} tags - Card tags
 * @returns {boolean} True if card matches selection
 */
function cardMatchesSelect(selectTag, tags) {
  return selectTag === "all" || tags.includes(selectTag.toLowerCase());
}

/**
 * Check if card matches all pressed chip filters
 * @param {Array<string>} pressedChips - Active chip tag names
 * @param {Array<string>} tags - Card tags
 * @returns {boolean} True if card has all pressed chip tags
 */
function cardMatchesChips(pressedChips, tags) {
  if (pressedChips.length === 0) return true;
  return pressedChips.every((t) => tags.includes(t.toLowerCase()));
}

/**
 * Update hero summary with total and visible counts
 * @param {number} totalSites - Total sites in catalog
 * @param {number} visibleSites - Number of visible sites after filters
 */
function updateHeroSummary(totalSites, visibleSites) {
  const siteCountEl = $("#siteCount");
  if (siteCountEl) {
    siteCountEl.textContent = String(totalSites || 0);
  }

  const filterIndicator = $("#filterIndicator");
  if (!filterIndicator) return;

  if (visibleSites !== totalSites) {
    filterIndicator.innerHTML = `<span class="filter-count">(showing ${visibleSites})</span>`;
    filterIndicator.classList.add("active");
  } else {
    filterIndicator.innerHTML = "";
    filterIndicator.classList.remove("active");
  }
}

/**
 * Show/hide empty state message when no cards match filters
 * @param {HTMLElement} grid - Card grid container
 * @param {number} visibleCount - Number of visible cards
 */
function updateEmptyState(grid, visibleCount) {
  let emptyState = $("#emptyState");

  if (visibleCount === 0) {
    if (!emptyState) {
      emptyState = createEmptyStateElement();
      grid.appendChild(emptyState);
    }
    emptyState.style.display = "flex";
  } else if (emptyState) {
    emptyState.style.display = "none";
  }
}

/**
 * Create empty state element
 * @returns {HTMLElement} Empty state container
 */
function createEmptyStateElement() {
  const emptyState = document.createElement("div");
  emptyState.id = "emptyState";
  emptyState.className = "empty-state";
  emptyState.innerHTML = `
    <div class="empty-icon">🔍</div>
    <h3>No dashboards found</h3>
    <p>Try adjusting your filters or search terms to see more results</p>
    <button class="btn primary" onclick="document.getElementById('clearFilters').click()">Clear all filters</button>
  `;
  return emptyState;
}

/**
 * Apply sorting to visible cards
 * @param {string} sortKey - Sort key ('default', 'title', or 'domain')
 * @param {Array<HTMLElement>} cards - Visible card elements
 * @param {HTMLElement} container - Grid container to reorder
 */
function applySorting(sortKey, cards, container) {
  if (sortKey === "default") return;

  const sortedCards = [...cards].sort((a, b) => {
    if (sortKey === "title") {
      return (a.dataset.title || "").localeCompare(b.dataset.title || "");
    }
    if (sortKey === "domain") {
      return (a.dataset.domain || "").localeCompare(b.dataset.domain || "");
    }
    return 0;
  });

  sortedCards.forEach((card) => container.appendChild(card));
}

/**
 * Update visual states of filter controls
 * Highlights active filters and shows/hides clear button
 * @param {Object} elements - Filter UI elements
 * @param {HTMLInputElement} elements.searchInput - Search input
 * @param {HTMLSelectElement} elements.tagSelect - Tag dropdown
 */
export function updateFilterStates({ searchInput, tagSelect }) {
  // Highlight search if has value
  if (searchInput.value.trim()) {
    searchInput.classList.add("has-value");
  } else {
    searchInput.classList.remove("has-value");
  }

  // Highlight dropdown if not "all"
  if (tagSelect.value !== "all") {
    tagSelect.classList.add("active-filter");
  } else {
    tagSelect.classList.remove("active-filter");
  }

  // Show/hide clear filters button
  const hasActiveFilters =
    searchInput.value.trim() !== "" ||
    tagSelect.value !== "all" ||
    $$('.chip[aria-pressed="true"]').length > 0;

  const clearFiltersBtn = $("#clearFilters");
  if (clearFiltersBtn) {
    clearFiltersBtn.style.display = hasActiveFilters ? "" : "none";
  }
}

/**
 * Clear all active filters
 * Resets search, dropdown, and chip selections
 * @param {Object} elements - Filter UI elements
 */
export function clearAllFilters({ searchInput, tagSelect }) {
  searchInput.value = "";
  tagSelect.value = "all";

  $$('.chip[aria-pressed="true"]').forEach((chip) => {
    chip.setAttribute("aria-pressed", "false");
    const icon = chip.querySelector(".chip-icon");
    if (icon) icon.style.display = "none";
  });
}

/**
 * Debounce function to limit execution rate
 * Returns a function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait before invoking
 * @returns {Function} Debounced function with cancel method
 */
export function debounce(func, wait = 300) {
  let timeout;

  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  // Add cancel method to debounced function
  debounced.cancel = function() {
    clearTimeout(timeout);
  };

  return debounced;
}

/**
 * Categorize tags into semantic facets for better organization
 * Groups tags by platform, use case, audience, and pattern types
 * @param {string[]} tags - All unique tags from the catalog
 * @returns {Object} Categorized tags object with platform, useCase, audience, pattern, other arrays
 */
export function categorizeTags(tags) {
  const categories = {
    platform: [],
    useCase: [],
    audience: [],
    pattern: [],
    other: []
  };

  // Define keyword patterns for each category
  const platformKeywords = ["power bi", "tableau", "arcgis", "saas", "platform", "excel", "dashboard"];
  const useCaseKeywords = ["cip", "municipal", "policy", "program", "budget", "capital", "infrastructure"];
  const audienceKeywords = ["public", "executive", "staff", "citizen", "resident", "internal"];
  const patternKeywords = ["visualization", "report", "matrix", "scorecard", "ranking", "prioritization"];

  tags.forEach((tag) => {
    const tagLower = tag.toLowerCase();
    let categorized = false;

    // Check each category in priority order
    if (!categorized && platformKeywords.some((kw) => tagLower.includes(kw))) {
      categories.platform.push(tag);
      categorized = true;
    }

    if (!categorized && useCaseKeywords.some((kw) => tagLower.includes(kw))) {
      categories.useCase.push(tag);
      categorized = true;
    }

    if (!categorized && audienceKeywords.some((kw) => tagLower.includes(kw))) {
      categories.audience.push(tag);
      categorized = true;
    }

    if (!categorized && patternKeywords.some((kw) => tagLower.includes(kw))) {
      categories.pattern.push(tag);
      categorized = true;
    }

    if (!categorized) {
      categories.other.push(tag);
    }
  });

  return categories;
}

/**
 * Render active filter chips row showing all applied filters
 * Creates removable chip elements for each active filter
 * @param {Object} filterState - Current filter state
 * @param {string} filterState.query - Search query
 * @param {Array<string>} filterState.selectedTags - Selected tag names
 * @param {string} filterState.dropdown - Dropdown filter value
 * @param {string} filterState.sort - Sort order
 * @param {Function} onRemove - Callback when chip is removed (type, value)
 */
export function renderActiveFilters(filterState, onRemove) {
  const container = $("#activeFilters");
  if (!container) return;

  container.innerHTML = "";
  let hasFilters = false;

  // Search query chip
  if (filterState.query && filterState.query.length > 0) {
    hasFilters = true;
    const chip = createRemovableChip("Search", filterState.query, () => {
      onRemove("query", "");
    });
    container.appendChild(chip);
  }

  // Selected tag chips
  if (filterState.selectedTags && filterState.selectedTags.length > 0) {
    filterState.selectedTags.forEach((tag) => {
      hasFilters = true;
      const chip = createRemovableChip("Tag", tag, () => {
        onRemove("tag", tag);
      });
      container.appendChild(chip);
    });
  }

  // Dropdown filter chip
  if (filterState.dropdown && filterState.dropdown !== "all") {
    hasFilters = true;
    const displayValue = filterState.dropdown
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const chip = createRemovableChip("Category", displayValue, () => {
      onRemove("dropdown", "all");
    });
    container.appendChild(chip);
  }

  // Sort order chip (only if not default)
  if (filterState.sort && filterState.sort !== "default") {
    hasFilters = true;
    const sortLabel = filterState.sort === "title" ? "Title A→Z" : "Domain A→Z";
    const chip = createRemovableChip("Sort", sortLabel, () => {
      onRemove("sort", "default");
    });
    container.appendChild(chip);
  }

  // Show/hide container based on filter presence
  container.style.display = hasFilters ? "flex" : "none";
}

/**
 * Create a removable filter chip element
 * Builds an interactive chip with label, value, and remove button
 * @param {string} label - Chip category label (Search, Tag, Category, Sort)
 * @param {string} value - Filter value to display
 * @param {Function} onRemove - Callback when remove button clicked
 * @returns {HTMLElement} Removable chip element
 * @private
 */
function createRemovableChip(label, value, onRemove) {
  const chip = document.createElement("button");
  chip.className = "active-filter-chip";
  chip.setAttribute("type", "button");
  chip.setAttribute("aria-label", `Remove ${label} filter: ${value}`);

  const labelSpan = document.createElement("span");
  labelSpan.className = "chip-label";
  labelSpan.textContent = `${label}:`;

  const valueSpan = document.createElement("span");
  valueSpan.className = "chip-value";
  valueSpan.textContent = value;

  const removeBtn = document.createElement("span");
  removeBtn.className = "chip-remove";
  removeBtn.textContent = "×";
  removeBtn.setAttribute("aria-hidden", "true");

  chip.appendChild(labelSpan);
  chip.appendChild(valueSpan);
  chip.appendChild(removeBtn);

  chip.addEventListener("click", (e) => {
    e.preventDefault();
    onRemove();
  });

  return chip;
}

/**
 * Populate faceted filter groups with categorized chips
 * @param {string[]} tags - All unique tags
 * @param {Function} createChipFn - Function to create chip elements
 */
export function populateFacetedFilters(tags, createChipFn) {
  const categorized = categorizeTags(tags);

  // Clear all chip containers
  const containers = {
    platform: $("#chips-platform"),
    useCase: $("#chips-usecase"),
    audience: $("#chips-audience"),
    pattern: $("#chips-pattern"),
    other: $("#chips-other"),
  };

  // Populate each category
  Object.entries(containers).forEach(([key, container]) => {
    if (!container) return;

    container.innerHTML = "";

    if (categorized[key].length === 0) {
      container.innerHTML = '<p class="filter-empty">No filters in this category</p>';
      return;
    }

    categorized[key].forEach((tag) => {
      const chip = createChipFn(tag);
      container.appendChild(chip);
    });
  });
}

/**
 * Setup faceted filter drawer interactions (mobile toggle, overlay, etc.)
 */
export function setupFilterDrawer() {
  const drawer = $("#filterDrawer");
  const toggle = $("#filterDrawerToggle");
  const overlay = $("#filterDrawerOverlay");
  const closeBtn = $("#filterDrawerClose");

  if (!drawer || !toggle || !overlay || !closeBtn) return;

  // Open drawer
  const openDrawer = () => {
    drawer.classList.add("active");
    drawer.removeAttribute("aria-hidden");
    overlay.classList.add("active");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; // Prevent scroll
  };

  // Close drawer
  const closeDrawer = () => {
    drawer.classList.remove("active");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("active");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  // Event listeners
  toggle.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("active")) {
      closeDrawer();
    }
  });

  // Touch swipe to close (simple swipe left detection)
  let touchStartX = 0;
  drawer.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });

  drawer.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartX - touchEndX;

    // If swiped left more than 100px, close drawer
    if (swipeDistance > 100) {
      closeDrawer();
    }
  });
}
