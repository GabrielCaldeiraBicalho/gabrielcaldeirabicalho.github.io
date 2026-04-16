export const showToast = (msg, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : 'info-circle');
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
};

export const confirmAction = (msg) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        if (!modal) return resolve(false);
        document.getElementById('confirmMessage').innerText = msg;
        modal.classList.add('active');
        const onConfirm = () => { modal.classList.remove('active'); resolve(true); cleanup(); };
        const onCancel = () => { modal.classList.remove('active'); resolve(false); cleanup(); };
        const cleanup = () => {
            document.getElementById('modalConfirm')?.removeEventListener('click', onConfirm);
            document.getElementById('modalCancel')?.removeEventListener('click', onCancel);
        };
        document.getElementById('modalConfirm').addEventListener('click', onConfirm);
        document.getElementById('modalCancel').addEventListener('click', onCancel);
    });
};