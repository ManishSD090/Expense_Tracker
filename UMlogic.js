document.addEventListener("DOMContentLoaded", function () {
    loadTransactions();
    initializeChart();

    document.getElementById("add-expense-btn")?.addEventListener("click", function () {
        addTransaction("Expense");
    });

    document.getElementById("add-income-btn")?.addEventListener("click", function () {
        addTransaction("Income");
    });

    document.getElementById("apply-custom-filter")?.addEventListener("click", function () {
        applyCustomFilter();
    });
});

function addTransaction(type) {
    const dateElement = document.getElementById(type === "Income" ? "income-date" : "expense-date");
    const descriptionElement = document.getElementById(type === "Income" ? "income-description" : "expense-description");
    const categoryElement = document.getElementById(type === "Income" ? "income-category" : "expense-category");
    const amountElement = document.getElementById(type === "Income" ? "income-amount" : "expense-amount");

    if (!dateElement || !descriptionElement || !categoryElement || !amountElement) {
        console.error(`❌ Form elements for ${type} not found!`);
        return;
    }

    const date = dateElement.value;
    const description = descriptionElement.value.trim();
    const category = categoryElement.value;
    const amount = parseFloat(amountElement.value);

    if (!date || !description || !category || isNaN(amount) || amount <= 0) {
        alert("⚠️ Please enter valid details.");
        return;
    }

    const transaction = { date, description, category, amount, type };
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    alert(`✅ ${type} added successfully!`);

    dateElement.value = "";
    descriptionElement.value = "";
    categoryElement.value = "";
    amountElement.value = "";

    loadTransactions();
    updateChart();
}

function loadTransactions(filter = "all", startDate = null, endDate = null) {
    console.log("🔄 Checking Local Storage Data:", localStorage.getItem("transactions"));
    console.log("Local Storage Transactions After Reload:", localStorage.getItem("transactions"));

    let storedData = localStorage.getItem("transactions");
if (!storedData) {
    console.warn("⚠️ No Transactions Found in Local Storage!");
    localStorage.setItem("transactions", JSON.stringify([])); // Ensure localStorage is initialized
    return;
}
let transactions = JSON.parse(storedData);


    if (!transactions.length) {
        console.warn("⚠️ No Transactions Found in Local Storage!");
        return;
    }

    let transactionTable = document.getElementById("transaction-table");
    if (!transactionTable) return;
    transactionTable.innerHTML = "";

    let totalIncome = 0;
    let totalExpense = 0;
    let now = new Date();

    let filteredTransactions = transactions.filter(transaction => {
        let transactionDate = new Date(transaction.date);

        if (filter === "last-month") {
            let lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return transactionDate >= lastMonth && transactionDate <= now;
        } else if (filter === "last-year") {
            let lastYear = new Date(now.getFullYear() - 1, 0, 1);
            return transactionDate >= lastYear && transactionDate <= now;
        } else if (filter === "custom") {
            return transactionDate >= startDate && transactionDate <= endDate;
        }
        return true;
    });

    filteredTransactions.forEach((transaction, index) => {
        let row = transactionTable.insertRow();
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>₹${transaction.amount.toFixed(2)}</td>
            <td>${transaction.type}</td>
            <td><button class="delete-btn" data-index="${index}">Delete</button></td>

        `;

        if (transaction.type === "Income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    document.getElementById("total-income").innerText = `₹${totalIncome.toFixed(2)}`;
    document.getElementById("total-expense").innerText = `₹${totalExpense.toFixed(2)}`;
    document.getElementById("balance").innerText = `₹${(totalIncome - totalExpense).toFixed(2)}`;

    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            deleteTransaction(this.dataset.index);
        });
    });

    console.log("📊 Transactions Successfully Loaded:", transactions);

    updateChart();
}


function applyCustomFilter() {
    let startDate = document.getElementById("start-date")?.value;
    let endDate = document.getElementById("end-date")?.value;

    if (!startDate || !endDate) {
        alert("⚠️ Please select both start and end dates.");
        return;
    }

    loadTransactions("custom", new Date(startDate), new Date(endDate));
}

function deleteTransaction(identifier) {
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let updatedTransactions = transactions.filter(transaction => `${transaction.date}-${transaction.description}` !== identifier);
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
    loadTransactions();
}


let expenseChart;

function initializeChart() {
    const canvas = document.getElementById("expenseChart");

    if (!canvas) {
        console.error("❌ Canvas element not found!");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (expenseChart) {
        expenseChart.destroy();
    }

    Chart.register(ChartDataLabels);

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Income", "Expenses", "Balance"],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ["#00bcd4", "#ff4d4d", "#008080"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    color: "#fff",
                    font: {
                        weight: "bold"
                    },
                    formatter: (value, context) => {
                        let total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        return total ? ((value / total) * 100).toFixed(1) + "%" : "0%";
                    }
                }
            }
        }
    });

    updateChart();
}

function updateChart() {
    if (!expenseChart) return;

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let totalIncome = 0, totalExpense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === "Income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    let balance = totalIncome - totalExpense;

    expenseChart.data.datasets[0].data = [totalIncome, totalExpense, balance];
    expenseChart.update();
}
