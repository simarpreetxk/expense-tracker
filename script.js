// Render daily chart
document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    expenses: [],
    categories: [],
    budgets: [],
    defaultCategories: [
      "Food",
      "Groceries",
      "Transportation",
      "Entertainment",
      "Shopping",
      "Utilities",
      "Housing",
      "Healthcare",
      "Education",
      "Personal Care",
      "Others",
    ],
  }

  // DOM Elements
  const elements = {
    tabs: document.querySelectorAll(".tab-btn"),
    tabContents: document.querySelectorAll(".tab-content"),
    expenseForm: document.getElementById("expense-form"),
    categorySelect: document.getElementById("category"),
    budgetCategorySelect: document.getElementById("budget-category"),
    todayTotal: document.getElementById("today-total"),
    weekTotal: document.getElementById("week-total"),
    monthTotal: document.getElementById("month-total"),
    expenseList: document.getElementById("expense-list"),
    categoryChart: document.getElementById("category-chart"),
    dailyChart: document.getElementById("daily-chart"),
    exportBtn: document.getElementById("export-btn"),
    addCategoryBtn: document.getElementById("add-category-btn"),
    saveCategoryBtn: document.getElementById("save-category-btn"),
    newCategoryName: document.getElementById("new-category-name"),
    categoriesList: document.getElementById("categories-list"),
    addBudgetBtn: document.getElementById("add-budget-btn"),
    addBudgetForm: document.getElementById("add-budget-form"),
    saveBudgetBtn: document.getElementById("save-budget-btn"),
    cancelBudgetBtn: document.getElementById("cancel-budget-btn"),
    budgetAmount: document.getElementById("budget-amount"),
    budgetList: document.getElementById("budget-list"),
    backupBtn: document.getElementById("backup-btn"),
    restoreBtn: document.getElementById("restore-btn"),
    clearBtn: document.getElementById("clear-btn"),
    modal: document.getElementById("modal"),
    modalContent: document.getElementById("modal-content"),
    closeModal: document.querySelector(".close"),
  }

  // Chart instances
  let categoryChartInstance = null
  let dailyChartInstance = null

  // Initialize the app
  function init() {
    loadData()
    setupEventListeners()
    setupDefaultCategories()
    populateCategorySelects()
    renderDashboard()
    renderBudgets()
    renderCategoriesList()

    // Set default date to today
    document.getElementById("date").valueAsDate = new Date()
  }

  // Load data from localStorage
  function loadData() {
    state.expenses = JSON.parse(localStorage.getItem("expenses") || "[]")
    state.categories = JSON.parse(localStorage.getItem("categories") || "[]")
    state.budgets = JSON.parse(localStorage.getItem("budgets") || "[]")
  }

  // Set up default categories if none exist
  function setupDefaultCategories() {
    if (state.categories.length === 0) {
      state.categories = state.defaultCategories
      saveCategories()
    }
  }

  // Save expenses to localStorage
  function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(state.expenses))
  }

  // Save categories to localStorage
  function saveCategories() {
    localStorage.setItem("categories", JSON.stringify(state.categories))
  }

  // Save budgets to localStorage
  function saveBudgets() {
    localStorage.setItem("budgets", JSON.stringify(state.budgets))
  }

  // Setup event listeners
  function setupEventListeners() {
    // Tab navigation
    elements.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        elements.tabs.forEach((t) => t.classList.remove("active"))
        elements.tabContents.forEach((c) => c.classList.remove("active"))

        tab.classList.add("active")
        const tabName = tab.getAttribute("data-tab")
        document.getElementById(tabName).classList.add("active")

        // Render data when switching to dashboard or budgets tab
        if (tabName === "dashboard") {
          renderDashboard()
        } else if (tabName === "budgets") {
          renderBudgets()
        }
      })
    })

    // Expense form submission
    elements.expenseForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const amount = parseFloat(document.getElementById("amount").value)
      const category = document.getElementById("category").value
      const note = document.getElementById("note").value
      const date = document.getElementById("date").value
      const paymentMethod = document.getElementById("payment-method").value

      addExpense(amount, category, note, date, paymentMethod)
      elements.expenseForm.reset()
      document.getElementById("date").valueAsDate = new Date()

      // Show a confirmation message
      showNotification("Expense added successfully")
    })

    // Category management
    elements.addCategoryBtn.addEventListener("click", () => {
      showModal(
        "Add New Category",
        `
                    <div class="form-group">
                        <label for="modal-category-name">Category Name</label>
                        <input type="text" id="modal-category-name" required>
                    </div>
                    <button id="modal-save-category" class="primary-btn">Save Category</button>
                `
      )

      document
        .getElementById("modal-save-category")
        .addEventListener("click", () => {
          const categoryName = document
            .getElementById("modal-category-name")
            .value.trim()
          if (categoryName) {
            addCategory(categoryName)
            hideModal()
          }
        })
    })

    elements.saveCategoryBtn.addEventListener("click", () => {
      const categoryName = elements.newCategoryName.value.trim()
      if (categoryName) {
        addCategory(categoryName)
        elements.newCategoryName.value = ""
      }
    })

    // Budget management
    elements.addBudgetBtn.addEventListener("click", () => {
      elements.addBudgetForm.classList.remove("hidden")
    })

    elements.saveBudgetBtn.addEventListener("click", () => {
      const category = elements.budgetCategorySelect.value
      const amount = parseFloat(elements.budgetAmount.value)

      if (category && amount > 0) {
        addBudget(category, amount)
        elements.addBudgetForm.classList.add("hidden")
        elements.budgetAmount.value = ""
        renderBudgets()
      }
    })

    elements.cancelBudgetBtn.addEventListener("click", () => {
      elements.addBudgetForm.classList.add("hidden")
      elements.budgetAmount.value = ""
    })

    // Data export
    elements.exportBtn.addEventListener("click", exportData)

    // Data management
    elements.backupBtn.addEventListener("click", backupData)
    elements.restoreBtn.addEventListener("click", showRestoreDataForm)
    elements.clearBtn.addEventListener("click", showClearDataConfirmation)

    // Modal
    elements.closeModal.addEventListener("click", hideModal)
    window.addEventListener("click", (e) => {
      if (e.target === elements.modal) {
        hideModal()
      }
    })
  }

  // Add a new expense
  function addExpense(amount, category, note, date, paymentMethod) {
    state.expenses.push({
      id: Date.now(),
      amount,
      category,
      note,
      date,
      paymentMethod,
      timestamp: new Date().toISOString(),
    })

    saveExpenses()
    renderDashboard()
  }

  // Add a new category
  function addCategory(name) {
    if (!state.categories.includes(name)) {
      state.categories.push(name)
      saveCategories()
      populateCategorySelects()
      renderCategoriesList()
    }
  }

  // Delete a category
  function deleteCategory(name) {
    const index = state.categories.indexOf(name)
    if (index !== -1) {
      state.categories.splice(index, 1)
      saveCategories()
      populateCategorySelects()
      renderCategoriesList()
    }
  }

  // Add a new budget
  function addBudget(category, amount) {
    // Check if budget already exists for this category
    const existingIndex = state.budgets.findIndex(
      (b) => b.category === category
    )

    if (existingIndex !== -1) {
      // Update existing budget
      state.budgets[existingIndex].amount = amount
    } else {
      // Add new budget
      state.budgets.push({
        category,
        amount,
      })
    }

    saveBudgets()
  }

  // Delete a budget
  function deleteBudget(category) {
    const index = state.budgets.findIndex((b) => b.category === category)
    if (index !== -1) {
      state.budgets.splice(index, 1)
      saveBudgets()
      renderBudgets()
    }
  }

  // Populate category selects
  function populateCategorySelects() {
    const categoryOptions = state.categories
      .map((category) => `<option value="${category}">${category}</option>`)
      .join("")

    elements.categorySelect.innerHTML = categoryOptions

    if (elements.budgetCategorySelect) {
      elements.budgetCategorySelect.innerHTML = categoryOptions
    }
  }

  // Render the dashboard
  function renderDashboard() {
    renderSummaryCards()
    renderExpenseList()
    renderCharts()
  }

  // Render summary cards
  function renderSummaryCards() {
    const today = new Date().toISOString().split("T")[0]

    // Today's total
    const todayExpenses = state.expenses.filter((e) => e.date === today)
    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
    elements.todayTotal.textContent = `₹${todayTotal.toFixed(2)}`

    // This week's total
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const weekExpenses = state.expenses.filter(
      (e) => new Date(e.date) >= weekStart
    )
    const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0)
    elements.weekTotal.textContent = `₹${weekTotal.toFixed(2)}`

    // This month's total
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthExpenses = state.expenses.filter(
      (e) => new Date(e.date) >= monthStart
    )
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    elements.monthTotal.textContent = `₹${monthTotal.toFixed(2)}`
  }

  // Render expense list
  function renderExpenseList() {
    // Sort expenses by date (newest first)
    const sortedExpenses = [...state.expenses].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )

    // Get most recent 10 expenses
    const recentExpenses = sortedExpenses.slice(0, 10)

    elements.expenseList.innerHTML =
      recentExpenses.length === 0
        ? "<p>No expenses recorded yet.</p>"
        : recentExpenses
            .map((expense) => {
              const date = new Date(expense.date).toLocaleDateString()
              return `
                        <div class="expense-item">
                            <div class="expense-left">
                                <div>${expense.note || expense.category}</div>
                                <div class="expense-category">${
                                  expense.category
                                }</div>
                                <div class="expense-date">${date} · ${
                expense.paymentMethod
              }</div>
                            </div>
                            <div class="expense-amount">₹${expense.amount.toFixed(
                              2
                            )}</div>
                        </div>
                    `
            })
            .join("")
  }

  // Render charts
  function renderCharts() {
    renderCategoryChart()
    renderDailyChart()
  }

  // Render category chart
  function renderCategoryChart() {
    // Group expenses by category
    const categoryData = {}

    state.expenses.forEach((expense) => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = 0
      }
      categoryData[expense.category] += expense.amount
    })

    const labels = Object.keys(categoryData)
    const data = Object.values(categoryData)

    // Generate colors
    const colors = generateColors(labels.length)

    if (categoryChartInstance) {
      categoryChartInstance.destroy()
    }

    const ctx = elements.categoryChart.getContext("2d")
    categoryChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "right",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || ""
                const value = context.raw || 0
                return `${label}: ₹${value.toFixed(2)}`
              },
            },
          },
        },
      },
    })
  }

  // Render daily chart
  function renderDailyChart() {
    // Get the last 7 days
    const days = []
    const dailyTotals = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayExpenses = state.expenses.filter((e) => e.date === dateStr)
      const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)

      // Format date as "Mon", "Tue", etc.
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

      days.push(dayName)
      dailyTotals.push(dayTotal)
    }

    if (dailyChartInstance) {
      dailyChartInstance.destroy()
    }

    const ctx = elements.dailyChart.getContext("2d")
    dailyChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: days,
        datasets: [
          {
            label: "Daily Spending",
            data: dailyTotals,
            backgroundColor: "rgba(66, 133, 244, 0.7)",
            borderColor: "rgba(66, 133, 244, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "₹" + value
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return "₹" + context.raw.toFixed(2)
              },
            },
          },
        },
      },
    })
  }

  // Render budgets
  function renderBudgets() {
    if (!elements.budgetList) return

    // Calculate spending for current month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0)

    const monthExpenses = state.expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate >= monthStart && expenseDate <= monthEnd
    })

    // Group expenses by category
    const categorySpending = {}
    monthExpenses.forEach((expense) => {
      if (!categorySpending[expense.category]) {
        categorySpending[expense.category] = 0
      }
      categorySpending[expense.category] += expense.amount
    })

    if (state.budgets.length === 0) {
      elements.budgetList.innerHTML =
        "<p>No budgets set. Add your first budget!</p>"
      return
    }

    elements.budgetList.innerHTML = state.budgets
      .map((budget) => {
        const spent = categorySpending[budget.category] || 0
        const percentage = (spent / budget.amount) * 100
        const remaining = budget.amount - spent

        let statusClass = ""
        if (percentage >= 90) {
          statusClass = "danger"
        } else if (percentage >= 70) {
          statusClass = "warning"
        }

        return `
                    <div class="budget-item">
                        <div class="budget-info">
                            <div class="budget-category">${
                              budget.category
                            }</div>
                            <div class="budget-limit">Budget: ₹${budget.amount.toFixed(
                              2
                            )}</div>
                        </div>
                        <div class="budget-progress">
                            <div class="budget-progress-bar ${statusClass}" style="width: ${Math.min(
          100,
          percentage
        )}%"></div>
                        </div>
                        <div class="budget-status">
                            <div>Spent: ₹${spent.toFixed(2)}</div>
                            <div>Remaining: ₹${remaining.toFixed(2)}</div>
                        </div>
                        <div class="button-group" style="justify-content: flex-end;">
                            <button class="small-btn danger-btn" onclick="deleteBudgetHandler('${
                              budget.category
                            }')">Delete</button>
                        </div>
                    </div>
                `
      })
      .join("")

    // Add event handler for delete buttons
    window.deleteBudgetHandler = function (category) {
      deleteBudget(category)
    }
  }

  // Render categories list
  function renderCategoriesList() {
    if (!elements.categoriesList) return

    elements.categoriesList.innerHTML = state.categories
      .map((category) => {
        return `
                    <div class="category-item">
                        <div>${category}</div>
                        <button class="small-btn danger-btn" onclick="deleteCategoryHandler('${category}')">Delete</button>
                    </div>
                `
      })
      .join("")

    // Add event handler for delete buttons
    window.deleteCategoryHandler = function (category) {
      // Check if category is used in any expense
      const isUsed = state.expenses.some((e) => e.category === category)

      if (isUsed) {
        showNotification("Cannot delete: category is used in expenses", "error")
      } else {
        deleteCategory(category)
      }
    }
  }

  // Export data to CSV
  function exportData() {
    const expenses = state.expenses
    if (expenses.length === 0) {
      showNotification("No data to export", "error")
      return
    }

    const headers = ["Date", "Category", "Amount", "Note", "Payment Method"]

    let csvContent = headers.join(",") + "\n"

    expenses.forEach((expense) => {
      const row = [
        expense.date,
        `"${expense.category}"`,
        expense.amount,
        `"${expense.note.replace(/"/g, '""')}"`,
        `"${expense.paymentMethod}"`,
      ]
      csvContent += row.join(",") + "\n"
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `expenses_${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Backup data
  function backupData() {
    const backup = {
      expenses: state.expenses,
      categories: state.categories,
      budgets: state.budgets,
      timestamp: new Date().toISOString(),
      version: "1.0",
    }

    const jsonString = JSON.stringify(backup)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `expense_tracker_backup_${new Date().toISOString().split("T")[0]}.json`
    )

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showNotification("Backup created successfully")
  }

  // Show restore data form
  function showRestoreDataForm() {
    showModal(
      "Restore Data",
      `
                <p>Upload your backup file:</p>
                <div class="form-group">
                    <input type="file" id="restore-file" accept=".json">
                </div>
                <button id="modal-restore-btn" class="primary-btn">Restore</button>
            `
    )

    document
      .getElementById("modal-restore-btn")
      .addEventListener("click", () => {
        const fileInput = document.getElementById("restore-file")
        if (fileInput.files.length === 0) {
          showNotification("Please select a file", "error")
          return
        }

        const file = fileInput.files[0]
        const reader = new FileReader()

        reader.onload = function (e) {
          try {
            const backup = JSON.parse(e.target.result)

            // Validate backup structure
            if (!backup.expenses || !backup.categories || !backup.budgets) {
              throw new Error("Invalid backup file")
            }

            // Restore data
            state.expenses = backup.expenses
            state.categories = backup.categories
            state.budgets = backup.budgets

            // Save to localStorage
            saveExpenses()
            saveCategories()
            saveBudgets()

            // Refresh UI
            populateCategorySelects()
            renderDashboard()
            renderBudgets()
            renderCategoriesList()

            hideModal()
            showNotification("Data restored successfully")
          } catch (error) {
            showNotification("Invalid backup file", "error")
          }
        }

        reader.readAsText(file)
      })
  }

  // Show clear data confirmation
  function showClearDataConfirmation() {
    showModal(
      "Clear All Data",
      `
                <p>Are you sure you want to delete all your data? This action cannot be undone.</p>
                <div class="button-group">
                    <button id="modal-clear-confirm" class="danger-btn">Yes, Delete Everything</button>
                    <button id="modal-clear-cancel" class="secondary-btn">Cancel</button>
                </div>
            `
    )

    document
      .getElementById("modal-clear-confirm")
      .addEventListener("click", () => {
        // Clear all data
        state.expenses = []
        saveExpenses()

        // Keep categories but reset budgets
        state.budgets = []
        saveBudgets()

        // Refresh UI
        renderDashboard()
        renderBudgets()

        hideModal()
        showNotification("All data has been cleared")
      })

    document
      .getElementById("modal-clear-cancel")
      .addEventListener("click", hideModal)
  }

  // Show modal
  function showModal(title, content) {
    elements.modalContent.innerHTML = `
                <h3>${title}</h3>
                ${content}
            `
    elements.modal.style.display = "block"
  }

  // Hide modal
  function hideModal() {
    elements.modal.style.display = "none"
  }

  // Show notification
  function showNotification(message, type = "success") {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message

    document.body.appendChild(notification)

    // Animate
    setTimeout(() => {
      notification.classList.add("show")
    }, 10)

    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }

  // Generate colors for charts
  function generateColors(count) {
    const baseColors = [
      "rgba(66, 133, 244, 0.8)", // Google Blue
      "rgba(52, 168, 83, 0.8)", // Google Green
      "rgba(251, 188, 5, 0.8)", // Google Yellow
      "rgba(234, 67, 53, 0.8)", // Google Red
      "rgba(103, 58, 183, 0.8)", // Purple
      "rgba(0, 188, 212, 0.8)", // Cyan
      "rgba(255, 152, 0, 0.8)", // Orange
      "rgba(233, 30, 99, 0.8)", // Pink
      "rgba(0, 150, 136, 0.8)", // Teal
      "rgba(121, 85, 72, 0.8)", // Brown
    ]

    const colors = []
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length])
    }

    return colors
  }

  // Add stylesheet for notifications
  function addNotificationStyles() {
    const style = document.createElement("style")
    style.textContent = `
                .notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    background-color: var(--secondary-color);
                    color: white;
                    border-radius: var(--radius);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 1000;
                }
                
                .notification.show {
                    transform: translateY(0);
                    opacity: 1;
                }
                
                .notification.error {
                    background-color: var(--danger-color);
                }
            `
    document.head.appendChild(style)
  }

  // Initialize the app
  addNotificationStyles()
  init()
})
