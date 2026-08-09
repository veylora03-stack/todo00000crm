// ===== THEME SWITCHER (Phase 44) =====
const themeSwitcher = (() => {
    const STORAGE_KEY = 'crm_theme';
    const TRANSITION_CLASS = 'theme-transitioning';
    
    // Detect system preference
    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    
    // Get current theme
    function getCurrentTheme() {
        return localStorage.getItem(STORAGE_KEY) || getSystemTheme();
    }
    
    // Apply theme
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
        
        // Update meta theme-color for PWA
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#7c3aed' : '#ffffff';
        }
        
        console.log(`[Theme] Switched to: ${theme}`);
    }
    
    // Toggle theme
    function toggle() {
        const current = getCurrentTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        
        if (typeof toast === 'function') {
            toast(`تم ${next === 'dark' ? 'تاریک' : 'روشن'} فعال شد`, 'success');
        }
    }
    
    // Initialize
    function init() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        const theme = savedTheme || getSystemTheme();
        applyTheme(theme, false);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'light' : 'dark');
            }
        });
        
        console.log('[Theme] Switcher initialized, theme:', theme);
    }
    
    return { init, toggle, getCurrentTheme, applyTheme };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    themeSwitcher.init();
    
    // Add toggle button to topbar
    const topbarActions = document.querySelector('.topbar-actions');
    if (topbarActions) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'icon-button theme-toggle-btn';
        toggleBtn.title = 'تغییر تم';
        toggleBtn.innerHTML = '<span class="theme-toggle"><span class="theme-toggle-thumb" id="themeToggleIcon"></span></span>';
        toggleBtn.onclick = () => themeSwitcher.toggle();
        
        // Insert before settings button
        const settingsBtn = topbarActions.querySelector('button[title="Settings"]');
        if (settingsBtn) {
            topbarActions.insertBefore(toggleBtn, settingsBtn);
        } else {
            topbarActions.appendChild(toggleBtn);
        }
    }
});

window.themeSwitcher = themeSwitcher;
console.log('[Theme] Switcher loaded');