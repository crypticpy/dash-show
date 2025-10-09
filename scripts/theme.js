/**
 * Theme Management Module
 * Handles dark/light theme switching with persistence
 */

/**
 * Initialize theme system
 * Loads saved theme or detects system preference
 */
export function initTheme() {
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  // Load saved theme or detect system preference
  const savedTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'austinDark' : 'austinLight');

  setTheme(savedTheme);

  // Toggle theme on button click
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'austinDark' ? 'austinLight' : 'austinDark';
      setTheme(next);
    });
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually set a theme
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'austinDark' : 'austinLight');
    }
  });
}

/**
 * Set theme and update UI
 * @param {string} theme - Theme name ('austinDark' or 'austinLight')
 */
function setTheme(theme) {
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  // Update toggle button icon with smooth transition
  if (themeToggle) {
    const icons = themeToggle.querySelectorAll('[data-theme-icon]');
    icons.forEach((icon) => {
      const target = icon.getAttribute('data-theme-icon');
      const shouldShow =
        (theme === 'austinDark' && target === 'dark') ||
        (theme === 'austinLight' && target === 'light');
      icon.classList.toggle('hidden', !shouldShow);
    });
    themeToggle.setAttribute('aria-pressed', theme === 'austinLight');
  }

  // Add smooth color transition to root element
  if (!html.style.transition) {
    html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }
}

/**
 * Get current theme
 * @returns {string} Current theme name
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'austinDark';
}
