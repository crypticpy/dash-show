# State Management & URL Synchronization Test Plan

**Feature**: Comprehensive state management with URL parameter synchronization
**Date**: 2025-10-08
**Implementation Status**: Complete

## Test Execution Guide

### Setup
1. Start local server: `python -m http.server 8000`
2. Open browser: `http://localhost:8000`
3. Open browser developer console to monitor for errors

---

## Manual Test Cases

### Test 1: Search Query URL Sync
**Objective**: Verify search input is debounced and synced to URL

**Steps**:
1. Open `http://localhost:8000`
2. Type "capital" in search box
3. Wait 300ms
4. Check URL bar

**Expected Result**:
- URL should update to: `?q=capital`
- Filter count should show `(showing N)`
- Active filter chip should appear: "Search: capital"

**Status**: [ ] Pass [ ] Fail

---

### Test 2: Tag Chip Selection URL Sync
**Objective**: Verify tag chip toggles sync to URL immediately

**Steps**:
1. Clear all filters
2. Click "Power BI" chip
3. Click "Municipal" chip
4. Check URL bar

**Expected Result**:
- URL should update to: `?tags=power-bi,municipal`
- Both chips should show checkmark and be highlighted
- Active filter chips should show: "Tag: Power BI" and "Tag: Municipal"

**Status**: [ ] Pass [ ] Fail

---

### Test 3: Dropdown Filter URL Sync
**Objective**: Verify dropdown selection syncs to URL

**Steps**:
1. Clear all filters
2. Select "Public CIP" from dropdown
3. Check URL bar

**Expected Result**:
- URL should update to: `?filter=public-cip`
- Active filter chip should show: "Category: Public Cip"

**Status**: [ ] Pass [ ] Fail

---

### Test 4: Sort Order URL Sync
**Objective**: Verify sort selection syncs to URL

**Steps**:
1. Clear all filters
2. Select "Sort: Title (A→Z)" from dropdown
3. Check URL bar

**Expected Result**:
- URL should update to: `?sort=title`
- Active filter chip should show: "Sort: Title A→Z"
- Cards should be alphabetically sorted

**Status**: [ ] Pass [ ] Fail

---

### Test 5: Combined Filters URL Sync
**Objective**: Verify multiple filters work together

**Steps**:
1. Clear all filters
2. Type "project" in search
3. Click "Power BI" chip
4. Select "Public CIP" from dropdown
5. Select "Sort: Domain (A→Z)"
6. Wait 300ms
7. Check URL bar

**Expected Result**:
- URL should be: `?q=project&tags=power-bi&filter=public-cip&sort=domain`
- All 4 active filter chips should be visible
- Correct number of cards should be shown

**Status**: [ ] Pass [ ] Fail

---

### Test 6: Clear Filters Button
**Objective**: Verify clear filters removes URL params

**Steps**:
1. Apply multiple filters (search, tag, dropdown, sort)
2. Click "Clear filters ✕" button
3. Check URL bar

**Expected Result**:
- URL should have no query params: `http://localhost:8000/`
- All active filter chips should disappear
- All cards should be visible
- Clear button should hide

**Status**: [ ] Pass [ ] Fail

---

### Test 7: Remove Individual Filter Chip
**Objective**: Verify clicking X on active chip removes that filter

**Steps**:
1. Apply search "capital" and tag "Power BI"
2. Click X on "Search: capital" chip
3. Check URL bar

**Expected Result**:
- URL should update to: `?tags=power-bi`
- Search chip should disappear
- Search input should be cleared
- Power BI chip should still be active

**Status**: [ ] Pass [ ] Fail

---

### Test 8: Shareable URL - Load with Filters
**Objective**: Verify URL params apply filters on page load

**Steps**:
1. Open new tab/window
2. Navigate to: `http://localhost:8000/?q=dashboard&tags=power-bi,municipal&filter=public-cip&sort=title`
3. Check UI state

**Expected Result**:
- Search input should contain "dashboard"
- Power BI and Municipal chips should be selected
- Dropdown should show "Public CIP"
- Sort should be "Title (A→Z)"
- Active filter chips should show all 4 filters
- Cards should be filtered and sorted accordingly

**Status**: [ ] Pass [ ] Fail

---

### Test 9: Browser Back Button
**Objective**: Verify browser back restores previous filter state

**Steps**:
1. Start with no filters
2. Apply search "capital" (wait for URL update)
3. Add tag "Power BI"
4. Change sort to "Title (A→Z)"
5. Click browser back button
6. Click back again

**Expected Result**:
- First back: Should restore state with search + tag (no sort)
- Second back: Should restore state with search only
- UI should match URL params on each back

**Status**: [ ] Pass [ ] Fail

---

### Test 10: Browser Forward Button
**Objective**: Verify browser forward restores next filter state

**Steps**:
1. Follow Test 9 steps to navigate back
2. Click browser forward button
3. Click forward again

**Expected Result**:
- First forward: Should restore search + tag state
- Second forward: Should restore search + tag + sort state
- UI should match URL params on each forward

**Status**: [ ] Pass [ ] Fail

---

### Test 11: Invalid URL Parameters
**Objective**: Verify graceful handling of malicious/invalid params

**Steps**:
1. Navigate to: `http://localhost:8000/?q=test&tags=invalid-tag,fake-tag&filter=badfilter&sort=invalid`
2. Check UI state and console

**Expected Result**:
- Search should work: "test"
- Invalid tags should be ignored (not applied)
- Invalid filter should fallback to "all"
- Invalid sort should fallback to "default"
- No JavaScript errors in console

**Status**: [ ] Pass [ ] Fail

---

### Test 12: Special Characters in Search
**Objective**: Verify URL encoding handles special characters

**Steps**:
1. Type in search: `project & budget "planning"`
2. Wait 300ms
3. Check URL bar

**Expected Result**:
- URL should properly encode: `?q=project+%26+budget+%22planning%22` (or similar)
- Search should work correctly
- Active chip should show: `Search: project & budget "planning"`

**Status**: [ ] Pass [ ] Fail

---

### Test 13: Debounced Search Performance
**Objective**: Verify search is debounced and doesn't update URL excessively

**Steps**:
1. Open browser DevTools Network tab
2. Type rapidly: "c-a-p-i-t-a-l" (one keystroke per ~100ms)
3. Observe URL changes

**Expected Result**:
- URL should update only ONCE after typing stops (300ms delay)
- Should NOT update 7 times (once per keystroke)
- Visual feedback (has-value class) should be immediate

**Status**: [ ] Pass [ ] Fail

---

### Test 14: Long Tag List URL Length
**Objective**: Verify maximum tag limit prevents overly long URLs

**Steps**:
1. Select 15+ different tag chips
2. Check URL bar

**Expected Result**:
- Only first 10 tags should be in URL (validation limit)
- UI should still reflect all selected chips
- No browser errors

**Status**: [ ] Pass [ ] Fail

---

### Test 15: Active Filter Chips Accessibility
**Objective**: Verify keyboard navigation works for filter chips

**Steps**:
1. Apply multiple filters
2. Press Tab to focus active filter chips
3. Press Enter on a chip
4. Press Space on a chip

**Expected Result**:
- Filter chips should be keyboard focusable
- Enter/Space should remove the filter
- Focus ring should be visible
- ARIA labels should announce filter details

**Status**: [ ] Pass [ ] Fail

---

## Edge Cases

### Edge Case 1: Empty Search Query in URL
**URL**: `?q=&tags=power-bi`

**Expected**:
- Empty query should be ignored
- Only tags filter should apply

**Status**: [ ] Pass [ ] Fail

---

### Edge Case 2: Duplicate Tags in URL
**URL**: `?tags=power-bi,power-bi,municipal`

**Expected**:
- Duplicate should be handled gracefully
- Only unique tags applied

**Status**: [ ] Pass [ ] Fail

---

### Edge Case 3: Case Sensitivity in URL
**URL**: `?tags=POWER-BI,Municipal&filter=PUBLIC-CIP`

**Expected**:
- Tags should match case-insensitively
- Filters should apply correctly

**Status**: [ ] Pass [ ] Fail

---

### Edge Case 4: URL with No Results
**URL**: `?q=nonexistentterm12345`

**Expected**:
- Empty state should show
- Active filter chip should display
- "Clear all filters" button should be visible

**Status**: [ ] Pass [ ] Fail

---

## Browser Compatibility Testing

### Chrome
- [ ] All tests pass
- [ ] No console errors
- [ ] URL updates smoothly

### Firefox
- [ ] All tests pass
- [ ] No console errors
- [ ] URL updates smoothly

### Safari
- [ ] All tests pass
- [ ] No console errors
- [ ] URL updates smoothly

### Edge
- [ ] All tests pass
- [ ] No console errors
- [ ] URL updates smoothly

---

## Performance Benchmarks

### Debounce Timing
- **Target**: 300ms delay after last keystroke
- **Measured**: _____ms
- **Pass Criteria**: 280-320ms range

### URL Update Time
- **Target**: < 10ms for single filter change
- **Measured**: _____ms
- **Pass Criteria**: < 50ms

### Filter Application Time (100 cards)
- **Target**: < 50ms to filter and render
- **Measured**: _____ms
- **Pass Criteria**: < 100ms

---

## Known Issues / Limitations

1. **Maximum Tags**: Limited to 10 selected tags to prevent overly long URLs (browser limit ~2000 chars)
2. **Browser History**: Uses `replaceState` not `pushState` to avoid polluting history with every keystroke
3. **Tag Name Format**: Tags must match existing tag names (case-insensitive) or will be ignored

---

## Success Criteria Summary

✅ All filter states reflected in URL
✅ Shareable URLs restore exact filter state
✅ Browser back/forward works correctly
✅ Search is debounced at 300ms
✅ Invalid URL params handled gracefully
✅ Active filter chips are removable
✅ No breaking changes to existing functionality
✅ Keyboard accessible filter chips
✅ No JavaScript errors in console

---

## Test Execution Log

**Tester**: _________________
**Date**: _________________
**Browser**: _________________
**OS**: _________________

**Overall Result**: [ ] All Tests Pass [ ] Issues Found

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
