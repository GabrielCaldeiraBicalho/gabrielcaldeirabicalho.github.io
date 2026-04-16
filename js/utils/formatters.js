export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const parseMoney = (str) => {
    if (!str || typeof str !== 'string') return 0;
    // Remove tudo exceto dígitos, vírgula e ponto
    let cleaned = str.replace(/[^\d,.-]/g, '');
    // Se tiver vírgula como separador decimal (ex: 1.234,56)
    if (cleaned.includes(',') && cleaned.includes('.')) {
        // Formato brasileiro: remove pontos de milhar e troca vírgula por ponto
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
        // Apenas vírgula: assume que é separador decimal
        cleaned = cleaned.replace(',', '.');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? 0 : num;
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const getCurrentYearMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const addMonthsToDate = (dateStr, months) => {
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + months);
    if (date.getDate() !== new Date(dateStr).getDate()) {
        date.setDate(0);
    }
    return date.toISOString().split('T')[0];
};