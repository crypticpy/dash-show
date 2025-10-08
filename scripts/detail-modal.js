/**
 * Detail Modal Module
 * Manages the detail view modal for dashboard cards.
 * Handles opening, closing, keyboard navigation, and focus management.
 */

import { hostname, screenshotURL, getCategoryIcon } from "./cards.js";
import { renderDetailChips } from "./cards.js";
import { $, $$ } from "./utils.js";

// Focusable selector for keyboard navigation
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Track last focused element for restoration
let lastFocusedElement = null;

/**
 * Open detail modal with site data
 * @param {Object} item - Site data object
 * @param {HTMLElement} card - Source card element
 * @param {Object} elements - Modal DOM elements
 */
export function openDetailModal(item, card, elements) {
  const {
    overlay,
    modal,
    category,
    title,
    domain,
    summaryText,
    blurb,
    tags,
    techniques,
    visitBtn,
    openBtn,
    screenshot,
    body,
  } = elements;

  if (!overlay || !modal) return;

  // Store last focused element
  lastFocusedElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  // Populate category
  const primaryTag = Array.isArray(item.tags) && item.tags.length
    ? item.tags[0]
    : "Uncategorized";
  const icon = getCategoryIcon(primaryTag);
  if (category) {
    category.textContent = `${icon ? `${icon} ` : ""}${primaryTag}`;
  }

  // Populate title and domain
  if (title) {
    title.textContent = item.title || "Untitled dashboard";
  }

  const domainText = hostname(item.url);
  if (domain) {
    domain.textContent = domainText;
  }

  // Populate summary (curator notes)
  if (summaryText) {
    const summary =
      item.description?.trim()
        ? item.description
        : "Curator notes will populate soon.";
    summaryText.textContent = summary;
  }

  // Populate blurb (fetched content)
  if (blurb) {
    const blurbNode = card?.querySelector(".blurb");
    const blurbText = blurbNode?.textContent.trim() || "";
    blurb.textContent =
      blurbText || "Live summary will load once site content is retrieved.";
  }

  // Render tags and techniques
  renderDetailChips(tags, item.tags, "tag");
  renderDetailChips(techniques, item.techniques, "technique");

  // Set action button URLs
  if (visitBtn) visitBtn.href = item.url || "#";
  if (openBtn) openBtn.href = item.url || "#";

  // Load screenshot
  if (screenshot) {
    const cardImg = card?.querySelector(".thumb img");
    const candidateSrc =
      cardImg?.src && cardImg.src.length
        ? cardImg.src
        : screenshotURL(item.url, 1200);
    screenshot.src = candidateSrc;
    screenshot.alt = `Screenshot of ${item.title}`;
  }

  // Scroll to top
  if (body) {
    if (typeof body.scrollTo === "function") {
      body.scrollTo({ top: 0, behavior: "auto" });
    } else {
      body.scrollTop = 0;
    }
  }

  // Show modal
  overlay.hidden = false;
  document.body.classList.add("detail-open");
  focusFirstElement(overlay, modal);
}

/**
 * Close detail modal and restore focus
 * @param {Object} elements - Modal DOM elements
 */
export function closeDetailModal(elements) {
  const { overlay } = elements;

  if (!overlay || overlay.hidden) return;

  overlay.hidden = true;
  document.body.classList.remove("detail-open");

  // Restore focus
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }

  lastFocusedElement = null;
}

/**
 * Focus first focusable element in modal
 * @param {HTMLElement} overlay - Modal overlay element
 * @param {HTMLElement} modal - Modal content element
 */
function focusFirstElement(overlay, modal) {
  if (!overlay) return;

  const focusable = $$(FOCUSABLE_SELECTOR, overlay).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("tabindex") !== "-1" &&
      el.getAttribute("aria-hidden") !== "true"
  );

  const target = focusable[0] || modal;
  if (target && typeof target.focus === "function") {
    target.focus();
  }
}

/**
 * Handle keyboard navigation in detail modal
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} elements - Modal DOM elements
 */
export function handleDetailKeydown(event, elements) {
  const { overlay, modal } = elements;

  if (!overlay || overlay.hidden) return;

  // Close on Escape
  if (event.key === "Escape") {
    event.preventDefault();
    closeDetailModal(elements);
    return;
  }

  // Handle Tab navigation
  if (event.key === "Tab") {
    trapFocus(event, overlay, modal);
  }
}

/**
 * Trap focus within modal using Tab key
 * @param {KeyboardEvent} event - Keyboard event
 * @param {HTMLElement} overlay - Modal overlay
 * @param {HTMLElement} modal - Modal content
 */
function trapFocus(event, overlay, modal) {
  const focusable = $$(FOCUSABLE_SELECTOR, overlay).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true"
  );

  if (focusable.length === 0) {
    event.preventDefault();
    if (modal && typeof modal.focus === "function") {
      modal.focus();
    }
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;

  // Cycle focus at boundaries
  if (event.shiftKey && current === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && current === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Create detail modal event handlers
 * @param {Object} elements - Modal DOM elements
 * @returns {Object} Event handler functions
 */
export function createDetailHandlers(elements) {
  const keydownHandler = (event) => handleDetailKeydown(event, elements);

  const closeHandler = () => closeDetailModal(elements);

  const overlayClickHandler = (event) => {
    if (event.target === elements.overlay) {
      closeDetailModal(elements);
    }
  };

  return {
    keydownHandler,
    closeHandler,
    overlayClickHandler,
  };
}

/**
 * Attach detail modal event listeners
 * @param {Object} elements - Modal DOM elements
 * @param {Object} handlers - Event handler functions
 */
export function attachDetailListeners(elements, handlers) {
  const { overlay, closeBtn } = elements;

  if (closeBtn) {
    closeBtn.addEventListener("click", handlers.closeHandler);
  }

  if (overlay) {
    overlay.addEventListener("mousedown", handlers.overlayClickHandler);
  }

  // Keydown handler is attached when modal opens
  return () => {
    document.removeEventListener("keydown", handlers.keydownHandler);
  };
}

/**
 * Enable detail modal keyboard navigation
 * @param {Function} keydownHandler - Keyboard event handler
 */
export function enableDetailKeyboard(keydownHandler) {
  document.addEventListener("keydown", keydownHandler);
}

/**
 * Disable detail modal keyboard navigation
 * @param {Function} keydownHandler - Keyboard event handler
 */
export function disableDetailKeyboard(keydownHandler) {
  document.removeEventListener("keydown", keydownHandler);
}
