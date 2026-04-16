import { getCategoryBudgets, setCategoryBudget, removeCategoryBudget, getTransactions } from './storage.js';
import { parseMoney, formatCurrency } from '../utils/formatters.js';
import { showToast } from '../utils/dom.js';

export function getBudgetsForMonth(month) {
    return getCategoryBudgets().filter(b => b.yearMonth === month);
}

export function saveBudget(month, category, limitRaw) {
    const limit = parseMoney(limitRaw);
    if (limit <= 0) {
        removeCategoryBudget(month, category);
        showToast(`Meta "${category}" removida`, 'info');
    } else {
        setCategoryBudget(month, category, limit);
        showToast(`Meta "${category}" salva: ${formatCurrency(limit)}`, 'success');
    }
}

export function getSpentForCategory(month, category) {
    return getTransactions().filter(t => t.type === 'expense' && t.date.startsWith(month) && t.category === category)
        .reduce((s, t) => s + t.amount, 0);
}

export function calculateBudgetProgress(month, category, limit) {
    const spent = getSpentForCategory(month, category);
    const percent = limit > 0 ? (spent / limit * 100) : 0;
    const color = percent > 100 ? '#e74c3c' : percent > 80 ? '#f39c12' : 'var(--primary-color)';
    return { spent, percent, color };
}