// ===== NAV ICON ENHANCER (Phase 45) =====
document.addEventListener('DOMContentLoaded', () => {
    const tryEnhance = () => {
        if (typeof IconsPro === 'undefined') {
            setTimeout(tryEnhance, 100);
            return;
        }
        
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
        
        let updated = 0;
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const view = link.getAttribute('data-view');
            const iconName = viewIconMap[view];
            if (iconName && IconsPro[iconName]) {
                const iconSpan = link.querySelector('.nav-icon');
                if (iconSpan) {
                    const currentContent = iconSpan.textContent.trim();
                    // Replace if empty or if contains any non-ASCII (emoji)
                    if (currentContent === '' || /[^\x00-\x7F]/.test(currentContent)) {
                        iconSpan.innerHTML = IconsPro[iconName](18);
                        iconSpan.style.display = 'inline-flex';
                        iconSpan.style.alignItems = 'center';
                        iconSpan.style.justifyContent = 'center';
                        updated++;
                    }
                }
            }
        });
        
        if (updated > 0) {
            console.log(`[NavEnhancer] Updated ${updated} nav icons to SVG`);
        }
    };
    
    tryEnhance();
});