export function initTheme() {
    const savedDark = localStorage.getItem('luaFinances_darkMode');
    const savedHue = localStorage.getItem('luaFinances_themeHue') || '340';
    const isDark = savedDark !== null ? savedDark === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    document.body.classList.toggle('dark', isDark);
    document.documentElement.style.setProperty('--primary-hue', savedHue);
    
    ['themeColorSelect', 'themeColorSelectManage'].forEach(id => {
        const select = document.getElementById(id);
        if (select) select.value = savedHue;
    });
    
    updateThemeIcons(isDark);
}

export function toggleTheme() {
    const isCurrentlyDark = document.body.classList.contains('dark');
    const newDark = !isCurrentlyDark;
    document.body.classList.toggle('dark', newDark);
    localStorage.setItem('luaFinances_darkMode', newDark.toString());
    updateThemeIcons(newDark);
}

export function changeThemeColor(hue) {
    document.documentElement.style.setProperty('--primary-hue', hue);
    localStorage.setItem('luaFinances_themeHue', hue);
    ['themeColorSelect', 'themeColorSelectManage'].forEach(id => {
        const select = document.getElementById(id);
        if (select && select.value !== hue) select.value = hue;
    });
}

function updateThemeIcons(isDark) {
    const btns = ['themeToggleBtn', 'themeToggleBtnManage'];
    btns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    });
}