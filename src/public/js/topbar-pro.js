// ===== ULTRA TOPBAR MODULE (Phase 23.5) =====
const TB_SVG = {
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

function setTopbarIcons() {
    const tb = document.querySelector('.topbar');
    if (!tb) return;
    const btns = Array.from(tb.querySelectorAll('.topbar-actions .icon-button'));
    let nonNotif = 0;
    btns.forEach(b => {
        if (b.id === 'notificationBtn') {
            b.innerHTML = (b.querySelector('.notification-badge') ? b.querySelector('.notification-badge').outerHTML : '') + TB_SVG.bell;
            b.dataset.tip = 'اعلان‌ها';
        } else {
            const keep = b.querySelector('.notification-badge');
            b.innerHTML = (keep ? keep.outerHTML : '') + (nonNotif === 0 ? TB_SVG.gear : TB_SVG.download);
            b.dataset.tip = nonNotif === 0 ? 'تنظیمات' : 'پشتیبان‌گیری';
            nonNotif++;
        }
    });
}

function enhanceTopbar2() {
    const tb = document.querySelector('.topbar');
    if (!tb) return;
    
    setTopbarIcons();
    
    // Avatar (add once)
    if (!tb.querySelector('.tb-avatar')) {
        const av = document.createElement('div');
        av.className = 'tb-avatar';
        av.title = 'کاربر من';
        av.innerHTML = '<div class="tb-avatar-inner">من</div><div class="tb-avatar-status"></div>';
        av.onclick = () => { if (typeof switchView === 'function') switchView('settings'); };
        tb.appendChild(av);
    }
    
    // Scroll-aware
    window.addEventListener('scroll', () => {
        tb.classList.toggle('scrolled', window.scrollY > 8);
    }, true);
    
    // Bell ping when badge visible
    setInterval(() => {
        const bell = document.getElementById('notificationBtn');
        const badge = document.getElementById('notifBadge');
        if (bell && badge) bell.classList.toggle('has-notif', badge.style.display !== 'none');
    }, 1000);
}

// Re-apply icons after each render (beat core's icon map)
const origRD2 = window.renderDashboard;
window.renderDashboard = function() { origRD2(); setTimeout(setTopbarIcons, 100); };
const origSV2 = window.switchView;
window.switchView = function(v) { origSV2(v); setTimeout(setTopbarIcons, 100); };

setTimeout(enhanceTopbar2, 400);
setTimeout(setTopbarIcons, 1200);
console.log('[UltraTopbar] loaded');
// Theme toggle button in topbar
setTimeout(() => {
    const tb = document.querySelector('.topbar-actions');
    if (!tb || tb.querySelector('#themeToggle')) return;
    
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'icon-button';
    btn.title = 'تغییر تم';
    btn.innerHTML = $context.state.theme === 'dark' ? '☀️' : '🌙';
    btn.onclick = () => {
        $context.toggleTheme();
        btn.innerHTML = $context.state.theme === 'dark' ? '☀️' : '🌙';
    };
    
    tb.insertBefore(btn, tb.firstChild);
}, 300);
