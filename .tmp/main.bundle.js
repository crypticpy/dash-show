(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // scripts/utils.js
  function escapeHtml(s = "") {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return s.replace(/[&<>"']/g, (m) => escapeMap[m]);
  }
  function enableSwipeDismiss(target, onDismiss, options = {}) {
    if (!target || typeof onDismiss !== "function") return void 0;
    const {
      threshold = 80,
      verticalLimit = 50,
      surface = target
    } = options;
    if (!surface) return void 0;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let tracking = false;
    let horizontalIntent = false;
    const handleTouchStart = (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      lastX = startX;
      tracking = true;
      horizontalIntent = false;
    };
    const handleTouchMove = (event) => {
      if (!tracking) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      lastX = touch.clientX;
      if (!horizontalIntent) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          tracking = false;
          return;
        }
        if (Math.abs(deltaX) > 16) {
          horizontalIntent = true;
        }
      }
      if (horizontalIntent && Math.abs(deltaY) > verticalLimit) {
        tracking = false;
      }
    };
    const handleTouchFinish = () => {
      if (!tracking || !horizontalIntent) {
        tracking = false;
        horizontalIntent = false;
        return;
      }
      const deltaX = lastX - startX;
      if (Math.abs(deltaX) >= threshold) {
        onDismiss();
      }
      tracking = false;
      horizontalIntent = false;
    };
    surface.addEventListener("touchstart", handleTouchStart, { passive: true });
    surface.addEventListener("touchmove", handleTouchMove, { passive: true });
    surface.addEventListener("touchend", handleTouchFinish);
    surface.addEventListener("touchcancel", handleTouchFinish);
    return () => {
      surface.removeEventListener("touchstart", handleTouchStart);
      surface.removeEventListener("touchmove", handleTouchMove);
      surface.removeEventListener("touchend", handleTouchFinish);
      surface.removeEventListener("touchcancel", handleTouchFinish);
    };
  }
  var $, $$, truncate, hostname, screenshotURL, screenshotFallback, faviconURL, proxiedReadableURL;
  var init_utils = __esm({
    "scripts/utils.js"() {
      $ = (sel, el = document) => el.querySelector(sel);
      $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
      truncate = (s, n = 260) => s && s.length > n ? s.slice(0, n - 1) + "\u2026" : s || "";
      hostname = (url) => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return url;
        }
      };
      screenshotURL = (url, width = 640) => `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${width}`;
      screenshotFallback = (url) => `https://image.thum.io/get/width/1200/crop/900/${url}`;
      faviconURL = (url) => {
        const host = hostname(url);
        return `https://www.google.com/s2/favicons?domain=${host}&sz=256`;
      };
      proxiedReadableURL = (url) => {
        const clean = url.replace(/^https?:\/\//, "");
        return `https://r.jina.ai/http://${clean}`;
      };
    }
  });

  // scripts/api.js
  var api_exports = {};
  __export(api_exports, {
    clearCache: () => clearCache,
    fetchBlurb: () => fetchBlurb,
    getCacheInfo: () => getCacheInfo,
    hydrateBlurbs: () => hydrateBlurbs
  });
  function saveCache() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }
  async function fetchBlurb(url) {
    const cached = cache[url];
    if (cached?.text && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.text;
    }
    try {
      const res = await fetch(proxiedReadableURL(url), { mode: "cors" });
      if (!res.ok) throw new Error("bad status");
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      let text = extractBlurbFromDocument(doc);
      text = truncate(text, 280);
      if (text) {
        cache[url] = { text, ts: Date.now() };
        saveCache();
      }
      return text;
    } catch (e) {
      console.warn(`Failed to fetch blurb for ${url}:`, e.message);
      return "";
    }
  }
  function extractBlurbFromDocument(doc) {
    const paragraphs = Array.from(doc.querySelectorAll("p")).map((p) => (p.textContent || "").trim()).filter((t) => {
      const wordCount = t.split(/\s+/).length;
      const hasNoise = /cookie|javascript|enable|subscribe|sign in|accept/i.test(t);
      return wordCount >= 10 && !hasNoise;
    });
    if (paragraphs.length) {
      return paragraphs[0];
    }
    const bodyText = (doc.body?.textContent || "").trim();
    const textBlocks = bodyText.split(/\n{2,}/);
    const substantialBlock = textBlocks.find((s) => s.trim().length > 80);
    return substantialBlock || "";
  }
  async function hydrateBlurbs(onProgress) {
    const cards = Array.from(document.querySelectorAll(".card"));
    const total = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const url = card.querySelector(".btn.primary")?.getAttribute("href");
      const blurbEl = card.querySelector(".blurb");
      if (!url || !blurbEl) continue;
      const text = await fetchBlurb(url);
      if (text) {
        blurbEl.textContent = text;
      } else {
        blurbEl.innerHTML = '<span class="notice">Blurb unavailable (site blocked or no readable text).</span>';
      }
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
  }
  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
  function getCacheInfo() {
    const keys = Object.keys(cache);
    return {
      entryCount: keys.length,
      sizeEstimate: JSON.stringify(cache).length
    };
  }
  var CACHE_KEY, CACHE_TTL_MS, cache;
  var init_api = __esm({
    "scripts/api.js"() {
      init_utils();
      CACHE_KEY = "pp-showcase-blurbs-v1";
      CACHE_TTL_MS = 1e3 * 60 * 60 * 24 * 7;
      cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    }
  });

  // scripts/state.js
  function getCurrentRole() {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    return stored === "coach" || stored === "student" ? stored : DEFAULT_ROLE;
  }
  function setCurrentRole(role) {
    if (role !== "student" && role !== "coach") {
      role = DEFAULT_ROLE;
    }
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }
  function hasSeenOnboarding() {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  }
  function markOnboardingSeen() {
    localStorage.setItem(ONBOARDING_KEY, "true");
  }
  function getFilterStateFromUI() {
    const searchInput = document.getElementById("q");
    const tagSelect = document.getElementById("filterTag");
    const sortSelect = document.getElementById("sortBy");
    const pressedChips = Array.from(document.querySelectorAll('.chip[aria-pressed="true"]'));
    return {
      query: searchInput ? searchInput.value.trim() : "",
      selectedTags: pressedChips.map((chip) => chip.dataset.tag || "").filter(Boolean),
      dropdown: tagSelect ? tagSelect.value : "all",
      sort: sortSelect ? sortSelect.value : "default"
    };
  }
  function serializeFilters(filterState) {
    const params = new URLSearchParams();
    if (filterState.query && filterState.query.length > 0) {
      params.set("q", filterState.query);
    }
    if (filterState.selectedTags && filterState.selectedTags.length > 0) {
      const tagString = filterState.selectedTags.map((tag) => tag.toLowerCase()).join(",");
      params.set("tags", tagString);
    }
    if (filterState.dropdown && filterState.dropdown !== "all") {
      params.set("filter", filterState.dropdown.toLowerCase());
    }
    if (filterState.sort && filterState.sort !== "default") {
      params.set("sort", filterState.sort.toLowerCase());
    }
    return params;
  }
  function deserializeFilters(params) {
    const state = {
      query: "",
      selectedTags: [],
      dropdown: "all",
      sort: "default"
    };
    const query = params.get("q");
    if (query) {
      state.query = query.trim();
    }
    const tagsParam = params.get("tags");
    if (tagsParam) {
      state.selectedTags = tagsParam.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => toTitleCase(tag));
    }
    const filter = params.get("filter");
    if (filter) {
      state.dropdown = filter.toLowerCase();
    }
    const sort = params.get("sort");
    if (sort && ["default", "title", "domain"].includes(sort.toLowerCase())) {
      state.sort = sort.toLowerCase();
    }
    return state;
  }
  function updateURL(params) {
    const url = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }
  function validateFilterState(state, validTags) {
    const validated = {
      query: typeof state.query === "string" ? state.query.trim() : "",
      selectedTags: [],
      dropdown: "all",
      sort: "default"
    };
    if (Array.isArray(state.selectedTags)) {
      validated.selectedTags = state.selectedTags.filter((tag) => validTags.has(tag.toLowerCase())).slice(0, 10);
    }
    if (state.dropdown && (state.dropdown === "all" || validTags.has(state.dropdown.toLowerCase()))) {
      validated.dropdown = state.dropdown;
    }
    if (state.sort && ["default", "title", "domain"].includes(state.sort.toLowerCase())) {
      validated.sort = state.sort;
    }
    return validated;
  }
  function toTitleCase(str) {
    return str.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }
  var ROLE_STORAGE_KEY, ONBOARDING_KEY, DEFAULT_ROLE;
  var init_state = __esm({
    "scripts/state.js"() {
      ROLE_STORAGE_KEY = "pp-showcase-role";
      ONBOARDING_KEY = "hasSeenOnboarding";
      DEFAULT_ROLE = "student";
    }
  });

  // scripts/filters.js?v=3
  function applyFilters({
    searchInput,
    tagSelect,
    sortSelect,
    grid,
    totalSites
  }) {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectTag = tagSelect ? tagSelect.value : "all";
    const pressedChips = $$('.chip[aria-pressed="true"]').map(
      (c) => c.dataset.tag
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
    announceFilterResults(totalSites, visibleCards.length);
    if (grid) {
      grid.setAttribute("aria-busy", "false");
    }
  }
  function cardMatchesQuery(query, title, domain, tags) {
    if (!query) return true;
    return title.includes(query) || domain.includes(query) || tags.some((t) => t.includes(query));
  }
  function cardMatchesSelect(selectTag, tags) {
    return selectTag === "all" || tags.includes(selectTag.toLowerCase());
  }
  function cardMatchesChips(pressedChips, tags) {
    if (pressedChips.length === 0) return true;
    return pressedChips.every((t) => tags.includes(t.toLowerCase()));
  }
  function announceFilterResults(totalSites, visibleSites) {
    const announcement = $("#filterAnnouncement");
    if (!announcement) return;
    let message = "";
    if (visibleSites === totalSites) {
      message = `Showing all ${totalSites} dashboards`;
    } else if (visibleSites === 0) {
      message = `No dashboards match your filters`;
    } else {
      message = `Showing ${visibleSites} of ${totalSites} dashboards`;
    }
    announcement.textContent = message;
  }
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
    const filterResultCount = $("#filterResultCount");
    if (filterResultCount) {
      if (visibleSites !== totalSites) {
        filterResultCount.textContent = `Showing ${visibleSites} of ${totalSites} dashboards`;
      } else {
        filterResultCount.textContent = "Filters Active";
      }
    }
  }
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
  function createEmptyStateElement() {
    const emptyState = document.createElement("div");
    emptyState.id = "emptyState";
    emptyState.className = "empty-state";
    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "\u{1F50D}";
    const heading = document.createElement("h3");
    heading.textContent = "No dashboards found";
    const text = document.createElement("p");
    text.textContent = "Try adjusting your filters or search terms to see more results";
    const clearBtn = document.createElement("button");
    clearBtn.className = "btn btn-primary";
    clearBtn.textContent = "Clear all filters";
    clearBtn.setAttribute("aria-label", "Clear all filters to show all dashboards");
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
  function updateFilterStates({ searchInput, tagSelect }) {
    if (searchInput && searchInput.value.trim()) {
      searchInput.classList.add("has-value");
    } else if (searchInput) {
      searchInput.classList.remove("has-value");
    }
    if (tagSelect) {
      if (tagSelect.value !== "all") {
        tagSelect.classList.add("active-filter");
      } else {
        tagSelect.classList.remove("active-filter");
      }
    }
    const hasActiveFilters = searchInput && searchInput.value.trim() !== "" || tagSelect && tagSelect.value !== "all" || $$('.chip[aria-pressed="true"]').length > 0;
    const clearFiltersBtn = $("#clearFilters");
    if (clearFiltersBtn) {
      clearFiltersBtn.style.display = hasActiveFilters ? "" : "none";
    }
    updateCategoryFilterCounts();
  }
  function updateCategoryFilterCounts() {
    const categories = ["platform", "usecase", "audience", "pattern", "other"];
    categories.forEach((category) => {
      const container = $(`#chips-${category}`);
      const countBadge = $(`#${category}-count`);
      if (!container || !countBadge) return;
      const activeChips = container.querySelectorAll(
        '.chip[aria-pressed="true"]'
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
  function clearAllFilters({ searchInput, tagSelect }) {
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
    updateCategoryFilterCounts();
  }
  function debounce(func, wait = 300) {
    let timeout;
    const debounced = function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
    debounced.cancel = function() {
      clearTimeout(timeout);
    };
    return debounced;
  }
  function categorizeTags(tags) {
    const categories = {
      platform: [],
      useCase: [],
      audience: [],
      pattern: [],
      other: []
    };
    const platformKeywords = [
      "power bi",
      "tableau",
      "arcgis",
      "saas",
      "platform",
      "excel",
      "dashboard",
      "data"
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
      "guidance"
    ];
    const audienceKeywords = [
      "public",
      "executive",
      "staff",
      "citizen",
      "resident",
      "internal",
      "community"
    ];
    const patternKeywords = [
      "visualization",
      "report",
      "matrix",
      "scorecard",
      "ranking",
      "prioritization",
      "pattern",
      "playbook"
    ];
    const explicitOverrides = /* @__PURE__ */ new Map([
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
      ["guidance", ["audience"]]
    ]);
    tags.forEach((tag) => {
      const tagLower = tag.toLowerCase();
      const tagCategories = new Set(explicitOverrides.get(tagLower) || []);
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
    Object.values(categories).forEach(
      (list) => list.sort((a, b) => a.localeCompare(b))
    );
    return categories;
  }
  function renderActiveFilters(filterState, onRemove) {
    const banner = $("#activeFilters");
    const tray = $("#activeFilterChips");
    if (!banner || !tray) return;
    let hasFilters = false;
    tray.innerHTML = "";
    if (filterState.query && filterState.query.length > 0) {
      hasFilters = true;
      const chip = createRemovableChip("Search", filterState.query, () => {
        onRemove("query", "");
      });
      tray.appendChild(chip);
    }
    if (filterState.selectedTags && filterState.selectedTags.length > 0) {
      filterState.selectedTags.forEach((tag) => {
        hasFilters = true;
        const chip = createRemovableChip("Tag", tag, () => {
          onRemove("tag", tag);
        });
        tray.appendChild(chip);
      });
    }
    if (filterState.dropdown && filterState.dropdown !== "all") {
      hasFilters = true;
      const displayValue = filterState.dropdown.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const chip = createRemovableChip("Category", displayValue, () => {
        onRemove("dropdown", "all");
      });
      tray.appendChild(chip);
    }
    if (filterState.sort && filterState.sort !== "default") {
      hasFilters = true;
      const sortLabel = filterState.sort === "title" ? "Title A\u2192Z" : "Domain A\u2192Z";
      const chip = createRemovableChip("Sort", sortLabel, () => {
        onRemove("sort", "default");
      });
      tray.appendChild(chip);
    }
    let clearMainBtn = document.getElementById("clearFiltersMain");
    if (hasFilters && !clearMainBtn) {
      clearMainBtn = document.createElement("button");
      clearMainBtn.id = "clearFiltersMain";
      clearMainBtn.className = "clear-filters-main";
      clearMainBtn.setAttribute("type", "button");
      clearMainBtn.setAttribute("aria-label", "Clear all filters");
      clearMainBtn.innerHTML = `
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
      Clear All Filters
    `;
      clearMainBtn.addEventListener("click", () => {
        const clearFiltersBtn = document.getElementById("clearFilters");
        if (clearFiltersBtn) clearFiltersBtn.click();
      });
      banner.parentNode.insertBefore(clearMainBtn, banner.nextSibling);
    } else if (!hasFilters && clearMainBtn) {
      clearMainBtn.remove();
    }
    banner.style.display = hasFilters ? "flex" : "none";
  }
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
    removeBtn.textContent = "\xD7";
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
  function populateFacetedFilters(tags, createChipFn) {
    console.log("[populateFacetedFilters] Starting with", tags.length, "tags");
    const categorized = categorizeTags(tags);
    console.log("[populateFacetedFilters] Categorized:", categorized);
    const containers = {
      platform: $("#chips-platform"),
      useCase: $("#chips-usecase"),
      audience: $("#chips-audience"),
      pattern: $("#chips-pattern"),
      other: $("#chips-other")
    };
    console.log("[populateFacetedFilters] Container check:", {
      platform: !!containers.platform,
      useCase: !!containers.useCase,
      audience: !!containers.audience,
      pattern: !!containers.pattern,
      other: !!containers.other
    });
    Object.entries(containers).forEach(([key, container]) => {
      if (!container) {
        console.warn(`[populateFacetedFilters] Container ${key} not found!`);
        return;
      }
      container.innerHTML = "";
      if (categorized[key].length === 0) {
        console.log(`[populateFacetedFilters] No tags for ${key}`);
        container.innerHTML = '<p class="filter-empty">No filters in this category</p>';
        return;
      }
      console.log(`[populateFacetedFilters] Adding ${categorized[key].length} chips to ${key}:`, categorized[key]);
      categorized[key].forEach((tag) => {
        const chip = createChipFn(tag);
        container.appendChild(chip);
      });
    });
    console.log("[populateFacetedFilters] Complete");
  }
  var init_filters = __esm({
    "scripts/filters.js?v=3"() {
      init_utils();
    }
  });

  // scripts/cards.js
  function getCategoryIcon(tag) {
    const key = CATEGORY_ICON_KEY[tag] || "default";
    return ICON_LIBRARY[key] || ICON_LIBRARY.default;
  }
  function getCategoryAria(tag) {
    return `Category: ${tag}`;
  }
  function createChip(tagText, onToggle) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.dataset.tag = tagText.toLowerCase();
    chip.dataset.state = "inactive";
    chip.setAttribute("aria-pressed", "false");
    const icon = document.createElement("span");
    icon.className = "chip-check";
    icon.setAttribute("data-checkmark", "");
    icon.textContent = "\u2713";
    const label = document.createElement("span");
    label.className = "chip-text";
    label.textContent = tagText;
    chip.appendChild(icon);
    chip.appendChild(label);
    chip.addEventListener("click", () => {
      const pressed = chip.getAttribute("aria-pressed") === "true";
      chip.setAttribute("aria-pressed", String(!pressed));
      chip.dataset.state = !pressed ? "active" : "inactive";
      if (onToggle) onToggle();
    });
    chip.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        chip.click();
      }
    });
    return chip;
  }
  function cardTemplate(item, onCardClick) {
    const host = hostname(item.url);
    const elm = document.createElement("article");
    elm.className = "card dashboard-card group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 loading";
    elm.dataset.tags = (item.tags || []).join("|").toLowerCase();
    elm.dataset.title = (item.title || "").toLowerCase();
    elm.dataset.domain = host.toLowerCase();
    elm.setAttribute("role", "article");
    elm.setAttribute("tabindex", "0");
    const handleClick = (e) => {
      if (shouldOpenDetail(e)) {
        onCardClick(elm, item, e);
      }
    };
    elm.addEventListener("click", handleClick);
    elm.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && shouldOpenDetail(event)) {
        event.preventDefault();
        onCardClick(elm, item, event);
      }
    });
    const primaryTag = item.tags[0] || "Uncategorized";
    const categoryIcon = getCategoryIcon(primaryTag);
    const categoryAria = getCategoryAria(primaryTag);
    const headingId = `card-title-${Math.random().toString(36).slice(2, 9)}`;
    const description = escapeHtml(item.description || "Loading description...");
    elm.innerHTML = buildCardHTML({
      primaryTag,
      categoryIcon,
      categoryAria,
      host,
      headingId,
      item,
      description
    });
    setupTagOverflowHandlers(elm);
    setupKebabMenuHandlers(elm, item);
    return elm;
  }
  function setupKebabMenuHandlers(card, item) {
    const kebabButton = card.querySelector(".kebab-menu");
    const kebabDropdown = card.querySelector(".kebab-dropdown");
    if (!kebabButton || !kebabDropdown) return;
    kebabButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const isExpanded = kebabButton.getAttribute("aria-expanded") === "true";
      document.querySelectorAll('.kebab-menu[aria-expanded="true"]').forEach((btn) => {
        if (btn !== kebabButton) {
          btn.setAttribute("aria-expanded", "false");
          const dropdown = btn.nextElementSibling;
          if (dropdown) dropdown.hidden = true;
        }
      });
      kebabButton.setAttribute("aria-expanded", String(!isExpanded));
      kebabDropdown.hidden = isExpanded;
    });
    const kebabItems = kebabDropdown.querySelectorAll(".kebab-item");
    kebabItems.forEach((menuItem) => {
      menuItem.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = menuItem.dataset.action;
        const url = menuItem.dataset.url;
        if (action === "regenerate") {
          handleRegenerateDescription(card, item);
        } else if (action === "copy-link") {
          handleCopyLink(url);
        }
        kebabButton.setAttribute("aria-expanded", "false");
        kebabDropdown.hidden = true;
      });
    });
    document.addEventListener("click", (e) => {
      if (!card.contains(e.target)) {
        kebabButton.setAttribute("aria-expanded", "false");
        kebabDropdown.hidden = true;
      }
    });
    kebabButton.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && kebabButton.getAttribute("aria-expanded") === "true") {
        kebabButton.setAttribute("aria-expanded", "false");
        kebabDropdown.hidden = true;
        kebabButton.focus();
      }
    });
    const closeOnScroll = () => {
      if (kebabButton.getAttribute("aria-expanded") === "true") {
        kebabButton.setAttribute("aria-expanded", "false");
        kebabDropdown.hidden = true;
      }
    };
    window.addEventListener("scroll", closeOnScroll, true);
    card.kebabScrollCleanup = () => {
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }
  async function handleRegenerateDescription(card, item) {
    const blurbElement = card.querySelector(".blurb");
    if (!blurbElement) return;
    const kebabButton = card.querySelector(".kebab-menu");
    const kebabDropdown = card.querySelector(".kebab-dropdown");
    if (kebabButton && kebabDropdown) {
      kebabButton.setAttribute("aria-expanded", "false");
      kebabDropdown.hidden = true;
    }
    const originalText = blurbElement.textContent;
    const loadingHTML = '<span class="loading loading-spinner loading-xs"></span> Regenerating description...';
    blurbElement.innerHTML = loadingHTML;
    blurbElement.style.fontStyle = "italic";
    blurbElement.style.opacity = "0.7";
    try {
      const { fetchBlurb: fetchBlurb2 } = await Promise.resolve().then(() => (init_api(), api_exports));
      const newBlurb = await fetchBlurb2(item.url);
      if (newBlurb) {
        blurbElement.textContent = newBlurb;
        blurbElement.style.fontStyle = "normal";
        blurbElement.style.opacity = "1";
        if (item.description !== void 0) {
          item.description = newBlurb;
        }
      } else {
        blurbElement.textContent = originalText;
        blurbElement.style.fontStyle = "normal";
        blurbElement.style.opacity = "1";
        showToast("Failed to regenerate description. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error regenerating description:", error);
      blurbElement.textContent = originalText;
      blurbElement.style.fontStyle = "normal";
      blurbElement.style.opacity = "1";
      showToast("Error regenerating description. Please try again.", "error");
    }
  }
  function showToast(message, type = "success") {
    if (activeToast) {
      clearTimeout(toastTimeout);
      activeToast.remove();
      activeToast = null;
    }
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    const icon = type === "success" ? "\u2713" : "\u26A0";
    const bgColor = type === "success" ? "rgba(0, 159, 77, 0.95)" : "rgba(248, 49, 37, 0.95)";
    toast.textContent = `${icon} ${message}`;
    toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 0.875rem;
    font-weight: 500;
    animation: slideInRight 0.3s ease;
    max-width: 320px;
  `;
    document.body.appendChild(toast);
    activeToast = toast;
    toastTimeout = setTimeout(() => {
      if (toast && document.body.contains(toast)) {
        toast.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => {
          toast.remove();
          if (activeToast === toast) {
            activeToast = null;
          }
        }, 300);
      }
    }, 3e3);
  }
  async function handleCopyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy link:", error);
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        showToast("Link copied to clipboard!", "success");
      } catch (err) {
        showToast("Failed to copy link", "error");
      }
      textArea.remove();
    }
  }
  function setupTagOverflowHandlers(card) {
    const toggleButtons = card.querySelectorAll(".tag-overflow-toggle");
    toggleButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const targetId = button.dataset.target;
        const targetContent = card.querySelector(`#${targetId}`);
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        if (targetContent) {
          if (isExpanded) {
            targetContent.style.display = "none";
            button.setAttribute("aria-expanded", "false");
            const hiddenCount = targetContent.querySelectorAll(".technique-tag").length;
            button.textContent = `+${hiddenCount} more`;
            button.setAttribute("aria-label", `Show ${hiddenCount} more tags`);
          } else {
            targetContent.style.display = "inline";
            button.setAttribute("aria-expanded", "true");
            button.textContent = "- show less";
            button.setAttribute("aria-label", "Show fewer tags");
          }
        }
      });
    });
  }
  function shouldOpenDetail(e) {
    return !e.target.closest(".btn") && !e.target.closest(".tag") && !e.target.closest(".badge") && !e.target.closest(".technique-badge") && !e.target.closest(".technique-tag") && !e.target.closest(".tag-overflow-toggle") && !e.target.closest(".kebab-menu");
  }
  function buildCardHTML({
    primaryTag,
    categoryIcon,
    categoryAria,
    host,
    headingId,
    item,
    description
  }) {
    const techniqueTags = item.techniques?.length ? item.techniques.slice(0, 3).map((t) => `<span class="technique-badge">${escapeHtml(t)}</span>`).join("") : "";
    return `
    <figure class="card-media h-48">
      <img alt="" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-src="${screenshotURL(item.url)}">
      <div class="card-media-actions">
        <div class="dropdown dropdown-end">
          <button class="btn btn-xs btn-circle btn-ghost kebab-menu" aria-label="Card actions" aria-expanded="false" aria-haspopup="true">
            <span aria-hidden="true">\u22EE</span>
          </button>
          <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 kebab-dropdown" hidden>
            <button class="btn btn-ghost btn-sm justify-start kebab-item" data-action="regenerate" data-url="${item.url}">
              \u{1F504} Regenerate AI Description
            </button>
            <button class="btn btn-ghost btn-sm justify-start kebab-item" data-action="copy-link" data-url="${item.url}">
              \u{1F4CB} Copy Link
            </button>
          </div>
        </div>
      </div>
    </figure>

    <div class="card-body">
      <div class="flex items-start justify-between gap-3">
        <h2 class="card-title text-base" id="${headingId}">
          ${escapeHtml(item.title)}
        </h2>
        <span class="host-badge">${host}</span>
      </div>

      <p class="text-sm opacity-80 line-clamp-3 blurb">${description}</p>

      <div class="flex flex-wrap items-center justify-between gap-3 mt-2">
        <div class="category-chip" aria-label="${escapeHtml(categoryAria)}">
          <span class="category-icon" aria-hidden="true">${categoryIcon}</span>
          ${escapeHtml(primaryTag)}
        </div>
        <div class="flex flex-wrap gap-2 text-xs font-medium text-base-content/70">
          ${techniqueTags}
        </div>
      </div>

      <div class="host-actions">
        <a class="btn btn-primary btn-sm" href="${item.url}" target="_blank" rel="noopener"
           aria-describedby="${headingId}">Open \u2197</a>
      </div>
    </div>
  `;
  }
  function renderDetailChips(container, items, variant) {
    if (!container) return;
    container.innerHTML = "";
    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement("span");
      empty.className = "detail-panel__empty";
      empty.textContent = variant === "technique" ? "Techniques will appear as annotations are added." : "Tags will populate soon.";
      container.appendChild(empty);
      return;
    }
    items.forEach((value) => {
      if (!value) return;
      const chip = document.createElement("span");
      chip.className = variant === "technique" ? "detail-panel__chip detail-panel__chip--muted" : "detail-panel__chip";
      chip.textContent = value;
      container.appendChild(chip);
    });
  }
  function setupLazyImages() {
    const imgs = $$("img[data-src]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "200px" }
    );
    imgs.forEach((img) => observer.observe(img));
  }
  function loadImage(img) {
    const card = img.closest(".card");
    img.src = img.dataset.src;
    img.addEventListener("load", () => {
      img.classList.add("loaded");
      if (card) card.classList.remove("loading");
    });
    img.addEventListener("error", () => {
      handleImageError(img, card);
    });
  }
  function handleImageError(img, card) {
    const primaryUrl = card?.querySelector(".btn.btn-primary")?.href;
    if (!primaryUrl) return;
    img.onerror = () => {
      img.src = faviconURL(primaryUrl);
      if (card) card.classList.remove("loading");
    };
    img.src = screenshotFallback(primaryUrl);
  }
  var ICON_LIBRARY, CATEGORY_ICON_KEY, activeToast, toastTimeout;
  var init_cards = __esm({
    "scripts/cards.js"() {
      init_utils();
      ICON_LIBRARY = {
        civic: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"/></svg>`,
        analytics: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>`,
        portfolio: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"/></svg>`,
        playbook: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>`,
        sustainability: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>`,
        policy: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>`,
        globe: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>`,
        data: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"/></svg>`,
        default: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/></svg>`
      };
      CATEGORY_ICON_KEY = {
        "Public CIP": "civic",
        "Municipal Program": "civic",
        "Power BI": "analytics",
        "Portfolio Management": "portfolio",
        "Visualization Patterns": "playbook",
        "Resource Recovery": "sustainability",
        "Zero Waste": "sustainability",
        "C&D Waste": "sustainability",
        "Green Halo": "sustainability",
        "Policy Reference": "policy",
        Guidance: "policy",
        "National Policy": "policy",
        "International Benchmark": "globe",
        "Reference Data": "data"
      };
      activeToast = null;
      toastTimeout = null;
    }
  });

  // scripts/detail-modal.js?v=2
  function applyScrollLock() {
    if (scrollLockActive) return;
    scrollLockPosition = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollLockPosition}px`;
    document.body.style.width = "100%";
    scrollLockActive = true;
  }
  function releaseScrollLock() {
    if (!scrollLockActive) return;
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollLockPosition);
    scrollLockPosition = 0;
    scrollLockActive = false;
  }
  function finalizeModalClose() {
    const focusTarget = lastFocusedElement;
    releaseScrollLock();
    if (focusTarget instanceof HTMLElement) {
      const isDisabled = focusTarget.hasAttribute("disabled");
      const isVisible = focusTarget.offsetParent !== null;
      if (document.contains(focusTarget) && !isDisabled && isVisible) {
        focusTarget.focus();
      } else {
        focusFallbackElement();
      }
    } else if (focusTarget === null) {
      focusFallbackElement();
    }
    lastFocusedElement = void 0;
  }
  function openDetailModal(item, card, elements) {
    const modal = $("#detailModal");
    if (!modal) return;
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    applyScrollLock();
    const primaryTag = Array.isArray(item.tags) && item.tags.length ? item.tags[0] : "Uncategorized";
    const icon = getCategoryIcon(primaryTag);
    const category = $("#detailCategory");
    if (category) {
      category.setAttribute("aria-label", `Category: ${primaryTag}`);
      category.innerHTML = `
      <span class="category-icon" aria-hidden="true">${icon}</span>
      ${escapeHtml(primaryTag)}
    `;
    }
    const title = $("#detailTitle");
    if (title) {
      title.textContent = item.title || "Untitled dashboard";
    }
    const domainText = hostname(item.url);
    const domain = $("#detailDomain");
    if (domain) {
      domain.textContent = domainText;
    }
    const summaryText = $("#detailSummary");
    if (summaryText) {
      const summary = item.description?.trim() ? item.description : "Curator notes will populate soon.";
      summaryText.textContent = summary;
    }
    const tags = $("#detailTags");
    const techniques = $("#detailTechniques");
    renderDetailChips(tags, item.tags, "tag");
    renderDetailChips(techniques, item.techniques, "technique");
    const visitBtn = $("#detailVisit");
    if (visitBtn) visitBtn.href = item.url || "#";
    const screenshot = $("#detailScreenshot");
    if (screenshot) {
      const cardImg = card?.querySelector("img[data-src], img.loaded");
      const candidateSrc = cardImg?.src && cardImg.src.length ? cardImg.src : screenshotURL(item.url, 1200);
      screenshot.src = candidateSrc;
      screenshot.alt = `Screenshot of ${item.title}`;
    }
    modal.showModal();
    const modalSurface = modal.querySelector(".modal-box") || modal;
    focusFirstElement(modalSurface);
  }
  function closeDetailModal(elements) {
    const modal = $("#detailModal");
    if (!modal || !modal.open) return;
    modal.close();
    finalizeModalClose();
  }
  function focusFallbackElement() {
    const firstCard = document.querySelector('.dashboard-card:not([style*="display: none"])');
    if (firstCard && typeof firstCard.focus === "function") {
      firstCard.focus();
      return;
    }
    document.body.focus();
  }
  function focusFirstElement(container) {
    if (!container) return;
    const focusable = $$(FOCUSABLE_SELECTOR, container).filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("tabindex") !== "-1" && el.getAttribute("aria-hidden") !== "true"
    );
    const target = focusable[0] || container;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  }
  function handleDetailKeydown(event, elements) {
    const modal = elements.modal || $("#detailModal");
    if (!modal || !modal.open) return;
    const container = modal.querySelector(".modal-box") || modal;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDetailModal(elements);
      return;
    }
    if (event.key === "Tab") {
      trapFocus(event, container);
    }
  }
  function trapFocus(event, container) {
    const focusable = $$(FOCUSABLE_SELECTOR, container).filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
    );
    if (focusable.length === 0) {
      event.preventDefault();
      if (container && typeof container.focus === "function") {
        container.focus();
      }
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }
  function finalizeDetailModalClose() {
    finalizeModalClose();
  }
  function createDetailHandlers(elements) {
    const keydownHandler = (event) => handleDetailKeydown(event, elements);
    const closeHandler = () => closeDetailModal(elements);
    const modalElement = elements.modal || $("#detailModal");
    const overlayElement = elements.overlay || modalElement;
    const swipeCleanup = enableSwipeDismiss(
      modalElement,
      () => closeDetailModal(elements),
      {
        surface: modalElement?.querySelector(".modal-box") || modalElement,
        threshold: 80,
        verticalLimit: 50
      }
    );
    const overlayClickHandler = (event) => {
      if (overlayElement && event.target === overlayElement) {
        closeDetailModal(elements);
      }
    };
    return {
      keydownHandler,
      closeHandler,
      overlayClickHandler,
      swipeCleanup
    };
  }
  function enableDetailKeyboard(keydownHandler) {
    document.addEventListener("keydown", keydownHandler);
  }
  function disableDetailKeyboard(keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
  }
  var FOCUSABLE_SELECTOR, lastFocusedElement, scrollLockPosition, scrollLockActive;
  var init_detail_modal = __esm({
    "scripts/detail-modal.js?v=2"() {
      init_cards();
      init_utils();
      FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
      lastFocusedElement = void 0;
      scrollLockPosition = 0;
      scrollLockActive = false;
    }
  });

  // scripts/learning-mode.js
  function getRoleConfig(role) {
    return ROLE_CONTENT[role] || ROLE_CONTENT.student;
  }
  function renderLearningSections(config, container) {
    if (!container) return;
    container.innerHTML = "";
    config.sections.forEach((section) => {
      const sectionEl = createSectionElement(section);
      container.appendChild(sectionEl);
    });
  }
  function createSectionElement(section) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "learning-card";
    const heading = document.createElement("h4");
    heading.className = "learning-card__title";
    heading.textContent = section.title;
    sectionEl.appendChild(heading);
    if (section.description) {
      const para = document.createElement("p");
      para.className = "learning-card__subtitle";
      para.textContent = section.description;
      sectionEl.appendChild(para);
    }
    if (Array.isArray(section.items) && section.items.length) {
      const list = document.createElement("ul");
      list.className = "learning-card__list";
      section.items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "learning-card__item";
        li.textContent = item;
        list.appendChild(li);
      });
      sectionEl.appendChild(list);
    }
    return sectionEl;
  }
  function setupNotesPersistence(role) {
    return;
  }
  function renderRole(role, learningModeActive, elements) {
    const config = getRoleConfig(role);
    if (elements.tip) {
      elements.tip.textContent = config.tip;
    }
    if (elements.printBtn) {
      const ariaLabel = config.printAria || "Print Learning Guide";
      elements.printBtn.setAttribute("aria-label", ariaLabel);
      elements.printBtn.title = config.printTooltip || ariaLabel;
    }
    if (elements.printTooltip) {
      elements.printTooltip.setAttribute(
        "data-tip",
        config.printTooltip || "Print Learning Guide"
      );
    }
    if (elements.roleSubtitle) {
      elements.roleSubtitle.textContent = config.panelSubtitle || config.printTitle || "Learning Guide";
    }
    renderLearningSections(config, elements.checklistContent);
    setupNotesPersistence(role);
    setLearningButtonState(
      learningModeActive,
      role,
      elements.learningBtn,
      elements.learningBtnTooltip
    );
  }
  function setLearningButtonState(active, role, button, tooltip) {
    if (!button) return;
    const ariaLabel = "Print Learning Guide";
    button.setAttribute("aria-label", ariaLabel);
    button.setAttribute("title", ariaLabel);
    button.setAttribute("aria-expanded", String(active));
    if (tooltip) {
      tooltip.setAttribute("data-tip", ariaLabel);
    }
  }
  function printChecklist(role, checklistContent) {
    const config = getRoleConfig(role);
    const win = window.open("", "_blank");
    if (!win) return;
    const printable = checklistContent.cloneNode(true);
    const printableTitle = config.printTitle || "Prioritization Visualization Review Guide";
    win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(printableTitle)}</title>
    <style>
      body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; margin:40px; color:#1f2937;}
      h1{font-size:22px; margin-bottom:12px;}
      h4{margin:24px 0 8px; font-size:16px; color:#111827;}
      ul{margin:0 0 12px 20px; padding:0;}
      li{margin-bottom:6px; font-size:13px; line-height:1.4;}
      p{font-size:13px; color:#4b5563; margin:0 0 12px;}
    </style>
  </head><body>
    <h1>${escapeHtml(printableTitle)}</h1>
    ${printable.innerHTML}
  </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }
  function createLearningHandlers(elements) {
    let learningMode = false;
    let lastFocusedElement2 = null;
    let swipeCleanup = null;
    const focusFirstElement2 = () => {
      if (!elements.overlay) return;
      const focusable = $$(FOCUSABLE_SELECTOR2, elements.overlay).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("tabindex") !== "-1" && el.getAttribute("aria-hidden") !== "true"
      );
      const target = focusable[0] || elements.panel;
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    };
    const handleKeydown = (event) => {
      if (!learningMode || !elements.overlay) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLearningPanel();
        return;
      }
      if (event.key === "Tab") {
        trapFocus2(event, elements.overlay, elements.panel);
      }
    };
    const openLearningPanel = () => {
      if (!elements.overlay || !elements.panel) return;
      learningMode = true;
      lastFocusedElement2 = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      elements.overlay.showModal();
      focusFirstElement2();
      document.addEventListener("keydown", handleKeydown);
      const role = getCurrentRole();
      setLearningButtonState(
        true,
        role,
        elements.learningBtn,
        elements.learningBtnTooltip
      );
      ensureSwipeGesture();
    };
    const closeLearningPanel = () => {
      if (!elements.overlay || !elements.panel || !elements.overlay.open) return;
      learningMode = false;
      elements.overlay.close();
      document.removeEventListener("keydown", handleKeydown);
      const role = getCurrentRole();
      setLearningButtonState(
        false,
        role,
        elements.learningBtn,
        elements.learningBtnTooltip
      );
      if (lastFocusedElement2 && typeof lastFocusedElement2.focus === "function") {
        lastFocusedElement2.focus();
      } else if (elements.learningBtn) {
        elements.learningBtn.focus();
      }
      lastFocusedElement2 = null;
    };
    const toggleLearningPanel = () => {
      learningMode ? closeLearningPanel() : openLearningPanel();
    };
    const ensureSwipeGesture = () => {
      if (swipeCleanup || !elements.overlay) return;
      const surface = elements.panel || elements.overlay;
      swipeCleanup = enableSwipeDismiss(surface, closeLearningPanel, {
        threshold: 80,
        verticalLimit: 60
      });
    };
    return {
      openLearningPanel,
      closeLearningPanel,
      toggleLearningPanel,
      isActive: () => learningMode
    };
  }
  function trapFocus2(event, container, fallback) {
    const focusable = $$(FOCUSABLE_SELECTOR2, container).filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
    );
    if (focusable.length === 0) {
      event.preventDefault();
      if (fallback) fallback.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }
  function createOnboardingHandlers(elements) {
    let currentStep = 1;
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 75;
    const handleSwipe = () => {
      const swipeDistance = touchStartX - touchEndX;
      if (swipeDistance > SWIPE_THRESHOLD && currentStep < ONBOARDING_STEPS.length) {
        currentStep++;
        renderStep(currentStep);
      }
      if (swipeDistance < -SWIPE_THRESHOLD && currentStep > 1) {
        currentStep--;
        renderStep(currentStep);
      }
    };
    const renderStep = (step) => {
      if (!elements.content) return;
      const stepData = ONBOARDING_STEPS[step - 1];
      if (!stepData) return;
      elements.content.innerHTML = buildOnboardingHTML(stepData, step);
      attachStepListeners();
      attachSwipeListeners();
    };
    const showOnboarding = () => {
      if (!elements.overlay) return;
      currentStep = 1;
      renderStep(1);
      elements.overlay.showModal();
    };
    const hideOnboarding = (markAsSeen = true) => {
      if (!elements.overlay || !elements.overlay.open) return;
      elements.overlay.close();
      if (markAsSeen) {
        markOnboardingSeen();
      }
    };
    const attachStepListeners = () => {
      const nextBtn = $("#onboardingNext");
      const prevBtn = $("#onboardingPrev");
      const skipBtn = $("#onboardingSkip");
      const startBtn = $("#onboardingStart");
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          currentStep++;
          renderStep(currentStep);
        });
      }
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          currentStep--;
          renderStep(currentStep);
        });
      }
      if (skipBtn) {
        skipBtn.addEventListener("click", () => hideOnboarding(true));
      }
      if (startBtn) {
        startBtn.addEventListener("click", () => hideOnboarding(true));
      }
    };
    const attachSwipeListeners = () => {
      if (!elements.content) return;
      elements.content.removeEventListener("touchstart", handleTouchStart);
      elements.content.removeEventListener("touchend", handleTouchEnd);
      elements.content.addEventListener("touchstart", handleTouchStart, { passive: true });
      elements.content.addEventListener("touchend", handleTouchEnd, { passive: true });
    };
    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };
    return {
      showOnboarding,
      hideOnboarding
    };
  }
  function buildOnboardingHTML(stepData, step) {
    let html = `
    <div class="space-y-6" data-step="${step}">
      <div class="text-center">
        <div class="text-6xl mb-4">${stepData.icon}</div>
        <h2 class="text-2xl font-bold mb-3">${stepData.title}</h2>
        <p class="text-base-content/70">${stepData.description}</p>
      </div>
  `;
    if (stepData.features) {
      html += '<div class="space-y-4 mt-6">';
      stepData.features.forEach((feature) => {
        html += `
        <div class="flex gap-4 items-start bg-base-200 rounded-lg p-4">
          <div class="text-3xl">${feature.icon}</div>
          <div class="flex-1">
            <h3 class="font-semibold mb-1">${feature.title}</h3>
            <p class="text-sm text-base-content/70">${feature.description}</p>
          </div>
        </div>
      `;
      });
      html += "</div>";
    }
    html += '<div class="flex justify-center gap-2 mt-6">';
    for (let i = 1; i <= ONBOARDING_STEPS.length; i++) {
      html += `<div class="w-2 h-2 rounded-full ${i === step ? "bg-primary" : "bg-base-300"}"></div>`;
    }
    html += "</div>";
    html += '<div class="text-center mt-4 text-xs text-base-content/60 lg:hidden">';
    if (step > 1 && step < ONBOARDING_STEPS.length) {
      html += "\u2190 Swipe to navigate \u2192";
    } else if (step === 1) {
      html += "Swipe left to continue \u2192";
    } else {
      html += "\u2190 Swipe to go back";
    }
    html += "</div>";
    html += '<div class="flex justify-between gap-2 mt-8">';
    if (step > 1) {
      html += '<button class="btn btn-ghost min-h-[44px] min-w-[44px] px-6" id="onboardingPrev" aria-label="Go to previous step">\u2190 Back</button>';
    } else {
      html += "<div></div>";
    }
    if (step < ONBOARDING_STEPS.length) {
      html += '<div class="flex gap-2">';
      html += '<button class="btn btn-ghost min-h-[44px] min-w-[44px] px-6" id="onboardingSkip" aria-label="Skip onboarding">Skip</button>';
      html += '<button class="btn btn-primary min-h-[44px] min-w-[44px] px-6" id="onboardingNext" aria-label="Go to next step">Next \u2192</button>';
      html += "</div>";
    } else {
      html += '<button class="btn btn-primary min-h-[44px] min-w-[100px] px-6" id="onboardingStart" aria-label="Close onboarding and get started">Get Started!</button>';
    }
    html += "</div></div>";
    return html;
  }
  var FOCUSABLE_SELECTOR2, ROLE_CONTENT, ONBOARDING_STEPS;
  var init_learning_mode = __esm({
    "scripts/learning-mode.js"() {
      init_utils();
      init_state();
      init_state();
      FOCUSABLE_SELECTOR2 = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
      ROLE_CONTENT = {
        student: {
          tip: "Participant tip: open Learning Mode to follow guided prompts and print your personal study sheet.",
          buttonInactive: "\u{1F4DA} Participant Learning Mode",
          buttonActive: "\u{1F4DA} Exit Participant Mode",
          buttonAria: "Toggle participant learning mode overlay",
          printLabel: "\u{1F5A8}\uFE0F Print participant guide",
          printAria: "Print the participant review guide",
          printTitle: "Participant Review Guide",
          sections: [
            {
              title: "\u{1F3AF} Study Rhythm",
              description: "Use this loop each time you explore a dashboard exemplar.",
              items: [
                "\u2610 Identify the audience and the single decision this view should unlock.",
                "\u2610 Summarize the prioritization story in one sentence\u2014does the evidence back it up?",
                "\u2610 Trace each score or status back to its source; capture any data gaps.",
                "\u2610 Note one design move to reuse and one caveat to watch for in your own work."
              ]
            },
            {
              title: "\u{1F3D9}\uFE0F Public CIP Dashboards \u2014 Participant Lens",
              description: "Look for signals that help residents and leaders understand capital tradeoffs.",
              items: [
                "\u2610 Map funding phases to timeline and geography to confirm equity of coverage.",
                "\u2610 Check whether project categories explain who benefits and when.",
                "\u2610 Observe how risk, delays, and budget pressure surface in the story.",
                "\u2610 List transparency cues you would expect if you were a community member."
              ]
            },
            {
              title: "\u{1F3E2} Portfolio & Product Tools \u2014 Participant Lens",
              description: "Study how product teams frame prioritization logic and scenario planning.",
              items: [
                "\u2610 Decode the scoring formula: inputs, weights, and refresh cadence.",
                "\u2610 Watch for signals about capacity, dependencies, or sequencing choices.",
                "\u2610 Evaluate how easy it is to compare options and spot tradeoffs quickly.",
                "\u2610 Translate jargon\u2014could your teammates understand this framing without help?"
              ]
            },
            {
              title: "\u{1F4CA} Visualization Patterns & Power BI",
              description: "Pay attention to interaction design and the path from question to action.",
              items: [
                "\u2610 Follow the eye path\u2014does the layout guide question \u2192 insight \u2192 action?",
                "\u2610 Test filters and tooltips to see if they reveal trustworthy context.",
                "\u2610 Evaluate color, legend, and annotation clarity for accessibility.",
                "\u2610 Check the view on smaller screens if responsiveness matters."
              ]
            },
            {
              title: "\u{1F9E0} Reflection Prompts",
              description: "Turn observations into experiments for your own coursework or projects.",
              items: [
                "\u2022 What surprised you about how this organization communicates priority?",
                "\u2022 Which chart, phrase, or scoring idea would improve your storytelling immediately?",
                "\u2022 Where would you ask for more evidence before making a decision?",
                "\u2022 What follow-up research or partner conversation does this exemplar spark?"
              ]
            }
          ],
          notes: {
            title: "\u270D\uFE0F Field Notes",
            description: "Capture observations, follow-up questions, and ideas to test with your team.",
            placeholder: "Capture observations, follow-up questions, next actions\u2026"
          }
        },
        coach: {
          tip: "Coach tip: open Learning Mode to access facilitation checklists and a printable workshop playbook.",
          buttonInactive: "\u{1F4DA} Coach Playbook Mode",
          buttonActive: "\u{1F4DA} Exit Coach Mode",
          buttonAria: "Toggle coach learning mode overlay",
          printLabel: "\u{1F5A8}\uFE0F Print coach playbook",
          printAria: "Print the coaching workshop guide",
          printTitle: "Coaching Workshop Guide",
          sections: [
            {
              title: "\u{1F3AF} Facilitation Rhythm",
              description: "Use this sequence when guiding teams through an exemplar.",
              items: [
                "\u2610 Clarify the session objective and the decision skill you are reinforcing.",
                "\u2610 Preview what good evidence looks like before the group explores the dashboard.",
                "\u2610 Surface blind spots by asking whose needs or tradeoffs are implied.",
                "\u2610 Close by translating insights into an experiment or commitment for the team."
              ]
            },
            {
              title: "\u{1F3D9}\uFE0F Public CIP Dashboards \u2014 Coaching Focus",
              description: "Equip civic teams to communicate transparency and accountability.",
              items: [
                "\u2610 Compare budget, schedule, and geography\u2014what must leaders explain in public?",
                "\u2610 Highlight how risk, delays, or equity tradeoffs appear (or fail to appear).",
                "\u2610 Capture questions residents, council members, or media would still ask.",
                "\u2610 Plan a follow-up artifact to extend the conversation after the workshop."
              ]
            },
            {
              title: "\u{1F3E2} Portfolio & Product Tools \u2014 Coaching Focus",
              description: "Model how to translate vendor frameworks into your organization's language.",
              items: [
                "\u2610 Reverse-engineer the scoring rubric and align it with your portfolio taxonomy.",
                "\u2610 Demonstrate how to facilitate prioritization when data quality is uncertain.",
                "\u2610 Identify opportunities to add scenario planning or dependency mapping discussions.",
                "\u2610 Draft a prompt that ties metrics back to strategic outcomes for leadership."
              ]
            },
            {
              title: "\u{1F4CA} Visualization Patterns \u2014 Workshop Callouts",
              description: "Prepare teaching moments that connect design choices to stakeholder impact.",
              items: [
                "\u2610 Spotlight design moves that make tradeoffs and risk unmistakable.",
                "\u2610 Offer an alternative framing if the chart over-promises certainty.",
                "\u2610 Note which visuals are easiest to repurpose for stakeholder briefings.",
                "\u2610 Flag accessibility gaps your teams should avoid when templating dashboards."
              ]
            },
            {
              title: "\u{1F9E0} Coaching Prompts",
              description: "Guide facilitators as they adapt the exemplar to their teams.",
              items: [
                "\u2022 How will you adapt this exemplar for a live working session?",
                "\u2022 Where might teams misinterpret the scoring story without facilitation?",
                "\u2022 Which partners or datasets must you involve to mirror this level of rigor?",
                "\u2022 What follow-on assignment keeps momentum after the workshop?"
              ]
            }
          ],
          notes: {
            title: "\u{1F5C2}\uFE0F Facilitation Plan",
            description: "Outline logistics, owners, and follow-ups for your coaching sessions.",
            placeholder: "Outline facilitation moves, owners, and follow-up actions\u2026"
          }
        }
      };
      ONBOARDING_STEPS = [
        {
          icon: "\u{1F3DB}\uFE0F",
          title: "Welcome, Data Practitioners!",
          description: "Discover how municipalities and organizations worldwide are visualizing complex data to inform decisions, engage communities, and tell compelling stories. This curated collection features 70+ real-world examples\u2014from capital improvement programs to resource recovery dashboards\u2014designed to inspire your next project."
        },
        {
          icon: "\u{1F50D}",
          title: "Research, Compare, Learn",
          description: "Designed for municipal workers, analysts, and coaches who want to see how peers are solving similar data challenges.",
          features: [
            {
              icon: "\u{1F4DA}",
              title: "Learning Mode",
              description: "Get guided prompts and create a personal study guide"
            },
            {
              icon: "\u{1F50D}",
              title: "Smart Filters",
              description: "Filter by tags, categories, and visualization techniques"
            },
            {
              icon: "\u{1F3AF}",
              title: "Detailed Analysis",
              description: "Click any dashboard for in-depth information and insights"
            }
          ]
        },
        {
          icon: "\u{1F4A1}",
          title: "Find Your Inspiration",
          description: "Whether you're building a CIP tracker, performance dashboard, or community engagement tool\u2014explore how others have approached similar challenges. Click any example to dive deeper, or use filters to find dashboards relevant to your work."
        }
      ];
    }
  });

  // scripts/theme.js
  function initTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "austinDark" : "austinLight");
    setTheme(savedTheme, false);
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const current = html.getAttribute("data-theme");
        const next = current === "austinDark" ? "austinLight" : "austinDark";
        setTheme(next);
      });
    }
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "austinDark" : "austinLight", false);
      }
    });
  }
  function setTheme(theme, showFeedback = true) {
    const html = document.documentElement;
    const themeToggle = document.getElementById("themeToggle");
    if (showFeedback) {
      showThemeTransition(theme);
    }
    html.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (themeToggle) {
      const icons = themeToggle.querySelectorAll("[data-theme-icon]");
      icons.forEach((icon) => {
        const target = icon.getAttribute("data-theme-icon");
        const shouldShow = theme === "austinDark" && target === "dark" || theme === "austinLight" && target === "light";
        icon.classList.toggle("hidden", !shouldShow);
      });
      themeToggle.setAttribute("aria-pressed", theme === "austinLight");
      if (showFeedback) {
        themeToggle.style.transform = "scale(0.92)";
        setTimeout(() => {
          themeToggle.style.transform = "scale(1)";
        }, 150);
      }
    }
    if (!html.style.transition) {
      html.style.transition = "background-color 0.3s ease, color 0.3s ease";
    }
  }
  function showThemeTransition(theme) {
    const overlay = document.createElement("div");
    overlay.className = "theme-transition-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const isDark = theme === "austinDark";
    overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    background: ${isDark ? "rgba(22, 27, 55, 0.15)" : "rgba(255, 255, 255, 0.15)"};
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
        }, 300);
      }, 150);
    });
    showThemeToast(theme);
  }
  function showThemeToast(theme) {
    const isDark = theme === "austinDark";
    const message = isDark ? "Dark theme activated" : "Light theme activated";
    const icon = isDark ? "\u{1F319}" : "\u2600\uFE0F";
    const existingToast = document.getElementById("theme-toast");
    if (existingToast) {
      existingToast.remove();
    }
    const toast = document.createElement("div");
    toast.id = "theme-toast";
    toast.className = "theme-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    background: ${isDark ? "linear-gradient(135deg, rgba(34, 37, 78, 0.95) 0%, rgba(24, 27, 51, 0.92) 100%)" : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 246, 245, 0.92) 100%)"};
    color: ${isDark ? "rgba(220, 242, 253, 0.92)" : "rgba(22, 27, 55, 0.92)"};
    border: 1px solid ${isDark ? "rgba(0, 156, 222, 0.3)" : "rgba(68, 73, 156, 0.2)"};
    box-shadow: 0 12px 28px ${isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(34, 37, 78, 0.2)"};
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    z-index: 10000;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 3e3);
    });
  }
  var init_theme = __esm({
    "scripts/theme.js"() {
    }
  });

  // scripts/pull-to-refresh.js
  function initPullToRefresh({ element, onRefresh }) {
    if (!element || typeof onRefresh !== "function") {
      console.error("Pull-to-refresh requires element and onRefresh callback");
      return () => {
      };
    }
    indicator = createRefreshIndicator();
    document.body.appendChild(indicator);
    const handleTouchStart = (e) => {
      if (window.scrollY > 0 || refreshing) {
        return;
      }
      pullStartY = e.touches[0].clientY;
      pulling = false;
    };
    const handleTouchMove = (e) => {
      if (pullStartY === 0 || window.scrollY > 0 || refreshing) {
        return;
      }
      pullCurrentY = e.touches[0].clientY;
      const pullDistance = pullCurrentY - pullStartY;
      if (pullDistance > 0) {
        pulling = true;
        const resistedDistance = Math.min(pullDistance / RESISTANCE, MAX_PULL);
        updateIndicator(resistedDistance);
        if (resistedDistance > 10) {
          e.preventDefault();
        }
      }
    };
    const handleTouchEnd = async () => {
      if (!pulling || refreshing) {
        pullStartY = 0;
        pullCurrentY = 0;
        pulling = false;
        return;
      }
      const pullDistance = (pullCurrentY - pullStartY) / RESISTANCE;
      if (pullDistance >= PULL_THRESHOLD) {
        refreshing = true;
        triggerRefresh(onRefresh);
      } else {
        hideIndicator();
      }
      pullStartY = 0;
      pullCurrentY = 0;
      pulling = false;
    };
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      if (indicator && indicator.parentNode) {
        indicator.remove();
      }
    };
  }
  function createRefreshIndicator() {
    const indicator2 = document.createElement("div");
    indicator2.id = "pull-refresh-indicator";
    indicator2.className = "pull-refresh-indicator";
    indicator2.setAttribute("aria-hidden", "true");
    indicator2.innerHTML = `
    <div class="pull-refresh-spinner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>
    </div>
  `;
    indicator2.style.cssText = `
    position: fixed;
    top: 0;
    left: 50%;
    transform: translate(-50%, -100%);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(68, 73, 156, 0.95) 0%, rgba(0, 156, 222, 0.85) 100%);
    box-shadow: 0 8px 20px rgba(68, 73, 156, 0.3);
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
  `;
    return indicator2;
  }
  function updateIndicator(distance) {
    if (!indicator) return;
    const progress = Math.min(distance / PULL_THRESHOLD, 1);
    const translateY = distance;
    const rotation = progress * 360;
    const opacity = Math.min(progress * 1.5, 1);
    indicator.style.opacity = opacity;
    indicator.style.transform = `translate(-50%, ${translateY - 48}px)`;
    const spinner = indicator.querySelector(".pull-refresh-spinner svg");
    if (spinner) {
      spinner.style.transform = `rotate(${rotation}deg)`;
      spinner.style.transition = "transform 0.1s ease";
    }
  }
  async function triggerRefresh(onRefresh) {
    if (!indicator) return;
    indicator.style.transform = "translate(-50%, 16px)";
    indicator.style.opacity = "1";
    indicator.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease";
    const spinner = indicator.querySelector(".pull-refresh-spinner svg");
    if (spinner) {
      spinner.style.animation = "pull-refresh-spin 0.8s linear infinite";
    }
    try {
      await onRefresh();
    } catch (error) {
      console.error("Pull-to-refresh error:", error);
    } finally {
      setTimeout(() => {
        hideIndicator();
        refreshing = false;
      }, 600);
    }
  }
  function hideIndicator() {
    if (!indicator) return;
    indicator.style.opacity = "0";
    indicator.style.transform = "translate(-50%, -100%)";
    indicator.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    const spinner = indicator.querySelector(".pull-refresh-spinner svg");
    if (spinner) {
      spinner.style.animation = "";
      spinner.style.transform = "rotate(0deg)";
    }
  }
  var PULL_THRESHOLD, MAX_PULL, RESISTANCE, pullStartY, pullCurrentY, pulling, refreshing, indicator;
  var init_pull_to_refresh = __esm({
    "scripts/pull-to-refresh.js"() {
      PULL_THRESHOLD = 80;
      MAX_PULL = 120;
      RESISTANCE = 2.5;
      pullStartY = 0;
      pullCurrentY = 0;
      pulling = false;
      refreshing = false;
      indicator = null;
    }
  });

  // scripts/main.js
  var require_main = __commonJS({
    "scripts/main.js"() {
      init_utils();
      init_api();
      init_state();
      init_state();
      init_state();
      init_filters();
      init_cards();
      init_detail_modal();
      init_learning_mode();
      init_theme();
      init_pull_to_refresh();
      var SITES_ENDPOINT = "sites.json";
      var sites = [];
      var learningHandlers = null;
      var detailHandlers = null;
      var validTagsSet = /* @__PURE__ */ new Set();
      function normalizeSite(site = {}) {
        const tags = Array.isArray(site.tags) ? site.tags.filter(Boolean) : [];
        if (tags.length === 0) tags.push("Uncategorized");
        return {
          title: site.title || "Untitled dashboard",
          url: site.url || "#",
          tags,
          description: typeof site.description === "string" ? site.description.trim() : "",
          techniques: Array.isArray(site.techniques) ? site.techniques.filter(Boolean) : []
        };
      }
      async function loadSites() {
        try {
          const res = await fetch(SITES_ENDPOINT, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const payload = await res.json();
          const items = Array.isArray(payload) ? payload : payload && payload.sites || [];
          if (!Array.isArray(items) || items.length === 0) {
            throw new Error("No sites found in configuration");
          }
          sites = items.map(normalizeSite);
          validTagsSet = new Set(
            sites.flatMap((site) => site.tags || []).map((tag) => tag.toLowerCase())
          );
          const elements = getFilterElements();
          const allTags = Array.from(
            new Set(sites.flatMap((site) => site.tags || []))
          ).sort((a, b) => a.localeCompare(b));
          console.log("[main.js] Populating filters with", allTags.length, "tags:", allTags);
          populateFacetedFilters(allTags, (tagText) => {
            return createChip(tagText, () => {
              const grid = $("#grid");
              if (grid) {
                grid.setAttribute("aria-busy", "true");
                grid.classList.add("filter-updating");
              }
              syncURLWithFilters();
              updateFilterStates(elements);
              applyFilters({ ...elements, totalSites: sites.length });
              if (grid) {
                setTimeout(() => {
                  grid.classList.remove("filter-updating");
                }, 400);
              }
            });
          });
          console.log("[main.js] Filter population complete");
          updateHeroSummary2(sites.length);
          buildGrid();
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
      function buildGrid(data = sites) {
        const grid = $("#grid");
        if (!grid) return;
        grid.innerHTML = "";
        if (!Array.isArray(data) || data.length === 0) {
          grid.innerHTML = `
      <div class="hero min-h-[400px] bg-base-200 rounded-lg col-span-full">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h2 class="text-3xl font-bold mb-4">\u{1F4CA} No Dashboards Found</h2>
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
      function handleCardClick(card, item, event) {
        if (event && typeof event.preventDefault === "function") {
          event.preventDefault();
        }
        const elements = getDetailElements();
        openDetailModal(item, card, elements);
        enableDetailKeyboard(detailHandlers.keydownHandler);
      }
      function showConfigError() {
        updateHeroSummary2(0);
        const grid = $("#grid");
        if (!grid) return;
        grid.innerHTML = `
    <div class="hero min-h-[400px] bg-error/10 rounded-lg col-span-full">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <div class="text-5xl mb-4">\u26A0\uFE0F</div>
          <h2 class="text-3xl font-bold mb-4">Unable to Load Data</h2>
          <p class="text-base-content/70 mb-4">
            Could not load showcase data. Please check that <code class="bg-base-200 px-2 py-1 rounded">${escapeHtml(SITES_ENDPOINT)}</code> is reachable and correctly formatted.
          </p>
          <button class="btn btn-primary" onclick="location.reload()">
            \u{1F504} Retry
          </button>
        </div>
      </div>
    </div>
  `;
      }
      function updateHeroSummary2(totalSites = 0) {
        const siteCountEl = $("#siteCount");
        if (siteCountEl) {
          siteCountEl.textContent = String(totalSites || 0);
        }
      }
      function getFilterElements() {
        return {
          searchInput: $("#q"),
          tagSelect: $("#filterTag"),
          sortSelect: $("#sortBy"),
          grid: $("#grid"),
          chipsContainer: $("#chips")
        };
      }
      function getDetailElements() {
        return {
          overlay: $("#detailModal"),
          modal: $("#detailModal"),
          closeBtn: $("#closeDetail"),
          inlineCloseBtn: $("#detailCloseInline"),
          category: $("#detailCategory"),
          title: $("#detailTitle"),
          domain: $("#detailDomain"),
          summaryText: $("#detailSummary"),
          tags: $("#detailTags"),
          techniques: $("#detailTechniques"),
          visitBtn: $("#detailVisit"),
          openBtn: $("#detailOpen"),
          screenshot: $("#detailScreenshot")
        };
      }
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
          roleSubtitle: $("#learningRoleSubtitle")
        };
      }
      function getOnboardingElements() {
        return {
          overlay: $("#onboardingOverlay"),
          content: $("#onboardingContent"),
          closeBtn: $("#onboardingClose"),
          helpBtn: $("#onboardingHelp")
        };
      }
      function syncURLWithFilters() {
        const filterState = getFilterStateFromUI();
        const params = serializeFilters(filterState);
        updateURL(params);
        renderActiveFilters(filterState, handleRemoveFilter);
      }
      function applyFilterStateToUI(state) {
        const elements = getFilterElements();
        const validatedState = validateFilterState(state, validTagsSet);
        if (elements.searchInput) {
          elements.searchInput.value = validatedState.query || "";
        }
        if (elements.tagSelect) {
          elements.tagSelect.value = validatedState.dropdown || "all";
        }
        if (elements.sortSelect) {
          elements.sortSelect.value = validatedState.sort || "default";
        }
        $$(".chip").forEach((chip) => {
          const chipTag = chip.dataset.tag || "";
          const shouldBePressed = validatedState.selectedTags.includes(chipTag);
          chip.setAttribute("aria-pressed", String(shouldBePressed));
          chip.dataset.state = shouldBePressed ? "active" : "inactive";
        });
        updateFilterStates(elements);
        applyFilters({ ...elements, totalSites: sites.length });
        renderActiveFilters(validatedState, handleRemoveFilter);
      }
      function handleRemoveFilter(type, value) {
        const elements = getFilterElements();
        if (type === "query") {
          if (elements.searchInput) elements.searchInput.value = "";
        } else if (type === "tag") {
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
        syncURLWithFilters();
        updateFilterStates(elements);
        applyFilters({ ...elements, totalSites: sites.length });
      }
      function setupFilterListeners() {
        const elements = getFilterElements();
        const filterSidebar = document.getElementById("filterSidebar");
        const mainContent = document.getElementById("mainContent");
        const filterToggleButton = document.getElementById("filterToggleButton");
        const mobileFilterToggle = document.getElementById("mobileFilterToggle");
        const closeFilterMobile = document.getElementById("closeFilterMobile");
        const filterToggleTooltip = document.getElementById("filterToggleTooltip");
        const lgMediaQuery = window.matchMedia("(min-width: 1280px)");
        let isDrawerOpen = false;
        let previousFocusElement = null;
        const getFocusableElements = () => {
          if (!filterSidebar) return [];
          const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          return Array.from(filterSidebar.querySelectorAll(focusableSelectors)).filter(
            (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
          );
        };
        const handleFocusTrap = (event) => {
          if (!isDrawerOpen || !filterSidebar) return;
          const focusableElements = getFocusableElements();
          if (focusableElements.length === 0) return;
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          if (event.key === "Tab") {
            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
          if (event.key === "Escape") {
            event.preventDefault();
            closeDrawer();
          }
        };
        const openDrawer = () => {
          previousFocusElement = document.activeElement;
          isDrawerOpen = true;
          filterSidebar?.classList.add("is-open");
          if (lgMediaQuery.matches) {
            mainContent?.classList.add("drawer-open");
          }
          filterToggleButton?.setAttribute("aria-expanded", "true");
          filterToggleButton?.setAttribute("aria-pressed", "true");
          filterToggleButton?.setAttribute("aria-label", "Hide filters");
          mobileFilterToggle?.setAttribute("aria-expanded", "true");
          if (filterToggleTooltip) {
            filterToggleTooltip.setAttribute("data-tip", "Hide filters");
          }
          if (!lgMediaQuery.matches) {
            document.addEventListener("keydown", handleFocusTrap);
            setTimeout(() => {
              const searchInput = elements.searchInput;
              if (searchInput) {
                searchInput.focus();
              }
            }, 100);
          }
        };
        const closeDrawer = () => {
          isDrawerOpen = false;
          filterSidebar?.classList.remove("is-open");
          mainContent?.classList.remove("drawer-open");
          filterToggleButton?.setAttribute("aria-expanded", "false");
          filterToggleButton?.setAttribute("aria-pressed", "false");
          filterToggleButton?.setAttribute("aria-label", "Show filters");
          mobileFilterToggle?.setAttribute("aria-expanded", "false");
          if (filterToggleTooltip) {
            filterToggleTooltip.setAttribute("data-tip", "Show filters");
          }
          document.removeEventListener("keydown", handleFocusTrap);
          if (previousFocusElement && typeof previousFocusElement.focus === "function") {
            setTimeout(() => {
              previousFocusElement.focus();
            }, 100);
          }
        };
        const toggleDrawer = () => {
          if (isDrawerOpen) {
            closeDrawer();
          } else {
            openDrawer();
          }
        };
        const handleViewportChange = (event) => {
          if (event.matches) {
            openDrawer();
          } else {
            closeDrawer();
          }
        };
        handleViewportChange(lgMediaQuery);
        if (typeof lgMediaQuery.addEventListener === "function") {
          lgMediaQuery.addEventListener("change", handleViewportChange);
        } else if (typeof lgMediaQuery.addListener === "function") {
          lgMediaQuery.addListener(handleViewportChange);
        }
        filterToggleButton?.addEventListener("click", toggleDrawer);
        mobileFilterToggle?.addEventListener("click", toggleDrawer);
        closeFilterMobile?.addEventListener("click", closeDrawer);
        const handleClickOutside = (event) => {
          if (!isDrawerOpen || lgMediaQuery.matches) return;
          const isClickInsideDrawer = filterSidebar?.contains(event.target);
          const isClickOnToggleButton = filterToggleButton?.contains(event.target) || mobileFilterToggle?.contains(event.target);
          if (!isClickInsideDrawer && !isClickOnToggleButton) {
            closeDrawer();
          }
        };
        document.addEventListener("click", handleClickOutside);
        let touchStartX = 0;
        if (filterSidebar) {
          filterSidebar.addEventListener("touchstart", (e) => {
            touchStartX = e.touches[0].clientX;
          }, { passive: true });
          filterSidebar.addEventListener("touchend", (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchStartX - touchEndX;
            if (swipeDistance > 50 && isDrawerOpen) {
              closeDrawer();
            }
          }, { passive: true });
        }
        const collapsibleSections = filterSidebar ? $$(".collapse", filterSidebar) : [];
        collapsibleSections.forEach((section, index) => {
          const toggleInput = section.querySelector('input[type="checkbox"]');
          const title = section.querySelector(".collapse-title");
          const content = section.querySelector(".collapse-content");
          if (!toggleInput || !title || !content) return;
          const contentId = `collapse-content-${index}`;
          content.id = contentId;
          const setOpenState = (isOpen) => {
            toggleInput.checked = isOpen;
            section.classList.toggle("is-open", isOpen);
            title.setAttribute("aria-expanded", String(isOpen));
          };
          setOpenState(toggleInput.checked);
          title.setAttribute("role", "button");
          title.setAttribute("aria-controls", contentId);
          if (!title.hasAttribute("tabindex")) {
            title.setAttribute("tabindex", "0");
          }
          const toggleSection = () => {
            setOpenState(!toggleInput.checked);
          };
          title.addEventListener("click", (event) => {
            event.preventDefault();
            toggleSection();
          });
          title.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleSection();
            }
          });
        });
        const debouncedSearchSync = debounce(() => {
          syncURLWithFilters();
          applyFilters({ ...elements, totalSites: sites.length });
        }, 300);
        const clearSearchBtn = document.getElementById("clearSearch");
        const updateClearButtonVisibility = () => {
          if (clearSearchBtn && elements.searchInput) {
            clearSearchBtn.style.display = elements.searchInput.value.trim() ? "flex" : "none";
          }
        };
        updateClearButtonVisibility();
        elements.searchInput?.addEventListener("input", () => {
          updateClearButtonVisibility();
          updateFilterStates(elements);
          debouncedSearchSync();
        });
        clearSearchBtn?.addEventListener("click", () => {
          if (elements.searchInput) {
            elements.searchInput.value = "";
            updateClearButtonVisibility();
            updateFilterStates(elements);
            syncURLWithFilters();
            applyFilters({ ...elements, totalSites: sites.length });
            elements.searchInput.focus();
          }
        });
        elements.tagSelect?.addEventListener("change", () => {
          syncURLWithFilters();
          updateFilterStates(elements);
          applyFilters({ ...elements, totalSites: sites.length });
        });
        elements.sortSelect?.addEventListener("change", () => {
          syncURLWithFilters();
          applyFilters({ ...elements, totalSites: sites.length });
        });
        const clearBtn = $("#clearFilters");
        clearBtn?.addEventListener("click", () => {
          clearAllFilters(elements);
          updateURL(new URLSearchParams());
          updateFilterStates(elements);
          applyFilters({ ...elements, totalSites: sites.length });
          renderActiveFilters(
            { query: "", selectedTags: [], dropdown: "all", sort: "default" },
            handleRemoveFilter
          );
        });
      }
      function setupLearningMode() {
        const elements = getLearningElements();
        learningHandlers = createLearningHandlers(elements);
        const currentRole = getCurrentRole();
        renderRole(currentRole, false, elements);
        if (elements.roleSelect) {
          elements.roleSelect.value = currentRole;
          elements.roleSelect.addEventListener("change", (event) => {
            const nextRole = event.target.value;
            setCurrentRole(nextRole);
            renderRole(nextRole, learningHandlers.isActive(), elements);
          });
        }
        if (elements.learningBtn) {
          elements.learningBtn.setAttribute("aria-haspopup", "dialog");
          elements.learningBtn.setAttribute("aria-expanded", "false");
          elements.learningBtn.setAttribute("aria-controls", "learningPanel");
          elements.learningBtn.addEventListener("click", () => {
            learningHandlers.toggleLearningPanel();
          });
        }
        elements.closeBtn?.addEventListener("click", () => {
          learningHandlers.closeLearningPanel();
        });
        elements.overlay?.addEventListener("mousedown", (event) => {
          if (event.target === elements.overlay) {
            learningHandlers.closeLearningPanel();
          }
        });
        elements.printBtn?.addEventListener("click", () => {
          printChecklist(getCurrentRole(), elements.checklistContent);
        });
      }
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
        elements.inlineCloseBtn?.addEventListener("click", () => {
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
        if (!hasSeenOnboarding()) {
          setTimeout(() => handlers.showOnboarding(), 500);
        }
      }
      function setupKeyboardNavigation() {
        const grid = $("#grid");
        if (!grid) return;
        const calculateGridColumns = (cards) => {
          if (cards.length < 2) return 1;
          const firstCardTop = cards[0].getBoundingClientRect().top;
          let columnsCount = 1;
          for (let i = 1; i < cards.length; i++) {
            const cardTop = cards[i].getBoundingClientRect().top;
            if (Math.abs(cardTop - firstCardTop) < 5) {
              columnsCount++;
            } else {
              break;
            }
          }
          return columnsCount;
        };
        grid.addEventListener("keydown", (e) => {
          if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
            return;
          }
          const cards = Array.from(grid.querySelectorAll(".card")).filter(
            (card) => card.style.display !== "none"
          );
          const currentIndex = cards.indexOf(document.activeElement);
          if (currentIndex === -1) return;
          const gridColumns = calculateGridColumns(cards);
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
      function setupBrowserHistory() {
        window.addEventListener("popstate", () => {
          const params = new URLSearchParams(window.location.search);
          const state = deserializeFilters(params);
          applyFilterStateToUI(state);
        });
      }
      function setupPullToRefresh() {
        const mainContent = document.getElementById("mainContent");
        if (!mainContent) return;
        initPullToRefresh({
          element: mainContent,
          onRefresh: async () => {
            const elements = getFilterElements();
            updateFilterStates(elements);
            applyFilters({ ...elements, totalSites: sites.length });
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        });
      }
      function updateCopyrightYear() {
        const copyrightEl = document.getElementById("copyright");
        if (copyrightEl) {
          const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
          copyrightEl.textContent = `\xA9 ${currentYear} City of Austin`;
        }
      }
      function init() {
        initTheme();
        updateCopyrightYear();
        setupFilterListeners();
        setupLearningMode();
        setupDetailModal();
        setupOnboarding();
        setupKeyboardNavigation();
        setupBrowserHistory();
        setupPullToRefresh();
        loadSites();
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    }
  });
  require_main();
})();
