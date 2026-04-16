export const validateTransaction = (data) => {
    if (!data.description?.trim()) return 'Descrição obrigatória';
    if (data.amount <= 0) return 'Valor deve ser maior que zero';
    if (!data.category) return 'Selecione uma categoria';
    return null;
};

export const validateCard = (data) => {
    if (!data.name?.trim()) return 'Nome do cartão obrigatório';
    if (data.limit <= 0) return 'Limite deve ser maior que zero';
    return null;
};

export const validateBudgetLimit = (value) => {
    const num = parseMoney(value);
    return num >= 0 ? null : 'Limite deve ser >= 0';
};