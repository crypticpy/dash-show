/**
 * Card Rendering Module
 * Handles card template creation, tag controls, chips, and lazy image loading.
 * Generates accessible card markup with proper ARIA attributes.
 */

import { escapeHtml, hostname, screenshotURL, screenshotFallback, faviconURL, $$ } from "./utils.js";

/**
 * Category icon mapping
 */
const CATEGORY_ICONS = {
  "Public CIP": "🏛️",
  "Power BI": "📊",
  "Portfolio Management": "💼",
  "Visualization Patterns": "✨",
  "Resource Recovery": "♻️",
  "Zero Waste": "♻️",
  "C&D Waste": "🏗️",
  "Green Halo": "🟢",
  "Policy Reference": "📑",
  Guidance: "🧭",
  "International Benchmark": "🌍",
  "National Policy": "🏛️",
  "Reference Data": "📓",
  "Municipal Program": "🏙️",
};

/**
 * Get icon for category tag
 * @param {string} tag - Category tag name
 * @returns {string} Icon emoji
 */
export function getCategoryIcon(tag) {
  return CATEGORY_ICONS[tag] || "📊";
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
  chip.dataset.tag = tagText;
  chip.setAttribute("aria-pressed", "false");

  const icon = document.createElement("span");
  icon.className = "chip-icon";
  icon.textContent = "✓ ";
  icon.style.display = "none";

  const label = document.createElement("span");
  label.textContent = tagText;

  chip.appendChild(icon);
  chip.appendChild(label);

  chip.addEventListener("click", () => {
    const pressed = chip.getAttribute("aria-pressed") === "true";
    chip.setAttribute("aria-pressed", String(!pressed));
    icon.style.display = pressed ? "none" : "inline";
    if (onToggle) onToggle();
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
export function populateTagControls(sites, chipsContainer, tagSelect, onChipToggle) {
  chipsContainer.innerHTML = "";
  tagSelect.innerHTML = "";

  // Add "All types" option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All types";
  tagSelect.appendChild(allOption);

  // Extract and sort unique tags
  const tags = Array.from(
    new Set(sites.flatMap((site) => site.tags || []))
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
    return tags.map(t => `<span class="technique-tag">${escapeHtml(t)}</span>`).join('');
  }

  const visible = tags.slice(0, maxVisible);
  const hidden = tags.slice(maxVisible);
  const overflowId = `overflow-${Math.random().toString(36).slice(2)}`;

  return `
    ${visible.map(t => `<span class="technique-tag">${escapeHtml(t)}</span>`).join('')}
    <button class="tag-overflow-toggle" data-target="${overflowId}" aria-expanded="false" aria-label="Show ${hidden.length} more tags">
      +${hidden.length} more
    </button>
    <div id="${overflowId}" class="tag-overflow-content" style="display:none;">
      ${hidden.map(t => `<span class="technique-tag">${escapeHtml(t)}</span>`).join('')}
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
  elm.className = "card loading";
  elm.dataset.tags = (item.tags || []).join("|").toLowerCase();
  elm.dataset.title = (item.title || "").toLowerCase();
  elm.dataset.domain = host.toLowerCase();
  elm.setAttribute("role", "article");
  elm.setAttribute("tabindex", "0");

  // Add click handlers for detail modal
  const handleClick = (e) => {
    if (shouldOpenDetail(e)) {
      handleCardClick(elm, item, e);
    }
  };

  elm.addEventListener("click", handleClick);
  elm.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && shouldOpenDetail(event)) {
      event.preventDefault();
      handleCardClick(elm, item, event);
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
  const kebabButton = card.querySelector('.kebab-menu');
  const kebabDropdown = card.querySelector('.kebab-dropdown');

  if (!kebabButton || !kebabDropdown) return;

  // Toggle dropdown
  kebabButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent card click event

    const isExpanded = kebabButton.getAttribute('aria-expanded') === 'true';

    // Close all other open kebab menus
    document.querySelectorAll('.kebab-menu[aria-expanded="true"]').forEach(btn => {
      if (btn !== kebabButton) {
        btn.setAttribute('aria-expanded', 'false');
        const dropdown = btn.nextElementSibling;
        if (dropdown) dropdown.hidden = true;
      }
    });

    // Toggle current menu
    kebabButton.setAttribute('aria-expanded', String(!isExpanded));
    kebabDropdown.hidden = isExpanded;
  });

  // Handle kebab menu item clicks
  const kebabItems = kebabDropdown.querySelectorAll('.kebab-item');
  kebabItems.forEach(menuItem => {
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();

      const action = menuItem.dataset.action;
      const url = menuItem.dataset.url;

      if (action === 'regenerate') {
        handleRegenerateDescription(card, item);
      } else if (action === 'copy-link') {
        handleCopyLink(url);
      }

      // Close dropdown after action
      kebabButton.setAttribute('aria-expanded', 'false');
      kebabDropdown.hidden = true;
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!card.contains(e.target)) {
      kebabButton.setAttribute('aria-expanded', 'false');
      kebabDropdown.hidden = true;
    }
  });

  // Close on Escape key
  kebabButton.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && kebabButton.getAttribute('aria-expanded') === 'true') {
      kebabButton.setAttribute('aria-expanded', 'false');
      kebabDropdown.hidden = true;
      kebabButton.focus();
    }
  });
}

/**
 * Handle regenerate AI description action
 * @param {HTMLElement} card - Card element
 * @param {Object} item - Site data object
 */
async function handleRegenerateDescription(card, item) {
  const blurbElement = card.querySelector('.blurb');
  if (!blurbElement) return;

  // Show loading state
  const originalText = blurbElement.textContent;
  blurbElement.textContent = 'Regenerating description...';
  blurbElement.style.fontStyle = 'italic';

  try {
    // Import API module dynamically to avoid circular dependencies
    const { fetchBlurb } = await import('./api.js');
    const newBlurb = await fetchBlurb(item.url);

    if (newBlurb) {
      blurbElement.textContent = newBlurb;
      blurbElement.style.fontStyle = 'normal';

      // Update the item data if possible
      if (item.description !== undefined) {
        item.description = newBlurb;
      }
    } else {
      blurbElement.textContent = originalText;
      blurbElement.style.fontStyle = 'normal';
      alert('Failed to regenerate description. Please try again.');
    }
  } catch (error) {
    console.error('Error regenerating description:', error);
    blurbElement.textContent = originalText;
    blurbElement.style.fontStyle = 'normal';
    alert('Error regenerating description. Please try again.');
  }
}

/**
 * Handle copy link action
 * @param {string} url - URL to copy
 */
async function handleCopyLink(url) {
  try {
    await navigator.clipboard.writeText(url);

    // Show success feedback
    const feedback = document.createElement('div');
    feedback.textContent = '✓ Link copied!';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-2);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  } catch (error) {
    console.error('Failed to copy link:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link. Please copy manually: ' + url);
    }
    textArea.remove();
  }
}

/**
 * Setup event handlers for tag overflow toggles
 * @param {HTMLElement} card - Card element
 */
function setupTagOverflowHandlers(card) {
  const toggleButtons = card.querySelectorAll('.tag-overflow-toggle');

  toggleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click event

      const targetId = button.dataset.target;
      const targetContent = card.querySelector(`#${targetId}`);
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      if (targetContent) {
        if (isExpanded) {
          // Collapse
          targetContent.style.display = 'none';
          button.setAttribute('aria-expanded', 'false');
          const hiddenCount = targetContent.querySelectorAll('.technique-tag').length;
          button.textContent = `+${hiddenCount} more`;
          button.setAttribute('aria-label', `Show ${hiddenCount} more tags`);
        } else {
          // Expand
          targetContent.style.display = 'inline';
          button.setAttribute('aria-expanded', 'true');
          button.textContent = '- show less';
          button.setAttribute('aria-label', 'Show fewer tags');
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
  const techniqueBadges = item.techniques?.length
    ? item.techniques
        .slice(0, 3)
        .map((t) => `<span class="technique-badge">${escapeHtml(t)}</span>`)
        .join("")
    : "";

  const techniqueTags = item.techniques?.length
    ? `<div class="techniques" aria-label="Key techniques demonstrated">
        ${renderTagsWithOverflow(item.techniques, 3)}
      </div>`
    : "";

  return `
    <header class="card-header">
      <span class="category-badge" aria-label="${categoryAria}">
        <span aria-hidden="true">${categoryIcon}</span>
        ${escapeHtml(primaryTag)}
      </span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="domain" aria-label="Domain: ${host}">${host}</span>
        <div class="card-actions">
          <button class="kebab-menu" aria-label="Card actions" aria-expanded="false" aria-haspopup="true">
            <span aria-hidden="true">⋮</span>
          </button>
          <div class="kebab-dropdown" hidden>
            <button class="kebab-item" data-action="regenerate" data-url="${item.url}">
              Regenerate AI Description
            </button>
            <button class="kebab-item" data-action="copy-link" data-url="${item.url}">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="thumb" role="img" aria-label="Screenshot of ${escapeHtml(item.title)}">
      <img alt="" loading="lazy" decoding="async" data-src="${screenshotURL(item.url)}">
      <div class="pattern-overlay" aria-hidden="true">
        ${techniqueBadges}
      </div>
      <span class="badge">${host}</span>
    </div>

    <section class="content">
      <h3 id="${headingId}">${escapeHtml(item.title)}</h3>
      <p class="blurb">${description}</p>
      ${techniqueTags}
    </section>

    <footer class="actions">
      <a class="btn primary" href="${item.url}" target="_blank" rel="noopener"
         aria-describedby="${headingId}">Open Dashboard ↗</a>
    </footer>
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
    empty.className = "detail-empty";
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
    chip.className = `detail-chip${variant === "technique" ? " technique" : ""}`;
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
    { rootMargin: "200px" }
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
  const primaryUrl = card?.querySelector(".btn.primary")?.href;
  if (!primaryUrl) return;

  // Fallback chain: thum.io → favicon
  img.onerror = () => {
    img.src = faviconURL(primaryUrl);
    if (card) card.classList.remove("loading");
  };
  img.src = screenshotFallback(primaryUrl);
}
