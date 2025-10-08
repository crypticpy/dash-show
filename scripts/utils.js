/**
 * Core Utility Functions
 * Provides fundamental DOM selectors and string manipulation utilities.
 * Zero dependencies - pure JavaScript helpers.
 */

/**
 * Select a single element from the DOM
 * @param {string} sel - CSS selector string
 * @param {Element|Document} el - Root element to search from (defaults to document)
 * @returns {Element|null} First matching element or null
 */
export const $ = (sel, el = document) => el.querySelector(sel);

/**
 * Select all matching elements from the DOM
 * @param {string} sel - CSS selector string
 * @param {Element|Document} el - Root element to search from (defaults to document)
 * @returns {Array<Element>} Array of matching elements
 */
export const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} s - String to escape
 * @returns {string} HTML-safe string
 */
export function escapeHtml(s = "") {
  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (m) => escapeMap[m]);
}

/**
 * Truncate string to specified length with ellipsis
 * @param {string} s - String to truncate
 * @param {number} n - Maximum length (default: 260)
 * @returns {string} Truncated string with ellipsis or original if under limit
 */
export const truncate = (s, n = 260) =>
  s && s.length > n ? s.slice(0, n - 1) + "…" : s || "";

/**
 * Extract hostname from URL, removing www prefix
 * @param {string} url - Full URL string
 * @returns {string} Clean hostname or original URL if parsing fails
 */
export const hostname = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * Generate screenshot URL using WordPress mShots service
 * @param {string} url - Target URL to screenshot
 * @param {number} width - Screenshot width in pixels (default: 640)
 * @returns {string} Screenshot service URL
 */
export const screenshotURL = (url, width = 640) =>
  `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${width}`;

/**
 * Generate fallback screenshot URL using thum.io service
 * @param {string} url - Target URL to screenshot
 * @returns {string} Fallback screenshot service URL
 */
export const screenshotFallback = (url) =>
  `https://image.thum.io/get/width/1200/crop/900/${url}`;

/**
 * Generate favicon URL for a given domain
 * @param {string} url - Full URL to extract domain from
 * @returns {string} Google favicon service URL
 */
export const faviconURL = (url) => {
  const host = hostname(url);
  return `https://www.google.com/s2/favicons?domain=${host}&sz=256`;
};

/**
 * Generate proxied readable URL using Jina Reader to bypass CORS
 * @param {string} url - Original URL
 * @returns {string} Proxied URL for content extraction
 */
export const proxiedReadableURL = (url) => {
  const clean = url.replace(/^https?:\/\//, "");
  return `https://r.jina.ai/http://${clean}`;
};
