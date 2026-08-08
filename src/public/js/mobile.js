// ===== MOBILE MODULE (Phase 27) =====
const MOBILE_NAV = [
    { view: 'dashboard', icon: '🏠', label: 'خانه' },
    { view: 'tasks', icon: '✅', label: 'کارها' },
    { view: 'inbox', icon: '📥', label: 'Inbox' },
    { view: 'people', icon: '👥', label: 'مخاطبان' },
    { view: '__more', icon: '☰', label: 'بیشتر' }
];

function isMobile() { return window.innerWidth <= 768; }

function injectMobile() {
    if (document.getElementById('bottomNav')) return;
    
    // Hamburger
    const tb = document.querySelector('.topbar');
    if (tb && !tb.querySelector('.mobile-menu-btn')) {
        const mb = document.createElement('button');
        mb.className = 'mobile-menu-btn';
        mb.innerHTML = '☰';
        mb.onclick = toggleSidebar;
        tb.prepend(mb);
    }
    
    // Overlay
    const ov = document.createElement('div');
    ov.className = 'sidebar-overlay';
    ov.onclick = () => document.body.classList.remove('sidebar-open');
    document.body.appendChild(ov);
    
    // Bottom nav
    const nav = document.createElement('nav');
    nav.id = 'bottomNav';
    nav.className = 'bottom-nav';
    nav.innerHTML = MOBILE_NAV.map(n => `
        <button class="bn-item" data-view="${n.view}" onclick="mobileNav('${n.view}')">
            <span class="bn-icon">${n.icon}</span>
            <span>${n.label}</span>
        </button>
    `).join('');
    document.body.appendChild(nav);
    
    syncBottomNav();
}

function mobileNav(view) {
    if (view === '__more') { toggleSidebar(); return; }
    switchView(view);
    document.body.classList.remove('sidebar-open');
}

function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

function syncBottomNav() {
    document.querySelectorAll('.bn-item').forEach(b => {
        b.classList.toggle('active', b.dataset.view === currentView);
    });
}

// Wrap switchView to sync bottom nav + close sidebar
const origSwitchViewM = window.switchView;
window.switchView = function(v) {
    origSwitchViewM(v);
    syncBottomNav();
    document.body.classList.remove('sidebar-open');
};

// Swipe to switch views
let touchX = null;
const SWIPE_VIEWS = ['dashboard', 'tasks', 'inbox', 'people'];
document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
    if (touchX === null || !isMobile()) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 80) return;
    // Ignore if touching interactive
    const idx = SWIPE_VIEWS.indexOf(currentView);
    if (idx === -1) return;
    if (dx < 0 && idx < SWIPE_VIEWS.length - 1) switchView(SWIPE_VIEWS[idx + 1]);
    else if (dx > 0 && idx > 0) switchView(SWIPE_VIEWS[idx - 1]);
}, { passive: true });

setTimeout(injectMobile, 400);
window.addEventListener('resize', () => { if (!isMobile()) document.body.classList.remove('sidebar-open'); });
console.log('[Mobile] Bottom nav + drawer + swipe loaded');