import { supabase } from './config.js'

// Transaction add करने का function
export async function addTransaction(text, amount) {
  const { data, error } = await supabase
    .from('transactions') // Supabase में table name
    .insert([{ text, amount }])

  if (error) {
    console.error("Error adding transaction:", error)
  } else {
    console.log("Transaction added:", data)
  }
}

// सभी transactions fetch करने का function
export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
  return data
}

// Example Usage:
// addTransaction("Lunch", -200)
// getTransactions().then(data => console.log(data))


// Application State
let transactions = [];
let budgets = {};
let categories = {
    food: '🍕',
    transport: '🚗',
    entertainment: '🎬',
    bills: '💡',
    shopping: '🛍️',
    health: '🏥',
    education: '📚',
    salary: '💼',
    freelance: '💻',
    investment: '📈',
    other: '📦'
};
let settings = {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    theme: 'gradient',
    language: 'en'
};
let nextId = 1;

// Currency symbols
const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    updateDashboard();
    loadSettings();
    updateCategoriesDropdowns();
});

// Setup event listeners
function setupEventListeners() {
    // Quick form
    document.getElementById('quick-form').addEventListener('submit', addTransaction);

    // Radio buttons for transaction type
    document.getElementById('expense-option').addEventListener('click', () => selectType('expense'));
    document.getElementById('income-option').addEventListener('click', () => selectType('income'));

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = e.currentTarget.getAttribute('onclick').match(/'(.*)'/)[1];
            showSection(sectionName);
        });
    });

    // Filters and search
    document.getElementById('search-transactions').addEventListener('input', filterTransactions);
    document.getElementById('filter-type').addEventListener('change', filterTransactions);
    document.getElementById('filter-category').addEventListener('change', filterTransactions);
    document.getElementById('sort-transactions').addEventListener('change', filterTransactions);
    
    // Budget
    document.querySelector('#budget button.btn-primary').addEventListener('click', setBudget);
    
    // Categories
    document.querySelector('#categories button.btn-primary').addEventListener('click', addCategory);
    
    // Reports
    document.querySelector('#reports button.btn-primary').addEventListener('click', generateReport);
    document.querySelector('.export-options .btn-success').addEventListener('click', () => exportTransactions('csv'));
    document.querySelector('.export-options .btn-primary').addEventListener('click', () => exportTransactions('json'));
    document.querySelector('.export-options .btn-danger').addEventListener('click', clearAllData);
    document.querySelector('#reports .export-options .btn-success').addEventListener('click', () => exportReport('pdf'));
    document.querySelector('#reports .export-options .btn-primary').addEventListener('click', () => exportReport('excel'));
    document.querySelector('#reports .export-options .btn-danger').addEventListener('click', printReport);
    
    // Settings
    document.querySelector('#settings .btn-primary').addEventListener('click', saveSettings);
    document.querySelector('#settings .btn-success').addEventListener('click', backupData);
    document.querySelector('#settings .btn-primary:nth-of-type(2)').addEventListener('click', importData);
    document.querySelector('#settings .btn-danger').addEventListener('click', resetApp);
    
    // Initial display
    showSection('dashboard');
}

// Sidebar functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const activeSection = document.getElementById(sectionName);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.nav-link[onclick*="'${sectionName}'"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Close sidebar on mobile
    closeSidebar();

    // Update section-specific data
    if (sectionName === 'analytics') {
        updateAnalytics();
    } else if (sectionName === 'budget') {
        updateBudgetDisplay();
    } else if (sectionName === 'categories') {
        updateCategoriesDisplay();
    } else if (sectionName === 'transactions') {
        updateTransactionsList();
    }
}

// Transaction type selection
function selectType(type) {
    const expenseOption = document.getElementById('expense-option');
    const incomeOption = document.getElementById('income-option');
    const expenseRadio = document.querySelector('input[value="expense"]');
    const incomeRadio = document.querySelector('input[value="income"]');

    if (type === 'expense') {
        expenseRadio.checked = true;
        expenseOption.classList.add('selected');
        incomeOption.classList.remove('selected');
    } else {
        incomeRadio.checked = true;
        incomeOption.classList.add('selected');
        expenseOption.classList.remove('selected');
    }
}

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    const description = document.getElementById('quick-description').value;
    const amount = parseFloat(document.getElementById('quick-amount').value);
    const category = document.getElementById('quick-category').value;
    const type = document.querySelector('input[name="type"]:checked').value;

    if (!description || isNaN(amount) || amount <= 0 || !category) {
        showNotification('Please fill all fields with valid data.', 'error');
        return;
    }

    const transaction = {
        id: nextId++,
        description,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        category,
        type,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };

    transactions.unshift(transaction);
    saveData();
    updateDashboard();
    updateTransactionsList();

    // Reset form
    document.getElementById('quick-form').reset();
    selectType('expense');

    showNotification('Transaction added successfully!', 'success');
}

// Update dashboard
function updateDashboard() {
    const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

    // This month calculations
    const now = new Date();
    const thisMonth = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });
    const monthBalance = thisMonth.reduce((sum, t) => sum + t.amount, 0);

    const currencySymbol = currencySymbols[settings.currency];

    document.getElementById('total-balance').textContent = `${currencySymbol}${totalBalance.toFixed(2)}`;
    document.getElementById('total-income').textContent = `+${currencySymbol}${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `-${currencySymbol}${totalExpenses.toFixed(2)}`;
    document.getElementById('month-balance').textContent = `${currencySymbol}${monthBalance.toFixed(2)}`;

    updateRecentTransactions();
}

// Update recent transactions
function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    const recentTransactions = transactions.slice(0, 5);

    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                <p>No transactions yet. Add your first transaction above!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item category-${transaction.category}">
            <div class="transaction-info">
                <div class="transaction-title">${transaction.description}</div>
                <div class="transaction-details">
                    <span>${categories[transaction.category] || '📦'} ${transaction.category}</span>
                    <span>${formatDate(new Date(transaction.date))}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.amount < 0 ? 'minus' : 'plus'}" style="color: ${transaction.amount < 0 ? '#fa709a' : '#4facfe'};">
                ${transaction.amount < 0 ? '-' : '+'}${currencySymbols[settings.currency]}${Math.abs(transaction.amount).toFixed(2)}
            </div>
        </div>
    `).join('');
}

// Update all transactions list
function updateTransactionsList() {
    const container = document.getElementById('all-transactions');
    let filteredTransactions = [...transactions];

    // Apply filters
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const sortBy = document.getElementById('sort-transactions').value;

    // Search filter
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(t =>
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    // Type filter
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
        case 'newest':
            filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filteredTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'highest':
            filteredTransactions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
            break;
        case 'lowest':
            filteredTransactions.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
            break;
    }

    if (filteredTransactions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <p>No transactions found matching your criteria</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTransactions.map(transaction => `
        <div class="transaction-item category-${transaction.category}">
            <div class="transaction-info">
                <div class="transaction-title">${transaction.description}</div>
                <div class="transaction-details">
                    <span>${categories[transaction.category] || '📦'} ${transaction.category}</span>
                    <span>${formatDate(new Date(transaction.date))}</span>
                    <span>${new Date(transaction.date).toLocaleTimeString()}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.amount < 0 ? 'minus' : 'plus'}" style="color: ${transaction.amount < 0 ? '#fa709a' : '#4facfe'};">
                ${transaction.amount < 0 ? '-' : '+'}${currencySymbols[settings.currency]}${Math.abs(transaction.amount).toFixed(2)}
            </div>
            <div class="transaction-actions">
                <button class="action-btn edit-btn" onclick="editTransaction(${transaction.id})" title="Edit">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${transaction.id})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Filter transactions
function filterTransactions() {
    updateTransactionsList();
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        updateDashboard();
        updateTransactionsList();
        showNotification('Transaction deleted', 'success');
    }
}

// Edit transaction (simplified - just delete and re-add)
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        // Fill form with transaction data
        document.getElementById('quick-description').value = transaction.description;
        document.getElementById('quick-amount').value = Math.abs(transaction.amount);
        document.getElementById('quick-category').value = transaction.category;
        selectType(transaction.type);

        // Delete the transaction
        deleteTransaction(id);

        // Show dashboard and scroll to form
        showSection('dashboard');
        document.getElementById('quick-description').focus();

        showNotification('Transaction loaded for editing', 'info');
    }
}

// Budget functions
function setBudget() {
    const category = document.getElementById('budget-category').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);

    if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid budget amount', 'error');
        return;
    }

    budgets[category] = amount;
    saveData();
    updateBudgetDisplay();
    showNotification('Budget set successfully!', 'success');
}

function updateBudgetDisplay() {
    const container = document.getElementById('budget-display');

    if (Object.keys(budgets).length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
                <p>No budgets set yet. Set your first budget above!</p>
            </div>
        `;
        return;
    }

    const now = new Date();
    const thisMonth = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === now.getMonth() &&
               tDate.getFullYear() === now.getFullYear() &&
               t.amount < 0;
    });

    container.innerHTML = Object.entries(budgets).map(([category, budget]) => {
        const spent = Math.abs(thisMonth.filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0));
        const percentage = (spent / budget) * 100;
        const remaining = budget - spent;

        let progressClass = '';
        if (percentage >= 90) progressClass = 'danger';
        else if (percentage >= 75) progressClass = 'warning';

        return `
            <div style="margin: 1.5rem 0; padding: 1.5rem; background: rgba(255, 255, 255, 0.1); border-radius: 12px;">
                <h4 style="color: white; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>${categories[category] || '📦'}</span>
                    <span style="text-transform: capitalize;">${category}</span>
                </h4>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="progress-text">
                    <span>Spent: ${currencySymbols[settings.currency]}${spent.toFixed(2)}</span>
                    <span>Budget: ${currencySymbols[settings.currency]}${budget.toFixed(2)}</span>
                </div>
                <div style="color: ${remaining >= 0 ? '#4facfe' : '#fa709a'}; font-weight: 600; margin-top: 0.5rem;">
                    ${remaining >= 0 ? 'Remaining' : 'Over budget'}: ${currencySymbols[settings.currency]}${Math.abs(remaining).toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

// Analytics functions
function updateAnalytics() {
    const now = new Date();

    // This week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const thisWeek = transactions.filter(t => new Date(t.date) >= weekStart);
    const weekTotal = thisWeek.reduce((sum, t) => sum + t.amount, 0);

    // This month
    const thisMonth = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });
    const monthTotal = thisMonth.reduce((sum, t) => sum + t.amount, 0);

    // Daily average (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const last30Days = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const dailyAverage = last30Days.reduce((sum, t) => sum + Math.abs(t.amount), 0) / 30;

    // Top category
    const categoryTotals = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });
    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

    const currencySymbol = currencySymbols[settings.currency];

    document.getElementById('week-total').textContent = `${currencySymbol}${weekTotal.toFixed(2)}`;
    document.getElementById('month-total').textContent = `${currencySymbol}${monthTotal.toFixed(2)}`;
    document.getElementById('daily-average').textContent = `${currencySymbol}${dailyAverage.toFixed(2)}`;
    document.getElementById('top-category').textContent = topCategory ? `${categories[topCategory[0]] || '📦'} ${topCategory[0]}` : 'None';

    updateCategoryBreakdown();
}

function updateCategoryBreakdown() {
    const container = document.getElementById('category-breakdown');

    const categoryTotals = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });

    const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    if (sortedCategories.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.7);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                <p>No expense data available</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="margin-top: 2rem;">
            <h3 style="color: white; margin-bottom: 1.5rem; text-align: center;">Spending by Category</h3>
            ${sortedCategories.map(([category, amount]) => {
                const percentage = (amount / total) * 100;
                return `
                    <div style="margin: 1rem 0; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: white; font-weight: 500;">
                                ${categories[category] || '📦'} ${category}
                            </span>
                            <span style="color: #fa709a; font-weight: 600;">
                                ${currencySymbols[settings.currency]}${amount.toFixed(2)} (${percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%; background: var(--error-gradient);"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Categories management
function addCategory() {
    const name = document.getElementById('new-category-name').value.trim().toLowerCase();
    const icon = document.getElementById('new-category-icon').value.trim();

    if (!name || !icon) {
        showNotification('Please enter both category name and icon', 'error');
        return;
    }

    if (categories[name]) {
        showNotification('Category already exists', 'error');
        return;
    }

    categories[name] = icon;
    saveData();
    updateCategoriesDisplay();
    updateCategoriesDropdowns();

    // Clear inputs
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-icon').value = '';

    showNotification('Category added successfully!', 'success');
}

function updateCategoriesDisplay() {
    const container = document.getElementById('categories-list');

    container.innerHTML = `
        <div style="margin-top: 2rem;">
            <h3 style="color: white; margin-bottom: 1.5rem;">Current Categories</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                ${Object.entries(categories).map(([name, icon]) => `
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">${icon}</div>
                        <div style="color: white; font-weight: 500; text-transform: capitalize;">${name}</div>
                        ${!['food', 'transport', 'entertainment', 'bills', 'shopping', 'health', 'education', 'salary', 'freelance', 'investment', 'other'].includes(name) ?
                            `<button onclick="deleteCategory('${name}')" style="margin-top: 0.5rem; background: var(--error-gradient); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer;">Delete</button>`
                            : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function updateCategoriesDropdowns() {
    const quickCategorySelect = document.getElementById('quick-category');
    const filterCategorySelect = document.getElementById('filter-category');
    const budgetCategorySelect = document.getElementById('budget-category');

    const options = Object.entries(categories).map(([name, icon]) => `<option value="${name}">${icon} ${name.charAt(0).toUpperCase() + name.slice(1)}</option>`).join('');

    quickCategorySelect.innerHTML = `<option value="">Select category...</option>${options}`;
    filterCategorySelect.innerHTML = `<option value="all">All Categories</option>${options}`;
    budgetCategorySelect.innerHTML = options;
}

function deleteCategory(name) {
    if (confirm(`Are you sure you want to delete the "${name}" category?`)) {
        delete categories[name];
        saveData();
        updateCategoriesDisplay();
        updateCategoriesDropdowns();
        showNotification('Category deleted', 'success');
    }
}

// Reports
function generateReport() {
    const period = document.getElementById('report-period').value;
    const container = document.getElementById('report-content');

    let filteredTransactions = [];
    const now = new Date();

    switch (period) {
        case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            filteredTransactions = transactions.filter(t => new Date(t.date) >= weekStart);
            break;
        case 'month':
            filteredTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            });
            break;
        case 'quarter':
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            filteredTransactions = transactions.filter(t => new Date(t.date) >= quarterStart);
            break;
        case 'year':
            filteredTransactions = transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
            break;
        case 'all':
            filteredTransactions = transactions;
            break;
    }

    const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const netIncome = totalIncome - totalExpenses;
    const transactionCount = filteredTransactions.length;

    const categoryBreakdown = {};
    filteredTransactions.filter(t => t.amount < 0).forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
    });

    const currencySymbol = currencySymbols[settings.currency];
    const periodName = period.charAt(0).toUpperCase() + period.slice(1);

    container.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 12px;">
            <h3 style="color: white; text-align: center; margin-bottom: 2rem;">Financial Report - ${periodName}</h3>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="text-align: center; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
                    <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">Total Income</div>
                    <div style="color: #4facfe; font-size: 1.5rem; font-weight: 700;">${currencySymbol}${totalIncome.toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
                    <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">Total Expenses</div>
                    <div style="color: #fa709a; font-size: 1.5rem; font-weight: 700;">${currencySymbol}${totalExpenses.toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
                    <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">Net Income</div>
                    <div style="color: ${netIncome >= 0 ? '#4facfe' : '#fa709a'}; font-size: 1.5rem; font-weight: 700;">${currencySymbol}${netIncome.toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
                    <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">Transactions</div>
                    <div style="color: white; font-size: 1.5rem; font-weight: 700;">${transactionCount}</div>
                </div>
            </div>

            ${Object.keys(categoryBreakdown).length > 0 ? `
                <div style="margin-top: 2rem;">
                    <h4 style="color: white; margin-bottom: 1rem;">Expenses by Category</h4>
                    ${Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a).map(([category, amount]) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <span style="color: white;">${categories[category] || '📦'} ${category}</span>
                            <span style="color: #fa709a; font-weight: 600;">${currencySymbol}${amount.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.2); font-size: 0.85rem; color: rgba(255, 255, 255, 0.7); text-align: center;">
                Report generated on ${formatDate(new Date())} at ${new Date().toLocaleTimeString()}
            </div>
        </div>
    `;
}

// Export functions
function exportTransactions(format) {
    if (transactions.length === 0) {
        showNotification('No transactions to export', 'error');
        return;
    }

    if (format === 'csv') {
        const csvContent = [
            ['Date', 'Description', 'Category', 'Type', 'Amount'],
            ...transactions.map(t => [
                formatDate(new Date(t.date)),
                t.description,
                t.category,
                t.type,
                t.amount
            ])
        ].map(row => row.join(',')).join('\n');

        downloadFile(csvContent, 'transactions.csv', 'text/csv');
    } else if (format === 'json') {
        const jsonContent = JSON.stringify(transactions, null, 2);
        downloadFile(jsonContent, 'transactions.json', 'application/json');
    }

    showNotification(`Transactions exported as ${format.toUpperCase()}`, 'success');
}

function exportReport(format) {
    showNotification(`${format.toUpperCase()} export functionality would be implemented with additional libraries`, 'info');
}

function printReport() {
    window.print();
}

// Settings
function loadSettings() {
    const savedSettings = localStorage.getItem('expenseflow-settings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }

    document.getElementById('currency-setting').value = settings.currency;
    document.getElementById('date-format').value = settings.dateFormat;
    document.getElementById('theme-setting').value = settings.theme;
    document.getElementById('language-setting').value = settings.language;
}

function saveSettings() {
    settings.currency = document.getElementById('currency-setting').value;
    settings.dateFormat = document.getElementById('date-format').value;
    settings.theme = document.getElementById('theme-setting').value;
    settings.language = document.getElementById('language-setting').value;

    localStorage.setItem('expenseflow-settings', JSON.stringify(settings));
    updateDashboard();
    showNotification('Settings saved successfully!', 'success');
}

// Data management
function saveData() {
    localStorage.setItem('expenseflow-transactions', JSON.stringify(transactions));
    localStorage.setItem('expenseflow-budgets', JSON.stringify(budgets));
    localStorage.setItem('expenseflow-categories', JSON.stringify(categories));
    localStorage.setItem('expenseflow-nextid', nextId.toString());
}

function loadData() {
    const savedTransactions = localStorage.getItem('expenseflow-transactions');
    const savedBudgets = localStorage.getItem('expenseflow-budgets');
    const savedCategories = localStorage.getItem('expenseflow-categories');
    const savedNextId = localStorage.getItem('expenseflow-nextid');

    if (savedTransactions) transactions = JSON.parse(savedTransactions);
    if (savedBudgets) budgets = JSON.parse(savedBudgets);
    if (savedCategories) categories = { ...categories, ...JSON.parse(savedCategories) };
    if (savedNextId) nextId = parseInt(savedNextId, 10);
}

function backupData() {
    const backup = {
        transactions,
        budgets,
        categories,
        settings,
        nextId,
        exportDate: new Date().toISOString()
    };

    const backupContent = JSON.stringify(backup, null, 2);
    downloadFile(backupContent, `expenseflow-backup-${formatDate(new Date()).replace(/\//g, '-')}.json`, 'application/json');
    showNotification('Data backup created successfully!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backup = JSON.parse(e.target.result);

                if (backup.transactions) transactions = backup.transactions;
                if (backup.budgets) budgets = backup.budgets;
                if (backup.categories) categories = backup.categories;
                if (backup.settings) settings = backup.settings;
                if (backup.nextId) nextId = backup.nextId;

                saveData();
                updateDashboard();
                loadSettings();

                showNotification('Data imported successfully!', 'success');
            } catch (error) {
                showNotification('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        if (confirm('This will delete ALL transactions, budgets, and custom categories. Are you absolutely sure?')) {
            transactions = [];
            budgets = {};
            categories = {
                food: '🍕',
                transport: '🚗',
                entertainment: '🎬',
                bills: '💡',
                shopping: '🛍️',
                health: '🏥',
                education: '📚',
                salary: '💼',
                freelance: '💻',
                investment: '📈',
                other: '📦'
            };
            nextId = 1;

            saveData();
            updateDashboard();
            updateTransactionsList();
            updateBudgetDisplay();
            updateCategoriesDisplay();
            updateCategoriesDropdowns();

            showNotification('All data cleared successfully!', 'success');
        }
    }
}

function resetApp() {
    if (confirm('This will reset the entire app to default settings. Continue?')) {
        localStorage.clear();
        location.reload();
    }
}

// Utility functions
function formatDate(date) {
    const format = settings.dateFormat;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${month}/${day}/${year}`;
    }
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
        background: ${getNotificationGradient(type)};
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationGradient(type) {
    switch (type) {
        case 'success':
            return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        case 'error':
            return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
        default:
            return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }
}
