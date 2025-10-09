/**
 * Card Rendering Module
 * Handles card template creation, tag controls, chips, and lazy image loading.
 * Generates accessible card markup with proper ARIA attributes.
 */

import {
  escapeHtml,
  hostname,
  screenshotURL,
  screenshotFallback,
  faviconURL,
  $$,
} from "./utils.js";

const ICON_LIBRARY = {
  civic: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"/></svg>`,
  analytics: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>`,
  portfolio: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"/></svg>`,
  playbook: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"/></svg>`,
  sustainability: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>`,
  policy: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>`,
  globe: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>`,
  data: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"/></svg>`,
  default: `<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/></svg>`,
};

const CATEGORY_ICON_KEY = {
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
  "Reference Data": "data",
};

/**
 * Get icon for category tag
 * @param {string} tag - Category tag name
 * @returns {string} Icon SVG markup
 */
export function getCategoryIcon(tag) {
  const key = CATEGORY_ICON_KEY[tag] || "default";
  return ICON_LIBRARY[key] || ICON_LIBRARY.default;
}

/**
 * Get ARIA label for category
 * @param {string} tag - Category tag name
 * @returns {string} Accessible category label
 */
export function getCategoryAria(tag) {
  return `Category: ${tag}`;
}

/**
 * Create interactive chip element for tag filtering
 * @param {string} tagText - Tag name to display
 * @param {Function} onToggle - Callback when chip is toggled
 * @returns {HTMLElement} Chip button element
 */
export function createChip(tagText, onToggle) {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.type = "button";
  chip.dataset.tag = tagText.toLowerCase();
  chip.dataset.state = "inactive";
  chip.setAttribute("aria-pressed", "false");

  const icon = document.createElement("span");
  icon.className = "chip-check";
  icon.setAttribute("data-checkmark", "");
  icon.textContent = "✓";

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

/**
 * Populate tag control UI (chips and dropdown)
 * @param {Array<Object>} sites - Site data array
 * @param {HTMLElement} chipsContainer - Container for chip buttons
 * @param {HTMLSelectElement} tagSelect - Dropdown select element
 * @param {Function} onChipToggle - Callback when chip is toggled
 */
export function populateTagControls(
  sites,
  chipsContainer,
  tagSelect,
  onChipToggle,
) {
  chipsContainer.innerHTML = "";
  tagSelect.innerHTML = "";

  // Add "All types" option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All types";
  tagSelect.appendChild(allOption);

  // Extract and sort unique tags
  const tags = Array.from(
    new Set(sites.flatMap((site) => site.tags || [])),
  ).sort((a, b) => a.localeCompare(b));

  // Create chips and dropdown options
  tags.forEach((tag) => {
    chipsContainer.appendChild(createChip(tag, onChipToggle));

    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagSelect.appendChild(option);
  });

  tagSelect.value = "all";
}

/**
 * Create tag overflow UI with expandable "+ N more" button
 * @param {string[]} tags - All technique tags
 * @param {number} maxVisible - Max tags to show (default 3)
 * @returns {string} HTML string
 */
function renderTagsWithOverflow(tags, maxVisible = 3) {
  if (!tags || tags.length === 0) return "";

  if (tags.length <= maxVisible) {
    return tags
      .map((t) => `<span class="technique-tag">${escapeHtml(t)}</span>`)
      .join("");
  }

  const visible = tags.slice(0, maxVisible);
  const hidden = tags.slice(maxVisible);
  const overflowId = `overflow-${Math.random().toString(36).slice(2)}`;

  return `
    ${visible.map((t) => `<span class="technique-tag">${escapeHtml(t)}</span>`).join("")}
    <button class="tag-overflow-toggle" data-target="${overflowId}" aria-expanded="false" aria-label="Show ${hidden.length} more tags">
      +${hidden.length} more
    </button>
    <div id="${overflowId}" class="tag-overflow-content" style="display:none;">
      ${hidden.map((t) => `<span class="technique-tag">${escapeHtml(t)}</span>`).join("")}
    </div>
  `;
}

/**
 * Create card element from site data
 * @param {Object} item - Site data object
 * @param {Function} onCardClick - Callback when card is clicked
 * @returns {HTMLElement} Card article element
 */
export function cardTemplate(item, onCardClick) {
  const host = hostname(item.url);
  const elm = document.createElement("article");
  elm.className =
    "card dashboard-card group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 loading";
  elm.dataset.tags = (item.tags || []).join("|").toLowerCase();
  elm.dataset.title = (item.title || "").toLowerCase();
  elm.dataset.domain = host.toLowerCase();
  elm.setAttribute("role", "article");
  elm.setAttribute("tabindex", "0");

  // Add click handlers for detail modal
  const handleClick = (e) => {
    if (shouldOpenDetail(e)) {
      onCardClick(elm, item, e);
    }
  };

  elm.addEventListener("click", handleClick);
  elm.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      shouldOpenDetail(event)
    ) {
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
    description,
  });

  // Setup tag overflow toggle handlers
  setupTagOverflowHandlers(elm);

  // Setup kebab menu handlers
  setupKebabMenuHandlers(elm, item);

  return elm;
}

/**
 * Setup event handlers for kebab menu
 * @param {HTMLElement} card - Card element
 * @param {Object} item - Site data object
 */
function setupKebabMenuHandlers(card, item) {
  const kebabButton = card.querySelector(".kebab-menu");
  const kebabDropdown = card.querySelector(".kebab-dropdown");

  if (!kebabButton || !kebabDropdown) return;

  // Toggle dropdown
  kebabButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent card click event

    const isExpanded = kebabButton.getAttribute("aria-expanded") === "true";

    // Close all other open kebab menus
    document
      .querySelectorAll('.kebab-menu[aria-expanded="true"]')
      .forEach((btn) => {
        if (btn !== kebabButton) {
          btn.setAttribute("aria-expanded", "false");
          const dropdown = btn.nextElementSibling;
          if (dropdown) dropdown.hidden = true;
        }
      });

    // Toggle current menu
    kebabButton.setAttribute("aria-expanded", String(!isExpanded));
    kebabDropdown.hidden = isExpanded;
  });

  // Handle kebab menu item clicks
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

      // Close dropdown after action
      kebabButton.setAttribute("aria-expanded", "false");
      kebabDropdown.hidden = true;
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!card.contains(e.target)) {
      kebabButton.setAttribute("aria-expanded", "false");
      kebabDropdown.hidden = true;
    }
  });

  // Close on Escape key
  kebabButton.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      kebabButton.getAttribute("aria-expanded") === "true"
    ) {
      kebabButton.setAttribute("aria-expanded", "false");
      kebabDropdown.hidden = true;
      kebabButton.focus();
    }
  });

  // Close dropdown on scroll
  const closeOnScroll = () => {
    if (kebabButton.getAttribute("aria-expanded") === "true") {
      kebabButton.setAttribute("aria-expanded", "false");
      kebabDropdown.hidden = true;
    }
  };

  // Use capture phase to detect scroll on any ancestor
  window.addEventListener("scroll", closeOnScroll, true);

  // Store cleanup function on element for potential cleanup
  card.kebabScrollCleanup = () => {
    window.removeEventListener("scroll", closeOnScroll, true);
  };
}

/**
 * Handle regenerate AI description action
 * @param {HTMLElement} card - Card element
 * @param {Object} item - Site data object
 */
async function handleRegenerateDescription(card, item) {
  const blurbElement = card.querySelector(".blurb");
  if (!blurbElement) return;

  // Close kebab menu during regeneration
  const kebabButton = card.querySelector(".kebab-menu");
  const kebabDropdown = card.querySelector(".kebab-dropdown");
  if (kebabButton && kebabDropdown) {
    kebabButton.setAttribute("aria-expanded", "false");
    kebabDropdown.hidden = true;
  }

  // Show loading state with spinner
  const originalText = blurbElement.textContent;
  const loadingHTML = '<span class="loading loading-spinner loading-xs"></span> Regenerating description...';
  blurbElement.innerHTML = loadingHTML;
  blurbElement.style.fontStyle = "italic";
  blurbElement.style.opacity = "0.7";

  try {
    // Import API module dynamically to avoid circular dependencies
    const { fetchBlurb } = await import("./api.js");
    const newBlurb = await fetchBlurb(item.url);

    if (newBlurb) {
      blurbElement.textContent = newBlurb;
      blurbElement.style.fontStyle = "normal";
      blurbElement.style.opacity = "1";

      // Update the item data if possible
      if (item.description !== undefined) {
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

// Toast notification queue management
let activeToast = null;
let toastTimeout = null;

/**
 * Show toast notification with type
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success' or 'error')
 * @private
 */
function showToast(message, type = "success") {
  // Clear existing toast if present
  if (activeToast) {
    clearTimeout(toastTimeout);
    activeToast.remove();
    activeToast = null;
  }

  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const icon = type === "success" ? "✓" : "⚠";
  const bgColor = type === "success"
    ? "rgba(0, 159, 77, 0.95)"
    : "rgba(248, 49, 37, 0.95)";

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
  }, 3000);
}

/**
 * Handle copy link action
 * @param {string} url - URL to copy
 */
async function handleCopyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard!", "success");
  } catch (error) {
    console.error("Failed to copy link:", error);
    // Fallback for older browsers
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

/**
 * Setup event handlers for tag overflow toggles
 * @param {HTMLElement} card - Card element
 */
function setupTagOverflowHandlers(card) {
  const toggleButtons = card.querySelectorAll(".tag-overflow-toggle");

  toggleButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card click event

      const targetId = button.dataset.target;
      const targetContent = card.querySelector(`#${targetId}`);
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      if (targetContent) {
        if (isExpanded) {
          // Collapse
          targetContent.style.display = "none";
          button.setAttribute("aria-expanded", "false");
          const hiddenCount =
            targetContent.querySelectorAll(".technique-tag").length;
          button.textContent = `+${hiddenCount} more`;
          button.setAttribute("aria-label", `Show ${hiddenCount} more tags`);
        } else {
          // Expand
          targetContent.style.display = "inline";
          button.setAttribute("aria-expanded", "true");
          button.textContent = "- show less";
          button.setAttribute("aria-label", "Show fewer tags");
        }
      }
    });
  });
}

/**
 * Check if click/keydown should open detail modal
 * Excludes clicks on buttons and tags
 * @param {Event} e - Click or keydown event
 * @returns {boolean} True if detail should open
 */
function shouldOpenDetail(e) {
  return (
    !e.target.closest(".btn") &&
    !e.target.closest(".tag") &&
    !e.target.closest(".badge") &&
    !e.target.closest(".technique-badge") &&
    !e.target.closest(".technique-tag") &&
    !e.target.closest(".tag-overflow-toggle") &&
    !e.target.closest(".kebab-menu")
  );
}

/**
 * Build card HTML content
 * @param {Object} params - Card rendering parameters
 * @returns {string} Card HTML string
 */
function buildCardHTML({
  primaryTag,
  categoryIcon,
  categoryAria,
  host,
  headingId,
  item,
  description,
}) {
  const techniqueTags = item.techniques?.length
    ? item.techniques
        .slice(0, 3)
        .map((t) => `<span class="technique-badge">${escapeHtml(t)}</span>`)
        .join("")
    : "";

  return `
    <figure class="card-media h-48">
      <img alt="" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-src="${screenshotURL(item.url)}">
      <div class="card-media-actions">
        <div class="dropdown dropdown-end">
          <button class="btn btn-xs btn-circle btn-ghost kebab-menu" aria-label="Card actions" aria-expanded="false" aria-haspopup="true">
            <span aria-hidden="true">⋮</span>
          </button>
          <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 kebab-dropdown" hidden>
            <button class="btn btn-ghost btn-sm justify-start kebab-item" data-action="regenerate" data-url="${item.url}">
              🔄 Regenerate AI Description
            </button>
            <button class="btn btn-ghost btn-sm justify-start kebab-item" data-action="copy-link" data-url="${item.url}">
              📋 Copy Link
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
           aria-describedby="${headingId}">Open ↗</a>
      </div>
    </div>
  `;
}

/**
 * Render detail chips (tags or techniques) in detail modal
 * @param {HTMLElement} container - Container element for chips
 * @param {Array<string>} items - Tag or technique names
 * @param {string} variant - Chip variant ('tag' or 'technique')
 */
export function renderDetailChips(container, items, variant) {
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement("span");
    empty.className = "detail-panel__empty";
    empty.textContent =
      variant === "technique"
        ? "Techniques will appear as annotations are added."
        : "Tags will populate soon.";
    container.appendChild(empty);
    return;
  }

  items.forEach((value) => {
    if (!value) return;
    const chip = document.createElement("span");
    chip.className =
      variant === "technique"
        ? "detail-panel__chip detail-panel__chip--muted"
        : "detail-panel__chip";
    chip.textContent = value;
    container.appendChild(chip);
  });
}

/**
 * Setup lazy loading for card images with fallbacks
 * Uses IntersectionObserver for performance
 */
export function setupLazyImages() {
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
    { rootMargin: "200px" },
  );

  imgs.forEach((img) => observer.observe(img));
}

/**
 * Load image with fallback chain
 * @param {HTMLImageElement} img - Image element to load
 */
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

/**
 * Handle image load errors with fallback chain
 * @param {HTMLImageElement} img - Failed image element
 * @param {HTMLElement} card - Parent card element
 */
function handleImageError(img, card) {
  const primaryUrl = card?.querySelector(".btn.btn-primary")?.href;
  if (!primaryUrl) return;

  // Fallback chain: thum.io → favicon
  img.onerror = () => {
    img.src = faviconURL(primaryUrl);
    if (card) card.classList.remove("loading");
  };
  img.src = screenshotFallback(primaryUrl);
}
