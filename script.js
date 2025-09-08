// --- DOM Elements ---
const totalBalance = document.getElementById('total-balance');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const monthBalance = document.getElementById('month-balance');
const recentTransactions = document.getElementById('recent-transactions');
const allTransactions = document.getElementById('all-transactions');
const quickForm = document.getElementById('quick-form');

// Load saved data
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// --- FUNCTIONS ---

// Add Transaction
function addTransaction(e) {
    e.preventDefault();

    const description = document.getElementById('quick-description').value;
    const amount = parseFloat(document.getElementById('quick-amount').value);
    const category = document.getElementById('quick-category').value;
    const type = document.querySelector('input[name="type"]:checked').value;

    if (!description || !amount || !category) {
        alert("Please fill all fields!");
        return;
    }

    const transaction = {
        id: Date.now(),
        description,
        amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
        category,
        type,
        date: new Date().toLocaleDateString()
    };

    transactions.push(transaction);
    updateLocalStorage();
    renderTransactions();
    quickForm.reset();
}

// Update Balance
function updateSummary() {
    const amounts = transactions.map(t => t.amount);

    const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
    const income = amounts.filter(a => a > 0).reduce((acc, a) => acc + a, 0).toFixed(2);
    const expenses = (amounts.filter(a => a < 0).reduce((acc, a) => acc + a, 0) * -1).toFixed(2);

    totalBalance.innerText = `$${total}`;
    totalIncome.innerText = `+$${income}`;
    totalExpenses.innerText = `-$${expenses}`;
    monthBalance.innerText = `$${total}`;
}

// Render Transactions
function renderTransactions() {
    // Recent transactions (last 5)
    recentTransactions.innerHTML = "";
    const recent = [...transactions].slice(-5).reverse();
    if (recent.length === 0) {
        recentTransactions.innerHTML = `<p style="text-align:center;color:gray;">No transactions yet</p>`;
    } else {
        recent.forEach(t => {
            const div = document.createElement("div");
            div.className = "transaction-item";
            div.innerHTML = `
                <span>${t.description} (${t.category})</span>
                <span style="color:${t.amount < 0 ? '#fa709a' : '#4facfe'};">
                    ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}
                </span>
                <button onclick="removeTransaction(${t.id})" style="margin-left:10px;">❌</button>
            `;
            recentTransactions.appendChild(div);
        });
    }

    // All transactions
    allTransactions.innerHTML = "";
    transactions.slice().reverse().forEach(t => {
        const div = document.createElement("div");
        div.className = "transaction-item";
        div.innerHTML = `
            <span>${t.date} - ${t.description} (${t.category})</span>
            <span style="color:${t.amount < 0 ? '#fa709a' : '#4facfe'};">
                ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}
            </span>
            <button onclick="removeTransaction(${t.id})" style="margin-left:10px;">❌</button>
        `;
        allTransactions.appendChild(div);
    });

    updateSummary();
}

// Remove Transaction
function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    renderTransactions();
}

// Save to Local Storage
function updateLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Init
function init() {
    renderTransactions();
    updateSummary();
}

// --- Event Listeners ---
quickForm.addEventListener("submit", addTransaction);

// Initial load
init();
