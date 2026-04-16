import { getTransactions, addTransaction, removeTransaction, getCreditCards } from './storage.js';
import { parseMoney, getCurrentYearMonth, addMonthsToDate } from '../utils/formatters.js';
import { showToast } from '../utils/dom.js';

export function createTransaction(desc, amountStr, date, type, category, paymentMethod, cardId = null, installments = 1) {
    const amount = parseMoney(amountStr);
    if (!desc.trim() || amount <= 0) {
        showToast('Descrição e valor > 0 obrigatórios (use formato 123,45)', 'error');
        return false;
    }
    if (amount > 999999) {
        showToast('Valor muito alto!', 'error');
        return false;
    }

    if (installments > 1 && paymentMethod === 'credito') {
        for (let i = 1; i <= installments; i++) {
            const parcelDate = addMonthsToDate(date, i - 1);
            const tx = {
                id: Date.now() + Math.random() + i,
                description: `${desc} (Parcela ${i}/${installments})`,
                amount: amount,
                date: parcelDate,
                type, category, paymentMethod, cardId,
                installments, parcelNumber: i
            };
            addTransaction(tx);
        }
        showToast(`${installments} parcelas adicionadas!`, 'success');
        return true;
    } else {
        const tx = {
            id: Date.now() + Math.random(),
            description: desc,
            amount, date, type, category, paymentMethod, cardId
        };
        addTransaction(tx);
        showToast(type === 'income' ? 'Receita adicionada!' : 'Despesa adicionada!', 'success');
        return true;
    }
}

export function deleteTransaction(id) {
    removeTransaction(id);
    showToast('Transação removida!', 'success');
}

export function getTotalIncome() {
    return getTransactions().filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

export function getTotalExpense() {
    return getTransactions().filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

export function getBalance() {
    return getTotalIncome() - getTotalExpense();
}

export function getExpensesByCategory(month = null) {
    const tx = getTransactions().filter(t => t.type === 'expense');
    if (month) {
        return tx.filter(t => t.date.startsWith(month)).reduce((map, t) => {
            map.set(t.category, (map.get(t.category) || 0) + t.amount);
            return map;
        }, new Map());
    }
    return tx.reduce((map, t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
        return map;
    }, new Map());
}

export function getTransactionsForMonth(month) {
    return getTransactions().filter(t => t.date.startsWith(month));
}

export function getCategorySpent(month, category) {
    return getTransactions().filter(t => t.type === 'expense' && t.date.startsWith(month) && t.category === category)
        .reduce((s, t) => s + t.amount, 0);
}