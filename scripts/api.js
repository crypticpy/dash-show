/**
 * API Integration Module
 * Handles data fetching, caching, and blurb hydration from external sources.
 * Manages localStorage cache with TTL and proxied content retrieval.
 */

import { proxiedReadableURL, truncate, $ } from "./utils.js";

// Cache configuration
const CACHE_KEY = "pp-showcase-blurbs-v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// In-memory cache object
const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

/**
 * Persist current cache state to localStorage
 */
function saveCache() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/**
 * Fetch and extract blurb text from a URL with caching
 * Uses Jina Reader proxy to bypass CORS restrictions
 * @param {string} url - Target URL to fetch blurb from
 * @returns {Promise<string>} Extracted blurb text or empty string on failure
 */
export async function fetchBlurb(url) {
  // Check cache first
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

/**
 * Extract meaningful text content from parsed HTML document
 * Prioritizes paragraphs with substantial content, filters out noise
 * @param {Document} doc - Parsed HTML document
 * @returns {string} Extracted blurb text
 */
function extractBlurbFromDocument(doc) {
  // Try to find meaningful paragraphs first
  const paragraphs = Array.from(doc.querySelectorAll("p"))
    .map((p) => (p.textContent || "").trim())
    .filter((t) => {
      const wordCount = t.split(/\s+/).length;
      const hasNoise = /cookie|javascript|enable|subscribe|sign in|accept/i.test(t);
      return wordCount >= 10 && !hasNoise;
    });

  if (paragraphs.length) {
    return paragraphs[0];
  }

  // Fallback: extract first substantial text block from body
  const bodyText = (doc.body?.textContent || "").trim();
  const textBlocks = bodyText.split(/\n{2,}/);
  const substantialBlock = textBlocks.find((s) => s.trim().length > 80);

  return substantialBlock || "";
}

/**
 * Hydrate all card blurbs with fetched content
 * Updates each card's blurb element with extracted text or error message
 * @param {Function} onProgress - Callback fired after each fetch (current, total)
 * @returns {Promise<void>}
 */
export async function hydrateBlurbs(onProgress) {
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
      blurbEl.innerHTML =
        '<span class="notice">Blurb unavailable (site blocked or no readable text).</span>';
    }

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }
}

/**
 * Clear all cached blurb data
 * Removes from both localStorage and in-memory cache
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  Object.keys(cache).forEach((k) => delete cache[k]);
}

/**
 * Get cache statistics
 * @returns {Object} Cache info with entry count and size estimate
 */
export function getCacheInfo() {
  const keys = Object.keys(cache);
  return {
    entryCount: keys.length,
    sizeEstimate: JSON.stringify(cache).length,
  };
}
