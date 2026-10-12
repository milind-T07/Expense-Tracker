/* ============================================
   STATE.JS — Expense Tracker State Management
   ============================================ */

// Main array that holds all transactions
// Each transaction is an object: { id, description, amount, type }
let transactions = [];

// initializeTransactions() - Loads saved transactions from localStorage on app start
function initializeTransactions() {
  transactions = loadTransactions();
}

// addTransaction() - Create a new transaction and adds it to the array
function addTransaction(description, amount, type) {
  // Create a unique ID using the current timestamp
  const newTransaction = {
    id: Date.now(),
    description: description,
    amount: amount,
    type: type
  };

  // Add the new transactions to the array
  transactions.push(newTransaction);

  // Save updated array to localStorage
  saveTransactions(transactions);

  return newTransaction;
}

// deleteTransaction() - Removes a transaction from the array by its ID
function deleteTransaction(id) {
  // Keep all transactions EXCEPT the one with the matching ID
  transactions = transactions.filter(function (transaction) {
    return transaction.id !== id;
  });

  // Save updated array to localStorage
  saveTransactions(transactions);
}

// updateTransactions() - Updates an existing transaction's data
function updateTransaction(id, description, amount, type) {
  // Find the transaction with the matching ID
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].id === id) {
      transactions[i].description = description;
      transactions[i].amount = amount;
      transactions[i].type = type;
      break;
    }
  }

  // Save update array to localStorage
  saveTransactions(transactions);
}

// calculateTotalIncome() - Use filter() + reduce() to sum all income
function calculateTotalIncome() {
  // filter() keeps only income transactions
  const incomeOnly = transactions.filter(function (t) {
    return t.type === "income";
  });

  // reduce() add up to  the amounts, starting from 0
  const total = incomeOnly.reduce(function (sum, t) {
    return sum + t.amount;
  }, 0);

  return total;
}

// calculateTotalExpense() - Uses filter() + reduce() to sum all expenses
function calculateTotalExpense() {
  // filter() keeps only expense transaction
  const expenseOnly = transactions.filter(function (t) {
    return t.type === "expense";
  });

  // reduce() adds up to the amount, starting from 0
  const total = expenseOnly.reduce(function (sum, t) {
    return sum + t.amount;
  }, 0);

  return total;
}

// calculateBalance() - Calculates current balance (income minus expenses)
function calculateBalance() {
  const totalIncome = calculateTotalIncome();
  const totalExpense = calculateTotalExpense();
  const balance = totalIncome - totalExpense;
  return balance;
}
