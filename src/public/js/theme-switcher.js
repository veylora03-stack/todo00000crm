// ===== THEME SWITCHER v2 (Phase 45 - with SVG Icons) =====
const themeSwitcher = (() => {
    const STORAGE_KEY = 'crm_theme';
    const TRANSITION_CLASS = 'theme-transitioning';
    
    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    
    function getCurrentTheme() {
        return localStorage.getItem(STORAGE_KEY) || getSystemTheme();
    }
    
    function updateToggleIcon(theme) {
        const toggleIcon = document.getElementById('themeToggleIcon');
        if (!toggleIcon) return;
        
        if (typeof IconsPro !== 'undefined') {
            toggleIcon.innerHTML = theme === 'dark' ? IconsPro.moon(12) : IconsPro.sun(12);
            toggleIcon.style.color = 'var(--text-primary)';
            toggleIcon.style.display = 'flex';
            toggleIcon.style.alignItems = 'center';
            toggleIcon.style.justifyContent = 'center';
        } else {
            toggleIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }
    
    function applyTheme(theme, animate = true) {
        const body = document.body;
        const html = document.documentElement;
        
        if (animate) {
            body.classList.add(TRANSITION_CLASS);
            body.classList.add('theme-changing');
            setTimeout(() => {
                body.classList.remove(TRANSITION_CLASS);
                body.classList.remove('theme-changing');
            }, 400);
        }
        
        html.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#7c3aed' : '#ffffff';
        }
        
        updateToggleIcon(theme);
        console.log(`[Theme] Switched to: ${theme}`);
    }
    
    function toggle() {
        const current = getCurrentTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        
        if (typeof toast === 'function') {
            toast(`تم ${next === 'dark' ? 'تاریک' : 'روشن'} فعال شد`, 'success');
        }
    }
    
    function init() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const theme = savedTheme || getSystemTheme();
        applyTheme(theme, false);
        
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'light' : 'dark');
            }
        });
        
        console.log('[Theme] Switcher initialized, theme:', theme);
    }
    
    return { init, toggle, getCurrentTheme, applyTheme, updateToggleIcon };
})();

document.addEventListener('DOMContentLoaded', () => {
    themeSwitcher.init();
    
    const topbarActions = document.querySelector('.topbar-actions');
    if (topbarActions && !document.querySelector('.theme-toggle-btn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'icon-button theme-toggle-btn';
        toggleBtn.title = 'تغییر تم';
        toggleBtn.innerHTML = '<span id="themeToggleIcon" style="display:inline-flex;align-items:center;justify-content:center;"></span>';
        toggleBtn.onclick = () => themeSwitcher.toggle();
        
        const settingsBtn = topbarActions.querySelector('button[title="Settings"]');
        if (settingsBtn) {
            topbarActions.insertBefore(toggleBtn, settingsBtn);
        } else {
            topbarActions.appendChild(toggleBtn);
        }
        
        // Wait for IconsPro to be ready, then set initial icon
        const trySetIcon = () => {
            if (typeof IconsPro !== 'undefined') {
                themeSwitcher.updateToggleIcon(themeSwitcher.getCurrentTheme());
            } else {
                setTimeout(trySetIcon, 100);
            }
        };
        setTimeout(trySetIcon, 200);
    }
});

window.themeSwitcher = themeSwitcher;
console.log('[Theme] Switcher v2 loaded');