/**
 * Detail Modal Module
 * Manages the detail view modal for dashboard cards.
 * Handles opening, closing, keyboard navigation, and focus management.
 */

import { getCategoryIcon, renderDetailChips } from "./cards.js";
import { $, $$, hostname, screenshotURL, escapeHtml } from "./utils.js";

// Focusable selector for keyboard navigation
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Track last focused element for restoration
let lastFocusedElement = undefined;
let scrollLockPosition = 0;
let scrollLockActive = false;

/**
 * Apply scroll lock to prevent background movement
 */
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

/**
 * Release scroll lock and restore previous position
 */
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

/**
 * Cleanup state after modal closes and restore focus
 */
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

  lastFocusedElement = undefined;
}

/**
 * Open detail modal with site data
 * @param {Object} item - Site data object
 * @param {HTMLElement} card - Source card element
 * @param {Object} elements - Modal DOM elements
 */
export function openDetailModal(item, card, elements) {
  const modal = $("#detailModal");
  if (!modal) return;

  // Store last focused element
  lastFocusedElement =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  // Prevent background scrolling while detail modal is active
  applyScrollLock();

  // Populate category
  const primaryTag =
    Array.isArray(item.tags) && item.tags.length
      ? item.tags[0]
      : "Uncategorized";
  const icon = getCategoryIcon(primaryTag);
  const category = $("#detailCategory");
  if (category) {
    category.setAttribute("aria-label", `Category: ${primaryTag}`);
    category.innerHTML = `
      <span class="category-icon" aria-hidden="true">${icon}</span>
      ${escapeHtml(primaryTag)}
    `;
  }

  // Populate title and domain
  const title = $("#detailTitle");
  if (title) {
    title.textContent = item.title || "Untitled dashboard";
  }

  const domainText = hostname(item.url);
  const domain = $("#detailDomain");
  if (domain) {
    domain.textContent = domainText;
  }

  // Populate summary (curator notes)
  const summaryText = $("#detailSummary");
  if (summaryText) {
    const summary = item.description?.trim()
      ? item.description
      : "Curator notes will populate soon.";
    summaryText.textContent = summary;
  }

  // Populate blurb (fetched content)
  const blurb = $("#detailBlurb");
  if (blurb) {
    const blurbNode = card?.querySelector(".blurb");
    const blurbText = blurbNode?.textContent.trim() || "";
    blurb.textContent =
      blurbText || "Live summary will load once site content is retrieved.";
  }

  // Render tags and techniques
  const tags = $("#detailTags");
  const techniques = $("#detailTechniques");
  renderDetailChips(tags, item.tags, "tag");
  renderDetailChips(techniques, item.techniques, "technique");

  // Set action button URLs
  const visitBtn = $("#detailVisit");
  if (visitBtn) visitBtn.href = item.url || "#";

  // Load screenshot
  const screenshot = $("#detailScreenshot");
  if (screenshot) {
    const cardImg = card?.querySelector("img[data-src], img.loaded");
    const candidateSrc =
      cardImg?.src && cardImg.src.length
        ? cardImg.src
        : screenshotURL(item.url, 1200);
    screenshot.src = candidateSrc;
    screenshot.alt = `Screenshot of ${item.title}`;
  }

  // Show modal using DaisyUI method
  modal.showModal();
  const modalSurface = modal.querySelector(".modal-box") || modal;
  focusFirstElement(modalSurface);
}

/**
 * Close detail modal and restore focus
 * @param {Object} elements - Modal DOM elements
 */
export function closeDetailModal(elements) {
  const modal = $("#detailModal");
  if (!modal || !modal.open) return;

  // Close modal using DaisyUI method
  modal.close();

  finalizeModalClose();
}

/**
 * Focus fallback element when previous focus target is unavailable
 * @private
 */
function focusFallbackElement() {
  // Try to focus the first visible card
  const firstCard = document.querySelector('.dashboard-card:not([style*="display: none"])');
  if (firstCard && typeof firstCard.focus === "function") {
    firstCard.focus();
    return;
  }

  // Ultimate fallback: focus body
  document.body.focus();
}

/**
 * Focus first focusable element in modal
 * @param {HTMLElement} overlay - Modal overlay element
 * @param {HTMLElement} modal - Modal content element
 */
function focusFirstElement(container) {
  if (!container) return;

  const focusable = $$(FOCUSABLE_SELECTOR, container).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("tabindex") !== "-1" &&
      el.getAttribute("aria-hidden") !== "true",
  );

  const target = focusable[0] || container;
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
  const modal = elements.modal || $("#detailModal");
  if (!modal || !modal.open) return;

  const container = modal.querySelector(".modal-box") || modal;

  // Close on Escape
  if (event.key === "Escape") {
    event.preventDefault();
    closeDetailModal(elements);
    return;
  }

  // Handle Tab navigation
  if (event.key === "Tab") {
    trapFocus(event, container);
  }
}

/**
 * Trap focus within modal using Tab key
 * @param {KeyboardEvent} event - Keyboard event
 * @param {HTMLElement} container - Modal focus container
 */
function trapFocus(event, container) {
  const focusable = $$(FOCUSABLE_SELECTOR, container).filter(
    (el) =>
      !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
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
 * Ensure modal cleanup when closed natively
 */
export function finalizeDetailModalClose() {
  finalizeModalClose();
}

/**
 * Create detail modal event handlers
 * @param {Object} elements - Modal DOM elements
 * @returns {Object} Event handler functions
 */
export function createDetailHandlers(elements) {
  const keydownHandler = (event) => handleDetailKeydown(event, elements);
  const closeHandler = () => closeDetailModal(elements);

  const modalElement = elements.modal || $("#detailModal");
  const overlayElement = elements.overlay || modalElement;

  const overlayClickHandler = (event) => {
    if (overlayElement && event.target === overlayElement) {
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
  const closeBtn = elements.closeBtn;
  const overlayElement =
    elements.overlay || elements.modal || $("#detailModal");

  if (closeBtn) {
    closeBtn.addEventListener("click", handlers.closeHandler);
  }

  if (overlayElement) {
    overlayElement.addEventListener("mousedown", handlers.overlayClickHandler);
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
