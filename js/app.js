import { loadFromLocalStorage, getTransactions, getCreditCards, getCategories, saveToLocalStorage, addTransaction, removeTransaction } from './modules/storage.js';
import { createTransaction, getTotalIncome, getTotalExpense, getBalance, getExpensesByCategory } from './modules/transactions.js';
import { createCard, deleteCard, getCardSelectOptions } from './modules/cards.js';
import { saveBudget, getBudgetsForMonth, getSpentForCategory, calculateBudgetProgress } from './modules/budgets.js';
import { getCategoryList, addNewCategory, renameCategory, deleteCategory } from './modules/categories.js';
import { populateCategorySelects, updateCardSelect, renderTransactions, renderCards, renderManageTab } from './modules/ui.js';
import { updateCharts, renderCashflowChart } from './modules/charts.js';
import { initTheme, toggleTheme, changeThemeColor } from './modules/theme.js';
import { generatePDF, exportCategoriesJSON, importCategoriesJSON } from './modules/exports.js';
import { renderInvoices, calculateHealthScore } from './modules/invoices.js';
// IMPORTANTE: Importar addMonthsToDate do formatters
import { formatCurrency, parseMoney, getCurrentYearMonth, formatDate, addMonthsToDate } from './utils/formatters.js';
import { showToast, confirmAction } from './utils/dom.js';

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initTheme();
    initLogin();
    initServiceWorker();
    setDefaultDates();
    initEventListeners();
    loadSalaryDaySetting();
});

// ❌ REMOVA ESTA FUNÇÃO - ela já foi importada acima
/*
function addMonthsToDate(dateStr, months) {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + months);
    // Corrige dia 31 para último dia do mês
    if (date.getDate() !== new Date(dateStr).getDate()) {
        date.setDate(0);
    }
    return date.toISOString().split('T')[0];
}
*/
// ✅ Use a função importada diretamente

function refreshAllUI() {
    populateCategorySelects();
    updateCardSelect();
    updateTotalsAndIndicators();
    renderTransactions({ search: '', category: '', month: '' });
    renderCards();
    renderManageTab();
    renderBudgetTab();
    renderInvoices();
    updateCharts();
    renderCashflowChart('monthly', getCurrentYearMonth());
    saveToLocalStorage();
    updateDaysUntilSalary();
}

function updateTotalsAndIndicators() {
    const inc = getTotalIncome();
    const exp = getTotalExpense();
    document.getElementById('incomeValue').innerText = formatCurrency(inc);
    document.getElementById('expenseValue').innerText = formatCurrency(exp);
    document.getElementById('balanceValue').innerText = formatCurrency(inc - exp);
    
    const savingsRate = inc > 0 ? ((inc - exp) / inc * 100) : 0;
    document.getElementById('savingsRate').innerText = savingsRate.toFixed(1) + '%';
    
    const currentMonth = getCurrentYearMonth();
    const monthExp = getTransactions().filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const dayOfMonth = new Date().getDate();
    const avgDaily = dayOfMonth > 0 ? monthExp / dayOfMonth : 0;
    document.getElementById('avgDailySpend').innerText = formatCurrency(avgDaily);
    
    const catMap = getExpensesByCategory();
    const sorted = Array.from(catMap.entries()).sort((a,b) => b[1] - a[1]).slice(0,5);
    document.getElementById('rankingList').innerHTML = sorted.map(([c, v]) => `<li class="ranking-item"><span>${c}</span><span>${formatCurrency(v)}</span></li>`).join('') || '<li>Sem dados</li>';
    
    const last3Months = [...new Set(getTransactions().map(t => t.date.slice(0,7)))].sort().slice(-3);
    let avgExp = 0;
    if (last3Months.length) {
        const total = getTransactions().filter(t => t.type==='expense' && last3Months.includes(t.date.slice(0,7))).reduce((s,t)=>s+t.amount,0);
        avgExp = total / last3Months.length;
    }
    document.getElementById('forecastContainer').innerHTML = `Próximo mês ~ ${formatCurrency(avgExp)} (média 3 meses)`;
    
    const healthScore = calculateHealthScore();
    const healthDiv = document.getElementById('healthScore');
    if (healthDiv) {
        healthDiv.textContent = healthScore + '/10';
        healthDiv.style.color = healthScore >= 8 ? '#27ae60' : healthScore >= 5 ? '#f39c12' : '#e74c3c';
    }
}

function updateDaysUntilSalary() {
    const salaryDay = parseInt(localStorage.getItem('luaFinances_salaryDay') || '5');
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    let salaryDate = new Date(currentYear, currentMonth, salaryDay);
    if (today > salaryDate) {
        salaryDate = new Date(currentYear, currentMonth + 1, salaryDay);
    }
    const diffTime = salaryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const span = document.getElementById('daysUntilSalary');
    if (span) span.innerText = diffDays + ' dias';
}

function loadSalaryDaySetting() {
    const input = document.getElementById('salaryDayInput');
    if (input) {
        const saved = localStorage.getItem('luaFinances_salaryDay') || '5';
        input.value = saved;
        input.addEventListener('change', (e) => {
            const day = parseInt(e.target.value);
            if (day >= 1 && day <= 31) {
                localStorage.setItem('luaFinances_salaryDay', day);
                updateDaysUntilSalary();
                showToast('Dia de pagamento atualizado!', 'success');
            }
        });
    }
}

function renderBudgetTab() {
    const monthSelect = document.getElementById('budgetMonthSelect');
    if (!monthSelect) return;
    const month = monthSelect.value || getCurrentYearMonth();
    monthSelect.value = month;
    const budgets = getBudgetsForMonth(month);
    const budgetMap = new Map(budgets.map(b => [b.category, b.limit]));
    const allCats = new Set([...getCategoryList(), ...budgets.map(b => b.category)]);
    let html = '<table><thead><tr><th>Categoria</th><th>Meta (R$)</th><th>Gasto</th><th>Progresso</th><th>%</th></tr></thead><tbody>';
    Array.from(allCats).sort().forEach(cat => {
        const limit = budgetMap.get(cat) || 0;
        const spent = getSpentForCategory(month, cat);
        const percent = limit > 0 ? (spent / limit * 100) : 0;
        const color = percent > 100 ? '#e74c3c' : percent > 80 ? '#f39c12' : 'var(--primary-color)';
        html += `<tr data-cat="${cat}">
            <td>${cat}</td>
            <td><input type="text" data-cat="${cat}" value="${limit.toFixed(2)}" style="width:90px;"></td>
            <td>${formatCurrency(spent)}</td>
            <td><div class="budget-progress" style="width:80px;"><div class="budget-fill" style="width:${Math.min(percent,100)}%; background:${color};"></div></div></td>
            <td style="color:${color};">${percent.toFixed(1)}%</td>
        </tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('budgetTableContainer').innerHTML = html;
    
    document.querySelectorAll('#budgetTableContainer input[data-cat]').forEach(input => {
        input.addEventListener('change', (e) => {
            const cat = input.dataset.cat;
            const value = input.value;
            saveBudget(month, cat, value);
            renderBudgetTab();
        });
    });
}

function initEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            if (btn.dataset.tab === 'budget-tab') renderBudgetTab();
            if (btn.dataset.tab === 'invoices-tab') renderInvoices();
            if (btn.dataset.tab === 'cashflow-tab') renderCashflowChart();
        });
    });
    
    // Transaction form
    document.getElementById('transactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = document.getElementById('desc').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value || new Date().toISOString().split('T')[0];
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const cardId = document.getElementById('cardIdSelect').value ? parseFloat(document.getElementById('cardIdSelect').value) : null;
        const installments = parseInt(document.getElementById('installments').value) || 1;
        createTransaction(desc, amount, date, type, category, paymentMethod, cardId, installments);
        e.target.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        refreshAllUI();
    });
    
    // Card form
    document.getElementById('cardForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('cardName').value;
        const limit = document.getElementById('cardLimit').value;
        const flag = document.getElementById('cardFlag').value;
        const closingDay = document.getElementById('closingDay').value;
        const dueDay = document.getElementById('dueDay').value;
        const editingId = document.getElementById('editingCardId')?.value;
        createCard(name, limit, flag, closingDay, dueDay, editingId);
        e.target.reset();
        const hidden = document.getElementById('editingCardId');
        if (hidden) hidden.remove();
        document.querySelector('#cardForm button[type="submit"]').textContent = 'Salvar Cartão';
        refreshAllUI();
    });
    
    // Filters
    let searchTimeout;
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderTransactions({ search: e.target.value, category: document.getElementById('filterCategory').value, month: document.getElementById('filterMonth').value });
        }, 300);
    });

    document.getElementById('filterCategory')?.addEventListener('change', (e) => {
        renderTransactions({ search: document.getElementById('searchInput').value, category: e.target.value, month: document.getElementById('filterMonth').value });
    });

    document.getElementById('filterMonth')?.addEventListener('change', (e) => {
        renderTransactions({ search: document.getElementById('searchInput').value, category: document.getElementById('filterCategory').value, month: e.target.value });
    });
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterMonth').value = '';
        renderTransactions({ search: '', category: '', month: '' });
    });
    
    // Budget month
    document.getElementById('budgetMonthSelect')?.addEventListener('change', renderBudgetTab);
    document.getElementById('loadBudgetMonthBtn')?.addEventListener('click', renderBudgetTab);
    document.getElementById('saveAllBudgetsBtn')?.addEventListener('click', () => {
        const month = document.getElementById('budgetMonthSelect').value;
        document.querySelectorAll('#budgetTableContainer input[data-cat]').forEach(input => {
            saveBudget(month, input.dataset.cat, input.value);
        });
        renderBudgetTab();
        showToast('Orçamentos salvos!', 'success');
    });
    
    // Cashflow
    document.getElementById('cashflowPeriod')?.addEventListener('change', () => renderCashflowChart());
    document.getElementById('cashflowMonth')?.addEventListener('change', () => renderCashflowChart());
    document.getElementById('updateCashflowBtn')?.addEventListener('click', () => renderCashflowChart());
    
    // Payment method toggle
    document.getElementById('paymentMethod')?.addEventListener('change', (e) => {
        const method = e.target.value;
        document.getElementById('cardSelectGroup').style.display = (method === 'credito' || method === 'debito') ? 'block' : 'none';
        document.getElementById('installmentsGroup').style.display = method === 'credito' ? 'block' : 'none';
    });
    
    // Offcanvas
    document.getElementById('menuToggle')?.addEventListener('click', () => toggleOffcanvas());
    document.getElementById('closeOffcanvas')?.addEventListener('click', () => closeOffcanvas());
    document.getElementById('offcanvasOverlay')?.addEventListener('click', () => closeOffcanvas());
    document.getElementById('manageCategoriesBtn')?.addEventListener('click', () => {
        closeOffcanvas();
        document.querySelector('[data-tab="manage-tab"]').click();
    });
    
    // Theme
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('themeToggleBtnManage')?.addEventListener('click', toggleTheme);
    document.getElementById('themeColorSelect')?.addEventListener('change', (e) => changeThemeColor(e.target.value));
    document.getElementById('themeColorSelectManage')?.addEventListener('change', (e) => changeThemeColor(e.target.value));
    
    // Clear all data
    document.getElementById('clearAllBtn')?.addEventListener('click', async () => {
        if (await confirmAction('Apagar TODOS os dados? Isso é irreversível!')) {
            localStorage.removeItem('luaFinances_v4_full');
            location.reload();
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
    document.getElementById('logoutBtnManage')?.addEventListener('click', () => logout());
    
    // Category management
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
        const name = document.getElementById('newCategoryInput').value.trim();
        if (addNewCategory(name)) {
            document.getElementById('newCategoryInput').value = '';
            refreshAllUI();
        }
    });
    document.getElementById('exportCategoriesBtn')?.addEventListener('click', () => exportCategoriesJSON(getCategoryList()));
    document.getElementById('importCategoriesBtn')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) importCategoriesJSON(file, (imported) => {
                imported.forEach(cat => addNewCategory(cat));
                refreshAllUI();
            });
        };
        input.click();
    });
    document.getElementById('categorySearch')?.addEventListener('input', renderManageTab);
    
    // PDF export
    document.getElementById('exportPdfBtn')?.addEventListener('click', async () => {
        const month = prompt('Mês (YYYY-MM):', getCurrentYearMonth());
        if (month) await generatePDF(month);
    });
    
    // Delegated events
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.edit-card')) {
            const id = parseInt(e.target.closest('.edit-card').dataset.id);
            const card = getCreditCards().find(c => c.id === id);
            if (card) {
                document.getElementById('cardName').value = card.name;
                document.getElementById('cardLimit').value = card.limit;
                document.getElementById('cardFlag').value = card.flag;
                document.getElementById('closingDay').value = card.closingDay;
                document.getElementById('dueDay').value = card.dueDay;
                let hidden = document.getElementById('editingCardId');
                if (!hidden) {
                    hidden = document.createElement('input');
                    hidden.type = 'hidden';
                    hidden.id = 'editingCardId';
                    document.getElementById('cardForm').appendChild(hidden);
                }
                hidden.value = id;
                document.querySelector('#cardForm button[type="submit"]').textContent = '✏️ Atualizar Cartão';
                document.querySelector('[data-tab="cards-tab"]').click();
            }
        }
        if (e.target.closest('.delete-card')) {
            const id = parseInt(e.target.closest('.delete-card').dataset.id);
            deleteCard(id);
            refreshAllUI();
        }
        if (e.target.closest('.edit-category')) {
            const oldName = e.target.closest('.edit-category').dataset.cat;
            const newName = prompt('Novo nome:', oldName);
            if (newName && newName !== oldName) {
                renameCategory(oldName, newName);
                refreshAllUI();
            }
        }
        if (e.target.closest('.delete-category')) {
            const catName = e.target.closest('.delete-category').dataset.cat;
            confirmAction(`Deletar categoria "${catName}"?`).then(ok => {
                if (ok) { deleteCategory(catName); refreshAllUI(); }
            });
        }
    });
}

function toggleOffcanvas() {
    document.getElementById('offcanvasMenu').classList.toggle('active');
    document.getElementById('offcanvasOverlay').classList.toggle('active');
}
function closeOffcanvas() {
    document.getElementById('offcanvasMenu').classList.remove('active');
    document.getElementById('offcanvasOverlay').classList.remove('active');
}
function logout() {
    if (confirm('Deseja sair? Os dados permanecem salvos.')) {
        // Mostra a tela de login
        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.querySelector('.app-container');
        const loginForm = document.getElementById('loginForm');
        
        // Limpa os campos de login
        if (loginForm) {
            loginForm.reset();
        }
        
        // Esconde o erro de login se estiver visível
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.style.display = 'none';
        }
        
        // Mostra login e esconde app
        loginScreen.style.display = 'flex';
        appContainer.style.display = 'none';
        
        // NÃO recarrega a página - mantém o CSS carregado!
        
        // Opcional: Limpa dados sensíveis da memória
        // Mas mantém as preferências de tema
    }
}
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('date')) document.getElementById('date').value = today;
    if (document.getElementById('cashflowMonth')) document.getElementById('cashflowMonth').value = getCurrentYearMonth();
}
function initLogin() {
    const loginScreen = document.getElementById('login-screen');
    const splash = document.getElementById('splash-screen');
    const appContainer = document.querySelector('.app-container');
    const loginForm = document.getElementById('loginForm');
    
    loginScreen.style.display = 'flex';
    splash.style.display = 'none';
    appContainer.style.display = 'none';
    
    if (!loginForm) return;
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        if (user === 'Lua' && pass === 'admin') {
            loginScreen.style.display = 'none';
            splash.style.display = 'flex';
            setTimeout(() => {
                splash.style.display = 'none';
                appContainer.style.display = 'block';
                document.body.classList.add('loaded');
                refreshAllUI();
            }, 1500);
        } else {
            document.getElementById('loginError').style.display = 'block';
        }
    });
}
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.warn('SW registration failed:', err));
    }
}