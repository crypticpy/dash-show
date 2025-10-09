/**
 * Learning Mode Module
 * Manages the learning panel overlay with role-specific content.
 * Handles role switching, notes persistence, printing, and onboarding flow.
 */

import { $, $$, escapeHtml } from "./utils.js";
import {
  getCurrentRole,
  setCurrentRole,
  getNotes,
  saveNotes,
} from "./state.js";
import { hasSeenOnboarding, markOnboardingSeen } from "./state.js";

// Focusable selector for keyboard navigation
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Role configuration content
const ROLE_CONTENT = {
  student: {
    tip: "Participant tip: open Learning Mode to follow guided prompts and print your personal study sheet.",
    buttonInactive: "📚 Participant Learning Mode",
    buttonActive: "📚 Exit Participant Mode",
    buttonAria: "Toggle participant learning mode overlay",
    printLabel: "🖨️ Print participant guide",
    printAria: "Print the participant review guide",
    printTitle: "Participant Review Guide",
    sections: [
      {
        title: "🎯 Study Rhythm",
        description:
          "Use this loop each time you explore a dashboard exemplar.",
        items: [
          "☐ Identify the audience and the single decision this view should unlock.",
          "☐ Summarize the prioritization story in one sentence—does the evidence back it up?",
          "☐ Trace each score or status back to its source; capture any data gaps.",
          "☐ Note one design move to reuse and one caveat to watch for in your own work.",
        ],
      },
      {
        title: "🏙️ Public CIP Dashboards — Participant Lens",
        description:
          "Look for signals that help residents and leaders understand capital tradeoffs.",
        items: [
          "☐ Map funding phases to timeline and geography to confirm equity of coverage.",
          "☐ Check whether project categories explain who benefits and when.",
          "☐ Observe how risk, delays, and budget pressure surface in the story.",
          "☐ List transparency cues you would expect if you were a community member.",
        ],
      },
      {
        title: "🏢 Portfolio & Product Tools — Participant Lens",
        description:
          "Study how product teams frame prioritization logic and scenario planning.",
        items: [
          "☐ Decode the scoring formula: inputs, weights, and refresh cadence.",
          "☐ Watch for signals about capacity, dependencies, or sequencing choices.",
          "☐ Evaluate how easy it is to compare options and spot tradeoffs quickly.",
          "☐ Translate jargon—could your teammates understand this framing without help?",
        ],
      },
      {
        title: "📊 Visualization Patterns & Power BI",
        description:
          "Pay attention to interaction design and the path from question to action.",
        items: [
          "☐ Follow the eye path—does the layout guide question → insight → action?",
          "☐ Test filters and tooltips to see if they reveal trustworthy context.",
          "☐ Evaluate color, legend, and annotation clarity for accessibility.",
          "☐ Check the view on smaller screens if responsiveness matters.",
        ],
      },
      {
        title: "🧠 Reflection Prompts",
        description:
          "Turn observations into experiments for your own coursework or projects.",
        items: [
          "• What surprised you about how this organization communicates priority?",
          "• Which chart, phrase, or scoring idea would improve your storytelling immediately?",
          "• Where would you ask for more evidence before making a decision?",
          "• What follow-up research or partner conversation does this exemplar spark?",
        ],
      },
    ],
    notes: {
      title: "✍️ Field Notes",
      description:
        "Capture observations, follow-up questions, and ideas to test with your team.",
      placeholder: "Capture observations, follow-up questions, next actions…",
    },
  },
  coach: {
    tip: "Coach tip: open Learning Mode to access facilitation checklists and a printable workshop playbook.",
    buttonInactive: "📚 Coach Playbook Mode",
    buttonActive: "📚 Exit Coach Mode",
    buttonAria: "Toggle coach learning mode overlay",
    printLabel: "🖨️ Print coach playbook",
    printAria: "Print the coaching workshop guide",
    printTitle: "Coaching Workshop Guide",
    sections: [
      {
        title: "🎯 Facilitation Rhythm",
        description:
          "Use this sequence when guiding teams through an exemplar.",
        items: [
          "☐ Clarify the session objective and the decision skill you are reinforcing.",
          "☐ Preview what good evidence looks like before the group explores the dashboard.",
          "☐ Surface blind spots by asking whose needs or tradeoffs are implied.",
          "☐ Close by translating insights into an experiment or commitment for the team.",
        ],
      },
      {
        title: "🏙️ Public CIP Dashboards — Coaching Focus",
        description:
          "Equip civic teams to communicate transparency and accountability.",
        items: [
          "☐ Compare budget, schedule, and geography—what must leaders explain in public?",
          "☐ Highlight how risk, delays, or equity tradeoffs appear (or fail to appear).",
          "☐ Capture questions residents, council members, or media would still ask.",
          "☐ Plan a follow-up artifact to extend the conversation after the workshop.",
        ],
      },
      {
        title: "🏢 Portfolio & Product Tools — Coaching Focus",
        description:
          "Model how to translate vendor frameworks into your organization's language.",
        items: [
          "☐ Reverse-engineer the scoring rubric and align it with your portfolio taxonomy.",
          "☐ Demonstrate how to facilitate prioritization when data quality is uncertain.",
          "☐ Identify opportunities to add scenario planning or dependency mapping discussions.",
          "☐ Draft a prompt that ties metrics back to strategic outcomes for leadership.",
        ],
      },
      {
        title: "📊 Visualization Patterns — Workshop Callouts",
        description:
          "Prepare teaching moments that connect design choices to stakeholder impact.",
        items: [
          "☐ Spotlight design moves that make tradeoffs and risk unmistakable.",
          "☐ Offer an alternative framing if the chart over-promises certainty.",
          "☐ Note which visuals are easiest to repurpose for stakeholder briefings.",
          "☐ Flag accessibility gaps your teams should avoid when templating dashboards.",
        ],
      },
      {
        title: "🧠 Coaching Prompts",
        description:
          "Guide facilitators as they adapt the exemplar to their teams.",
        items: [
          "• How will you adapt this exemplar for a live working session?",
          "• Where might teams misinterpret the scoring story without facilitation?",
          "• Which partners or datasets must you involve to mirror this level of rigor?",
          "• What follow-on assignment keeps momentum after the workshop?",
        ],
      },
    ],
    notes: {
      title: "🗂️ Facilitation Plan",
      description:
        "Outline logistics, owners, and follow-ups for your coaching sessions.",
      placeholder: "Outline facilitation moves, owners, and follow-up actions…",
    },
  },
};

/**
 * Get role configuration object
 * @param {string} role - Role name ('student' or 'coach')
 * @returns {Object} Role configuration
 */
export function getRoleConfig(role) {
  return ROLE_CONTENT[role] || ROLE_CONTENT.student;
}

/**
 * Render learning sections for current role
 * @param {Object} config - Role configuration
 * @param {HTMLElement} container - Container element
 */
export function renderLearningSections(config, container) {
  if (!container) return;
  container.innerHTML = "";

  config.sections.forEach((section) => {
    const sectionEl = createSectionElement(section);
    container.appendChild(sectionEl);
  });

  // Notes section removed per user request
}

/**
 * Create section element
 * @param {Object} section - Section data
 * @returns {HTMLElement} Section element
 */
function createSectionElement(section) {
  const sectionEl = document.createElement("div");
  sectionEl.className = "learning-card";

  const heading = document.createElement("h4");
  heading.className = "learning-card__title";
  heading.textContent = section.title;
  sectionEl.appendChild(heading);

  if (section.description) {
    const para = document.createElement("p");
    para.className = "learning-card__subtitle";
    para.textContent = section.description;
    sectionEl.appendChild(para);
  }

  if (Array.isArray(section.items) && section.items.length) {
    const list = document.createElement("ul");
    list.className = "learning-card__list";
    section.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "learning-card__item";
      li.textContent = item;
      list.appendChild(li);
    });
    sectionEl.appendChild(list);
  }

  return sectionEl;
}

/**
 * Create notes section element
 * @param {Object} notesConfig - Notes configuration
 * @returns {HTMLElement} Notes section element
 */
function createNotesSection(notesConfig) {
  const notesSection = document.createElement("div");
  notesSection.className = "learning-card learning-notes";

  const heading = document.createElement("h4");
  heading.className = "learning-card__title";
  heading.textContent = notesConfig.title;
  notesSection.appendChild(heading);

  if (notesConfig.description) {
    const para = document.createElement("p");
    para.className = "learning-card__subtitle";
    para.textContent = notesConfig.description;
    notesSection.appendChild(para);
  }

  const textarea = document.createElement("textarea");
  textarea.id = "reviewNotes";
  textarea.className = "learning-notes__field";
  textarea.placeholder = notesConfig.placeholder || "";
  notesSection.appendChild(textarea);

  return notesSection;
}

/**
 * Setup notes persistence for current role
 * @param {string} role - Current role
 */
export function setupNotesPersistence(role) {
  // Notes feature removed per user request
  return;
}

/**
 * Render role-specific content
 * @param {string} role - Role to render
 * @param {boolean} learningModeActive - Whether learning mode is active
 * @param {Object} elements - DOM elements
 */
export function renderRole(role, learningModeActive, elements) {
  const config = getRoleConfig(role);

  if (elements.tip) {
    elements.tip.textContent = config.tip;
  }

  if (elements.printBtn) {
    const ariaLabel = config.printAria || "Print Learning Guide";
    elements.printBtn.setAttribute("aria-label", ariaLabel);
    elements.printBtn.title = config.printTooltip || ariaLabel;
  }

  if (elements.printTooltip) {
    elements.printTooltip.setAttribute(
      "data-tip",
      config.printTooltip || "Print Learning Guide",
    );
  }

  if (elements.roleSubtitle) {
    elements.roleSubtitle.textContent =
      config.panelSubtitle || config.printTitle || "Learning Guide";
  }

  renderLearningSections(config, elements.checklistContent);
  setupNotesPersistence(role);
  setLearningButtonState(
    learningModeActive,
    role,
    elements.learningBtn,
    elements.learningBtnTooltip,
  );
}

/**
 * Update learning button state and label
 * @param {boolean} active - Whether learning mode is active
 * @param {string} role - Current role
 * @param {HTMLElement} button - Learning button element
 */
function setLearningButtonState(active, role, button, tooltip) {
  if (!button) return;

  const ariaLabel = "Print Learning Guide";
  button.setAttribute("aria-label", ariaLabel);
  button.setAttribute("title", ariaLabel);
  button.setAttribute("aria-expanded", String(active));

  if (tooltip) {
    tooltip.setAttribute("data-tip", ariaLabel);
  }
}

/**
 * Print learning checklist
 * @param {string} role - Current role
 * @param {HTMLElement} checklistContent - Checklist content element
 */
export function printChecklist(role, checklistContent) {
  const config = getRoleConfig(role);
  const win = window.open("", "_blank");
  if (!win) return;

  const printable = checklistContent.cloneNode(true);

  const printableTitle =
    config.printTitle || "Prioritization Visualization Review Guide";

  win.document
    .write(`<!DOCTYPE html><html><head><title>${escapeHtml(printableTitle)}</title>
    <style>
      body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; margin:40px; color:#1f2937;}
      h1{font-size:22px; margin-bottom:12px;}
      h4{margin:24px 0 8px; font-size:16px; color:#111827;}
      ul{margin:0 0 12px 20px; padding:0;}
      li{margin-bottom:6px; font-size:13px; line-height:1.4;}
      p{font-size:13px; color:#4b5563; margin:0 0 12px;}
    </style>
  </head><body>
    <h1>${escapeHtml(printableTitle)}</h1>
    ${printable.innerHTML}
  </body></html>`);

  win.document.close();
  win.focus();
  win.print();
}

/**
 * Create learning panel handlers
 * @param {Object} elements - DOM elements
 * @returns {Object} State and handlers
 */
export function createLearningHandlers(elements) {
  let learningMode = false;
  let lastFocusedElement = null;

  const focusFirstElement = () => {
    if (!elements.overlay) return;

    const focusable = $$(FOCUSABLE_SELECTOR, elements.overlay).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.getAttribute("tabindex") !== "-1" &&
        el.getAttribute("aria-hidden") !== "true",
    );

    const target = focusable[0] || elements.panel;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  };

  const handleKeydown = (event) => {
    if (!learningMode || !elements.overlay) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLearningPanel();
      return;
    }

    if (event.key === "Tab") {
      trapFocus(event, elements.overlay, elements.panel);
    }
  };

  const openLearningPanel = () => {
    if (!elements.overlay || !elements.panel) return;

    learningMode = true;

    lastFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Use DaisyUI modal API
    elements.overlay.showModal();

    focusFirstElement();
    document.addEventListener("keydown", handleKeydown);

    const role = getCurrentRole();
    setLearningButtonState(
      true,
      role,
      elements.learningBtn,
      elements.learningBtnTooltip,
    );
  };

  const closeLearningPanel = () => {
    if (!elements.overlay || !elements.panel || !elements.overlay.open) return;

    learningMode = false;

    // Use DaisyUI modal API
    elements.overlay.close();

    document.removeEventListener("keydown", handleKeydown);

    const role = getCurrentRole();
    setLearningButtonState(
      false,
      role,
      elements.learningBtn,
      elements.learningBtnTooltip,
    );

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    } else if (elements.learningBtn) {
      elements.learningBtn.focus();
    }

    lastFocusedElement = null;
  };

  const toggleLearningPanel = () => {
    learningMode ? closeLearningPanel() : openLearningPanel();
  };

  return {
    openLearningPanel,
    closeLearningPanel,
    toggleLearningPanel,
    isActive: () => learningMode,
  };
}

/**
 * Trap focus within container
 * @param {KeyboardEvent} event - Keyboard event
 * @param {HTMLElement} container - Focus container
 * @param {HTMLElement} fallback - Fallback element
 */
function trapFocus(event, container, fallback) {
  const focusable = $$(FOCUSABLE_SELECTOR, container).filter(
    (el) =>
      !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );

  if (focusable.length === 0) {
    event.preventDefault();
    if (fallback) fallback.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = document.activeElement;

  if (event.shiftKey && current === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && current === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Onboarding flow configuration
 */
const ONBOARDING_STEPS = [
  {
    icon: "🏛️",
    title: "Welcome, Data Practitioners!",
    description:
      "Discover how municipalities and organizations worldwide are visualizing complex data to inform decisions, engage communities, and tell compelling stories. This curated collection features 70+ real-world examples—from capital improvement programs to resource recovery dashboards—designed to inspire your next project.",
  },
  {
    icon: "🔍",
    title: "Research, Compare, Learn",
    description:
      "Designed for municipal workers, analysts, and coaches who want to see how peers are solving similar data challenges.",
    features: [
      {
        icon: "📚",
        title: "Learning Mode",
        description: "Get guided prompts and create a personal study guide",
      },
      {
        icon: "🔍",
        title: "Smart Filters",
        description: "Filter by tags, categories, and visualization techniques",
      },
      {
        icon: "🎯",
        title: "Detailed Analysis",
        description:
          "Click any dashboard for in-depth information and insights",
      },
    ],
  },
  {
    icon: "💡",
    title: "Find Your Inspiration",
    description:
      "Whether you're building a CIP tracker, performance dashboard, or community engagement tool—explore how others have approached similar challenges. Click any example to dive deeper, or use filters to find dashboards relevant to your work.",
  },
];

/**
 * Create onboarding handlers
 * @param {Object} elements - Onboarding DOM elements
 * @returns {Object} Onboarding handlers
 */
export function createOnboardingHandlers(elements) {
  let currentStep = 1;
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 75; // Minimum swipe distance in pixels

  const handleSwipe = () => {
    const swipeDistance = touchStartX - touchEndX;

    // Swipe left - go to next step
    if (swipeDistance > SWIPE_THRESHOLD && currentStep < ONBOARDING_STEPS.length) {
      currentStep++;
      renderStep(currentStep);
    }

    // Swipe right - go to previous step
    if (swipeDistance < -SWIPE_THRESHOLD && currentStep > 1) {
      currentStep--;
      renderStep(currentStep);
    }
  };

  const renderStep = (step) => {
    if (!elements.content) return;

    const stepData = ONBOARDING_STEPS[step - 1];
    if (!stepData) return;

    elements.content.innerHTML = buildOnboardingHTML(stepData, step);
    attachStepListeners();
    attachSwipeListeners();
  };

  const showOnboarding = () => {
    if (!elements.overlay) return;
    currentStep = 1;
    renderStep(1);
    elements.overlay.showModal();
  };

  const hideOnboarding = (markAsSeen = true) => {
    if (!elements.overlay || !elements.overlay.open) return;
    elements.overlay.close();
    if (markAsSeen) {
      markOnboardingSeen();
    }
  };

  const attachStepListeners = () => {
    const nextBtn = $("#onboardingNext");
    const prevBtn = $("#onboardingPrev");
    const skipBtn = $("#onboardingSkip");
    const startBtn = $("#onboardingStart");

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentStep++;
        renderStep(currentStep);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentStep--;
        renderStep(currentStep);
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener("click", () => hideOnboarding(true));
    }

    if (startBtn) {
      startBtn.addEventListener("click", () => hideOnboarding(true));
    }
  };

  const attachSwipeListeners = () => {
    if (!elements.content) return;

    // Remove existing listeners to prevent duplicates
    elements.content.removeEventListener("touchstart", handleTouchStart);
    elements.content.removeEventListener("touchend", handleTouchEnd);

    // Add new listeners
    elements.content.addEventListener("touchstart", handleTouchStart, { passive: true });
    elements.content.addEventListener("touchend", handleTouchEnd, { passive: true });
  };

  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  };

  return {
    showOnboarding,
    hideOnboarding,
  };
}

/**
 * Build onboarding HTML for step
 * @param {Object} stepData - Step data
 * @param {number} step - Current step number
 * @returns {string} HTML string
 */
function buildOnboardingHTML(stepData, step) {
  let html = `
    <div class="space-y-6" data-step="${step}">
      <div class="text-center">
        <div class="text-6xl mb-4">${stepData.icon}</div>
        <h2 class="text-2xl font-bold mb-3">${stepData.title}</h2>
        <p class="text-base-content/70">${stepData.description}</p>
      </div>
  `;

  if (stepData.features) {
    html += '<div class="space-y-4 mt-6">';
    stepData.features.forEach((feature) => {
      html += `
        <div class="flex gap-4 items-start bg-base-200 rounded-lg p-4">
          <div class="text-3xl">${feature.icon}</div>
          <div class="flex-1">
            <h3 class="font-semibold mb-1">${feature.title}</h3>
            <p class="text-sm text-base-content/70">${feature.description}</p>
          </div>
        </div>
      `;
    });
    html += "</div>";
  }

  html += '<div class="flex justify-center gap-2 mt-6">';
  for (let i = 1; i <= ONBOARDING_STEPS.length; i++) {
    html += `<div class="w-2 h-2 rounded-full ${i === step ? "bg-primary" : "bg-base-300"}"></div>`;
  }
  html += "</div>";

  // Add swipe hint for mobile
  html += '<div class="text-center mt-4 text-xs text-base-content/60 lg:hidden">';
  if (step > 1 && step < ONBOARDING_STEPS.length) {
    html += '← Swipe to navigate →';
  } else if (step === 1) {
    html += 'Swipe left to continue →';
  } else {
    html += '← Swipe to go back';
  }
  html += '</div>';

  html += '<div class="flex justify-between gap-2 mt-8">';
  if (step > 1) {
    html += '<button class="btn btn-ghost min-h-[44px] min-w-[44px] px-6" id="onboardingPrev" aria-label="Go to previous step">← Back</button>';
  } else {
    html += "<div></div>";
  }
  if (step < ONBOARDING_STEPS.length) {
    html += '<div class="flex gap-2">';
    html += '<button class="btn btn-ghost min-h-[44px] min-w-[44px] px-6" id="onboardingSkip" aria-label="Skip onboarding">Skip</button>';
    html +=
      '<button class="btn btn-primary min-h-[44px] min-w-[44px] px-6" id="onboardingNext" aria-label="Go to next step">Next →</button>';
    html += "</div>";
  } else {
    html +=
      '<button class="btn btn-primary min-h-[44px] min-w-[100px] px-6" id="onboardingStart" aria-label="Close onboarding and get started">Get Started!</button>';
  }
  html += "</div></div>";

  return html;
}
