let transactions = [];
let creditCards = [];
let monthlyBudgets = [];
let categoryBudgets = [];
let categories = [];

export function loadFromLocalStorage() {
    const saved = localStorage.getItem('luaFinances_v4_full');
    if (saved) {
        try {
            const d = JSON.parse(saved);
            transactions = d.transactions || [];
            creditCards = d.creditCards || [];
            monthlyBudgets = d.monthlyBudgets || [];
            categoryBudgets = d.categoryBudgets || [];
            categories = d.categories || [];
        } catch(e) { console.error(e); }
    }
    if (categories.length === 0) {
        categories = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Moradia', 'Outros'];
    }
}

export function saveToLocalStorage() {
    const data = { transactions, creditCards, monthlyBudgets, categoryBudgets, categories };
    localStorage.setItem('luaFinances_v4_full', JSON.stringify(data));
}

// Getters
export const getTransactions = () => transactions;
export const getCreditCards = () => creditCards;
export const getCategories = () => categories;
export const getCategoryBudgets = () => categoryBudgets;

// Setters / mutations
export const addTransaction = (tx) => { transactions.push(tx); saveToLocalStorage(); };
export const removeTransaction = (id) => { transactions = transactions.filter(t => t.id !== id); saveToLocalStorage(); };
export const setTransactions = (newTx) => { transactions = newTx; saveToLocalStorage(); };

export const addCreditCard = (card) => { creditCards.push(card); saveToLocalStorage(); };
export const updateCreditCard = (id, newData) => {
    const index = creditCards.findIndex(c => c.id === id);
    if (index !== -1) { creditCards[index] = { ...creditCards[index], ...newData }; saveToLocalStorage(); }
};
export const removeCreditCard = (id) => { creditCards = creditCards.filter(c => c.id !== id); saveToLocalStorage(); };
export const setCreditCards = (cards) => { creditCards = cards; saveToLocalStorage(); };

export const addCategory = (cat) => { if (!categories.includes(cat)) { categories.push(cat); saveToLocalStorage(); } };
export const removeCategory = (cat) => { categories = categories.filter(c => c !== cat); saveToLocalStorage(); };
export const updateCategory = (oldName, newName) => {
    const idx = categories.indexOf(oldName);
    if (idx !== -1) categories[idx] = newName;
    // Atualiza transações
    transactions.forEach(t => { if (t.category === oldName) t.category = newName; });
    // Atualiza orçamentos
    categoryBudgets.forEach(b => { if (b.category === oldName) b.category = newName; });
    saveToLocalStorage();
};

export const setCategoryBudget = (yearMonth, category, limit) => {
    const existing = categoryBudgets.find(b => b.yearMonth === yearMonth && b.category === category);
    if (existing) existing.limit = limit;
    else categoryBudgets.push({ yearMonth, category, limit });
    saveToLocalStorage();
};
export const removeCategoryBudget = (yearMonth, category) => {
    categoryBudgets = categoryBudgets.filter(b => !(b.yearMonth === yearMonth && b.category === category));
    saveToLocalStorage();
};

// Inicialização automática
loadFromLocalStorage();