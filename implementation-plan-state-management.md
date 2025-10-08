# Implementation Plan: Comprehensive State Management and URL Parameter Synchronization

**Created**: 2025-10-08
**Feature**: URL-based filter state with browser history integration
**Modules Affected**: `state.js`, `filters.js`, `main.js`

## 1. Situation Assessment

### Current State Analysis

**Existing Modules:**
- `state.js` (88 lines) - Currently handles role/notes/onboarding localStorage
- `filters.js` (219 lines) - Filter logic with search, tags, dropdown, sorting
- `main.js` (460 lines) - Application orchestration and event binding
- `index.html` - Has all required filter UI elements (`#q`, `#filterTag`, `#sortBy`, `#chips`)

**Current Filter State (Not URL-Synchronized):**
1. Search query (`#q` input)
2. Selected tag chips (`.chip[aria-pressed="true"]`)
3. Dropdown filter (`#filterTag` select)
4. Sort order (`#sortBy` select)

**Current Limitations:**
- No URL parameter synchronization
- No shareable filter states
- No browser back/forward support
- No deep linking to filtered views
- Search input is not debounced (fires on every keystroke)

### Dependencies Identified
- Uses native `URLSearchParams` API (modern browsers)
- Uses `window.history.replaceState()` for URL updates
- Uses `window.addEventListener('popstate')` for back/forward
- No external dependencies required

### Integration Points
- `applyFilters()` in filters.js - needs to update URL
- `clearAllFilters()` in filters.js - needs to clear URL params
- Chip toggle handlers in cards.js - needs URL sync
- Initial page load in main.js - needs to read URL params

## 2. Strategy

### High-Level Approach

**URL Parameter Schema:**
```
?q=search+term&tags=power-bi,municipal&filter=public-cip&sort=title
```

**State Flow:**
```
User Action → Update UI State → Serialize to URL → Update Browser History
     ↓
Browser Back/Forward → Read URL → Deserialize State → Update UI
     ↓
Page Load → Read URL → Apply Initial Filters → Render
```

### Architectural Decisions

1. **Centralized State in `state.js`**
   - Add filter state management alongside role/notes
   - Pure functions for serialization/deserialization
   - URL as single source of truth

2. **Debounced Search in `filters.js`**
   - 300ms debounce to prevent excessive URL updates
   - Immediate visual feedback, delayed filter application

3. **History Management**
   - Use `replaceState` for filter changes (not `pushState`)
   - Avoids polluting browser history with every keystroke
   - Support `popstate` for back/forward navigation

4. **Active Filter Chips**
   - Visual row showing all active filters
   - Each chip is removable with click handler
   - Auto-hide when no filters active

### Security Considerations
- URL parameters are user-controlled input
- Sanitize all params before applying to DOM
- Validate tag names against known tag list
- Escape HTML in chip labels

### Performance Considerations
- Debounce search input (300ms)
- Batch URL updates (use single `replaceState` call)
- Avoid unnecessary filter re-application
- Efficient tag validation using Set lookup

## 3. Detailed Implementation Plan

### Phase 1: Enhance State Module (`state.js`)

**Add URL Parameter Management:**

```javascript
/**
 * Get current filter state from URL parameters
 * @returns {Object} Filter state object
 */
export function getFilterStateFromURL()

/**
 * Serialize filter state to URL query parameters
 * @param {Object} filterState - Current filter state
 * @returns {URLSearchParams}
 */
export function serializeFilters(filterState)

/**
 * Deserialize URL params to filter state object
 * @param {URLSearchParams} params
 * @returns {Object} Filter state
 */
export function deserializeFilters(params)

/**
 * Update browser URL without page reload
 * @param {URLSearchParams} params
 */
export function updateURL(params)

/**
 * Get current filter state snapshot
 * @returns {Object} Current state
 */
export function getCurrentFilterState()

/**
 * Validate filter state against known values
 * @param {Object} state - Filter state to validate
 * @param {Set<string>} validTags - Set of valid tag names
 * @returns {Object} Validated and sanitized state
 */
export function validateFilterState(state, validTags)
```

**Filter State Object Structure:**
```javascript
{
  query: "",           // Search query string
  selectedTags: [],    // Array of tag names
  dropdown: "all",     // Dropdown filter value
  sort: "default"      // Sort order
}
```

### Phase 2: Add Debounce to Filters (`filters.js`)

**Debounce Utility:**
```javascript
/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300)
```

**Tag Categorization:**
```javascript
/**
 * Categorize tags into semantic facets
 * @param {string[]} tags - All unique tags
 * @returns {Object} Categorized tag object
 */
export function categorizeTags(tags)
```

**Active Filter Chips:**
```javascript
/**
 * Render active filter chips row
 * @param {Object} filterState - Current filter state
 * @param {Function} onRemove - Callback when chip removed
 */
export function renderActiveFilters(filterState, onRemove)

/**
 * Create removable filter chip element
 * @param {string} label - Chip label
 * @param {string} value - Filter value
 * @param {Function} onRemove - Remove callback
 * @returns {HTMLElement}
 */
function createRemovableChip(label, value, onRemove)
```

### Phase 3: Integrate Browser History (`main.js`)

**Page Load Integration:**
```javascript
// In init() function
const initialParams = new URLSearchParams(window.location.search);
if (initialParams.toString()) {
  const state = deserializeFilters(initialParams);
  applyFilterStateFromURL(state);
}
```

**Popstate Handler:**
```javascript
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const state = deserializeFilters(params);
  applyFilterStateFromURL(state);
});
```

**Filter State Application:**
```javascript
/**
 * Apply filter state to UI from URL
 * @param {Object} state - Deserialized filter state
 */
function applyFilterStateFromURL(state)
```

### Phase 4: Update Event Handlers

**Search Input (Debounced):**
```javascript
const debouncedApplyFilters = debounce(() => {
  const state = getCurrentFilterState();
  const params = serializeFilters(state);
  updateURL(params);
  applyFilters({ ...elements, totalSites: sites.length });
}, 300);

searchInput.addEventListener('input', () => {
  updateFilterStates(elements); // Immediate visual feedback
  debouncedApplyFilters();       // Delayed filter + URL update
});
```

**Dropdown/Sort Changes (Immediate):**
```javascript
tagSelect.addEventListener('change', () => {
  const state = getCurrentFilterState();
  const params = serializeFilters(state);
  updateURL(params);
  updateFilterStates(elements);
  applyFilters({ ...elements, totalSites: sites.length });
});
```

**Chip Toggles (cards.js):**
```javascript
// In chip click handler
chip.addEventListener('click', () => {
  // Toggle chip state
  chip.setAttribute('aria-pressed', isPressed);

  // Update URL
  const state = getCurrentFilterState();
  const params = serializeFilters(state);
  updateURL(params);

  // Apply filters
  applyFilters(...);
});
```

**Clear Filters:**
```javascript
clearBtn.addEventListener('click', () => {
  clearAllFilters(elements);
  updateURL(new URLSearchParams()); // Clear URL params
  updateFilterStates(elements);
  applyFilters({ ...elements, totalSites: sites.length });
});
```

## 4. Technical Specifications

### URL Parameter Schema

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `q` | string | `q=capital+projects` | Search query (URL encoded) |
| `tags` | comma-separated | `tags=power-bi,municipal` | Selected tag chips (lowercase) |
| `filter` | string | `filter=public-cip` | Dropdown filter value (lowercase) |
| `sort` | string | `sort=title` | Sort order (`default`, `title`, `domain`) |

**Example URLs:**
```
# Search only
?q=austin+budget

# Tags only
?tags=power-bi,municipal

# Combined filters
?q=capital&tags=power-bi&filter=public-cip&sort=title

# All filters
?q=project+prioritization&tags=power-bi,municipal,cip&filter=public-cip&sort=domain
```

### API Contracts

**serializeFilters(filterState)**
```javascript
Input:  { query: "austin", selectedTags: ["Power BI"], dropdown: "all", sort: "title" }
Output: URLSearchParams { q: "austin", tags: "power-bi", sort: "title" }
```

**deserializeFilters(params)**
```javascript
Input:  URLSearchParams { q: "austin", tags: "power-bi,municipal" }
Output: { query: "austin", selectedTags: ["Power BI", "Municipal"], dropdown: "all", sort: "default" }
```

**validateFilterState(state, validTags)**
```javascript
Input:  { selectedTags: ["Power BI", "InvalidTag", "Municipal"] }
Output: { selectedTags: ["Power BI", "Municipal"] } // Invalid tag removed
```

## 5. Risk Mitigation

### Potential Issues

1. **Invalid Tag Names in URL**
   - **Risk**: Malicious or outdated tags in shared URLs
   - **Solution**: Validate against current tag set, ignore invalid tags

2. **URL Too Long (Browser Limits)**
   - **Risk**: Too many tags selected (2000+ char limit)
   - **Solution**: Limit tag selection to 10 chips max

3. **Race Conditions (Rapid Filter Changes)**
   - **Risk**: Debounced search + immediate dropdown change
   - **Solution**: Cancel pending debounced calls on immediate updates

4. **Back/Forward Breaking Filter State**
   - **Risk**: Popstate not correctly restoring UI state
   - **Solution**: Comprehensive state restoration including chips

5. **Special Characters in Search**
   - **Risk**: URL encoding issues with quotes, &, etc.
   - **Solution**: Use native `URLSearchParams` for encoding

### Edge Cases

1. **Empty Search Query**: `?q=` should be ignored (no param)
2. **Unknown Tags**: Filter out tags not in current tag list
3. **Invalid Sort Value**: Default to `"default"` sort
4. **Malformed URL**: Gracefully handle and apply defaults
5. **No Results After URL Filters**: Show empty state message

## 6. Testing Strategy

### Manual Test Cases

1. **Share URL with Filters**
   - Apply filters → Copy URL → Open in new tab → Verify state restored

2. **Browser Back/Forward**
   - Apply filters → Navigate away → Click back → Verify filters restored

3. **Search Debouncing**
   - Type rapidly → Verify URL updates only after 300ms pause

4. **Clear All Filters**
   - Apply filters → Click clear → Verify URL has no params

5. **Invalid URL Params**
   - Manually craft bad URL → Verify graceful handling

6. **Multiple Tags**
   - Select 3+ tags → Verify URL has comma-separated list

7. **Special Characters in Search**
   - Search for `"project & budget"` → Verify proper encoding

### Validation Checklist

- [ ] URL updates on search input (debounced)
- [ ] URL updates on tag toggle (immediate)
- [ ] URL updates on dropdown change (immediate)
- [ ] URL updates on sort change (immediate)
- [ ] URL clears on "Clear filters" click
- [ ] Page load reads URL and applies filters
- [ ] Browser back/forward restores filter state
- [ ] Invalid tags in URL are ignored
- [ ] Special characters are properly encoded
- [ ] Empty state shows when no results match URL filters

## 7. Implementation Checklist

### State Module (`state.js`)
- [ ] Add `getFilterStateFromURL()` function
- [ ] Add `serializeFilters()` function
- [ ] Add `deserializeFilters()` function
- [ ] Add `updateURL()` function
- [ ] Add `getCurrentFilterState()` function
- [ ] Add `validateFilterState()` function
- [ ] Add comprehensive JSDoc comments
- [ ] Export all new functions

### Filters Module (`filters.js`)
- [ ] Add `debounce()` utility function
- [ ] Add `categorizeTags()` function
- [ ] Add `renderActiveFilters()` function
- [ ] Add `createRemovableChip()` helper
- [ ] Export debounce and categorization functions
- [ ] Update existing filter functions to support state objects

### Main Module (`main.js`)
- [ ] Import new state functions
- [ ] Add popstate event listener
- [ ] Add initial URL read on page load
- [ ] Create `applyFilterStateFromURL()` helper
- [ ] Debounce search input handler
- [ ] Update all filter event handlers to sync URL
- [ ] Update chip toggle handlers to sync URL
- [ ] Update clear filters to clear URL

### HTML (`index.html`)
- [ ] Add `#activeFilters` container for filter chips
- [ ] Ensure proper ARIA labels for accessibility
- [ ] Verify all filter elements have correct IDs

### Testing
- [ ] Test all manual test cases
- [ ] Verify validation checklist items
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test mobile responsive behavior
- [ ] Verify accessibility with keyboard navigation

## 8. Success Criteria

**Functional Requirements:**
- ✅ All filter states reflected in URL
- ✅ Shareable URLs restore exact filter state
- ✅ Browser back/forward works correctly
- ✅ Search is debounced at 300ms
- ✅ Invalid URL params handled gracefully
- ✅ Active filter chips are removable

**Non-Functional Requirements:**
- ✅ No breaking changes to existing functionality
- ✅ Performance: No noticeable lag on filter changes
- ✅ Accessibility: Keyboard accessible filter chips
- ✅ Browser support: Chrome 61+, Firefox 60+, Safari 11+
- ✅ Code quality: Comprehensive JSDoc, under 50 lines per function

**Documentation:**
- ✅ URL parameter schema documented
- ✅ API contracts defined
- ✅ Edge cases documented
- ✅ Test cases documented

---

**Estimated Implementation Time**: 3-4 hours
**Lines of Code Added**: ~400 lines
**Files Modified**: 3 (state.js, filters.js, main.js)
**Files Created**: 0 (using existing modules)
**Breaking Changes**: None
