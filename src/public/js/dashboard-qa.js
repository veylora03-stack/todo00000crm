// ===== DASHBOARD QA MODULE (Phase 24) =====

// ---------- 1) Reorder: KPI right after commandHub ----------
const QA_ORDER = ['commandHub','statsGrid','focusSuite','chartsGrid','vitalsRow','heatmap','relWidgets','ambientRow','insights','achievements','timeline'];
function qaApplyOrder() {
    if (!localStorage.getItem('crm_dash_order')) {
        localStorage.setItem('crm_dash_order', JSON.stringify(QA_ORDER));
        if (typeof cwApply === 'function') cwApply();
    }
}

// ---------- 6) Zone labels move with widgets ----------
const QA_ZONES = [
    { id: 'focusSuiteContainer', label: '⚡ امروز' },
    { id: 'statsGrid', label: '📊 نمای کلی' },
    { id: 'chartsGrid', label: '📈 روندها' },
    { id: 'vitalsRow', label: '💪 سلامت و بهره‌وری' },
    { id: 'relWidgets', label: '💞 روابط و دستاوردها' }
];
function syncZoneLabels() {
    document.querySelectorAll('.zone-label').forEach(l => l.remove());
    QA_ZONES.forEach(z => {
        const el = document.getElementById(z.id);
        if (!el) return;
        const lbl = document.createElement('div');
        lbl.className = 'zone-label';
        lbl.textContent = z.label;
        el.parentNode.insertBefore(lbl, el);
    });
}
const origCwApply = window.cwApply;
window.cwApply = function() { if (origCwApply) origCwApply(); syncZoneLabels(); };

// ---------- 2) KPI delta ----------
function qaDelta(entity) {
    const now = Date.now();
    const arr = currentData[entity] || [];
    const a = arr.filter(x => x.createdAtUtc && (now - new Date(x.createdAtUtc)) < 7 * 86400000).length;
    const b = arr.filter(x => x.createdAtUtc && (now - new Date(x.createdAtUtc)) >= 7 * 86400000 && (now - new Date(x.createdAtUtc)) < 14 * 86400000).length;
    return a - b;
}
const origRenderStats = window.renderStats;
window.renderStats = function() {
    origRenderStats();
    const map = { people: 'people', tasks: 'tasks', ideas: 'ideas', projects: 'projects' };
    document.querySelectorAll('#statsGrid .stat-card-v2').forEach((card, i) => {
        const key = Object.keys(map)[i];
        if (!key || card.querySelector('.stat-delta')) return;
        const d = qaDelta(key);
        const labelEl = card.querySelector('.stat-card-label');
        if (!labelEl) return;
        const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
        const txt = d > 0 ? '+' + toPersianDigits(d) + ' ↑' : d < 0 ? toPersianDigits(d) + ' ↓' : '—';
        labelEl.insertAdjacentHTML('beforeend', ' <span class="stat-delta ' + cls + '">' + txt + '</span>');
    });
}

// ---------- 3) Pin to Focus ----------
function getFocusPins() { try { return JSON.parse(localStorage.getItem('crm_focus_pins') || '[]'); } catch (e) { return []; } }
function setFocusPins(p) { localStorage.setItem('crm_focus_pins', JSON.stringify(p)); }

const origSelectTop = window.selectTopTasks;
window.selectTopTasks = function() {
    origSelectTop();
    const pins = getFocusPins().map(id => currentData.tasks.find(t => t.id === id)).filter(t => t && t.status !== 'done');
    const auto = focusSelectedTasks.filter(t => !pins.some(p => p.id === t.id));
    focusSelectedTasks = pins.concat(auto).slice(0, 3);
};

function openFocusPicker(btn) {
    const old = document.querySelector('.focus-picker'); if (old) { old.remove(); return; }
    const rect = btn.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'focus-picker';
    p.style.top = (rect.bottom + 6) + 'px';
    p.style.left = Math.max(10, rect.left - 200) + 'px';
    const pins = getFocusPins();
    const cands = (currentData.tasks || []).filter(t => t.status !== 'done').slice(0, 8);
    p.innerHTML = '<div style="font-size:11px;color:var(--text-tertiary);padding:4px 8px;">📌 انتخاب کارهای فوکوس (حداکثر ۳):</div>' +
        cands.map(t => '<div class="focus-picker-item ' + (pins.includes(t.id) ? 'pinned' : '') + '" onclick="toggleFocusPin(\'' + t.id + '\')">' + (pins.includes(t.id) ? '📌' : '○') + ' ' + t.title + '</div>').join('');
    document.body.appendChild(p);
    setTimeout(() => document.addEventListener('click', function h(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('click', h); } }), 50);
}

function toggleFocusPin(id) {
    let pins = getFocusPins();
    if (pins.includes(id)) pins = pins.filter(x => x !== id);
    else { pins.push(id); if (pins.length > 3) pins.shift(); }
    setFocusPins(pins);
    document.querySelector('.focus-picker')?.remove();
    renderFocusWidget();
}

// Add pin button to focus header
const origRenderFocus = window.renderFocusWidget;
window.renderFocusWidget = function() {
    origRenderFocus();
    const hdr = document.querySelector('#focusTodayWidget .focus-widget-header');
    if (hdr && !hdr.querySelector('.focus-pin-btn')) {
        hdr.insertAdjacentHTML('beforeend', '<button class="focus-pin-btn" title="انتخاب کارهای فوکوس" onclick="openFocusPicker(this)">📌</button>');
    }
}

// ---------- 4) Pomodoro linked task ----------
const origStartFocus = window.startFocusSession;
window.startFocusSession = function() {
    const inc = focusSelectedTasks.filter(t => t.status !== 'done');
    if (inc.length) localStorage.setItem('crm_pomo_task', inc[0].id);
    origStartFocus();
};
const origRenderPomo = window.renderPomoWidget;
window.renderPomoWidget = function() {
    origRenderPomo();
    const tid = localStorage.getItem('crm_pomo_task');
    const t = tid ? currentData.tasks.find(x => x.id === tid) : null;
    const wrap = document.querySelector('#focusPomoWidget .pomo-stats');
    if (wrap && t && !document.getElementById('pomoLinked')) {
        wrap.insertAdjacentHTML('afterend', '<div id="pomoLinked" style="margin-top:10px;font-size:11px;color:var(--text-secondary);background:var(--bg-surface-2);padding:6px 10px;border-radius:6px;">🎯 ' + t.title + '</div>');
    }
}

// ---------- 5) View-all + clickable insights ----------
function qaWireLinks() {
    const link = document.querySelector('#view-dashboard .card-link');
    if (link && !link.dataset.wired) {
        link.dataset.wired = '1';
        link.onclick = () => {
            const tl = document.getElementById('timeline');
            if (!tl) return;
            const expanded = tl.dataset.expanded === '1';
            renderTimelineFull(!expanded);
            tl.dataset.expanded = expanded ? '0' : '1';
            link.textContent = expanded ? 'View all' : 'نمایش کمتر';
        };
    }
    // insights clickable
    const cards = document.querySelectorAll('#insightsGrid .insight-card');
    const targets = ['tasks', 'dashboard', 'dashboard'];
    cards.forEach((c, i) => {
        if (c.dataset.wired) return;
        c.dataset.wired = '1';
        c.onclick = () => switchView(i === 0 ? 'tasks' : 'reports');
    });
}
function renderTimelineFull(all) {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    const logs = (all ? currentData.logs : currentData.logs.slice(-8)).slice().reverse();
    if (!logs.length) return;
    tl.innerHTML = logs.map(log => {
        const cls = log.action === 'create' ? 'create' : log.action === 'update' ? 'update' : 'delete';
        return '<div class="timeline-item"><div class="timeline-dot ' + cls + '"></div><div class="timeline-content"><div class="timeline-text">' + log.details + '</div><div class="timeline-meta">' + getTimeAgo(new Date(log.createdAtUtc)) + '</div></div></div>';
    }).join('');
}

// ---------- 8) Activity range toggle ----------
let actRange = 7;
function qaAddRangeToggle() {
    const header = document.querySelector('#activityChartContainer')?.closest('.chart-card')?.querySelector('.chart-header');
    if (!header || header.querySelector('.range-toggle')) return;
    header.insertAdjacentHTML('beforeend', '<div class="range-toggle"><button class="range-btn active" data-r="7" onclick="setActRange(7)">7روز</button><button class="range-btn" data-r="30" onclick="setActRange(30)">30روز</button><button class="range-btn" data-r="90" onclick="setActRange(90)">90روز</button></div>');
}
function setActRange(r) {
    actRange = r;
    document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', +b.dataset.r === r));
    renderActivityRange();
}
function renderActivityRange() {
    const c = document.getElementById('activityChartContainer');
    if (!c || typeof Charts === 'undefined') return;
    const now = new Date();
    const buckets = 6;
    const span = actRange / buckets;
    const data = [];
    for (let i = buckets - 1; i >= 0; i--) {
        const end = new Date(now); end.setDate(end.getDate() - i * span);
        const start = new Date(end); start.setDate(start.getDate() - span);
        const count = currentData.logs.filter(l => { const t = new Date(l.createdAtUtc); return t > start && t <= end; }).length;
        data.push({ label: '-' + toPersianDigits(Math.round(i * span)) + 'روز', value: count });
    }
    Charts.bar('activityChartContainer', data, { width: 600, height: 260, color: '#7c3aed' });
}

// ---------- Hook ----------
const origRenderDashQ = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashQ();
    setTimeout(() => { qaApplyOrder(); syncZoneLabels(); qaWireLinks(); qaAddRangeToggle(); }, 300);
};

setTimeout(() => { qaApplyOrder(); syncZoneLabels(); }, 400);
console.log('[DashboardQA] 8 fixes loaded');