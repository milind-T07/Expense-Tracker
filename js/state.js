/* ============================================================
   STATE.JS — Application State, Analytics & Calculation Logic
   Expense Tracker Fintech SaaS Platform
   ============================================================ */

// Primary state container
var transactions = [];
var appSettings = typeof DEFAULT_SETTINGS !== "undefined" ? DEFAULT_SETTINGS : {
  currency: "INR",
  currencySymbol: "₹",
  locale: "en-IN",
  period: "all"
};

// Category definitions with cohesive fintech color palette
var CATEGORIES = {
  expense: [
    { name: "Food", icon: "utensils", color: "#F97316" },
    { name: "Transport", icon: "car", color: "#38BDF8" },
    { name: "Shopping", icon: "shopping-bag", color: "#EC4899" },
    { name: "Bills", icon: "receipt", color: "#FBBF24" },
    { name: "Education", icon: "graduation-cap", color: "#A855F7" },
    { name: "Health", icon: "heart-pulse", color: "#14B8A6" },
    { name: "Entertainment", icon: "film", color: "#8B5CF6" },
    { name: "Rent", icon: "home", color: "#6366F1" },
    { name: "Other", icon: "layers", color: "#94A3B8" }
  ],
  income: [
    { name: "Salary", icon: "briefcase", color: "#10B981" },
    { name: "Freelance", icon: "laptop", color: "#06B6D4" },
    { name: "Business", icon: "building-2", color: "#3B82F6" },
    { name: "Investment", icon: "trending-up", color: "#8B5CF6" },
    { name: "Gift", icon: "gift", color: "#F43F5E" },
    { name: "Other", icon: "plus-circle", color: "#64748B" }
  ]
};

// Supported currencies
var CURRENCIES = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN", label: "Indian Rupee (₹)" },
  USD: { code: "USD", symbol: "$", locale: "en-US", label: "US Dollar ($)" },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE", label: "Euro (€)" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", label: "British Pound (£)" },
  JPY: { code: "JPY", symbol: "¥", locale: "ja-JP", label: "Japanese Yen (¥)" }
};

if (typeof window !== "undefined") {
  window.transactions = transactions;
  window.appSettings = appSettings;
  window.CATEGORIES = CATEGORIES;
  window.CURRENCIES = CURRENCIES;
}

/**
 * Initializes state from storage.
 */
function initializeTransactions() {
  transactions = loadTransactions();
  appSettings = loadSettings();
}

/**
 * Adds a new transaction.
 */
function addTransaction(data) {
  const newTx = {
    id: Date.now(),
    description: (data.description || "").trim(),
    amount: parseFloat(data.amount) || 0,
    type: data.type === "income" ? "income" : "expense",
    category: data.category || (data.type === "income" ? "Salary" : "Other"),
    date: data.date || new Date().toISOString().split("T")[0],
    note: (data.note || "").trim(),
    createdAt: new Date().toISOString()
  };

  transactions.unshift(newTx);
  saveTransactions(transactions);
  return newTx;
}

/**
 * Updates an existing transaction.
 */
function updateTransaction(id, data) {
  const index = transactions.findIndex(t => t.id === id);
  if (index === -1) return null;

  transactions[index] = {
    ...transactions[index],
    description: (data.description || "").trim(),
    amount: parseFloat(data.amount) || 0,
    type: data.type === "income" ? "income" : "expense",
    category: data.category || (data.type === "income" ? "Salary" : "Other"),
    date: data.date || transactions[index].date,
    note: (data.note || "").trim()
  };

  saveTransactions(transactions);
  return transactions[index];
}

/**
 * Deletes a transaction by ID.
 */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions(transactions);
}

/**
 * Gets a transaction by ID.
 */
function getTransactionById(id) {
  return transactions.find(t => t.id === id) || null;
}

/**
 * Calculates core financial summary metrics for a given set of transactions.
 */
function calculateMetrics(txList = transactions) {
  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = 0; i < txList.length; i++) {
    const t = txList[i];
    if (t.type === "income") {
      totalIncome += t.amount;
    } else if (t.type === "expense") {
      totalExpense += t.amount;
    }
  }

  const balance = totalIncome - totalExpense;
  
  // Safe Savings Rate calculation:
  // If income > 0, % of income saved = ((income - expenses) / income) * 100
  // If income <= 0, savings rate is 0
  let savingsRate = 0;
  if (totalIncome > 0) {
    savingsRate = Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100);
  }

  return {
    totalIncome,
    totalExpense,
    balance,
    savingsRate: parseFloat(savingsRate.toFixed(1)),
    count: txList.length
  };
}

/**
 * Backwards compatibility wrappers for existing code
 */
function calculateTotalIncome() {
  return calculateMetrics(transactions).totalIncome;
}

function calculateTotalExpense() {
  return calculateMetrics(transactions).totalExpense;
}

function calculateBalance() {
  return calculateMetrics(transactions).balance;
}

/**
 * Filter and sort transactions based on user queries.
 */
function filterTransactions({
  search = "",
  type = "all",
  category = "all",
  period = "all",
  startDate = null,
  endDate = null,
  sortBy = "date-desc"
} = {}) {
  let filtered = [...transactions];

  // 1. Search filter (description and note)
  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(q) || 
      (t.note && t.note.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  }

  // 2. Type filter
  if (type && type !== "all") {
    filtered = filtered.filter(t => t.type === type);
  }

  // 3. Category filter
  if (category && category !== "all") {
    filtered = filtered.filter(t => t.category === category);
  }

  // 4. Period / Date Filter
  const now = new Date();
  if (period === "this-month") {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    filtered = filtered.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  } else if (period === "last-month") {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const targetYear = lastMonthDate.getFullYear();
    const targetMonth = lastMonthDate.getMonth();
    filtered = filtered.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
  } else if (period === "last-30") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    filtered = filtered.filter(t => t.date >= cutoffStr);
  } else if (period === "this-year") {
    const currentYear = now.getFullYear();
    filtered = filtered.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear;
    });
  } else if (period === "custom" && (startDate || endDate)) {
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);
  }

  // 5. Sorting
  filtered.sort((a, b) => {
    if (sortBy === "date-desc") {
      return b.date.localeCompare(a.date) || b.id - a.id;
    } else if (sortBy === "date-asc") {
      return a.date.localeCompare(b.date) || a.id - b.id;
    } else if (sortBy === "amount-desc") {
      return b.amount - a.amount;
    } else if (sortBy === "amount-asc") {
      return a.amount - b.amount;
    }
    return 0;
  });

  return filtered;
}

/**
 * Computes Cash Flow timeline data for charts based on selected range (7d, 30d, 90d, 12m).
 */
function getCashFlowTimeline(range = "30d") {
  const now = new Date();
  const points = [];
  const incomeMap = {};
  const expenseMap = {};

  if (range === "7d") {
    // 7 days daily breakdown
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
      points.push({ key, label });
      incomeMap[key] = 0;
      expenseMap[key] = 0;
    }
  } else if (range === "30d") {
    // 30 days grouped in intervals or rolling days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      // Display day number
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      points.push({ key, label });
      incomeMap[key] = 0;
      expenseMap[key] = 0;
    }
  } else if (range === "90d") {
    // 90 days - grouped into 12 weeks or 3 months
    // Let's create weekly buckets
    const weekCount = 12;
    for (let i = weekCount - 1; i >= 0; i--) {
      const startD = new Date(now);
      startD.setDate(startD.getDate() - (i * 7 + 6));
      const endD = new Date(now);
      endD.setDate(endD.getDate() - (i * 7));
      const key = `W${i}`;
      const label = `${startD.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endD.toLocaleDateString("en-US", { day: "numeric" })}`;
      points.push({ key, label, startStr: startD.toISOString().split("T")[0], endStr: endD.toISOString().split("T")[0] });
      incomeMap[key] = 0;
      expenseMap[key] = 0;
    }
  } else if (range === "12m") {
    // 12 months breakdown
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      points.push({ key, label });
      incomeMap[key] = 0;
      expenseMap[key] = 0;
    }
  }

  // Populate maps from transactions
  transactions.forEach(t => {
    if (range === "7d" || range === "30d") {
      if (incomeMap[t.date] !== undefined) {
        if (t.type === "income") incomeMap[t.date] += t.amount;
        else expenseMap[t.date] += t.amount;
      }
    } else if (range === "90d") {
      points.forEach(p => {
        if (t.date >= p.startStr && t.date <= p.endStr) {
          if (t.type === "income") incomeMap[p.key] += t.amount;
          else expenseMap[p.key] += t.amount;
        }
      });
    } else if (range === "12m") {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (incomeMap[monthKey] !== undefined) {
        if (t.type === "income") incomeMap[monthKey] += t.amount;
        else expenseMap[monthKey] += t.amount;
      }
    }
  });

  return {
    labels: points.map(p => p.label),
    income: points.map(p => Math.round(incomeMap[p.key] * 100) / 100),
    expense: points.map(p => Math.round(expenseMap[p.key] * 100) / 100)
  };
}

/**
 * Computes expense or income breakdown by category with percentages and colors.
 */
function getCategoryBreakdown(type = "expense", txList = transactions) {
  const targetList = txList.filter(t => t.type === type);
  const total = targetList.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = {};
  targetList.forEach(t => {
    const cat = t.category || "Other";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amount: 0, count: 0 };
    }
    categoryMap[cat].amount += t.amount;
    categoryMap[cat].count += 1;
  });

  const availableCategories = CATEGORIES[type] || [];
  const results = Object.keys(categoryMap).map(catName => {
    const meta = availableCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    const amount = categoryMap[catName].amount;
    const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;

    return {
      name: catName,
      amount,
      percentage: parseFloat(percentage),
      count: categoryMap[catName].count,
      color: meta ? meta.color : "#94A3B8",
      icon: meta ? meta.icon : "circle"
    };
  });

  // Sort descending by amount
  results.sort((a, b) => b.amount - a.amount);

  return {
    total,
    items: results,
    topCategory: results.length > 0 ? results[0] : null
  };
}

/**
 * Returns latest N transactions.
 */
function getRecentTransactions(limit = 5) {
  return [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, limit);
}

/**
 * Populates realistic fintech demo data for evaluation and first-run demonstration.
 */
function loadSampleData() {
  const today = new Date();
  const formatOffset = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  const sampleItems = [
    { description: "Primary Software Salary", amount: 145000, type: "income", category: "Salary", date: formatOffset(2), note: "Monthly corporate direct deposit" },
    { description: "Apartment Rental", amount: 32000, type: "expense", category: "Rent", date: formatOffset(3), note: "Monthly lease payment" },
    { description: "High-Speed Fiber Internet", amount: 1499, type: "expense", category: "Bills", date: formatOffset(5), note: "Monthly gigabit plan" },
    { description: "Organic Supermarket Groceries", amount: 6250, type: "expense", category: "Food", date: formatOffset(7), note: "Weekly grocery run" },
    { description: "Mobile UI Design Freelance", amount: 35000, type: "income", category: "Freelance", date: formatOffset(9), note: "Milestone completion payment" },
    { description: "Ride Share Commute", amount: 840, type: "expense", category: "Transport", date: formatOffset(11), note: "Airport cab travel" },
    { description: "Dinner at Bistro", amount: 2850, type: "expense", category: "Food", date: formatOffset(14), note: "Team dinner" },
    { description: "Index Fund Dividend", amount: 8200, type: "income", category: "Investment", date: formatOffset(16), note: "Quarterly portfolio return" },
    { description: "Noise Cancelling Headphones", amount: 18900, type: "expense", category: "Shopping", date: formatOffset(18), note: "Office upgrade equipment" },
    { description: "Streaming & Media Subscription", amount: 1199, type: "expense", category: "Entertainment", date: formatOffset(21), note: "Annual bundle membership" },
    { description: "Health Insurance Premium", amount: 7500, type: "expense", category: "Health", date: formatOffset(25), note: "Annual health coverage" },
    { description: "Web Development Masterclass", amount: 4999, type: "expense", category: "Education", date: formatOffset(28), note: "Advanced TypeScript certification" }
  ];

  transactions = sampleItems.map((item, idx) => ({
    id: Date.now() - (idx * 86400000),
    ...item,
    createdAt: new Date(Date.now() - (idx * 86400000)).toISOString()
  }));

  saveTransactions(transactions);
  return transactions;
}

/**
 * Clears all transaction data.
 */
function clearAllTransactions() {
  transactions = [];
  saveTransactions(transactions);
}

/**
 * Exports all transactions to a CSV string.
 */
function exportTransactionsCSV() {
  const headers = ["ID", "Date", "Description", "Type", "Category", "Amount", "Note"];
  const rows = transactions.map(t => [
    t.id,
    `"${t.date}"`,
    `"${(t.description || "").replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category || ""}"`,
    t.amount,
    `"${(t.note || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  return csvContent;
}

/**
 * Exports all transactions to JSON string.
 */
function exportTransactionsJSON() {
  return JSON.stringify(transactions, null, 2);
}

/**
 * Imports transactions from a JSON string with validation.
 */
function importTransactionsJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) throw new Error("Imported data must be an array of transactions.");

    const imported = parsed.map((item, i) => ({
      id: item.id || Date.now() + i,
      description: (item.description || "Imported Transaction").trim(),
      amount: Math.abs(parseFloat(item.amount)) || 0,
      type: item.type === "income" ? "income" : "expense",
      category: item.category || (item.type === "income" ? "Salary" : "Other"),
      date: item.date || new Date().toISOString().split("T")[0],
      note: (item.note || "").trim(),
      createdAt: item.createdAt || new Date().toISOString()
    }));

    transactions = imported;
    saveTransactions(transactions);
    return { success: true, count: imported.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
