/**
 * State Management Module
 * Centralized state for filters, roles, and localStorage persistence.
 * Provides getters/setters for application-wide state values.
 */

// Storage keys
const ROLE_STORAGE_KEY = "pp-showcase-role";
const NOTES_KEY = "pp-showcase-notes";
const ONBOARDING_KEY = "hasSeenOnboarding";

// Default values
const DEFAULT_ROLE = "student";

/**
 * Get current user role from localStorage
 * @returns {string} Current role ('student' or 'coach')
 */
export function getCurrentRole() {
  const stored = localStorage.getItem(ROLE_STORAGE_KEY);
  return stored === "coach" || stored === "student" ? stored : DEFAULT_ROLE;
}

/**
 * Set current user role and persist to localStorage
 * @param {string} role - Role to set ('student' or 'coach')
 */
export function setCurrentRole(role) {
  if (role !== "student" && role !== "coach") {
    role = DEFAULT_ROLE;
  }
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}

/**
 * Get notes for current role from localStorage
 * @param {string} role - Role to get notes for
 * @returns {string} Stored notes or empty string
 */
export function getNotes(role) {
  const key = `${NOTES_KEY}-${role}`;
  return localStorage.getItem(key) || "";
}

/**
 * Save notes for current role to localStorage
 * @param {string} role - Role to save notes for
 * @param {string} notes - Notes content
 */
export function saveNotes(role, notes) {
  const key = `${NOTES_KEY}-${role}`;
  localStorage.setItem(key, notes);
}

/**
 * Check if user has seen onboarding
 * @returns {boolean} True if onboarding has been completed
 */
export function hasSeenOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

/**
 * Mark onboarding as seen
 */
export function markOnboardingSeen() {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

/**
 * Clear onboarding state (for testing/reset)
 */
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}

/**
 * Get all state for debugging
 * @returns {Object} Current state snapshot
 */
export function getStateSnapshot() {
  return {
    role: getCurrentRole(),
    hasSeenOnboarding: hasSeenOnboarding(),
    notesStudent: getNotes("student"),
    notesCoach: getNotes("coach"),
  };
}

/**
 * Get current filter state from UI elements
 * Reads search input, selected chips, dropdown, and sort order
 * @returns {Object} Filter state object
 */
export function getFilterStateFromUI() {
  const searchInput = document.getElementById("q");
  const tagSelect = document.getElementById("filterTag");
  const sortSelect = document.getElementById("sortBy");
  const pressedChips = Array.from(document.querySelectorAll('.chip[aria-pressed="true"]'));

  return {
    query: searchInput ? searchInput.value.trim() : "",
    selectedTags: pressedChips.map((chip) => chip.dataset.tag || "").filter(Boolean),
    dropdown: tagSelect ? tagSelect.value : "all",
    sort: sortSelect ? sortSelect.value : "default",
  };
}

/**
 * Serialize filter state to URL query parameters
 * Converts internal state to URL-friendly format with lowercase tags
 * @param {Object} filterState - Current filter state
 * @param {string} filterState.query - Search query
 * @param {Array<string>} filterState.selectedTags - Selected tag names
 * @param {string} filterState.dropdown - Dropdown filter value
 * @param {string} filterState.sort - Sort order
 * @returns {URLSearchParams} URL search parameters
 */
export function serializeFilters(filterState) {
  const params = new URLSearchParams();

  // Add search query if present
  if (filterState.query && filterState.query.length > 0) {
    params.set("q", filterState.query);
  }

  // Add selected tags as comma-separated lowercase values
  if (filterState.selectedTags && filterState.selectedTags.length > 0) {
    const tagString = filterState.selectedTags
      .map((tag) => tag.toLowerCase())
      .join(",");
    params.set("tags", tagString);
  }

  // Add dropdown filter if not "all"
  if (filterState.dropdown && filterState.dropdown !== "all") {
    params.set("filter", filterState.dropdown.toLowerCase());
  }

  // Add sort order if not "default"
  if (filterState.sort && filterState.sort !== "default") {
    params.set("sort", filterState.sort.toLowerCase());
  }

  return params;
}

/**
 * Deserialize URL parameters to filter state object
 * Converts URL params back to internal state format
 * @param {URLSearchParams} params - URL search parameters
 * @returns {Object} Filter state object with normalized values
 */
export function deserializeFilters(params) {
  const state = {
    query: "",
    selectedTags: [],
    dropdown: "all",
    sort: "default",
  };

  // Parse search query
  const query = params.get("q");
  if (query) {
    state.query = query.trim();
  }

  // Parse selected tags (comma-separated, convert to title case)
  const tagsParam = params.get("tags");
  if (tagsParam) {
    state.selectedTags = tagsParam
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => toTitleCase(tag));
  }

  // Parse dropdown filter
  const filter = params.get("filter");
  if (filter) {
    state.dropdown = filter.toLowerCase();
  }

  // Parse sort order
  const sort = params.get("sort");
  if (sort && ["default", "title", "domain"].includes(sort.toLowerCase())) {
    state.sort = sort.toLowerCase();
  }

  return state;
}

/**
 * Update browser URL without page reload
 * Uses replaceState to avoid polluting browser history
 * @param {URLSearchParams} params - URL parameters to set
 */
export function updateURL(params) {
  const url = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.replaceState({}, "", url);
}

/**
 * Validate and sanitize filter state against known valid values
 * Removes invalid tags and ensures valid dropdown/sort values
 * @param {Object} state - Filter state to validate
 * @param {Set<string>} validTags - Set of valid tag names
 * @returns {Object} Validated and sanitized filter state
 */
export function validateFilterState(state, validTags) {
  const validated = {
    query: typeof state.query === "string" ? state.query.trim() : "",
    selectedTags: [],
    dropdown: "all",
    sort: "default",
  };

  // Validate selected tags against known tag set
  if (Array.isArray(state.selectedTags)) {
    validated.selectedTags = state.selectedTags
      .filter((tag) => validTags.has(tag.toLowerCase()))
      .slice(0, 10); // Limit to 10 tags max for URL length
  }

  // Validate dropdown value
  if (state.dropdown && (state.dropdown === "all" || validTags.has(state.dropdown.toLowerCase()))) {
    validated.dropdown = state.dropdown;
  }

  // Validate sort value
  if (state.sort && ["default", "title", "domain"].includes(state.sort.toLowerCase())) {
    validated.sort = state.sort;
  }

  return validated;
}

/**
 * Convert hyphenated or lowercase string to Title Case
 * Used for normalizing tag names from URL to display format
 * @param {string} str - String to convert
 * @returns {string} Title cased string
 * @private
 */
function toTitleCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
