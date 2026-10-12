# Expense Tracker

A simple and responsive Expense Tracker web application built using **HTML, CSS, and JavaScript**. The application allows users to manage income and expenses, calculate balances, and store data locally using browser localStorage.

---

## Features

### Transaction Management

* Add new transactions
* Edit existing transactions
* Delete transactions
* View transaction history

### Financial Summary

* Total Income Calculation
* Total Expense Calculation
* Current Balance Tracking

### Data Persistence

* Saves transactions using localStorage
* Automatically loads saved data on page refresh

### User Interface

* Clean and responsive design
* Mobile-friendly layout
* Dark/Light Theme Toggle

### Validation & Error Handling

* Prevents empty descriptions
* Prevents invalid amounts
* Displays user-friendly validation messages
* Handles localStorage errors gracefully

---

## Project Structure

```text
expense-tracker/
│
├── index.html
├── css/
│   └── style.css
│
├── js/
│   ├── main.js
│   ├── state.js
│   ├── storage.js
│   ├── ui.js
│   └── theme.js
│
└── README.md
```

---

## Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Local Storage API

---

## Application Workflow

1. User enters transaction details.
2. Form validation checks input.
3. Transaction is added to application state.
4. Data is stored in localStorage.
5. UI updates automatically.
6. Income, Expense, and Balance are recalculated.

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/expense-tracker.git
```

### Open Project

```bash
cd expense-tracker
```

Open `index.html` in your browser.

---

## Screenshots

### Dashboard

* Total Income
* Total Expense
* Current Balance

### Transaction History

* Edit Transactions
* Delete Transactions
* View All Records

---

## Future Enhancements

* Transaction Categories
* Search and Filter Transactions
* Export Data to CSV
* Monthly Reports
* Charts and Analytics
* User Authentication

---

## Learning Outcomes

This project demonstrates:

* DOM Manipulation
* CRUD Operations
* State Management
* Event Handling
* Form Validation
* Error Handling
* Local Storage Integration
* Responsive Web Design

---

## Author

Milind Thakare

---

## License

This project is developed for educational and learning purposes.
