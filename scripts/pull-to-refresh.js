/**
 * Pull-to-Refresh Module
 * Implements pull-to-refresh gesture for mobile devices
 */

const PULL_THRESHOLD = 80; // Distance in pixels to trigger refresh
const MAX_PULL = 120; // Maximum pull distance
const RESISTANCE = 2.5; // Pull resistance factor

let pullStartY = 0;
let pullCurrentY = 0;
let pulling = false;
let refreshing = false;
let indicator = null;

/**
 * Initialize pull-to-refresh functionality
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.element - Element to attach pull-to-refresh to
 * @param {Function} options.onRefresh - Callback function when refresh is triggered
 * @returns {Function} Cleanup function to remove event listeners
 */
export function initPullToRefresh({ element, onRefresh }) {
  if (!element || typeof onRefresh !== 'function') {
    console.error('Pull-to-refresh requires element and onRefresh callback');
    return () => {};
  }

  // Create refresh indicator
  indicator = createRefreshIndicator();
  document.body.appendChild(indicator);

  const handleTouchStart = (e) => {
    // Only start pull if we're at the top of the page
    if (window.scrollY > 0 || refreshing) {
      return;
    }

    pullStartY = e.touches[0].clientY;
    pulling = false;
  };

  const handleTouchMove = (e) => {
    // Only track pull if we started at the top
    if (pullStartY === 0 || window.scrollY > 0 || refreshing) {
      return;
    }

    pullCurrentY = e.touches[0].clientY;
    const pullDistance = pullCurrentY - pullStartY;

    // Only activate pull if dragging downward
    if (pullDistance > 0) {
      pulling = true;

      // Apply resistance to create natural feel
      const resistedDistance = Math.min(pullDistance / RESISTANCE, MAX_PULL);

      // Update indicator
      updateIndicator(resistedDistance);

      // Prevent default scrolling when pulling
      if (resistedDistance > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling || refreshing) {
      pullStartY = 0;
      pullCurrentY = 0;
      pulling = false;
      return;
    }

    const pullDistance = (pullCurrentY - pullStartY) / RESISTANCE;

    if (pullDistance >= PULL_THRESHOLD) {
      // Trigger refresh
      refreshing = true;
      triggerRefresh(onRefresh);
    } else {
      // Reset indicator
      hideIndicator();
    }

    pullStartY = 0;
    pullCurrentY = 0;
    pulling = false;
  };

  // Attach event listeners (non-passive for touchmove to allow preventDefault)
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    if (indicator && indicator.parentNode) {
      indicator.remove();
    }
  };
}

/**
 * Create the refresh indicator element
 * @returns {HTMLElement} The indicator element
 */
function createRefreshIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'pull-refresh-indicator';
  indicator.className = 'pull-refresh-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  indicator.innerHTML = `
    <div class="pull-refresh-spinner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>
    </div>
  `;

  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 50%;
    transform: translate(-50%, -100%);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(68, 73, 156, 0.95) 0%, rgba(0, 156, 222, 0.85) 100%);
    box-shadow: 0 8px 20px rgba(68, 73, 156, 0.3);
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
  `;

  return indicator;
}

/**
 * Update indicator position and rotation based on pull distance
 * @param {number} distance - Current pull distance
 */
function updateIndicator(distance) {
  if (!indicator) return;

  const progress = Math.min(distance / PULL_THRESHOLD, 1);
  const translateY = distance;
  const rotation = progress * 360;
  const opacity = Math.min(progress * 1.5, 1);

  indicator.style.opacity = opacity;
  indicator.style.transform = `translate(-50%, ${translateY - 48}px)`;

  const spinner = indicator.querySelector('.pull-refresh-spinner svg');
  if (spinner) {
    spinner.style.transform = `rotate(${rotation}deg)`;
    spinner.style.transition = 'transform 0.1s ease';
  }
}

/**
 * Trigger the refresh action
 * @param {Function} onRefresh - Callback function to execute
 */
async function triggerRefresh(onRefresh) {
  if (!indicator) return;

  // Show indicator at fixed position
  indicator.style.transform = 'translate(-50%, 16px)';
  indicator.style.opacity = '1';
  indicator.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';

  // Add spinning animation
  const spinner = indicator.querySelector('.pull-refresh-spinner svg');
  if (spinner) {
    spinner.style.animation = 'pull-refresh-spin 0.8s linear infinite';
  }

  try {
    // Execute refresh callback
    await onRefresh();
  } catch (error) {
    console.error('Pull-to-refresh error:', error);
  } finally {
    // Hide indicator after refresh completes
    setTimeout(() => {
      hideIndicator();
      refreshing = false;
    }, 600);
  }
}

/**
 * Hide the refresh indicator
 */
function hideIndicator() {
  if (!indicator) return;

  indicator.style.opacity = '0';
  indicator.style.transform = 'translate(-50%, -100%)';
  indicator.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  const spinner = indicator.querySelector('.pull-refresh-spinner svg');
  if (spinner) {
    spinner.style.animation = '';
    spinner.style.transform = 'rotate(0deg)';
  }
}
