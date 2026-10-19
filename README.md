# Ledger — Premium Personal Finance & Expense Tracker

A modern, high-performance personal finance dashboard and expense tracker built as a standalone **Fintech SaaS** web application using **HTML5, CSS3, and ES6 JavaScript**.

Ledger features a dark-first design system with deep navy surfaces, emerald income accents, coral expense accents, and restrained violet highlights. It operates 100% client-side with privacy-preserving `localStorage` persistence, real-time Chart.js cash flow analytics, and comprehensive transaction filtering.

---

## Key Features

### 1. Overview Dashboard
- **Financial Summary Cards**: Real-time calculations for Total Balance, Total Income, Total Expenses, and Savings Rate.
- **Cash Flow Visualizer**: Interactive income vs. expenses chart supporting 7-day, 30-day, 90-day, and 12-month rolling ranges.
- **Expense Breakdown Donut**: Category distribution with percentage share, amounts, and progress indicators.
- **Recent Transactions Feed**: Fast snapshot of latest financial entries with quick actions.
- **Smart Empty States**: Contextual onboarding guidance with 1-click realistic demo data loading.

### 2. Modern Navigation & Sidebar Architecture
- **Frosted Glassmorphism**: High-performance backdrop blur (`backdrop-filter: blur(24px) saturate(180%)`) with specular borders and ambient glowing brand accents.
- **Dynamic Breadcrumbs & Live Cash Flow Chip**: Top navbar with contextual route breadcrumbs and real-time net cash flow indicator dot.
- **Global Command & Search Bar**: Quick search modal accessible directly from the header (`⌘K` / `Ctrl+K`) that searches across all transaction properties.
- **Live Vault Storage Monitor**: Real-time record counter and storage utilization progress track in the sidebar footer.
- **1-Click Vault Backup**: Instant JSON database download directly from the sidebar footer.
- **Keyboard Shortcuts**: Power-user productivity shortcuts across all pages.

| Shortcut | Action |
|:---|:---|
| <kbd>⌘</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Focus global transaction search bar |
| <kbd>N</kbd> | Open **Add Transaction** modal |
| <kbd>1</kbd> | Navigate to **Overview** |
| <kbd>2</kbd> | Navigate to **Transactions** |
| <kbd>3</kbd> | Navigate to **Analytics** |
| <kbd>4</kbd> | Navigate to **Settings** |
| <kbd>Esc</kbd> | Close open modals & mobile navigation drawer |

### 3. Transaction Management
- **Search & Multi-Filter Engine**: Real-time search across descriptions, categories, and notes. Filter by Type (All / Income / Expense), Category, Period (All Time, This Month, Last 30 Days, Last Month, This Year), and Sort order (Date, Amount).
- **Edit & Delete Workflows**: In-place modal editing with category suggestion switching and custom confirmation dialogs for deletions.
- **Categorization**: Pre-configured categories for Expenses (Food, Transport, Shopping, Bills, Education, Health, Entertainment, Rent, Other) and Income (Salary, Freelance, Business, Investment, Gift, Other).

### 4. Analytics Suite
- **12-Month Trends**: Historical monthly income vs. expenses comparative bar chart.
- **Category Dispersion**: Multi-dimensional polar area chart for expense distribution.
- **Financial KPIs**: Net Cash Flow, Savings Efficiency, Top Expense Category, and Average Transaction Value.
- **Comprehensive Expense Table**: Itemized category expenditure breakdown.

### 5. Settings & Data Portability
- **Currency Preferences**: Native formatting support for Indian Rupee (₹ INR default), US Dollar ($ USD), Euro (€ EUR), British Pound (£ GBP), and Japanese Yen (¥ JPY).
- **Data Export & Backup**: Export records to CSV (Excel compatible) or JSON database backup.
- **Restore & Demo**: JSON file import and 1-click demo data population.
- **Theme Selection**: Dark mode (default) and Light mode with persistent preferences and zero theme flash on load.
- **URL Parameters**: Test & deep link states with `?demo=1`, `?theme=light|dark`, and `?sidebar=open`.

---

## Project Structure

```text
expense-tracker/
│
├── index.html                  # Application shell & semantic SPA markup
├── LICENSE                     # MIT License
├── README.md                   # Project documentation
│
├── css/
│   └── style.css               # Design system tokens, layouts, cards & animations
│
├── js/
│   ├── storage.js              # LocalStorage persistence, migration & settings
│   ├── state.js                # State management, analytics logic & demo data
│   ├── charts.js               # Theme-aware Chart.js visualizers & lifecycle
│   ├── theme.js                # Dark-first theme engine & event handlers
│   ├── ui.js                   # SPA view routing, modal system, tables & toasts
│   └── main.js                 # Application entry point & event orchestration
│
└── .github/                    # Issue & pull request templates
```

---

## Technologies Used

- **HTML5**: Semantic document structure, dialogs, and accessible ARIA attributes.
- **Vanilla CSS3**: Design system with CSS custom properties, responsive flexbox & CSS grid, micro-transitions.
- **JavaScript (ES6+)**: Modular clientside architecture, event handling, data calculation logic.
- **Chart.js**: Cash flow charts and donut/polar visualizers.
- **Lucide Icons**: Clean fintech iconography.
- **Google Fonts**: Inter font family for typographic clarity.

---

## Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/milind-T07/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Run Locally
Open `index.html` directly in any modern browser, or serve using a lightweight static server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx -y serve .
```

Open `http://localhost:8000` in your web browser.

---

## Author

**Milind Thakare**
GitHub: [@milind-T07](https://github.com/milind-T07)

---

## License

This project is licensed under the [MIT License](LICENSE).
