import { getTransactions, getCreditCards, addTransaction } from './storage.js';
import { formatCurrency, getCurrentYearMonth } from '../utils/formatters.js';
import { showToast, confirmAction } from '../utils/dom.js';

export function calculateHealthScore() {
    const transactions = getTransactions();
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = inc - exp;
    const currentMonth = getCurrentYearMonth();
    const monthExp = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
    const avgMonthlyExp = monthExp || (exp / 6);
    const monthsReserve = avgMonthlyExp > 0 ? balance / avgMonthlyExp : 0;
    const savingsRate = inc > 0 ? ((inc - exp) / inc * 100) : 0;
    
    let score = 0;
    if (savingsRate >= 20) score += 3;
    else if (savingsRate >= 10) score += 1;
    if (monthsReserve >= 6) score += 4;
    else if (monthsReserve >= 3) score += 2;
    if (savingsRate > 0) score += 1;
    return Math.min(Math.floor(score), 10);
}

export function renderInvoices(month = null) {
    const container = document.getElementById('invoicesContainer');
    if (!container) return;
    if (!month) month = getCurrentYearMonth();
    const cards = getCreditCards();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    let html = `<div class="filters-bar"><input type="month" id="invoiceMonthFilter" value="${month}" style="border-radius:30px;"></div>`;
    html += `<h3>Faturas Cartões - ${month}</h3>`;
    
    if (!cards.length) {
        html += '<div style="text-align:center; padding:30px;">Cadastre cartões na aba Cartões</div>';
        container.innerHTML = html;
        return;
    }
    
    let totalOpen = 0;
    cards.forEach(card => {
        const gastos = getTransactions().filter(t => t.cardId === card.id && t.type === 'expense' && t.date.startsWith(month));
        const fatura = gastos.reduce((s,t) => s + t.amount, 0);
        const closingDay = card.closingDay || 5;
        const dueDay = card.dueDay || 15;
        
        // Determina status baseado na data atual
        const [year, mon] = month.split('-').map(Number);
        const closingDate = new Date(year, mon - 1, closingDay);
        const dueDate = new Date(year, mon - 1, dueDay);
        let status;
        if (today > dueDate) status = 'Vencida';
        else if (today > closingDate) status = 'Fechada - Pagar';
        else status = 'Aberta';
        
        if (status === 'Fechada - Pagar') totalOpen += fatura;
        const color = status === 'Vencida' ? '#e74c3c' : (status === 'Fechada - Pagar' ? '#f39c12' : '#2ecc71');
        html += `<div class="card" style="border-left:5px solid ${color}; margin-bottom:1rem;">
            <div><strong>${card.name}</strong> <span style="color:${color}">${status}</span></div>
            <div style="font-size:1.5rem;">${formatCurrency(fatura)}</div>
            <small>Fechamento: ${closingDay} | Venc: ${dueDay}</small>
            ${status === 'Fechada - Pagar' ? `<button class="btn-primary pay-fatura" data-card="${card.id}" data-month="${month}">Pagar Fatura</button>` : ''}
            <details><summary>Detalhes (${gastos.length})</summary>${gastos.map(g => `<div>${g.description} ${formatCurrency(g.amount)}</div>`).join('') || 'Nenhum gasto'}</details>
        </div>`;
    });
    if (totalOpen > 0) {
        html += `<div class="card" style="background:#f8d7da;"><button class="btn-primary" id="payAllFaturasBtn">Pagar Todas Faturas Fechadas (${formatCurrency(totalOpen)})</button></div>`;
    }
    container.innerHTML = html;
    
    document.getElementById('invoiceMonthFilter')?.addEventListener('change', (e) => renderInvoices(e.target.value));
    container.querySelectorAll('.pay-fatura').forEach(btn => {
        btn.addEventListener('click', () => payCardFatura(btn.dataset.card, btn.dataset.month));
    });
    document.getElementById('payAllFaturasBtn')?.addEventListener('click', payAllFaturas);
}

async function payCardFatura(cardId, month) {
    const card = getCreditCards().find(c => c.id == cardId);
    if (!card) return;
    const gastos = getTransactions().filter(t => t.cardId == cardId && t.type === 'expense' && t.date.startsWith(month));
    const total = gastos.reduce((s,t) => s + t.amount, 0);
    if (total === 0) return showToast('Nenhum gasto', 'warning');
    const ok = await confirmAction(`Pagar fatura ${card.name} de ${formatCurrency(total)}?`);
    if (ok) {
        addTransaction({
            id: Date.now() + Math.random(),
            description: `Pagamento Fatura ${card.name} (${month})`,
            amount: total,
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            category: 'Pagamento Faturas Cartão',
            paymentMethod: 'dinheiro'
        });
        // Garante que a categoria existe
        if (!getCategories().includes('Pagamento Faturas Cartão')) {
            addCategory('Pagamento Faturas Cartão');
        }
        showToast(`Fatura ${card.name} paga!`, 'success');
        renderInvoices(month);
    }
}

async function payAllFaturas() {
    const month = document.getElementById('invoiceMonthFilter')?.value || getCurrentYearMonth();
    const cards = getCreditCards();
    let total = 0;
    const today = new Date();
    cards.forEach(card => {
        const gastos = getTransactions().filter(t => t.cardId === card.id && t.type === 'expense' && t.date.startsWith(month));
        const fatura = gastos.reduce((s,t) => s + t.amount, 0);
        const closingDay = card.closingDay || 5;
        const [year, mon] = month.split('-').map(Number);
        const closingDate = new Date(year, mon - 1, closingDay);
        if (today > closingDate && fatura > 0) total += fatura;
    });
    if (total === 0) return showToast('Nenhuma fatura fechada', 'info');
    const ok = await confirmAction(`Pagar todas faturas fechadas (${formatCurrency(total)})?`);
    if (ok) {
        cards.forEach(card => {
            const gastos = getTransactions().filter(t => t.cardId === card.id && t.type === 'expense' && t.date.startsWith(month));
            const fatura = gastos.reduce((s,t) => s + t.amount, 0);
            const closingDay = card.closingDay || 5;
            const [year, mon] = month.split('-').map(Number);
            const closingDate = new Date(year, mon - 1, closingDay);
            if (today > closingDate && fatura > 0) {
                addTransaction({
                    id: Date.now() + Math.random(),
                    description: `Pagamento Fatura ${card.name} (${month})`,
                    amount: fatura,
                    date: new Date().toISOString().split('T')[0],
                    type: 'expense',
                    category: 'Pagamento Faturas Cartão',
                    paymentMethod: 'dinheiro'
                });
            }
        });
        if (!getCategories().includes('Pagamento Faturas Cartão')) {
            addCategory('Pagamento Faturas Cartão');
        }
        showToast(`Todas faturas pagas! Total: ${formatCurrency(total)}`, 'success');
        renderInvoices(month);
    }
}