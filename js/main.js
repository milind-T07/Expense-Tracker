/* ============================================
   MAIN.JS — Expense Tracker Entry Points
   ============================================ */

document.addEventListener("DOMContentLoaded", function () {
  // Step 1: Load any previously save transactions from localStorage
  initializeTransactions();

  // Step 2: Render the transaction list and summary
  renderTransactions();
  renderSummary();

  // Step 3: Set up the form submission handler
  const form = document.getElementById("transaction-form");
  form.addEventListener("submit", handleFormSubmit);
});
