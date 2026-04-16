import { getCategories, addCategory, removeCategory, updateCategory, getTransactions, getCategoryBudgets, saveToLocalStorage } from './storage.js';
import { showToast } from '../utils/dom.js';

export function getCategoryList() {
    return [...getCategories()];
}

export function addNewCategory(name) {
    if (!name || getCategories().includes(name)) {
        showToast('Nome inválido ou duplicado', 'error');
        return false;
    }
    addCategory(name);
    showToast(`Categoria "${name}" adicionada!`, 'success');
    return true;
}

export function renameCategory(oldName, newName) {
    if (!newName || getCategories().includes(newName)) {
        showToast('Nome inválido ou já existe', 'error');
        return false;
    }
    updateCategory(oldName, newName);
    showToast(`Categoria renomeada para "${newName}"`, 'success');
    return true;
}

export function deleteCategory(catName) {
    // Move transações dessa categoria para "Outros"
    const transactions = getTransactions();
    transactions.forEach(t => { if (t.category === catName) t.category = 'Outros'; });
    // Remove orçamentos da categoria
    const budgets = getCategoryBudgets();
    const filtered = budgets.filter(b => b.category !== catName);
    // Atualiza storage
    removeCategory(catName);
    // Salva
    saveToLocalStorage();
    showToast(`Categoria "${catName}" removida e transações movidas para Outros`, 'success');
}

export function getCategoryUsageCount(category) {
    return getTransactions().filter(t => t.category === category).length;
}