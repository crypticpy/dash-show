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
export function applyFilters({
  searchInput,
  tagSelect,
  sortSelect,
  grid,
  totalSites,
}) {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectTag = tagSelect ? tagSelect.value : "all";
  const pressedChips = $$('.chip[aria-pressed="true"]').map(
    (c) => c.dataset.tag,
  );

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
  applySorting(sortSelect ? sortSelect.value : "default", visibleCards, grid);

  // Announce filter results to screen readers
  announceFilterResults(totalSites, visibleCards.length);

  // Update aria-busy state on grid
  if (grid) {
    grid.setAttribute("aria-busy", "false");
  }
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
 * Announce filter results to screen readers
 * @param {number} totalSites - Total sites in catalog
 * @param {number} visibleSites - Number of visible sites after filters
 */
function announceFilterResults(totalSites, visibleSites) {
  const announcement = $("#filterAnnouncement");
  if (!announcement) return;

  // Create announcement text
  let message = "";
  if (visibleSites === totalSites) {
    message = `Showing all ${totalSites} dashboards`;
  } else if (visibleSites === 0) {
    message = `No dashboards match your filters`;
  } else {
    message = `Showing ${visibleSites} of ${totalSites} dashboards`;
  }

  // Update announcement (screen readers will detect the change)
  announcement.textContent = message;
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
  if (filterIndicator) {
    if (visibleSites !== totalSites) {
      filterIndicator.innerHTML = `<span class="filter-count">(showing ${visibleSites})</span>`;
      filterIndicator.classList.add("active");
    } else {
      filterIndicator.innerHTML = "";
      filterIndicator.classList.remove("active");
    }
  }

  // Update filter result count in active filters banner
  const filterResultCount = $("#filterResultCount");
  if (filterResultCount) {
    if (visibleSites !== totalSites) {
      filterResultCount.textContent = `Showing ${visibleSites} of ${totalSites} dashboards`;
    } else {
      filterResultCount.textContent = "Filters Active";
    }
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

  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.textContent = "🔍";

  const heading = document.createElement("h3");
  heading.textContent = "No dashboards found";

  const text = document.createElement("p");
  text.textContent =
    "Try adjusting your filters or search terms to see more results";

  const clearBtn = document.createElement("button");
  clearBtn.className = "btn btn-primary";
  clearBtn.textContent = "Clear all filters";
  clearBtn.setAttribute(
    "aria-label",
    "Clear all filters to show all dashboards",
  );
  clearBtn.addEventListener("click", () => {
    const clearFiltersBtn = document.getElementById("clearFilters");
    if (clearFiltersBtn) clearFiltersBtn.click();
  });

  emptyState.appendChild(icon);
  emptyState.appendChild(heading);
  emptyState.appendChild(text);
  emptyState.appendChild(clearBtn);

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
  if (searchInput && searchInput.value.trim()) {
    searchInput.classList.add("has-value");
  } else if (searchInput) {
    searchInput.classList.remove("has-value");
  }

  // Highlight dropdown if not "all" (may not exist in faceted design)
  if (tagSelect) {
    if (tagSelect.value !== "all") {
      tagSelect.classList.add("active-filter");
    } else {
      tagSelect.classList.remove("active-filter");
    }
  }

  // Show/hide clear filters button
  const hasActiveFilters =
    (searchInput && searchInput.value.trim() !== "") ||
    (tagSelect && tagSelect.value !== "all") ||
    $$('.chip[aria-pressed="true"]').length > 0;

  const clearFiltersBtn = $("#clearFilters");
  if (clearFiltersBtn) {
    clearFiltersBtn.style.display = hasActiveFilters ? "" : "none";
  }

  // Update category filter counts
  updateCategoryFilterCounts();
}

/**
 * Update filter count badges for each category
 * Shows number of active filters in each section
 */
export function updateCategoryFilterCounts() {
  const categories = ["platform", "usecase", "audience", "pattern", "other"];

  categories.forEach((category) => {
    const container = $(`#chips-${category}`);
    const countBadge = $(`#${category}-count`);

    if (!container || !countBadge) return;

    const activeChips = container.querySelectorAll(
      '.chip[aria-pressed="true"]',
    );
    const count = activeChips.length;

    if (count > 0) {
      countBadge.textContent = `${count}`;
      countBadge.style.display = "";
      countBadge.classList.add("badge-primary");
    } else {
      countBadge.style.display = "none";
      countBadge.classList.remove("badge-primary");
    }
  });
}

/**
 * Clear all active filters
 * Resets search, dropdown, and chip selections
 * @param {Object} elements - Filter UI elements
 */
export function clearAllFilters({ searchInput, tagSelect }) {
  if (searchInput) {
    searchInput.value = "";
  }
  if (tagSelect) {
    tagSelect.value = "all";
  }

  $$('.chip[aria-pressed="true"]').forEach((chip) => {
    chip.setAttribute("aria-pressed", "false");
    chip.classList.remove("badge-primary", "font-semibold", "shadow-md");
    chip.classList.add("badge-outline");
    const icon = chip.querySelector("[data-checkmark]");
    if (icon) icon.classList.add("hidden");
  });

  // Reset category counts
  updateCategoryFilterCounts();
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
  debounced.cancel = function () {
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
    other: [],
  };

  // Define keyword patterns for each category
  const platformKeywords = [
    "power bi",
    "tableau",
    "arcgis",
    "saas",
    "platform",
    "excel",
    "dashboard",
    "data",
  ];
  const useCaseKeywords = [
    "cip",
    "municipal",
    "policy",
    "program",
    "budget",
    "capital",
    "infrastructure",
    "portfolio",
    "waste",
    "recovery",
    "management",
    "benchmark",
    "reference",
    "resource",
    "guidance",
  ];
  const audienceKeywords = [
    "public",
    "executive",
    "staff",
    "citizen",
    "resident",
    "internal",
    "community",
  ];
  const patternKeywords = [
    "visualization",
    "report",
    "matrix",
    "scorecard",
    "ranking",
    "prioritization",
    "pattern",
    "playbook",
  ];

  /**
   * Explicit overrides ensure important tags surface in the most helpful buckets.
   * Keys are stored in lowercase for simple lookups.
   */
  const explicitOverrides = new Map([
    ["public cip", ["useCase", "audience"]],
    ["portfolio management", ["useCase"]],
    ["resource recovery", ["useCase"]],
    ["zero waste", ["useCase"]],
    ["c&d waste", ["useCase"]],
    ["green halo", ["useCase"]],
    ["national policy", ["useCase"]],
    ["international benchmark", ["useCase"]],
    ["policy reference", ["useCase"]],
    ["reference data", ["platform", "useCase"]],
    ["open data", ["platform", "useCase"]],
    ["guidance", ["audience"]],
  ]);

  tags.forEach((tag) => {
    const tagLower = tag.toLowerCase();
    const tagCategories = new Set(explicitOverrides.get(tagLower) || []);

    // Allow tags to appear in multiple categories if they match multiple heuristics
    if (platformKeywords.some((kw) => tagLower.includes(kw))) {
      tagCategories.add("platform");
    }
    if (useCaseKeywords.some((kw) => tagLower.includes(kw))) {
      tagCategories.add("useCase");
    }
    if (audienceKeywords.some((kw) => tagLower.includes(kw))) {
      tagCategories.add("audience");
    }
    if (patternKeywords.some((kw) => tagLower.includes(kw))) {
      tagCategories.add("pattern");
    }

    if (tagCategories.size === 0) {
      tagCategories.add("other");
    }

    tagCategories.forEach((category) => {
      if (!categories[category].includes(tag)) {
        categories[category].push(tag);
      }
    });
  });

  // Keep chip lists sorted for predictable UI
  Object.values(categories).forEach((list) =>
    list.sort((a, b) => a.localeCompare(b)),
  );

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
  const banner = $("#activeFilters");
  const tray = $("#activeFilterChips");
  if (!banner || !tray) return;

  let hasFilters = false;
  tray.innerHTML = "";

  // Search query chip
  if (filterState.query && filterState.query.length > 0) {
    hasFilters = true;
    const chip = createRemovableChip("Search", filterState.query, () => {
      onRemove("query", "");
    });
    tray.appendChild(chip);
  }

  // Selected tag chips
  if (filterState.selectedTags && filterState.selectedTags.length > 0) {
    filterState.selectedTags.forEach((tag) => {
      hasFilters = true;
      const chip = createRemovableChip("Tag", tag, () => {
        onRemove("tag", tag);
      });
      tray.appendChild(chip);
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
    tray.appendChild(chip);
  }

  // Sort order chip (only if not default)
  if (filterState.sort && filterState.sort !== "default") {
    hasFilters = true;
    const sortLabel = filterState.sort === "title" ? "Title A→Z" : "Domain A→Z";
    const chip = createRemovableChip("Sort", sortLabel, () => {
      onRemove("sort", "default");
    });
    tray.appendChild(chip);
  }

  // Add clear filters button in main content area if there are filters
  let clearMainBtn = document.getElementById("clearFiltersMain");
  if (hasFilters && !clearMainBtn) {
    // Create clear filters button for main area
    clearMainBtn = document.createElement("button");
    clearMainBtn.id = "clearFiltersMain";
    clearMainBtn.className = "clear-filters-main";
    clearMainBtn.setAttribute("type", "button");
    clearMainBtn.setAttribute("aria-label", "Clear all filters");

    // Add icon and text
    clearMainBtn.innerHTML = `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
      Clear All Filters
    `;

    // Add click handler
    clearMainBtn.addEventListener("click", () => {
      const clearFiltersBtn = document.getElementById("clearFilters");
      if (clearFiltersBtn) clearFiltersBtn.click();
    });

    // Insert after the active filters banner
    banner.parentNode.insertBefore(clearMainBtn, banner.nextSibling);
  } else if (!hasFilters && clearMainBtn) {
    // Remove the clear filters button if no filters
    clearMainBtn.remove();
  }

  // Show/hide container based on filter presence
  banner.style.display = hasFilters ? "flex" : "none";
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
  console.log("[populateFacetedFilters] Starting with", tags.length, "tags");
  const categorized = categorizeTags(tags);
  console.log("[populateFacetedFilters] Categorized:", categorized);

  // Clear all chip containers
  const containers = {
    platform: $("#chips-platform"),
    useCase: $("#chips-usecase"),
    audience: $("#chips-audience"),
    pattern: $("#chips-pattern"),
    other: $("#chips-other"),
  };

  console.log("[populateFacetedFilters] Container check:", {
    platform: !!containers.platform,
    useCase: !!containers.useCase,
    audience: !!containers.audience,
    pattern: !!containers.pattern,
    other: !!containers.other,
  });

  // Populate each category
  Object.entries(containers).forEach(([key, container]) => {
    if (!container) {
      console.warn(`[populateFacetedFilters] Container ${key} not found!`);
      return;
    }

    container.innerHTML = "";

    if (categorized[key].length === 0) {
      console.log(`[populateFacetedFilters] No tags for ${key}`);
      container.innerHTML =
        '<p class="filter-empty">No filters in this category</p>';
      return;
    }

    console.log(
      `[populateFacetedFilters] Adding ${categorized[key].length} chips to ${key}:`,
      categorized[key],
    );
    categorized[key].forEach((tag) => {
      const chip = createChipFn(tag);
      container.appendChild(chip);
    });
  });

  console.log("[populateFacetedFilters] Complete");
}
