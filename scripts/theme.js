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

  // Set initial theme without feedback animation
  setTheme(savedTheme, false);

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
      // Don't show feedback for automatic system theme changes
      setTheme(e.matches ? 'austinDark' : 'austinLight', false);
    }
  });
}

/**
 * Set theme and update UI
 * @param {string} theme - Theme name ('austinDark' or 'austinLight')
 * @param {boolean} showFeedback - Whether to show visual feedback (default: true)
 */
function setTheme(theme, showFeedback = true) {
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  // Add visual feedback if this is a user-initiated change
  if (showFeedback) {
    showThemeTransition(theme);
  }

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

    // Add button pulse animation
    if (showFeedback) {
      themeToggle.style.transform = 'scale(0.92)';
      setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
      }, 150);
    }
  }

  // Add smooth color transition to root element
  if (!html.style.transition) {
    html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }
}

/**
 * Show visual feedback during theme transition
 * @param {string} theme - Theme name being switched to
 */
function showThemeTransition(theme) {
  // Create transition overlay
  const overlay = document.createElement('div');
  overlay.className = 'theme-transition-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  // Set overlay background based on target theme
  const isDark = theme === 'austinDark';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    background: ${isDark ? 'rgba(22, 27, 55, 0.15)' : 'rgba(255, 255, 255, 0.15)'};
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(overlay);

  // Trigger animation
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }, 150);
  });

  // Show toast notification
  showThemeToast(theme);
}

/**
 * Show toast notification for theme change
 * @param {string} theme - Theme name being switched to
 */
function showThemeToast(theme) {
  const isDark = theme === 'austinDark';
  const message = isDark ? 'Dark theme activated' : 'Light theme activated';
  const icon = isDark ? '🌙' : '☀️';

  // Remove existing toast if any
  const existingToast = document.getElementById('theme-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement('div');
  toast.id = 'theme-toast';
  toast.className = 'theme-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    background: ${isDark
      ? 'linear-gradient(135deg, rgba(34, 37, 78, 0.95) 0%, rgba(24, 27, 51, 0.92) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 246, 245, 0.92) 100%)'
    };
    color: ${isDark ? 'rgba(220, 242, 253, 0.92)' : 'rgba(22, 27, 55, 0.92)'};
    border: 1px solid ${isDark ? 'rgba(0, 156, 222, 0.3)' : 'rgba(68, 73, 156, 0.2)'};
    box-shadow: 0 12px 28px ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(34, 37, 78, 0.2)'};
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    z-index: 10000;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    // Animate out after 3 seconds (extended for screen reader users)
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  });
}

/**
 * Get current theme
 * @returns {string} Current theme name
 */
export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'austinDark';
}
