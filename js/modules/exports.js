import { getTransactions } from './storage.js';
import { formatCurrency, formatDate, getCurrentYearMonth } from '../utils/formatters.js';
import { showToast } from '../utils/dom.js';
import { calculateHealthScore } from './invoices.js';

export async function generatePDF(month = null) {
    if (!month) month = getCurrentYearMonth();
    if (typeof window.jspdf === 'undefined') {
        showToast('Biblioteca jsPDF não carregada.', 'error');
        return;
    }
    showToast('Gerando PDF... aguarde', 'info');
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Lua Finanças - Extrato Mensal', 20, 25);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Mês: ${month}`, 20, 35);
        pdf.text(`Gerado: ${new Date().toLocaleDateString('pt-BR')}`, 20, 42);
        
        let inc = 0, exp = 0;
        const monthTxs = getTransactions().filter(t => t.date.startsWith(month));
        monthTxs.forEach(t => t.type === 'income' ? inc += t.amount : exp += t.amount);
        const balance = inc - exp;
        
        pdf.text('RESUMO', 20, 60);
        pdf.text(`Receitas: ${formatCurrency(inc).replace('R$ ', '')}`, 20, 70);
        pdf.text(`Despesas: ${formatCurrency(exp).replace('R$ ', '')}`, 20, 78);
        pdf.text(`Saldo: ${formatCurrency(balance).replace('R$ ', '')}`, 20, 86);
        
        const score = calculateHealthScore();
        pdf.setFontSize(16);
        pdf.text(`Nota Saúde Financeira: ${score}/10`, 20, 105);
        
        pdf.text('TRANSAÇÕES', 20, 125);
        let y = 135;
        monthTxs.sort((a,b) => new Date(b.date) - new Date(a.date));
        monthTxs.forEach(t => {
            if (y > 270) { pdf.addPage(); y = 25; }
            const sign = t.type === 'income' ? '+' : '-';
            pdf.text(`${formatDate(t.date)} | ${t.description} | ${sign}${formatCurrency(t.amount).replace('R$ ', '')}`, 20, y);
            y += 7;
        });
        pdf.setFontSize(8);
        pdf.text('Lua Finanças v0.9 - Dados locais', 20, 290);
        pdf.save(`lua-financas-${month}.pdf`);
        showToast('PDF gerado com sucesso!', 'success');
    } catch (error) {
        console.error(error);
        showToast('Erro ao gerar PDF', 'error');
    }
}

export function exportCategoriesJSON(categories) {
    const dataStr = JSON.stringify(categories, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categorias-lua-financas.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Categorias exportadas!', 'success');
}

export function importCategoriesJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) callback(imported);
            else showToast('Formato inválido (deve ser array)', 'error');
        } catch { showToast('Erro ao ler JSON', 'error'); }
    };
    reader.readAsText(file);
}