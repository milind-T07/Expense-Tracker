/* ============================================
   STORAGE.JS — Expense Tracker localStorage
   ============================================*/

// Key used to store transactions in localStorage
const STORAGE_KEY = "expense-tracker-transactions";

// loadTransactions() - Reads transactions from localStorage
function loadTransactions() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    // If nothing is saved, return an empty array
    if (savedData === null) {
      return [];
    }

    // Parse the JSON string back into a JavaScript array
    const transactions = JSON.parse(savedData);
    return transactions;
  } catch (error) {
    // If localStorage is disabled or data is corrupted
    console.error("Error loading transactions:", error);
    return [];
  }
}

// saveTransactions() - Saves the transactions array to localStorage
function saveTransactions(transactions) {
  try {
    const jsonString = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (error) {
    // If localStorage is full or disabled
    console.error("Error saving transactions:", error);
    alert("Unable to save data. Your browser storage may be full or disabled.");
  }
}
