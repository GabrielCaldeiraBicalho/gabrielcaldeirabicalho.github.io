import { getCreditCards, addCreditCard, updateCreditCard, removeCreditCard, getTransactions } from './storage.js';
import { parseMoney, formatCurrency } from '../utils/formatters.js';
import { showToast } from '../utils/dom.js';

export function createCard(name, limitStr, flag, closingDay, dueDay, editingId = null) {
    const limitNum = parseMoney(limitStr);
    if (!name.trim() || limitNum <= 0) {
        showToast('Nome e limite > 0 obrigatórios (formato 123,45)', 'error');
        return false;
    }

    const cardData = {
        id: editingId ? parseFloat(editingId) : Date.now() + Math.random(),
        name, limit: limitNum, flag, 
        closingDay: parseInt(closingDay) || 5, 
        dueDay: parseInt(dueDay) || 15
    };
    if (editingId) {
        updateCreditCard(parseFloat(editingId), cardData);
        showToast(`Cartão "${name}" atualizado!`, 'success');
    } else {
        addCreditCard(cardData);
        showToast(`Cartão "${name}" criado!`, 'success');
    }
    return true;
}

export function deleteCard(id) {
    removeCreditCard(id);
    showToast('Cartão removido!', 'success');
}

export function getCardUsage(cardId) {
    const total = getTransactions().filter(t => t.cardId === cardId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const card = getCreditCards().find(c => c.id === cardId);
    return { total, remaining: card ? card.limit - total : 0 };
}

export function getCardSelectOptions() {
    return getCreditCards().map(c => `<option value="${c.id}">${c.name} (${formatCurrency(c.limit)})</option>`).join('');
}