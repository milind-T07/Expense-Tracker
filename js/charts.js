/* ============================================================
   CHARTS.JS — Chart.js Visualizations & Lifecycle Management
   Expense Tracker Fintech SaaS Platform
   ============================================================ */

var chartInstances = {};
if (typeof window !== "undefined") window.chartInstances = chartInstances;

/**
 * Returns current theme colors for chart styling.
 */
function getChartThemeColors() {
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  return {
    textColor: isDark ? "#98A2B8" : "#64748B",
    gridColor: isDark ? "rgba(38, 49, 73, 0.5)" : "rgba(226, 232, 240, 0.8)",
    tooltipBg: isDark ? "#171F33" : "#FFFFFF",
    tooltipTitle: isDark ? "#F5F7FF" : "#0F172A",
    tooltipBody: isDark ? "#98A2B8" : "#475569",
    tooltipBorder: isDark ? "#263149" : "#E2E8F0",
    incomeColor: "#34D399",
    incomeFill: "rgba(52, 211, 153, 0.15)",
    expenseColor: "#FB7185",
    expenseFill: "rgba(251, 113, 133, 0.15)",
    accentColor: "#8B7CFF"
  };
}

/**
 * Sets active range pill and re-renders cash flow chart.
 */
function setCashFlowRange(range) {
  document.querySelectorAll(".range-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-range") === range);
  });
  renderOverviewCashFlowChart(range);
}

/**
 * Destroys a chart instance safely if it exists.
 */
function destroyChart(key) {
  if (chartInstances[key]) {
    try {
      chartInstances[key].destroy();
    } catch (e) {
      console.warn("Error destroying chart:", e);
    }
    chartInstances[key] = null;
  }
}

/**
 * Renders or updates the Cash Flow chart on the Overview dashboard.
 * @param {string} range '7d' | '30d' | '90d' | '12m'
 */
function renderOverviewCashFlowChart(range = "30d") {
  const canvas = document.getElementById("cash-flow-canvas");
  if (!canvas || typeof Chart === "undefined") return;

  destroyChart("overviewCashFlow");

  const colors = getChartThemeColors();
  const timeline = getCashFlowTimeline(range);

  // Check if data is completely empty
  const hasData = timeline.income.some(v => v > 0) || timeline.expense.some(v => v > 0);
  const emptyNotice = document.getElementById("cash-flow-empty");
  if (emptyNotice) {
    emptyNotice.style.display = hasData ? "none" : "flex";
  }

  const ctx = canvas.getContext("2d");
  chartInstances.overviewCashFlow = new Chart(ctx, {
    type: "bar",
    data: {
      labels: timeline.labels,
      datasets: [
        {
          label: "Income",
          data: timeline.income,
          backgroundColor: colors.incomeColor,
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 16
        },
        {
          label: "Expenses",
          data: timeline.expense,
          backgroundColor: colors.expenseColor,
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 16
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: "circle",
            color: colors.textColor,
            font: { family: "Inter", size: 12, weight: 500 },
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y || 0;
              return ` ${context.dataset.label}: ${formatCurrency(val)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: colors.textColor,
            font: { family: "Inter", size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: range === "30d" ? 8 : 12
          }
        },
        y: {
          grid: {
            color: colors.gridColor,
            drawBorder: false
          },
          ticks: {
            color: colors.textColor,
            font: { family: "Inter", size: 11 },
            callback: function(val) {
              if (val >= 100000) return (val / 100000).toFixed(1) + "L";
              if (val >= 1000) return (val / 1000).toFixed(0) + "k";
              return val;
            }
          }
        }
      }
    }
  });
}

/**
 * Renders or updates the Expense Breakdown donut chart on the Overview dashboard.
 */
function renderOverviewBreakdownChart() {
  const canvas = document.getElementById("breakdown-canvas");
  if (!canvas || typeof Chart === "undefined") return;

  destroyChart("overviewBreakdown");

  const colors = getChartThemeColors();
  const breakdown = getCategoryBreakdown("expense");
  const emptyNotice = document.getElementById("breakdown-empty");
  const legendContainer = document.getElementById("breakdown-legend");

  if (!breakdown.items || breakdown.items.length === 0 || breakdown.total === 0) {
    if (emptyNotice) emptyNotice.style.display = "flex";
    if (legendContainer) legendContainer.innerHTML = "";
    canvas.style.display = "none";
    return;
  }

  if (emptyNotice) emptyNotice.style.display = "none";
  canvas.style.display = "block";

  const labels = breakdown.items.map(item => item.name);
  const data = breakdown.items.map(item => item.amount);
  const bgColors = breakdown.items.map(item => item.color);

  const ctx = canvas.getContext("2d");
  chartInstances.overviewBreakdown = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute("data-theme") === "light" ? "#FFFFFF" : "#11182A",
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            label: function(context) {
              const item = breakdown.items[context.dataIndex];
              return ` ${item.name}: ${formatCurrency(item.amount)} (${item.percentage}%)`;
            }
          }
        }
      }
    }
  });

  // Render HTML legend with progress bars below
  if (legendContainer) {
    legendContainer.innerHTML = breakdown.items.slice(0, 5).map(item => `
      <div class="legend-row">
        <div class="legend-label">
          <span class="legend-dot" style="background-color: ${item.color}"></span>
          <span class="legend-name">${item.name}</span>
        </div>
        <div class="legend-values">
          <span class="legend-amount">${formatCurrency(item.amount)}</span>
          <span class="legend-pct">${item.percentage}%</span>
        </div>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${item.percentage}%; background-color: ${item.color}"></div>
      </div>
    `).join("");
  }
}

/**
 * Renders the Analytics deep-dive charts.
 */
function renderAnalyticsCharts() {
  renderAnalyticsMonthlyChart();
  renderAnalyticsCategoryChart();
}

/**
 * Monthly Cash Flow Comparison on Analytics page.
 */
function renderAnalyticsMonthlyChart() {
  const canvas = document.getElementById("analytics-monthly-canvas");
  if (!canvas || typeof Chart === "undefined") return;

  destroyChart("analyticsMonthly");

  const colors = getChartThemeColors();
  const timeline = getCashFlowTimeline("12m");
  const ctx = canvas.getContext("2d");

  chartInstances.analyticsMonthly = new Chart(ctx, {
    type: "bar",
    data: {
      labels: timeline.labels,
      datasets: [
        {
          label: "Total Income",
          data: timeline.income,
          backgroundColor: colors.incomeColor,
          borderRadius: 6,
          maxBarThickness: 24
        },
        {
          label: "Total Expenses",
          data: timeline.expense,
          backgroundColor: colors.expenseColor,
          borderRadius: 6,
          maxBarThickness: 24
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            color: colors.textColor,
            font: { family: "Inter", size: 12 }
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textColor, font: { family: "Inter", size: 11 } }
        },
        y: {
          grid: { color: colors.gridColor, drawBorder: false },
          ticks: {
            color: colors.textColor,
            font: { family: "Inter", size: 11 },
            callback: function(v) {
              if (v >= 100000) return (v / 100000).toFixed(1) + "L";
              if (v >= 1000) return (v / 1000).toFixed(0) + "k";
              return v;
            }
          }
        }
      }
    }
  });
}

/**
 * Category Breakdown Chart on Analytics page.
 */
function renderAnalyticsCategoryChart() {
  const canvas = document.getElementById("analytics-category-canvas");
  if (!canvas || typeof Chart === "undefined") return;

  destroyChart("analyticsCategory");

  const colors = getChartThemeColors();
  const breakdown = getCategoryBreakdown("expense");
  const emptyNotice = document.getElementById("analytics-category-empty");

  if (!breakdown.items || breakdown.items.length === 0) {
    if (emptyNotice) emptyNotice.style.display = "flex";
    canvas.style.display = "none";
    return;
  }

  if (emptyNotice) emptyNotice.style.display = "none";
  canvas.style.display = "block";

  const labels = breakdown.items.map(item => item.name);
  const data = breakdown.items.map(item => item.amount);
  const bgColors = breakdown.items.map(item => item.color);

  const ctx = canvas.getContext("2d");
  chartInstances.analyticsCategory = new Chart(ctx, {
    type: "polarArea",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: bgColors.map(c => c + "CC"),
          borderColor: colors.tooltipBorder,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: colors.textColor,
            font: { family: "Inter", size: 12 },
            boxWidth: 12,
            boxHeight: 12,
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipTitle,
          bodyColor: colors.tooltipBody,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const item = breakdown.items[context.dataIndex];
              return ` ${item.name}: ${formatCurrency(item.amount)} (${item.percentage}%)`;
            }
          }
        }
      },
      scales: {
        r: {
          grid: { color: colors.gridColor },
          angleLines: { color: colors.gridColor },
          ticks: { display: false }
        }
      }
    }
  });
}

/**
 * Updates all existing charts when theme (Dark/Light) changes.
 */
function refreshAllCharts() {
  const activeView = document.querySelector(".nav-item.active")?.getAttribute("data-view") || "overview";
  if (activeView === "overview") {
    const activeRangeBtn = document.querySelector(".range-btn.active");
    const range = activeRangeBtn ? activeRangeBtn.getAttribute("data-range") : "30d";
    renderOverviewCashFlowChart(range);
    renderOverviewBreakdownChart();
  } else if (activeView === "analytics") {
    renderAnalyticsCharts();
  }
}
