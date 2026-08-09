// ===== ULTRA TOPBAR MODULE (Phase 23.5) =====
const TB_SVG = {
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

TB_SVG.database = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>';
TB_SVG.sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
TB_SVG.moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
function setTopbarIcons() {
  const tb = document.querySelector('.topbar');
  if (!tb) return;
  const btns = Array.from(tb.querySelectorAll('.topbar-actions .icon-button'));
  btns.forEach(b => {
    const id = b.id || '';
    const title = (b.getAttribute('title') || '').toLowerCase();
    const onclick = (b.getAttribute('onclick') || '').toLowerCase();
    const cls = (b.className || '').toLowerCase();
    // Skip theme-switcher button (it manages its own icon)
    if (cls.includes('theme-toggle-btn')) return;
    const keep = b.querySelector('.notification-badge');
    const keepHtml = keep ? keep.outerHTML : '';
    let icon = null;
    if (id === 'notificationBtn' || title.includes('notification') || title.includes('اعلان')) {
      icon = TB_SVG.bell;
    } else if (id === 'installBtn' || title.includes('نصب') || title.includes('install')) {
      icon = TB_SVG.download;
    } else if (id === 'themeToggle' || cls.includes('theme') || title.includes('تم') || title.includes('theme')) {
      const t = (typeof themeSwitcher !== 'undefined') ? themeSwitcher.getCurrentTheme() : 'dark';
      icon = (t === 'dark') ? TB_SVG.sun : TB_SVG.moon;
    } else if (title.includes('settings') || title.includes('تنظیمات') || onclick.includes('settings')) {
      icon = TB_SVG.gear;
    } else if (title.includes('backup') || title.includes('پشتیبان')) {
      icon = TB_SVG.database;
    }
    if (icon) b.innerHTML = keepHtml + icon;
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

