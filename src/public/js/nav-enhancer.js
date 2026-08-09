// ===== NAV ICON ENHANCER (Phase 45) =====
document.addEventListener('DOMContentLoaded', () => {
    if (typeof IconsPro === 'undefined') return;
    
    const viewIconMap = {
        'dashboard': 'dashboard',
        'inbox': 'inbox',
        'pipeline': 'pipeline',
        'companies': 'company',
        'people': 'people',
        'tasks': 'tasks',
        'projects': 'projects',
        'ideas': 'ideas',
        'okr': 'okr',
        'graph': 'graph',
        'notes': 'notes',
        'backups': 'backups',
        'reports': 'reports',
        'settings': 'settings',
    };
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const view = link.getAttribute('data-view');
        const iconName = viewIconMap[view];
        if (iconName && IconsPro[iconName]) {
            const iconSpan = link.querySelector('.nav-icon');
            if (iconSpan) {
                // Only replace if empty or contains emoji
                const currentContent = iconSpan.textContent.trim();
                const hasEmoji = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u.test(currentContent);
                if (currentContent === '' || hasEmoji) {
                    iconSpan.innerHTML = IconsPro[iconName](18);
                }
            }
        }
    });
    
    console.log('[NavEnhancer] Icons updated');
});