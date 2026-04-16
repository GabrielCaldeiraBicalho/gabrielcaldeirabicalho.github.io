import { formatCurrency, formatDate, getCurrentYearMonth } from '../utils/formatters.js';
import { getTransactions, getCreditCards, getCategories, getCategoryBudgets } from './storage.js';
import { getCategorySpent } from './transactions.js';
import { deleteTransaction } from './transactions.js';
import { confirmAction } from '../utils/dom.js';

export function populateCategorySelects() {
    const catSelect = document.getElementById('category');
    const filterCat = document.getElementById('filterCategory');
    const categories = getCategories();
    const options = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    if (catSelect) catSelect.innerHTML = options;
    if (filterCat) filterCat.innerHTML = '<option value="">Todas categorias</option>' + options;
}

export function updateCardSelect() {
    const sel = document.getElementById('cardIdSelect');
    if (!sel) return;
    const cards = getCreditCards();
    sel.innerHTML = '<option value="">Selecione um cartão</option>' + cards.map(c => `<option value="${c.id}">${c.name} (${formatCurrency(c.limit)})</option>`).join('');
}

export function renderTransactions(filter = { search: '', category: '', month: '' }) {
    const container = document.getElementById('transactionsContainer');
    if (!container) return;
    let filtered = getTransactions().filter(t => {
        if (filter.search && !t.description.toLowerCase().includes(filter.search.toLowerCase()) && !t.category.toLowerCase().includes(filter.search.toLowerCase())) return false;
        if (filter.category && t.category !== filter.category) return false;
        if (filter.month && !t.date.startsWith(filter.month)) return false;
        return true;
    });
    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px;">✨ Nenhuma transação</div>';
        return;
    }
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = '';
    
    filtered.forEach(t => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `transaction-item ${t.type === 'income' ? 'transaction-income' : 'transaction-expense'}`;
        itemDiv.dataset.transactionId = t.id;
        
        const descDiv = document.createElement('div');
        descDiv.style.flexGrow = '1';
        
        const descB = document.createElement('b');
        descB.textContent = t.description;
        descDiv.appendChild(descB);
        
        const infoSmall = document.createElement('small');
        let paymentInfo = '';
        if (t.paymentMethod === 'dinheiro') paymentInfo = '💵 Dinheiro';
        else if (t.paymentMethod === 'debito') paymentInfo = `💳 Débito${t.cardId ? ' (' + (getCreditCards().find(c=>c.id===t.cardId)?.name || 'Cartão') + ')' : ''}`;
        else if (t.paymentMethod === 'credito') paymentInfo = `💳 Crédito (${getCreditCards().find(c=>c.id===t.cardId)?.name || 'Cartão'})`;
        let parcelInfo = t.installments ? ` (${t.parcelNumber || t.installments}x)` : '';
        infoSmall.textContent = `${t.category} · ${paymentInfo}${parcelInfo}`;
        descDiv.appendChild(infoSmall);
        
        const dateSmall = document.createElement('small');
        dateSmall.textContent = formatDate(t.date);
        descDiv.appendChild(dateSmall);
        
        const amtDiv = document.createElement('div');
        amtDiv.className = t.type === 'income' ? 'income-amount' : 'expense-amount';
        amtDiv.textContent = (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.id = t.id;
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', async (e) => {
            const id = parseFloat(e.currentTarget.dataset.id);
            if (await confirmAction('Deletar esta transação?')) {
                deleteTransaction(id);
                renderTransactions(filter);
            }
        });
        
        itemDiv.appendChild(descDiv);
        itemDiv.appendChild(amtDiv);
        itemDiv.appendChild(deleteBtn);
        container.appendChild(itemDiv);
    });
}

export function renderCards() {
    const container = document.getElementById('cardsContainer');
    const cards = getCreditCards();
    if (!cards.length) {
        container.innerHTML = '<div style="text-align:center; padding:30px;">💳 Nenhum cartão cadastrado</div>';
        return;
    }
    container.innerHTML = '';
    cards.forEach(card => {
        const gasto = getTransactions().filter(t => t.type==='expense' && t.cardId === card.id).reduce((s,t)=>s+t.amount,0);
        const restante = card.limit - gasto;
        
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = 'background:var(--card-bg); border-radius:1.5rem; padding:1.2rem; margin-bottom:1rem;';
        
        const flexDiv = document.createElement('div');
        flexDiv.style.cssText = 'display:flex; justify-content:space-between;';
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `<strong>${card.name}</strong> (${card.flag})<br>Limite: ${formatCurrency(card.limit)}<br>Gasto: ${formatCurrency(gasto)}<br>Restante: <span style="color:${restante<0?'#e74c3c':'#2ecc71'}">${formatCurrency(restante)}</span>`;
        
        const btnDiv = document.createElement('div');
        const editBtn = document.createElement('button');
        editBtn.className = 'btn edit-card';
        editBtn.dataset.id = card.id;
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn delete-card';
        delBtn.dataset.id = card.id;
        delBtn.innerHTML = '<i class="fas fa-trash"></i>';
        btnDiv.appendChild(editBtn);
        btnDiv.appendChild(delBtn);
        
        flexDiv.appendChild(infoDiv);
        flexDiv.appendChild(btnDiv);
        itemDiv.appendChild(flexDiv);
        container.appendChild(itemDiv);
    });
}

export function renderManageTab() {
    const container = document.getElementById('manageCategoriesList');
    const categories = getCategories();
    if (!categories.length) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">✨ Nenhuma categoria</div>';
        return;
    }
    container.innerHTML = categories.map(cat => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:var(--card-bg); border-radius:1.5rem; margin-bottom:12px;">
            <span>${cat}</span>
            <div><button class="btn edit-category" data-cat="${cat}"><i class="fas fa-edit"></i></button> <button class="delete-btn delete-category" data-cat="${cat}"><i class="fas fa-trash"></i></button></div>
        </div>
    `).join('');
}