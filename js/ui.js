/* ============================================================
   UI.JS — Interface Rendering, View Routing & Interaction System
   Ledger Fintech SaaS Platform
   ============================================================ */

// Active view state
var currentView = "overview";
var editingTransactionId = null;
var pendingDeleteId = null;

// Filter state for transactions page
var activeFilters = {
  search: "",
  type: "all",
  category: "all",
  period: "all",
  sortBy: "date-desc"
};

if (typeof window !== "undefined") {
  window.currentView = currentView;
  window.activeFilters = activeFilters;
}

/**
 * Escapes HTML characters to prevent XSS.
 */
function sanitizeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Formats a monetary amount into the user's active currency.
 * @param {number} amount
 * @returns {string} Formatted currency string (e.g., "₹12,500.00")
 */
function formatCurrency(amount) {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const currencyInfo = CURRENCIES[appSettings.currency] || CURRENCIES.INR;

  try {
    const formatted = Math.abs(num).toLocaleString(currencyInfo.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${currencyInfo.symbol}${formatted}`;
  } catch (e) {
    return `${currencyInfo.symbol}${Math.abs(num).toFixed(2)}`;
  }
}

/**
 * Formats date string into human-friendly format (e.g. "12 Oct 2026").
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Synchronizes the top header breadcrumbs, live balance chip, and sidebar stats.
 */
function syncHeaderAndSidebar(viewName) {
  const current = viewName || currentView || "overview";

  // 1. Update breadcrumb text and icon
  const breadcrumbIcon = document.getElementById("header-breadcrumb-icon");
  const breadcrumbText = document.getElementById("header-breadcrumb-text");

  const viewConfig = {
    overview: { label: "Overview", icon: "layout-dashboard" },
    transactions: { label: "Transactions", icon: "arrow-left-right" },
    analytics: { label: "Analytics", icon: "bar-chart-3" },
    settings: { label: "Settings", icon: "sliders-horizontal" }
  };

  const cfg = viewConfig[current] || viewConfig.overview;
  if (breadcrumbText) breadcrumbText.textContent = cfg.label;
  if (breadcrumbIcon) breadcrumbIcon.setAttribute("data-lucide", cfg.icon);

  // 2. Update transaction count badge in sidebar
  const txBadge = document.getElementById("sidebar-tx-badge");
  const txCount = Array.isArray(transactions) ? transactions.length : 0;
  if (txBadge) {
    txBadge.textContent = txCount;
  }

  // 3. Update storage caption and progress bar in sidebar footer
  const storageCaption = document.getElementById("sidebar-storage-caption");
  const storageFill = document.getElementById("sidebar-storage-fill");
  if (storageCaption) {
    storageCaption.textContent = `${txCount} record${txCount === 1 ? "" : "s"} saved • Local Vault`;
  }
  if (storageFill) {
    const pct = Math.min(100, Math.max(15, txCount * 6));
    storageFill.style.width = `${pct}%`;
  }

  // 4. Update Header Live Net Balance chip
  const headerBalance = document.getElementById("header-balance-amount");
  if (headerBalance && typeof calculateMetrics === "function") {
    const metrics = calculateMetrics(transactions);
    headerBalance.textContent = formatCurrency(metrics.balance);
    if (metrics.balance < 0) {
      headerBalance.style.color = "var(--expense)";
    } else {
      headerBalance.style.color = "var(--income)";
    }
  }
}

/**
 * Switches the primary view and updates URL hash.
 */
function switchView(viewName) {
  const validViews = ["overview", "transactions", "analytics", "settings"];
  if (!validViews.includes(viewName)) viewName = "overview";

  currentView = viewName;
  window.location.hash = viewName;

  // Update navigation links
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.getAttribute("data-view") === viewName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update view panels
  document.querySelectorAll(".view-panel").forEach(panel => {
    panel.classList.remove("active");
  });
  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) targetPanel.classList.add("active");

  // Update top header title & subtitle
  const headerTitle = document.getElementById("header-title");
  const headerSubtitle = document.getElementById("header-subtitle");
  
  if (viewName === "overview") {
    if (headerTitle) headerTitle.textContent = "Overview";
    if (headerSubtitle) headerSubtitle.textContent = "Financial snapshot, cash flow & recent activity";
    renderOverview();
  } else if (viewName === "transactions") {
    if (headerTitle) headerTitle.textContent = "Transactions";
    if (headerSubtitle) headerSubtitle.textContent = "Manage, filter, search, and edit income & expense records";
    renderTransactionsPage();
  } else if (viewName === "analytics") {
    if (headerTitle) headerTitle.textContent = "Analytics";
    if (headerSubtitle) headerSubtitle.textContent = "Cash flow trends, category breakdown, and monthly metrics";
    renderAnalyticsPage();
  } else if (viewName === "settings") {
    if (headerTitle) headerTitle.textContent = "Settings";
    if (headerSubtitle) headerSubtitle.textContent = "Manage currency preferences, backups, and app appearance";
    renderSettingsPage();
  }

  // Sync header breadcrumbs & sidebar badges
  syncHeaderAndSidebar(viewName);

  // Close mobile sidebar if open
  closeMobileSidebar();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Re-run Lucide icons
  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

/**
 * ============================================================
 * VIEW 1: OVERVIEW DASHBOARD
 * ============================================================
 */
function renderOverview() {
  syncHeaderAndSidebar("overview");
  const metrics = calculateMetrics(transactions);

  // 1. Total Balance
  const balanceEl = document.getElementById("metric-balance");
  const balanceSignEl = document.getElementById("metric-balance-sign");
  if (balanceEl) {
    balanceEl.textContent = formatCurrency(metrics.balance);
    if (metrics.balance < 0) {
      balanceEl.classList.add("negative");
      balanceEl.classList.remove("positive");
      if (balanceSignEl) balanceSignEl.textContent = "-";
    } else {
      balanceEl.classList.add("positive");
      balanceEl.classList.remove("negative");
      if (balanceSignEl) balanceSignEl.textContent = "+";
    }
  }

  // 2. Total Income
  const incomeEl = document.getElementById("metric-income");
  if (incomeEl) incomeEl.textContent = formatCurrency(metrics.totalIncome);

  // 3. Total Expenses
  const expenseEl = document.getElementById("metric-expense");
  if (expenseEl) expenseEl.textContent = formatCurrency(metrics.totalExpense);

  // 4. Savings Rate
  const savingsRateEl = document.getElementById("metric-savings-rate");
  if (savingsRateEl) {
    if (metrics.totalIncome > 0) {
      savingsRateEl.textContent = `${metrics.savingsRate}%`;
    } else {
      savingsRateEl.textContent = "0.0%";
    }
  }

  // Overview empty banner
  const emptyBanner = document.getElementById("overview-empty-state");
  if (emptyBanner) {
    emptyBanner.style.display = transactions.length === 0 ? "flex" : "none";
  }

  // Render Charts
  const activeRangeBtn = document.querySelector(".range-btn.active");
  const range = activeRangeBtn ? activeRangeBtn.getAttribute("data-range") : "30d";
  renderOverviewCashFlowChart(range);
  renderOverviewBreakdownChart();

  // Render Recent Transactions
  renderRecentTransactionsList();
}

/**
 * Renders the top 5 recent transactions on Overview.
 */
function renderRecentTransactionsList() {
  const container = document.getElementById("recent-transactions-list");
  if (!container) return;

  const recent = getRecentTransactions(5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path>
            <path d="M14 8H8"></path>
            <path d="M16 12H8"></path>
            <path d="M13 16H8"></path>
          </svg>
        </div>
        <h4>No transactions yet</h4>
        <p>Start recording your daily income and expenses by clicking "Add Transaction" above.</p>
        <button class="btn btn-primary btn-sm" onclick="openTransactionModal()">
          <i data-lucide="plus"></i> Add Transaction
        </button>
      </div>
    `;
    if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
    return;
  }

  container.innerHTML = recent.map(t => {
    const isIncome = t.type === "income";
    const sign = isIncome ? "+" : "-";
    const amountClass = isIncome ? "text-income" : "text-expense";
    const typeBadgeClass = isIncome ? "badge-income" : "badge-expense";
    const catMeta = (CATEGORIES[t.type] || []).find(c => c.name.toLowerCase() === (t.category || "").toLowerCase());
    const catIcon = catMeta ? catMeta.icon : "tag";

    return `
      <div class="transaction-row-card" data-id="${t.id}">
        <div class="tx-left">
          <div class="tx-cat-icon ${typeBadgeClass}">
            <i data-lucide="${catIcon}"></i>
          </div>
          <div class="tx-details">
            <div class="tx-title">${sanitizeHTML(t.description)}</div>
            <div class="tx-sub">
              <span class="tx-date">${formatDate(t.date)}</span>
              <span class="tx-bullet">•</span>
              <span class="tx-badge ${typeBadgeClass}">${sanitizeHTML(t.category)}</span>
            </div>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${amountClass}">
            ${sign}${formatCurrency(t.amount)}
          </div>
          <div class="tx-row-actions">
            <button class="icon-btn edit-tx-btn" title="Edit" onclick="openTransactionModal(${t.id})">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-btn delete-tx-btn" title="Delete" onclick="confirmDeleteTransaction(${t.id})">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

/**
 * ============================================================
 * VIEW 2: TRANSACTIONS MANAGEMENT
 * ============================================================
 */
function renderTransactionsPage() {
  syncHeaderAndSidebar("transactions");
  populateCategoryFilterOptions();

  const filtered = filterTransactions(activeFilters);
  const container = document.getElementById("transactions-table-body");
  const countBadge = document.getElementById("tx-filtered-count");

  if (countBadge) {
    countBadge.textContent = `${filtered.length} of ${transactions.length} records`;
  }

  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8">
          <div class="empty-state-card">
            <div class="empty-icon" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
                <path d="m13.5 8.5-5 5"></path>
                <path d="m8.5 8.5 5 5"></path>
              </svg>
            </div>
            <h4>No matching transactions</h4>
            <p>Try adjusting your search query, type, or date filters.</p>
            ${transactions.length === 0 ? `
              <button class="btn btn-primary btn-sm mt-3" onclick="openTransactionModal()">
                <i data-lucide="plus"></i> Add Transaction
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm mt-3" onclick="resetFilters()">
                Reset Filters
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isIncome = t.type === "income";
    const sign = isIncome ? "+" : "-";
    const amountClass = isIncome ? "text-income" : "text-expense";
    const badgeClass = isIncome ? "badge-income" : "badge-expense";
    const catMeta = (CATEGORIES[t.type] || []).find(c => c.name.toLowerCase() === (t.category || "").toLowerCase());
    const catIcon = catMeta ? catMeta.icon : "tag";

    return `
      <tr class="tx-table-row" data-id="${t.id}">
        <td class="col-date">${formatDate(t.date)}</td>
        <td class="col-category">
          <span class="category-pill ${badgeClass}">
            <i data-lucide="${catIcon}" class="pill-icon"></i>
            ${sanitizeHTML(t.category)}
          </span>
        </td>
        <td class="col-desc">
          <div class="desc-main">${sanitizeHTML(t.description)}</div>
          ${t.note ? `<div class="desc-note">${sanitizeHTML(t.note)}</div>` : ""}
        </td>
        <td class="col-type">
          <span class="type-indicator ${t.type}">${t.type === "income" ? "Income" : "Expense"}</span>
        </td>
        <td class="col-amount ${amountClass}">
          ${sign}${formatCurrency(t.amount)}
        </td>
        <td class="col-actions">
          <div class="action-buttons-group">
            <button class="icon-btn" title="Edit" onclick="openTransactionModal(${t.id})">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-btn text-danger" title="Delete" onclick="confirmDeleteTransaction(${t.id})">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

/**
 * Populates the category dropdown in the Transactions filter bar.
 */
function populateCategoryFilterOptions() {
  const select = document.getElementById("filter-category-select");
  if (!select) return;

  const currentSelection = activeFilters.category;
  const categories = activeFilters.type === "income" 
    ? CATEGORIES.income 
    : activeFilters.type === "expense" 
      ? CATEGORIES.expense 
      : [...CATEGORIES.expense, ...CATEGORIES.income];

  // Unique names
  const uniqueNames = Array.from(new Set(categories.map(c => c.name)));

  select.innerHTML = `
    <option value="all">All Categories</option>
    ${uniqueNames.map(name => `
      <option value="${name}" ${currentSelection === name ? "selected" : ""}>${name}</option>
    `).join("")}
  `;
}

/**
 * Resets search and filters on Transactions page.
 */
function resetFilters() {
  activeFilters.search = "";
  activeFilters.type = "all";
  activeFilters.category = "all";
  activeFilters.period = "all";
  activeFilters.sortBy = "date-desc";

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  document.querySelectorAll(".type-pill-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-type") === "all");
  });

  const catSelect = document.getElementById("filter-category-select");
  if (catSelect) catSelect.value = "all";

  const periodSelect = document.getElementById("filter-period-select");
  if (periodSelect) periodSelect.value = "all";

  const sortSelect = document.getElementById("filter-sort-select");
  if (sortSelect) sortSelect.value = "date-desc";

  renderTransactionsPage();
}

/**
 * ============================================================
 * VIEW 3: ANALYTICS PAGE
 * ============================================================
 */
function renderAnalyticsPage() {
  syncHeaderAndSidebar("analytics");
  const metrics = calculateMetrics(transactions);
  const expenseBreakdown = getCategoryBreakdown("expense");
  const incomeBreakdown = getCategoryBreakdown("income");

  // KPI 1: Net Cash Flow
  const netEl = document.getElementById("analytics-net-cashflow");
  if (netEl) {
    netEl.textContent = formatCurrency(metrics.balance);
    netEl.className = `metric-value ${metrics.balance >= 0 ? 'text-income' : 'text-expense'}`;
  }

  // KPI 2: Savings Rate
  const savingsEl = document.getElementById("analytics-savings-rate");
  if (savingsEl) {
    savingsEl.textContent = `${metrics.savingsRate}%`;
  }

  // KPI 3: Top Expense Category
  const topCatEl = document.getElementById("analytics-top-category");
  const topCatSubEl = document.getElementById("analytics-top-category-sub");
  if (topCatEl) {
    if (expenseBreakdown.topCategory) {
      topCatEl.textContent = expenseBreakdown.topCategory.name;
      if (topCatSubEl) {
        topCatSubEl.textContent = `${formatCurrency(expenseBreakdown.topCategory.amount)} (${expenseBreakdown.topCategory.percentage}% of total spend)`;
      }
    } else {
      topCatEl.textContent = "None recorded";
      if (topCatSubEl) topCatSubEl.textContent = "No expense data recorded";
    }
  }

  // KPI 4: Average Transaction
  const avgTxEl = document.getElementById("analytics-avg-tx");
  if (avgTxEl) {
    const avg = transactions.length > 0 ? (metrics.totalIncome + metrics.totalExpense) / transactions.length : 0;
    avgTxEl.textContent = formatCurrency(avg);
  }

  // Render Charts
  renderAnalyticsCharts();

  // Category Breakdown Table
  const tableContainer = document.getElementById("analytics-category-table-body");
  if (tableContainer) {
    if (!expenseBreakdown.items || expenseBreakdown.items.length === 0) {
      tableContainer.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-6 text-muted">
            No expense records found. Add expenses to generate category insights.
          </td>
        </tr>
      `;
    } else {
      tableContainer.innerHTML = expenseBreakdown.items.map(item => `
        <tr>
          <td>
            <div class="d-flex align-center gap-2">
              <span class="legend-dot" style="background-color: ${item.color}"></span>
              <span class="font-medium">${item.name}</span>
            </div>
          </td>
          <td>${item.count} transaction${item.count !== 1 ? 's' : ''}</td>
          <td class="font-semibold">${formatCurrency(item.amount)}</td>
          <td>${item.percentage}%</td>
          <td style="width: 140px;">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${item.percentage}%; background-color: ${item.color}"></div>
            </div>
          </td>
        </tr>
      `).join("");
    }
  }

  if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
  }
}

/**
 * ============================================================
 * VIEW 4: SETTINGS PAGE
 * ============================================================
 */
function renderSettingsPage() {
  syncHeaderAndSidebar("settings");
  // Currency select
  const currencySelect = document.getElementById("settings-currency-select");
  if (currencySelect) {
    currencySelect.value = appSettings.currency;
  }

  // Theme select
  const themeSelect = document.getElementById("settings-theme-select");
  if (themeSelect) {
    const activeTheme = document.documentElement.getAttribute("data-theme") || "dark";
    themeSelect.value = activeTheme;
  }

  // Stats
  const txCountEl = document.getElementById("settings-tx-count");
  if (txCountEl) txCountEl.textContent = `${transactions.length} items`;

  const storageSizeEl = document.getElementById("settings-storage-size");
  if (storageSizeEl) {
    const bytes = (localStorage.getItem(STORAGE_KEY) || "").length;
    storageSizeEl.textContent = `${(bytes / 1024).toFixed(1)} KB`;
  }
}

/**
 * ============================================================
 * MODALS & FORM INTERACTIONS
 * ============================================================
 */

/**
 * Opens Add or Edit Transaction Modal.
 * @param {number|null} id If provided, opens in edit mode
 */
function openTransactionModal(id = null) {
  const modal = document.getElementById("transaction-modal");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("transaction-form");
  const submitBtn = document.getElementById("modal-submit-btn");

  if (!modal || !form) return;

  editingTransactionId = id;
  clearModalValidationErrors();

  if (id) {
    const tx = getTransactionById(id);
    if (!tx) {
      showToast("Transaction not found", "error");
      return;
    }
    if (modalTitle) modalTitle.textContent = "Edit Transaction";
    if (submitBtn) submitBtn.innerHTML = `<i data-lucide="check"></i> Save Changes`;

    document.getElementById("tx-amount").value = tx.amount;
    document.getElementById("tx-description").value = tx.description;
    document.getElementById("tx-date").value = tx.date;
    document.getElementById("tx-note").value = tx.note || "";

    // Set type buttons
    setFormType(tx.type);
    updateModalCategoryOptions(tx.type, tx.category);
  } else {
    if (modalTitle) modalTitle.textContent = "New Transaction";
    if (submitBtn) submitBtn.innerHTML = `<i data-lucide="plus"></i> Add Transaction`;

    form.reset();
    document.getElementById("tx-date").value = new Date().toISOString().split("T")[0];
    setFormType("expense");
    updateModalCategoryOptions("expense");
  }

  modal.classList.add("open");
  document.body.classList.add("modal-open");

  // Focus description
  setTimeout(() => {
    const descInput = document.getElementById("tx-description");
    if (descInput) descInput.focus();
    if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();
  }, 100);
}

/**
 * Closes the transaction modal.
 */
function closeTransactionModal() {
  const modal = document.getElementById("transaction-modal");
  if (!modal) return;
  modal.classList.remove("open");
  document.body.classList.remove("modal-open");
  editingTransactionId = null;
  clearModalValidationErrors();
}

/**
 * Updates active transaction type in modal (Expense vs Income).
 */
function setFormType(type) {
  const expenseBtn = document.getElementById("btn-type-expense");
  const incomeBtn = document.getElementById("btn-type-income");
  const hiddenTypeInput = document.getElementById("tx-type-input");

  if (hiddenTypeInput) hiddenTypeInput.value = type;

  if (type === "expense") {
    if (expenseBtn) expenseBtn.classList.add("active");
    if (incomeBtn) incomeBtn.classList.remove("active");
  } else {
    if (incomeBtn) incomeBtn.classList.add("active");
    if (expenseBtn) expenseBtn.classList.remove("active");
  }

  updateModalCategoryOptions(type);
}

/**
 * Updates category dropdown in modal based on selected type.
 */
function updateModalCategoryOptions(type, selectedCategory = null) {
  const catSelect = document.getElementById("tx-category");
  if (!catSelect) return;

  const categories = CATEGORIES[type] || CATEGORIES.expense;
  catSelect.innerHTML = categories.map(cat => `
    <option value="${cat.name}" ${selectedCategory === cat.name ? "selected" : ""}>
      ${cat.name}
    </option>
  `).join("");
}

/**
 * Handles Add/Edit Form submission with strict validation.
 */
function handleModalFormSubmit(event) {
  event.preventDefault();
  clearModalValidationErrors();

  const descriptionInput = document.getElementById("tx-description");
  const amountInput = document.getElementById("tx-amount");
  const dateInput = document.getElementById("tx-date");
  const categoryInput = document.getElementById("tx-category");
  const typeInput = document.getElementById("tx-type-input");
  const noteInput = document.getElementById("tx-note");
  const submitBtn = document.getElementById("modal-submit-btn");

  const description = descriptionInput ? descriptionInput.value.trim() : "";
  const amountRaw = amountInput ? amountInput.value.trim() : "";
  const date = dateInput ? dateInput.value : "";
  const category = categoryInput ? categoryInput.value : "";
  const type = typeInput ? typeInput.value : "expense";
  const note = noteInput ? noteInput.value.trim() : "";

  let hasError = false;

  // Validate Description
  if (!description) {
    setFieldError("tx-description", "Please enter a transaction description.");
    hasError = true;
  }

  // Validate Amount
  const amount = parseFloat(amountRaw);
  if (!amountRaw) {
    setFieldError("tx-amount", "Please specify an amount.");
    hasError = true;
  } else if (isNaN(amount) || amount <= 0) {
    setFieldError("tx-amount", "Amount must be a positive number greater than 0.");
    hasError = true;
  }

  // Validate Date
  if (!date) {
    setFieldError("tx-date", "Please select a valid transaction date.");
    hasError = true;
  }

  if (hasError) return;

  // Disable button while processing
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Saving...`;
  }

  setTimeout(() => {
    try {
      if (editingTransactionId) {
        updateTransaction(editingTransactionId, {
          description,
          amount,
          type,
          category,
          date,
          note
        });
        showToast("Transaction updated successfully", "success");
      } else {
        addTransaction({
          description,
          amount,
          type,
          category,
          date,
          note
        });
        showToast("Transaction added successfully", "success");
      }

      closeTransactionModal();

      // Refresh current view
      if (currentView === "overview") renderOverview();
      else if (currentView === "transactions") renderTransactionsPage();
      else if (currentView === "analytics") renderAnalyticsPage();
      else if (currentView === "settings") renderSettingsPage();
    } catch (err) {
      console.error("Save error:", err);
      showToast("An unexpected error occurred while saving.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check"></i> Confirm`;
      }
    }
  }, 120);
}

/**
 * Sets validation error styling and message on field.
 */
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add("input-error");
  const parent = field.closest(".form-group");
  if (parent) {
    const existing = parent.querySelector(".field-error-msg");
    if (!existing) {
      const msg = document.createElement("div");
      msg.className = "field-error-msg";
      msg.textContent = message;
      parent.appendChild(msg);
    }
  }
}

/**
 * Clears validation errors in modal.
 */
function clearModalValidationErrors() {
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
  document.querySelectorAll(".field-error-msg").forEach(el => el.remove());
}

/**
 * Prompts user with custom confirmation modal before deleting.
 */
function confirmDeleteTransaction(id) {
  pendingDeleteId = id;
  const modal = document.getElementById("confirm-modal");
  if (!modal) {
    if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
      deleteTransaction(id);
      showToast("Transaction deleted", "info");
      refreshCurrentView();
    }
    return;
  }

  const tx = getTransactionById(id);
  const descEl = document.getElementById("confirm-modal-target");
  if (descEl && tx) {
    descEl.textContent = `"${tx.description}" (${formatCurrency(tx.amount)})`;
  }

  modal.classList.add("open");
  document.body.classList.add("modal-open");
}

/**
 * Executes pending deletion after confirmation.
 */
function executeDelete() {
  if (pendingDeleteId !== null) {
    deleteTransaction(pendingDeleteId);
    showToast("Transaction deleted", "info");
    pendingDeleteId = null;
    closeConfirmModal();
    refreshCurrentView();
  }
}

/**
 * Closes confirmation modal.
 */
function closeConfirmModal() {
  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
  }
  pendingDeleteId = null;
}

/**
 * Refreshes currently visible view.
 */
function refreshCurrentView() {
  syncHeaderAndSidebar(currentView);
  if (currentView === "overview") renderOverview();
  else if (currentView === "transactions") renderTransactionsPage();
  else if (currentView === "analytics") renderAnalyticsPage();
  else if (currentView === "settings") renderSettingsPage();
}

/**
 * ============================================================
 * TOAST NOTIFICATION SYSTEM
 * ============================================================
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast-pill toast-${type}`;

  let iconName = "info";
  if (type === "success") iconName = "check-circle";
  if (type === "error") iconName = "alert-circle";

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <span class="toast-text">${sanitizeHTML(message)}</span>
  `;

  container.appendChild(toast);
  if (typeof lucide !== "undefined" && lucide.createIcons) lucide.createIcons();

  // Slide in
  requestAnimationFrame(() => toast.classList.add("show"));

  // Dismiss after 3.2s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/**
 * ============================================================
 * MOBILE NAVIGATION
 * ============================================================
 */
function toggleMobileSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("app-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  }
}

/**
 * Download helper for files.
 */
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
