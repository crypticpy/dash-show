/**
 * Main Application Module
 * Orchestrates all modules and initializes the application.
 * Handles site loading, event binding, and keyboard navigation.
 */

import { $, $$, escapeHtml } from "./utils.js";
import { hydrateBlurbs, clearCache } from "./api.js";
import { getCurrentRole, setCurrentRole } from "./state.js";
import { hasSeenOnboarding } from "./state.js";
import {
  getFilterStateFromUI,
  serializeFilters,
  deserializeFilters,
  updateURL,
  validateFilterState,
} from "./state.js";
import {
  applyFilters,
  updateFilterStates,
  clearAllFilters,
  debounce,
  renderActiveFilters,
  populateFacetedFilters,
  setupFilterDrawer,
} from "./filters.js";
import {
  cardTemplate,
  populateTagControls,
  createChip,
  setupLazyImages,
  getCategoryIcon,
} from "./cards.js";
import {
  openDetailModal,
  closeDetailModal,
  createDetailHandlers,
  enableDetailKeyboard,
  disableDetailKeyboard,
} from "./detail-modal.js";
import {
  renderRole,
  createLearningHandlers,
  printChecklist,
  createOnboardingHandlers,
} from "./learning-mode.js";

// Configuration
const SITES_ENDPOINT = "sites.json";

// Application state
let sites = [];
let learningHandlers = null;
let detailHandlers = null;
let validTagsSet = new Set(); // Set of valid tag names (lowercase)

/**
 * Normalize site data with defaults
 * @param {Object} site - Raw site data
 * @returns {Object} Normalized site object
 */
function normalizeSite(site = {}) {
  const tags = Array.isArray(site.tags) ? site.tags.filter(Boolean) : [];
  if (tags.length === 0) tags.push("Uncategorized");

  return {
    title: site.title || "Untitled dashboard",
    url: site.url || "#",
    tags,
    description: typeof site.description === "string" ? site.description.trim() : "",
    techniques: Array.isArray(site.techniques)
      ? site.techniques.filter(Boolean)
      : [],
  };
}

/**
 * Load sites from JSON endpoint
 * @returns {Promise<void>}
 */
async function loadSites() {
  try {
    const res = await fetch(SITES_ENDPOINT, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = await res.json();
    const items = Array.isArray(payload)
      ? payload
      : (payload && payload.sites) || [];

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No sites found in configuration");
    }

    sites = items.map(normalizeSite);

    // Build set of valid tags (lowercase) for validation
    validTagsSet = new Set(
      sites.flatMap((site) => site.tags || []).map((tag) => tag.toLowerCase())
    );

    const elements = getFilterElements();

    // Get all unique tags
    const allTags = Array.from(
      new Set(sites.flatMap((site) => site.tags || []))
    ).sort((a, b) => a.localeCompare(b));

    // Use faceted filter population
    populateFacetedFilters(allTags, (tagText) => {
      return createChip(tagText, () => {
        // Chip toggle handler - sync URL immediately
        syncURLWithFilters();
        updateFilterStates(elements);
        applyFilters({ ...elements, totalSites: sites.length });
      });
    });

    // Setup filter drawer interactions
    setupFilterDrawer();

    updateHeroSummary(sites.length);
    buildGrid();

    // Apply initial filters from URL if present
    const initialParams = new URLSearchParams(window.location.search);
    if (initialParams.toString()) {
      const state = deserializeFilters(initialParams);
      applyFilterStateToUI(state);
    } else {
      applyFilters({ ...getFilterElements(), totalSites: sites.length });
    }
  } catch (err) {
    console.error("Failed to load site configuration", err);
    showConfigError();
  }
}

/**
 * Build card grid from sites data
 * @param {Array<Object>} data - Sites to render (defaults to all sites)
 */
function buildGrid(data = sites) {
  const grid = $("#grid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    grid.innerHTML = '<p class="meta notice">No dashboards configured yet.</p>';
    return;
  }

  data.forEach((item, index) => {
    const card = cardTemplate(item, handleCardClick);
    card.style.setProperty("--index", index);
    grid.appendChild(card);
  });

  setupLazyImages();
}

/**
 * Handle card click to open detail modal
 * @param {HTMLElement} card - Card element
 * @param {Object} item - Site data
 * @param {Event} event - Click event
 */
function handleCardClick(card, item, event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }

  const elements = getDetailElements();
  openDetailModal(item, card, elements);
  enableDetailKeyboard(detailHandlers.keydownHandler);
}

/**
 * Show configuration error message
 */
function showConfigError() {
  updateHeroSummary(0);
  const grid = $("#grid");
  if (!grid) return;

  grid.innerHTML = `
    <article class="card">
      <section class="content">
        <h3>Unable to load showcase data</h3>
        <p class="blurb">Check that <code>${escapeHtml(SITES_ENDPOINT)}</code> is reachable and correctly formatted.</p>
      </section>
    </article>
  `;
}

/**
 * Update hero summary count
 * @param {number} totalSites - Total site count
 */
function updateHeroSummary(totalSites = 0) {
  const siteCountEl = $("#siteCount");
  if (siteCountEl) {
    siteCountEl.textContent = String(totalSites || 0);
  }
}

/**
 * Get filter UI elements
 * @returns {Object} Filter elements
 */
function getFilterElements() {
  return {
    searchInput: $("#q"),
    tagSelect: $("#filterTag"),
    sortSelect: $("#sortBy"),
    grid: $("#grid"),
    chipsContainer: $("#chips"),
  };
}

/**
 * Get detail modal elements
 * @returns {Object} Detail modal elements
 */
function getDetailElements() {
  return {
    overlay: $("#detailOverlay"),
    modal: $("#detailModal"),
    closeBtn: $("#closeDetail"),
    category: $("#detailCategory"),
    title: $("#detailTitle"),
    domain: $("#detailDomain"),
    summaryText: $("#detailSummary"),
    blurb: $("#detailBlurb"),
    tags: $("#detailTags"),
    techniques: $("#detailTechniques"),
    visitBtn: $("#detailVisit"),
    openBtn: $("#detailOpen"),
    screenshot: $("#detailScreenshot"),
    body: $("#detailBody"),
  };
}

/**
 * Get learning mode elements
 * @returns {Object} Learning mode elements
 */
function getLearningElements() {
  return {
    overlay: $("#learningOverlay"),
    panel: $("#learningPanel"),
    learningBtn: $("#toggleLearning"),
    closeBtn: $("#closeLearning"),
    printBtn: $("#printChecklist"),
    checklistContent: $("#checklistContent"),
    roleSelect: $("#roleSelect"),
    tip: $("#learningTip"),
  };
}

/**
 * Get onboarding elements
 * @returns {Object} Onboarding elements
 */
function getOnboardingElements() {
  return {
    overlay: $("#onboardingOverlay"),
    content: $("#onboardingContent"),
    closeBtn: $("#onboardingClose"),
    helpBtn: $("#onboardingHelp"),
  };
}

/**
 * Synchronize URL with current filter state
 * Reads UI state, serializes to URL params, updates browser history
 */
function syncURLWithFilters() {
  const filterState = getFilterStateFromUI();
  const params = serializeFilters(filterState);
  updateURL(params);
  renderActiveFilters(filterState, handleRemoveFilter);
}

/**
 * Apply filter state from URL to UI
 * Used on page load and browser back/forward navigation
 * @param {Object} state - Deserialized filter state from URL
 */
function applyFilterStateToUI(state) {
  const elements = getFilterElements();

  // Validate state against known tags
  const validatedState = validateFilterState(state, validTagsSet);

  // Apply search query
  if (elements.searchInput) {
    elements.searchInput.value = validatedState.query || "";
  }

  // Apply dropdown filter
  if (elements.tagSelect) {
    elements.tagSelect.value = validatedState.dropdown || "all";
  }

  // Apply sort order
  if (elements.sortSelect) {
    elements.sortSelect.value = validatedState.sort || "default";
  }

  // Apply selected tag chips
  $$('.chip').forEach((chip) => {
    const chipTag = chip.dataset.tag || "";
    const shouldBePressed = validatedState.selectedTags.includes(chipTag);
    chip.setAttribute("aria-pressed", String(shouldBePressed));
    const icon = chip.querySelector(".chip-icon");
    if (icon) {
      icon.style.display = shouldBePressed ? "inline" : "none";
    }
  });

  // Update filter states and apply filters
  updateFilterStates(elements);
  applyFilters({ ...elements, totalSites: sites.length });
  renderActiveFilters(validatedState, handleRemoveFilter);
}

/**
 * Handle removing individual filter from active chips
 * @param {string} type - Filter type (query, tag, dropdown, sort)
 * @param {string} value - New value to set
 */
function handleRemoveFilter(type, value) {
  const elements = getFilterElements();

  if (type === "query") {
    if (elements.searchInput) elements.searchInput.value = "";
  } else if (type === "tag") {
    // Find and unpress the chip
    $$('.chip').forEach((chip) => {
      if (chip.dataset.tag === value) {
        chip.setAttribute("aria-pressed", "false");
        const icon = chip.querySelector(".chip-icon");
        if (icon) icon.style.display = "none";
      }
    });
  } else if (type === "dropdown") {
    if (elements.tagSelect) elements.tagSelect.value = value;
  } else if (type === "sort") {
    if (elements.sortSelect) elements.sortSelect.value = value;
  }

  // Sync URL and reapply filters
  syncURLWithFilters();
  updateFilterStates(elements);
  applyFilters({ ...elements, totalSites: sites.length });
}

/**
 * Setup filter event listeners with URL synchronization
 */
function setupFilterListeners() {
  const elements = getFilterElements();

  // Create debounced search handler (300ms delay)
  const debouncedSearchSync = debounce(() => {
    syncURLWithFilters();
    applyFilters({ ...elements, totalSites: sites.length });
  }, 300);

  // Search input - debounced URL sync with immediate visual feedback
  elements.searchInput?.addEventListener("input", () => {
    updateFilterStates(elements); // Immediate visual feedback
    debouncedSearchSync(); // Delayed filter + URL update
  });

  // Dropdown filter - immediate URL sync
  elements.tagSelect?.addEventListener("change", () => {
    syncURLWithFilters();
    updateFilterStates(elements);
    applyFilters({ ...elements, totalSites: sites.length });
  });

  // Sort order - immediate URL sync
  elements.sortSelect?.addEventListener("change", () => {
    syncURLWithFilters();
    applyFilters({ ...elements, totalSites: sites.length });
  });

  // Clear filters button - clear URL params
  const clearBtn = $("#clearFilters");
  clearBtn?.addEventListener("click", () => {
    clearAllFilters(elements);
    updateURL(new URLSearchParams()); // Clear all URL params
    updateFilterStates(elements);
    applyFilters({ ...elements, totalSites: sites.length });
    renderActiveFilters({ query: "", selectedTags: [], dropdown: "all", sort: "default" }, handleRemoveFilter);
  });
}

/**
 * Setup learning mode listeners
 */
function setupLearningMode() {
  const elements = getLearningElements();

  // Initialize learning template
  const learningTemplate = document.getElementById("learning-panel-template");
  if (learningTemplate) {
    document.body.appendChild(learningTemplate.content.cloneNode(true));
    learningTemplate.remove();
  }

  // Create handlers
  learningHandlers = createLearningHandlers(elements);

  // Render initial role
  const currentRole = getCurrentRole();
  renderRole(currentRole, false, elements);

  // Setup role selector
  if (elements.roleSelect) {
    elements.roleSelect.value = currentRole;
    elements.roleSelect.addEventListener("change", (event) => {
      const nextRole = event.target.value;
      setCurrentRole(nextRole);
      renderRole(nextRole, learningHandlers.isActive(), elements);
    });
  }

  // Setup learning button
  if (elements.learningBtn) {
    elements.learningBtn.setAttribute("aria-haspopup", "dialog");
    elements.learningBtn.setAttribute("aria-expanded", "false");
    elements.learningBtn.setAttribute("aria-controls", "learningPanel");
    elements.learningBtn.addEventListener("click", () => {
      learningHandlers.toggleLearningPanel();
    });
  }

  // Setup close button
  elements.closeBtn?.addEventListener("click", () => {
    learningHandlers.closeLearningPanel();
  });

  // Setup overlay click
  elements.overlay?.addEventListener("mousedown", (event) => {
    if (event.target === elements.overlay) {
      learningHandlers.closeLearningPanel();
    }
  });

  // Setup print button
  elements.printBtn?.addEventListener("click", () => {
    printChecklist(getCurrentRole(), elements.checklistContent);
  });
}

/**
 * Setup detail modal listeners
 */
function setupDetailModal() {
  const elements = getDetailElements();

  detailHandlers = createDetailHandlers(elements);

  elements.closeBtn?.addEventListener("click", () => {
    closeDetailModal(elements);
    disableDetailKeyboard(detailHandlers.keydownHandler);
  });

  elements.overlay?.addEventListener("mousedown", (event) => {
    if (event.target === elements.overlay) {
      closeDetailModal(elements);
      disableDetailKeyboard(detailHandlers.keydownHandler);
    }
  });
}

/**
 * Setup onboarding flow
 */
function setupOnboarding() {
  const elements = getOnboardingElements();
  const handlers = createOnboardingHandlers(elements);

  elements.closeBtn?.addEventListener("click", () => {
    handlers.hideOnboarding(true);
  });

  elements.helpBtn?.addEventListener("click", () => {
    handlers.showOnboarding();
  });

  elements.overlay?.addEventListener("mousedown", (event) => {
    if (event.target === elements.overlay) {
      handlers.hideOnboarding(true);
    }
  });

  // Show onboarding on first visit
  if (!hasSeenOnboarding()) {
    setTimeout(() => handlers.showOnboarding(), 500);
  }
}

/**
 * Setup keyboard navigation for card grid
 */
function setupKeyboardNavigation() {
  const grid = $("#grid");
  if (!grid) return;

  grid.addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
      return;
    }

    const cards = Array.from(grid.querySelectorAll(".card")).filter(
      (card) => card.style.display !== "none"
    );

    const currentIndex = cards.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    // Calculate grid columns
    const gridStyle = window.getComputedStyle(grid);
    const gridColumns = gridStyle.gridTemplateColumns.split(" ").length;

    let nextIndex = currentIndex;

    if (e.key === "ArrowRight" && currentIndex < cards.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (e.key === "ArrowLeft" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (e.key === "ArrowDown") {
      nextIndex = Math.min(currentIndex + gridColumns, cards.length - 1);
    } else if (e.key === "ArrowUp") {
      nextIndex = Math.max(currentIndex - gridColumns, 0);
    }

    if (nextIndex !== currentIndex && cards[nextIndex]) {
      e.preventDefault();
      cards[nextIndex].focus();
      cards[nextIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}

/**
 * Setup browser history integration
 * Handles popstate events for back/forward navigation
 */
function setupBrowserHistory() {
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const state = deserializeFilters(params);
    applyFilterStateToUI(state);
  });
}

/**
 * Initialize application
 */
function init() {
  setupFilterListeners();
  setupLearningMode();
  setupDetailModal();
  setupOnboarding();
  setupKeyboardNavigation();
  setupBrowserHistory();
  loadSites();
}

// Start application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
