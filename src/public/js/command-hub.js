// ===== COMMAND HUB MODULE (Phase 18) =====

const QUICK_ACTIONS = [
    { label: 'کار جدید', icon: 'check', c1: '#3b82f6', c2: '#06b6d4', action: () => openModal('tasks') },
    { label: 'یادداشت', icon: 'file', c1: '#10b981', c2: '#34d399', action: () => openModal('notes') },
    { label: 'ایده', icon: 'lightbulb', c1: '#f59e0b', c2: '#fbbf24', action: () => openModal('ideas') },
    { label: 'مخاطب', icon: 'users', c1: '#7c3aed', c2: '#a855f7', action: () => openModal('people') },
    { label: 'Zen', icon: 'sparkle', c1: '#ec4899', c2: '#f472b6', action: () => { if (typeof openZen === 'function') openZen(); } },
    { label: 'گراف', icon: 'rocket', c1: '#8b5cf6', c2: '#6366f1', action: () => switchView('graph') }
];

function injectCommandHub() {
    const view = document.getElementById('view-dashboard');
    if (!view || document.getElementById('commandHub')) return;
    
    const hero = view.querySelector('.analytics-hero');
    if (!hero) return;
    
    const hub = document.createElement('div');
    hub.id = 'commandHub';
    hub.className = 'command-hub';
    
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';
    
    // Smart search
    let html = `
        <div class="command-search">
            <span class="cs-icon">${mk('search', 18)}</span>
            <input id="heroSearchInput" type="text" placeholder="جستجو در کارها، مخاطبان، یادداشت‌ها..." readonly onclick="openCommandPalette()" onfocus="openCommandPalette()" />
            <span class="cs-kbd"><span class="kbd">Ctrl</span><span class="kbd">K</span></span>
        </div>
    `;
    
    // Quick actions
    html += '<div class="quick-actions">';
    QUICK_ACTIONS.forEach((qa, i) => {
        html += `<button class="qa-btn" style="--qa-c1:${qa.c1}; --qa-c2:${qa.c2}; animation-delay:${(i * 0.05) + 0.1}s" onclick="quickAction(${i})">
            <span class="qa-icon">${mk(qa.icon, 16)}</span>
            <span>${qa.label}</span>
        </button>`;
    });
    html += '</div>';
    
    hub.innerHTML = html;
    hero.insertAdjacentElement('afterend', hub);
}

function quickAction(i) {
    const qa = QUICK_ACTIONS[i];
    if (qa && qa.action) qa.action();
}

// Hook into dashboard render
const origRenderDashH = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashH();
    setTimeout(injectCommandHub, 80);
};