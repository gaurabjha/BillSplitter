# Bill Splitter - Project Context & Structure

## 📋 Project Overview

**Bill Splitter** is a web-based application that simplifies splitting bills among friends and family. It calculates the minimum cash flow required to settle all debts among multiple people, making it easy to figure out who owes whom and how much.

### 🎯 Core Purpose
- Enable users to split bills efficiently among multiple participants
- Automatically calculate settlement payments to minimize transactions
- Provide a user-friendly interface for expense tracking and reporting

---

## 🏗️ Project Architecture

### Technology Stack
```
Frontend Framework:  Bootstrap 5 + jQuery 3.4.1
UI Libraries:        Select2 4.1.0 (multi-select dropdowns)
Icons:              Font Awesome 5.14.0
Language:           JavaScript (Vanilla)
Styling:            CSS3 + Bootstrap Classes
```

### Directory Structure
```
BillSplitter/
├── index.html                          # Main application page
├── README.md                           # Project documentation
├── resources/
│   ├── js/
│   │   ├── AddExpense.js              # Expense management logic
│   │   └── split_algo.js              # Bill settlement algorithm
│   └── images/
│       └── logo_info.txt
├── .git/                              # Git version control
├── .gitignore                         # Git ignore rules
├── .vscode/                           # VS Code settings
├── .idea/                             # IntelliJ IDE settings
└── (backup files: index copy.html, test.html, BootStrapTutorial.html)
```

---

## 🔄 Application Workflow

### 1️⃣ **Bill Setup Phase**
**User Actions:**
- Enter a bill name (e.g., "Dinner", "Trip Expenses")
- Select multiple participants using Select2 multi-select dropdown
- Click "Continue to Add Expenses" button

**Backend Processing:**
- Stores bill name and participants list
- Initializes expense options for the selected members
- Transitions UI from bill details to expense entry view

### 2️⃣ **Expense Entry Phase**
**Expense Table Structure:**
| Column | Purpose |
|--------|---------|
| **Paid By** | Who paid for this expense (dropdown) |
| **Description** | Expense details (e.g., "Appetizers") |
| **Amount** | Total expense amount in currency |
| **Shared By** | Multi-select of who shares this expense |
| **Action** | Delete button to remove expense |

**User Actions:**
- Add expense rows (click "Add New" button)
- Fill in expense details for each transaction
- Select who shares each expense
- Delete incorrectly entered expenses
- Repeat until all expenses are entered

### 3️⃣ **Settlement / Report Phase**
**Report Calculation:**
- Click "View Expense Report" button
- System calculates required cash flows
- Displays settlement instructions (e.g., "John pays $20 to Sarah")

---

## 💾 Core Components & Their Functions

### `index.html` - Main Page Structure

#### Key Elements:
```html
1. Header Section
   - Title: "Bill Splitter"
   - Tagline: "Split your bill, the free and smart way!"

2. Container
   ├── Card: Bill Meta Data
   │   ├── Bill Name Input
   │   ├── Members Multi-select (Select2)
   │   └── "Continue to Add Expenses" Button
   │
   ├── Card: Add Expense (Hidden Initially)
   │   ├── Expense Table
   │   │   └── Columns: Paid By, Description, Amount, Shared By, Action
   │   └── "Add New" Button
   │
   └── Card: Expense Report (Hidden Initially)
       └── Report Display Area (populated by JavaScript)

3. Footer
   - Social media links (Facebook, Twitter, LinkedIn, etc.)
   - Copyright information
```

---

## ⚙️ JavaScript Logic

### `AddExpense.js` - Main Application Logic

#### Key Functions:

**1. `newColumn()`**
- Creates a new expense row in the table
- Initializes Select2 dropdowns for payee and paidFor selections
- Dynamically binds click handlers to delete buttons

**2. `$("#AddExpenseButton").click()`**
- Validates bill name and participant selection
- Generates participant options for all future dropdowns
- Hides bill details card, shows expense entry card
- Adds first expense row

**3. `$("#ExpenseReportButton").click()`**
- Collects all expense data from table rows
- Creates adjacency matrix (graph) representing payment flows
- Calls `calculate()` function with the graph
- Displays settlement report

**4. Delete Row Handler**
- Removes row from DOM when delete button clicked
- Uses event delegation for dynamically added rows

---

### `split_algo.js` - Bill Settlement Algorithm

#### Core Algorithm: Minimum Cash Flow

This implements a **graph-based optimization algorithm** to minimize the number of transactions needed to settle all debts.

**Algorithm Flow:**

```javascript
1. INPUT: Graph matrix where graph[i][j] = amount person i owes person j

2. Calculate net amount for each person:
   amount[p] = sum of debts - sum of credits

3. While there are unsettled amounts:
   a. Find person with max debt (mxDebit)
   b. Find person with max credit (mxCredit)
   c. Settlement = min(debt, credit)
   d. Person with debt pays the settlement amount
   e. Display: "Person A pays X to Person B"
   f. Recursively process remaining amounts

4. OUTPUT: Minimal set of transactions to settle all debts
```

**Key Functions:**

```javascript
getMin(arr)          // Returns index of minimum value
getMax(arr)          // Returns index of maximum value
minOf2(x, y)         // Returns smaller of two numbers
minCashFlowRec(amount)  // Recursive settlement calculator
calculate(graph, names) // Main entry point with display
```

---

## 🎨 Critical Bug Fixes Applied

### Bug #1: Incorrect Paidfor Selector ✅ FIXED
**Issue:** `.paidFor :selected` was selecting from ALL rows instead of current row
**Original Code:**
```javascript
var paidFor = $(".paidFor :selected").map((_, e) => e.value).get();
```
**Fixed Code:**
```javascript
var paidFor = $(tr).find('.paidFor :selected').map((_, e) => e.value).get();
```
**Impact:** Each expense now correctly uses only its own "Shared By" selections

---

## 📊 Data Flow Example

### Scenario: Three Friends Dining
```
Input:
- Members: Alice, Bob, Charlie
- Expenses:
  1. Appetizers (₹300) - paid by Alice, shared by all
  2. Main Course (₹600) - paid by Bob, shared by all
  3. Dessert (₹150) - paid by Charlie, shared by Alice & Bob

Calculation:
- Alice owes: (300/3) + (600/3) + 0 = ₹300
- Bob owes: (300/3) + 0 + (150/2) = ₹175
- Charlie owes: (300/3) + (600/3) + 0 = ₹300

Settlement:
- Alice loses ₹100, receives ₹100 (balanced)
- Bob loses ₹75, receives ₹100 (owes ₹25)
- Charlie loses ₹300, receives ₹0 (owes ₹300)

Output:
- Bob pays Alice ₹25
- Charlie pays Alice ₹100
- Charlie pays Bob ₹75
```

---

## 🎯 Typical Use Cases

1. **Dinner with Friends**
   - Track who paid for appetizers, mains, drinks, dessert
   - Calculate who owes whom at the end of the meal

2. **Group Trip**
   - One person books hotel, others reimburse
   - Another pays for car rental, gas, tolls
   - System settles all accounts automatically

3. **Household Expenses**
   - Roommates sharing utilities, groceries, supplies
   - Track who paid and who should share
   - Monthly settlement calculations

4. **Event Planning**
   - Organize large group events (weddings, conferences)
   - Multiple organizers with different expenses
   - Final settlement report for all participants

---

## 🔧 Current State & Improvements Made

### Recent Enhancements:
✅ Fixed paidFor selector bug (each expense uses correct row data)
✅ Improved bill settlement calculations
✅ Dynamic expense entry system
✅ Real-time report generation
✅ Responsive UI with Bootstrap

### Responsive Behavior:
- ✅ Mobile-friendly layout
- ✅ Bootstrap grid system
- ✅ Flexible tables
- ✅ Touch-friendly buttons

---

## 🚀 How to Use the Application

### Step-by-Step Guide:

1. **Start Application**
   - Open `index.html` in a web browser
   - See "Bill Splitter" header and Bill Details card

2. **Create Bill**
   - Enter bill name (e.g., "Weekend Brunch")
   - Type names in "Add Members" field:
     - Type a name, press Enter to add
     - Repeat for all participants
   - Click "Continue to Add Expenses"

3. **Add Expenses**
   - Table appears with expense rows
   - For each expense:
     - Select who paid (Paid By dropdown)
     - Describe the expense
     - Enter amount
     - Select who shares the cost (checkbox dropdowns)
   - Click "Add New" for additional expenses

4. **View Report**
   - Click "View Expense Report" button
   - System displays settlement instructions
   - Example: "John pays $35 to Sarah"

5. **Start Over**
   - After reviewing, click "Start Over"
   - Clear all data and begin new bill

---

## 📝 Key Technical Notes

### Select2 Integration
- Enables searching and multi-selection for members
- Prevents duplicate selections of same person
- Auto-generates participant options dynamically

### Bootstrap Details
- Container uses Bootstrap grid (responsive)
- Cards for visual organization
- Tables for structured expense data
- Buttons with consistent styling

### Algorithm Efficiency
- Graph-based approach minimizes transactions
- O(n²) time complexity for settlement
- Optimal for any number of participants

---

## 🐛 Testing Scenarios

### Test Case 1: Equal Split
```
2 people, 1 expense of ₹200 paid by person A
Expected: Person B pays ₹100 to Person A
```

### Test Case 2: Multiple Expenses
```
3 people, 3 expenses with different payers
Verify: All debts are settled with minimum transactions
```

### Test Case 3: No Debt
```
If person shares only expenses they paid for
Expected: No settlement needed for that person
```

---

## 📞 Contact & Creator

- **Author:** Gaurab Jha
- **GitHub:** https://github.com/gaurabjha
- **LinkedIn:** https://www.linkedin.com/in/gaurabjha/
- **Email:** gaurabkjha@gmail.com

---

## 📄 License & Credits

- **Bootstrap:** https://getbootstrap.com/
- **jQuery:** https://jquery.com/
- **Select2:** https://select2.org/
- **Font Awesome:** https://fontawesome.com/

---

*Last Updated: April 2026*
*Project Status: Active Development*
