/* ============================================================
   MAIN.JS — Application Orchestration & Event Binding
   Ledger Fintech SaaS Platform
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Theme (dark-first)
  initializeTheme();

  // 2. Initialize State from Storage
  initializeTransactions();

  // 3. Initialize Lucide Icons
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }

  // 4. Setup View Routing & Navigation
  setupNavigation();

  // 5. Setup Modal & Form Handlers
  setupTransactionModal();

  // 6. Setup Transactions Page Filter Listeners
  setupTransactionFilters();

  // 7. Setup Overview Cash Flow Range Buttons
  setupOverviewControls();

  // 8. Setup Settings Page Handlers
  setupSettingsHandlers();

  // 9. Setup Global Shortcuts (Esc to close modal, etc.)
  setupGlobalEvents();

  // 10. Load Initial View (from hash or default to overview)
  const initialHash = window.location.hash.replace("#", "") || "overview";
  switchView(initialHash);
});

/**
 * Navigation and Sidebar Routing.
 */
function setupNavigation() {
  // Sidebar navigation items
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      const view = item.getAttribute("data-view");
      if (view) switchView(view);
    });
  });

  // Mobile menu toggle & backdrop
  const hamburgerBtn = document.getElementById("hamburger-btn");
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", toggleMobileSidebar);
  }

  const sidebarOverlay = document.getElementById("sidebar-overlay");
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeMobileSidebar);
  }

  const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
  }

  // Handle browser back/forward buttons
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && hash !== currentView) {
      switchView(hash);
    }
  });

  // "View All" button on Overview
  const viewAllBtn = document.getElementById("btn-view-all-tx");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => switchView("transactions"));
  }
}

/**
 * Add / Edit Modal Controls.
 */
function setupTransactionModal() {
  // Primary "+ Add Transaction" button in top nav
  const addButtons = document.querySelectorAll(".btn-open-add-tx");
  addButtons.forEach(btn => {
    btn.addEventListener("click", () => openTransactionModal());
  });

  // Modal Close buttons
  const closeBtn = document.getElementById("modal-close-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeTransactionModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeTransactionModal);

  // Backdrop click to close modal
  const modal = document.getElementById("transaction-modal");
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeTransactionModal();
    });
  }

  // Type Selector (Expense vs Income)
  const expenseBtn = document.getElementById("btn-type-expense");
  const incomeBtn = document.getElementById("btn-type-income");
  if (expenseBtn) {
    expenseBtn.addEventListener("click", () => setFormType("expense"));
  }
  if (incomeBtn) {
    incomeBtn.addEventListener("click", () => setFormType("income"));
  }

  // Form submission
  const form = document.getElementById("transaction-form");
  if (form) {
    form.addEventListener("submit", handleModalFormSubmit);
  }

  // Confirmation Modal Delete Action
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
  const confirmModal = document.getElementById("confirm-modal");

  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", executeDelete);
  if (confirmCancelBtn) confirmCancelBtn.addEventListener("click", closeConfirmModal);
  if (confirmModal) {
    confirmModal.addEventListener("click", e => {
      if (e.target === confirmModal) closeConfirmModal();
    });
  }
}

/**
 * Filter, Search, and Sort Handlers on Transactions Page.
 */
function setupTransactionFilters() {
  // Search input
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", e => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        activeFilters.search = e.target.value;
        renderTransactionsPage();
      }, 200);
    });
  }

  // Type Pills (All, Income, Expense)
  document.querySelectorAll(".type-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".type-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilters.type = btn.getAttribute("data-type") || "all";
      renderTransactionsPage();
    });
  });

  // Category select
  const catSelect = document.getElementById("filter-category-select");
  if (catSelect) {
    catSelect.addEventListener("change", e => {
      activeFilters.category = e.target.value;
      renderTransactionsPage();
    });
  }

  // Period select
  const periodSelect = document.getElementById("filter-period-select");
  if (periodSelect) {
    periodSelect.addEventListener("change", e => {
      activeFilters.period = e.target.value;
      renderTransactionsPage();
    });
  }

  // Sort select
  const sortSelect = document.getElementById("filter-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", e => {
      activeFilters.sortBy = e.target.value;
      renderTransactionsPage();
    });
  }
}

/**
 * Overview Controls (Cash flow range selector).
 */
function setupOverviewControls() {
  document.querySelectorAll(".range-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".range-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const range = btn.getAttribute("data-range") || "30d";
      renderOverviewCashFlowChart(range);
    });
  });

  // Overview quick add demo data button
  const loadDemoBtn = document.getElementById("overview-load-demo-btn");
  if (loadDemoBtn) {
    loadDemoBtn.addEventListener("click", () => {
      loadSampleData();
      showToast("Demo transactions loaded successfully", "success");
      renderOverview();
    });
  }
}

/**
 * Settings Page Handlers.
 */
function setupSettingsHandlers() {
  // Currency Select
  const currencySelect = document.getElementById("settings-currency-select");
  if (currencySelect) {
    currencySelect.addEventListener("change", e => {
      const code = e.target.value;
      if (CURRENCIES[code]) {
        appSettings.currency = code;
        appSettings.currencySymbol = CURRENCIES[code].symbol;
        appSettings.locale = CURRENCIES[code].locale;
        saveSettings(appSettings);
        showToast(`Currency updated to ${CURRENCIES[code].label}`, "success");

        // Update currency labels on UI
        const currencySymbolBadge = document.getElementById("currency-symbol-prefix");
        if (currencySymbolBadge) currencySymbolBadge.textContent = appSettings.currencySymbol;

        refreshCurrentView();
      }
    });
  }

  // Theme Select on Settings
  const themeSelect = document.getElementById("settings-theme-select");
  if (themeSelect) {
    themeSelect.addEventListener("change", e => {
      applyTheme(e.target.value);
      showToast(`Theme changed to ${e.target.value} mode`, "info");
    });
  }

  // Export CSV
  const exportCsvBtn = document.getElementById("btn-export-csv");
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      if (transactions.length === 0) {
        showToast("No transactions available to export.", "info");
        return;
      }
      const csv = exportTransactionsCSV();
      downloadFile(csv, `ledger-transactions-${new Date().toISOString().split("T")[0]}.csv`, "text/csv");
      showToast("CSV export initiated", "success");
    });
  }

  // Export JSON
  const exportJsonBtn = document.getElementById("btn-export-json");
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", () => {
      if (transactions.length === 0) {
        showToast("No transactions available to export.", "info");
        return;
      }
      const json = exportTransactionsJSON();
      downloadFile(json, `ledger-backup-${new Date().toISOString().split("T")[0]}.json`, "application/json");
      showToast("JSON backup downloaded", "success");
    });
  }

  // Import JSON Trigger & File Handler
  const importFileBtn = document.getElementById("btn-import-json");
  const fileInput = document.getElementById("import-file-input");

  if (importFileBtn && fileInput) {
    importFileBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        const result = importTransactionsJSON(event.target.result);
        if (result.success) {
          showToast(`Successfully imported ${result.count} transactions`, "success");
          refreshCurrentView();
        } else {
          showToast(`Failed to import: ${result.error}`, "error");
        }
        fileInput.value = "";
      };
      reader.readAsText(file);
    });
  }

  // Load Demo Data
  const loadDemoSettingsBtn = document.getElementById("btn-load-demo-settings");
  if (loadDemoSettingsBtn) {
    loadDemoSettingsBtn.addEventListener("click", () => {
      loadSampleData();
      showToast("12 demo transactions loaded", "success");
      renderSettingsPage();
    });
  }

  // Clear All Data
  const clearDataBtn = document.getElementById("btn-clear-all-data");
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) {
        clearAllTransactions();
        showToast("All transaction records have been erased.", "info");
        renderSettingsPage();
      }
    });
  }
}

/**
 * Global Keyboard & Window Shortcuts.
 */
function setupGlobalEvents() {
  document.addEventListener("keydown", e => {
    // Esc closes open modals
    if (e.key === "Escape") {
      const txModal = document.getElementById("transaction-modal");
      const confirmModal = document.getElementById("confirm-modal");

      if (txModal && txModal.classList.contains("open")) {
        closeTransactionModal();
      }
      if (confirmModal && confirmModal.classList.contains("open")) {
        closeConfirmModal();
      }
      closeMobileSidebar();
    }

    // Ctrl+N or Cmd+N opens Add Transaction
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      if (currentView !== "transactions") switchView("transactions");
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 150);
    }
  });

  // Window resize to handle mobile sidebar collapse
  window.addEventListener("resize", () => {
    if (window.innerWidth > 992) {
      closeMobileSidebar();
    }
  });
}
