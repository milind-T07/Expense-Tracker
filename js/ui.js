/* ============================================
   UI.JS — Expense Tracker DOM Rendering
   ========================================== */

// sanitizeHTML() - Prevents XSS by escaping HTML special characters
function sanitizeHTML(rawString) {
  const div = document.createElement("div");
  div.textContent = rawString;
  return div.innerHTML;
}

// renderSummary() - Updates the income, expense, and balance display
function renderSummary() {
  const totalIncome = calculateTotalIncome();
  const totalExpense = calculateTotalExpense();
  const balance = calculateBalance();

  document.getElementById("total-income").textContent = formatCurrency(totalIncome);
  document.getElementById("total-expense").textContent = formatCurrency(totalExpense);
  document.getElementById("balance").textContent = formatCurrency(balance);

  // Change balance color based on positive/negative
  const balanceElement = document.getElementById("balance");
  if (balance >= 0) {
    balanceElement.style.color = "var(--color-success)";
  } else {
    balanceElement.style.color = "var(--color-danger)";
  }
}

// renderTransactions() - Renders the transaction list to the DOM
function renderTransactions() {
  const listContainer = document.getElementById("transaction-list");

  // Update transaction count
  const countElement = document.getElementById("transaction-count");
  if (countElement) {
    countElement.textContent = transactions.length + " transaction" + (transactions.length !== 1 ? "s" : "");
  }

  // If no transactions, show empty state
  if (transactions.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <p>No transactions yet. Add your first transaction above!</p>
      </div>
    `;
    return;
  }

  // Build HTML for each transaction
  let listHTML = "";
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const isIncome = transaction.type === "income";
    const sign = isIncome ? "+" : "-";
    const typeClass = isIncome ? "income" : "expense";

    // SECURITY: Sanitize user input before rendering
    const safeDescription = sanitizeHTML(transaction.description);

    listHTML += `
      <div class="transaction-item ${typeClass} fade-in" data-id="${transaction.id}">
        <div class="transaction-info">
          <span class="transaction-description">${safeDescription}</span>
          <span class="transaction-amount ${typeClass}">
            ${sign}${formatCurrency(transaction.amount)}
          </span>
        </div>
        <div class="transaction-actions">
          <button class="btn btn-small btn-secondary edit-btn" data-id="${transaction.id}">
            Edit
          </button>
          <button class="btn btn-small btn-danger delete-btn" data-id="${transaction.id}">
            Delete
          </button>
        </div>
      </div>
    `;
  }

  listContainer.innerHTML = listHTML;

  // Add event listeners to edit and delete buttons
  addTransactionEventListeners();
}

// addTransactionEventListeners() - Adds click listeners to edit/delete buttons
function addTransactionEventListeners() {
  // Delete buttons
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const id = parseInt(button.getAttribute("data-id"));
      handleDeleteTransaction(id);
    });
  });

  // Edit buttons
  const editButtons = document.querySelectorAll(".edit-btn");
  editButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const id = parseInt(button.getAttribute("data-id"));
      handleEditTransaction(id);
    });
  });
}

// handleDeleteTransaction() - Deletes a transaction and re-renders the UI
function handleDeleteTransaction(id) {
  // Confirm before deleting
  const confirmed = confirm("Are you sure you want to delete this transaction?");
  if (confirmed) {
    deleteTransaction(id);
    renderTransactions();
    renderSummary();
  }
}

// handleEditTransaction() - Fills the form with transaction data for editing
function handleEditTransaction(id) {
  // Find the transaction to edit
  let transactionToEdit = null;
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].id === id) {
      transactionToEdit = transactions[i];
      break;
    }
  }

  if (transactionToEdit === null) {
    return;
  }

  // Fill the form with existing values
  document.getElementById("description").value = transactionToEdit.description;
  document.getElementById("amount").value = transactionToEdit.amount;
  document.getElementById("type").value = transactionToEdit.type;

  // Change submit button to "Update"
  const submitButton = document.getElementById("submit-btn");
  submitButton.textContent = "Update Transaction";
  submitButton.setAttribute("data-editing-id", id);

  // Scroll to form
  document.getElementById("transaction-form").scrollIntoView({ behavior: "smooth" });
}

// handleFormSubmit() - Handles the form submission for adding or updating a transaction
function handleFormSubmit(event) {
  event.preventDefault();

  // Clear any previous errors
  clearFormErrors();

  // Get form values
  const description = document.getElementById("description").value.trim();
  const amountInput = document.getElementById("amount").value.trim();
  const type = document.getElementById("type").value;

  // Validate inputs
  const isValid = validateForm(description, amountInput);
  if (!isValid) {
    return;
  }

  // Convert amount to a number
  const amount = parseFloat(amountInput);

  // Check if we're editing or adding
  const submitButton = document.getElementById("submit-btn");
  const editingId = submitButton.getAttribute("data-editing-id");

  if (editingId) {
    // Update existing transaction
    updateTransaction(parseInt(editingId), description, amount, type);
    submitButton.textContent = "Add Transaction";
    submitButton.removeAttribute("data-editing-id");
  } else {
    // Add new transaction
    addTransaction(description, amount, type);
  }

  // Clear the form
  document.getElementById("transaction-form").reset();

  // Re-render the UI
  renderTransactions();
  renderSummary();
}

// validateForm() - Validates the transaction form inputs
function validateForm(description, amountInput) {
  let isValid = true;

  if (description === "") {
    showFormError("description", "Please enter a description.");
    isValid = false;
  }

  if (amountInput === "") {
    showFormError("amount", "Please enter an amount.");
    isValid = false;
  } else if (isNaN(parseFloat(amountInput)) || parseFloat(amountInput) <= 0) {
    showFormError("amount", "Please enter a valid positive number.");
    isValid = false;
  }

  return isValid;
}

// showFormError() - Displays an error message below a form field
function showFormError(fieldId, message) {
  const field = document.getElementById(fieldId);
  field.classList.add("error");

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  field.parentNode.appendChild(errorDiv);
}

// clearFormErrors() - Removes all error messages from the form
function clearFormErrors() {
  const errors = document.querySelectorAll(".error-message");
  errors.forEach(function (el) { el.remove(); });

  const errorFields = document.querySelectorAll(".error");
  errorFields.forEach(function (el) { el.classList.remove("error"); });
}

// formatCurrency() - Formats a number as currency string
function formatCurrency(amount) {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
