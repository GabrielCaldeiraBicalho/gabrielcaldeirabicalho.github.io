import { getTransactions } from './storage.js';
import { formatCurrency } from '../utils/formatters.js';

let expenseChart = null;
let balanceChart = null;
let cashflowChart = null;

export function updateCharts() {
    updateExpenseChart();
    updateBalanceChart();
}

export function updateExpenseChart() {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const expenses = getTransactions().filter(t => t.type === 'expense');
    const groups = new Map();
    expenses.forEach(e => groups.set(e.category, (groups.get(e.category) || 0) + e.amount));
    
    if (expenseChart) expenseChart.destroy();
    if (groups.size === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Quicksand';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--chart-empty-msg');
        ctx.textAlign = 'center';
        ctx.fillText('Sem despesas no período', canvas.width/2, canvas.height/2);
        return;
    }
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Array.from(groups.keys()),
            datasets: [{ data: Array.from(groups.values()), backgroundColor: ['#e86f9c','#f39c12','#3498db','#2ecc71','#9b59b6','#e67e22','#1abc9c'] }]
        }
    });
}

export function updateBalanceChart() {
    const canvas = document.getElementById('balanceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const months = [...new Set(getTransactions().map(t => t.date.slice(0,7)))].sort();
    let cumulative = 0;
    const balances = months.map(m => {
        getTransactions().filter(t => t.date.startsWith(m)).forEach(t => {
            cumulative += (t.type === 'income' ? t.amount : -t.amount);
        });
        return cumulative;
    });
    if (balanceChart) balanceChart.destroy();
    if (months.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Quicksand';
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--chart-empty-msg');
        ctx.textAlign = 'center';
        ctx.fillText('Sem transações para exibir evolução', canvas.width/2, canvas.height/2);
        return;
    }
    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{ label: 'Saldo Acumulado', data: balances, borderColor: getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#e86f9c', tension: 0.2, fill: false }]
        }
    });
}

export function renderCashflowChart(period = 'monthly', month = null) {
    const canvas = document.getElementById('cashflowChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!month) month = new Date().toISOString().slice(0,7);
    
    const groups = {};
    getTransactions().forEach(t => {
        if (!t.date.startsWith(month)) return;
        let key;
        if (period === 'weekly') {
            const date = new Date(t.date);
            const week = Math.ceil((date.getDate()) / 7);
            key = `Semana ${week}`;
        } else {
            key = t.date.slice(8,10);
        }
        if (!groups[key]) groups[key] = { income: 0, expense: 0 };
        if (t.type === 'income') groups[key].income += t.amount;
        else groups[key].expense += t.amount;
    });
    
    const labels = Object.keys(groups).sort((a,b) => {
        if (period === 'weekly') return a.localeCompare(b);
        return parseInt(a) - parseInt(b);
    });
    const incomeData = labels.map(l => groups[l].income);
    const expenseData = labels.map(l => groups[l].expense);
    
    if (cashflowChart) cashflowChart.destroy();
    cashflowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Receitas', data: incomeData, backgroundColor: '#27ae60' },
                { label: 'Despesas', data: expenseData, backgroundColor: '#e74c3c' }
            ]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: `Fluxo ${period === 'weekly' ? 'Semanal' : 'Mensal'} - ${month}` } },
            scales: { y: { ticks: { callback: value => 'R$ ' + value.toLocaleString('pt-BR') } } }
        }
    });
    
    const totalIncome = incomeData.reduce((a,b) => a+b,0);
    const totalExpense = expenseData.reduce((a,b) => a+b,0);
    const summaryDiv = document.getElementById('cashflowSummary');
    if (summaryDiv) {
        summaryDiv.innerHTML = `<strong>Resumo ${month}:</strong><br>
            Receitas: ${formatCurrency(totalIncome)} | Despesas: ${formatCurrency(totalExpense)} | 
            <span style="color: ${totalIncome - totalExpense >= 0 ? '#27ae60' : '#e74c3c'}">Líquido: ${formatCurrency(totalIncome - totalExpense)}</span>`;
    }
}