/* ============================================================
   THEME.JS — Dark/Light Mode Management (Dark-First Default)
   Ledger Fintech SaaS Platform
   ============================================================ */

var THEME_STORAGE_KEY = "expense-tracker-theme";
if (typeof window !== "undefined") window.THEME_STORAGE_KEY = THEME_STORAGE_KEY;

/**
 * Initializes the theme based on user's saved preference or dark-first default.
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  applyTheme(savedTheme);

  const toggleButtons = document.querySelectorAll(".theme-toggle-btn");
  toggleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  });
}

/**
 * Applies the requested theme to document and updates UI indicators.
 * @param {string} theme 'dark' | 'light'
 */
function applyTheme(theme) {
  const targetTheme = (theme === "light") ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", targetTheme);
  localStorage.setItem(THEME_STORAGE_KEY, targetTheme);

  // Update theme toggle buttons (icons & labels)
  const toggleButtons = document.querySelectorAll(".theme-toggle-btn");
  toggleButtons.forEach(btn => {
    const iconSpan = btn.querySelector(".theme-icon");
    const textSpan = btn.querySelector(".theme-text");
    
    if (targetTheme === "dark") {
      btn.setAttribute("aria-label", "Switch to Light Theme");
      btn.setAttribute("title", "Switch to Light Mode");
      if (iconSpan) iconSpan.innerHTML = `<i data-lucide="sun"></i>`;
      if (textSpan) textSpan.textContent = "Light Mode";
    } else {
      btn.setAttribute("aria-label", "Switch to Dark Theme");
      btn.setAttribute("title", "Switch to Dark Mode");
      if (iconSpan) iconSpan.innerHTML = `<i data-lucide="moon"></i>`;
      if (textSpan) textSpan.textContent = "Dark Mode";
    }
  });

  // Reinitialize Lucide icons if available
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }

  // Refresh charts with updated theme colors if already loaded
  if (typeof refreshAllCharts === "function") {
    refreshAllCharts();
  }
}
