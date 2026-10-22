/* ============================================================
   STORAGE.JS — Data Persistence & Settings Management
   Expense Tracker Fintech SaaS Platform
   ============================================================ */

var STORAGE_KEY = "expense-tracker-transactions";
var SETTINGS_KEY = "expense-tracker-settings";

// Default user settings
var DEFAULT_SETTINGS = {
  currency: "INR",
  currencySymbol: "₹",
  locale: "en-IN",
  period: "all"
};

if (typeof window !== "undefined") {
  window.STORAGE_KEY = STORAGE_KEY;
  window.SETTINGS_KEY = SETTINGS_KEY;
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
}

/**
 * Loads transactions from localStorage with backward-compatible migration.
 * @returns {Array<Object>} Array of transaction objects
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Migrate any legacy data from older versions
    return parsed.map((item, index) => {
      const now = new Date();
      return {
        id: item.id || Date.now() + index,
        description: item.description || "Untitled Transaction",
        amount: typeof item.amount === "number" ? Math.abs(item.amount) : parseFloat(item.amount) || 0,
        type: item.type === "income" ? "income" : "expense",
        category: item.category || (item.type === "income" ? "Salary" : "Other"),
        date: item.date || now.toISOString().split("T")[0],
        note: item.note || "",
        createdAt: item.createdAt || (item.id && !isNaN(item.id) ? new Date(item.id).toISOString() : now.toISOString())
      };
    });
  } catch (error) {
    console.error("Failed to load transactions from localStorage:", error);
    return [];
  }
}

/**
 * Saves transactions to localStorage.
 * @param {Array<Object>} transactions
 * @returns {boolean} Success status
 */
function saveTransactions(transactions) {
  try {
    const serialized = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error("Failed to save transactions to localStorage:", error);
    if (typeof showToast === "function") {
      showToast("Storage quota exceeded or disabled. Changes could not be saved.", "error");
    }
    return false;
  }
}

/**
 * Loads application settings.
 * @returns {Object} Settings object
 */
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Saves application settings.
 * @param {Object} settings
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}
