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
} from "./filters.js?v=3";
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
  finalizeDetailModalClose,
} from "./detail-modal.js?v=2";
import {
  renderRole,
  createLearningHandlers,
  printChecklist,
  createOnboardingHandlers,
} from "./learning-mode.js";
import { initTheme } from "./theme.js";

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
    description:
      typeof site.description === "string" ? site.description.trim() : "",
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
      sites.flatMap((site) => site.tags || []).map((tag) => tag.toLowerCase()),
    );

    const elements = getFilterElements();

    // Get all unique tags
    const allTags = Array.from(
      new Set(sites.flatMap((site) => site.tags || [])),
    ).sort((a, b) => a.localeCompare(b));

    // Use faceted filter population
    populateFacetedFilters(allTags, (tagText) => {
      return createChip(tagText, () => {
        // Chip toggle handler - sync URL immediately
        syncURLWithFilters();
        updateFilterStates(elements);
        applyFilters({ ...elements, totalSites: sites.length });

        // Auto-close drawer on mobile after filter selection
        if (window.innerWidth < 1024) {
          const drawerToggle = document.getElementById("filter-drawer");
          if (drawerToggle && drawerToggle.checked) {
            // Add visual feedback before closing
            const filterSidebar = document.getElementById("filterSidebar");
            if (filterSidebar) {
              filterSidebar.style.opacity = "0.7";
              setTimeout(() => {
                // Only restore opacity if drawer is still open
                if (drawerToggle.checked) {
                  filterSidebar.style.opacity = "1";
                }
              }, 150);
            }
            // Reduced delay for faster response
            setTimeout(() => {
              // Only close if still checked (user might have closed manually)
              if (drawerToggle.checked) {
                drawerToggle.checked = false;
              }
            }, 200);
          }
        }
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
    grid.innerHTML = `
      <div class="hero min-h-[400px] bg-base-200 rounded-lg col-span-full">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h2 class="text-3xl font-bold mb-4">📊 No Dashboards Found</h2>
            <p class="text-base-content/70">
              No dashboards match your current filters. Try adjusting your search or clearing filters to see more results.
            </p>
          </div>
        </div>
      </div>
    `;
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
    <div class="hero min-h-[400px] bg-error/10 rounded-lg col-span-full">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <div class="text-5xl mb-4">⚠️</div>
          <h2 class="text-3xl font-bold mb-4">Unable to Load Data</h2>
          <p class="text-base-content/70 mb-4">
            Could not load showcase data. Please check that <code class="bg-base-200 px-2 py-1 rounded">${escapeHtml(SITES_ENDPOINT)}</code> is reachable and correctly formatted.
          </p>
          <button class="btn btn-primary" onclick="location.reload()">
            🔄 Retry
          </button>
        </div>
      </div>
    </div>
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
    overlay: $("#detailModal"),
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
    printTooltip: $("#printTooltip"),
    learningBtnTooltip: $("#learningBtnTooltip"),
    checklistContent: $("#checklistContent"),
    roleSelect: $("#roleSelect"),
    tip: $("#learningTip"),
    roleSubtitle: $("#learningRoleSubtitle"),
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
  $$(".chip").forEach((chip) => {
    const chipTag = chip.dataset.tag || "";
    const shouldBePressed = validatedState.selectedTags.includes(chipTag);
    chip.setAttribute("aria-pressed", String(shouldBePressed));
    chip.dataset.state = shouldBePressed ? "active" : "inactive";
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
    $$(".chip").forEach((chip) => {
      if (chip.dataset.tag === value) {
        chip.setAttribute("aria-pressed", "false");
        chip.dataset.state = "inactive";
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
  const drawerToggleInput = document.getElementById("filter-drawer");
  const filterToggleButton = document.getElementById("filterToggleButton");
  const filterToggleTooltip = document.getElementById("filterToggleTooltip");
  const filterRevealZone = document.getElementById("filterRevealZone");

  const lgMediaQuery = window.matchMedia("(min-width: 1024px)");

  const updateFilterToggleState = () => {
    if (!drawerToggleInput || !filterToggleButton) return;
    const expanded = drawerToggleInput.checked;
    filterToggleButton.setAttribute("aria-expanded", String(expanded));
    filterToggleButton.setAttribute(
      "aria-label",
      expanded ? "Hide filters" : "Show filters",
    );
    filterToggleButton.setAttribute("aria-pressed", String(expanded));
    if (filterToggleTooltip) {
      filterToggleTooltip.setAttribute(
        "data-tip",
        expanded ? "Hide filters" : "Show filters",
      );
    }

    if (filterRevealZone) {
      const showReveal = !expanded && lgMediaQuery.matches;
      filterRevealZone.classList.toggle("is-visible", showReveal);
      // Update ARIA attributes when visibility changes
      if (showReveal) {
        filterRevealZone.setAttribute("aria-hidden", "false");
        filterRevealZone.setAttribute("tabindex", "0");
      } else {
        filterRevealZone.setAttribute("aria-hidden", "true");
        filterRevealZone.setAttribute("tabindex", "-1");
      }
    }
  };

  if (drawerToggleInput) {
    drawerToggleInput.addEventListener("change", updateFilterToggleState);

    const handleViewportChange = (event) => {
      drawerToggleInput.checked = event.matches;
      updateFilterToggleState();
    };

    handleViewportChange(lgMediaQuery);
    if (typeof lgMediaQuery.addEventListener === "function") {
      lgMediaQuery.addEventListener("change", handleViewportChange);
    } else if (typeof lgMediaQuery.addListener === "function") {
      lgMediaQuery.addListener(handleViewportChange);
    }
  }

  if (filterRevealZone && drawerToggleInput) {
    const openDrawer = () => {
      if (!lgMediaQuery.matches) return;
      drawerToggleInput.checked = true;
      updateFilterToggleState();
    };

    filterRevealZone.addEventListener("pointerenter", openDrawer);
    filterRevealZone.addEventListener("focus", openDrawer);
    filterRevealZone.addEventListener("click", openDrawer);
    filterRevealZone.addEventListener("keyup", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        openDrawer();
      }
    });
  }

  updateFilterToggleState();

  // Create debounced search handler (300ms delay)
  const debouncedSearchSync = debounce(() => {
    syncURLWithFilters();
    applyFilters({ ...elements, totalSites: sites.length });
  }, 300);

  // Search input - debounced URL sync with immediate visual feedback
  const clearSearchBtn = document.getElementById("clearSearch");

  const updateClearButtonVisibility = () => {
    if (clearSearchBtn && elements.searchInput) {
      clearSearchBtn.style.display = elements.searchInput.value.trim() ? "flex" : "none";
    }
  };

  elements.searchInput?.addEventListener("input", () => {
    updateClearButtonVisibility();
    updateFilterStates(elements); // Immediate visual feedback
    debouncedSearchSync(); // Delayed filter + URL update
  });

  // Clear search button
  clearSearchBtn?.addEventListener("click", () => {
    if (elements.searchInput) {
      elements.searchInput.value = "";
      updateClearButtonVisibility();
      updateFilterStates(elements);
      syncURLWithFilters();
      applyFilters({ ...elements, totalSites: sites.length });
      elements.searchInput.focus(); // Return focus to input
    }
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
    renderActiveFilters(
      { query: "", selectedTags: [], dropdown: "all", sort: "default" },
      handleRemoveFilter,
    );
  });
}

/**
 * Setup learning mode listeners
 */
function setupLearningMode() {
  const elements = getLearningElements();

  // Learning template removed per user request

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

  elements.modal?.addEventListener("close", () => {
    finalizeDetailModalClose();
    disableDetailKeyboard(detailHandlers.keydownHandler);
  });

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
      (card) => card.style.display !== "none",
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
 * Update copyright year to current year
 */
function updateCopyrightYear() {
  const copyrightEl = document.getElementById("copyright");
  if (copyrightEl) {
    const currentYear = new Date().getFullYear();
    copyrightEl.textContent = `© ${currentYear} City of Austin`;
  }
}

/**
 * Initialize application
 */
function init() {
  initTheme();
  updateCopyrightYear();
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
