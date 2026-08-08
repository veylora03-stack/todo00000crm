// ===== CUSTOMIZABLE DASHBOARD MODULE (Phase 21) =====

const CW_DEFAULT_ORDER = ['commandHub', 'focusSuite', 'vitalsRow', 'ambientRow', 'statsGrid', 'chartsGrid', 'heatmap', 'insights', 'relWidgets', 'achievements', 'timeline'];

const CW_LABELS = {
    commandHub: '🔍 جستجو + اکشن‌ها',
    focusSuite: '🎯 تمرکز + پومودورو',
    vitalsRow: '💪 انرژی + اهداف + روابط',
    ambientRow: '🌤️ هوا + نقل‌قول',
    statsGrid: '📊 آمار کلی',
    chartsGrid: '📈 نمودارها',
    heatmap: '🟩 نقشه فعالیت',
    insights: '💡 Insights',
    relWidgets: '💞 پیگیری + مناسبت‌ها',
    achievements: '🏆 دستاوردها',
    timeline: '📜 Timeline'
};

function cwGetOrder() {
    try {
        const o = JSON.parse(localStorage.getItem('crm_dash_order') || 'null');
        if (o && Array.isArray(o) && o.length) return o;
    } catch (e) {}
    return CW_DEFAULT_ORDER.slice();
}

function cwGetHidden() {
    try { return JSON.parse(localStorage.getItem('crm_dash_hidden') || '[]'); } catch (e) { return []; }
}

// Prepare widget elements (assign ids, wrap insights)
function cwPrepare() {
    const view = document.getElementById('view-dashboard');
    if (!view) return;
    
    // charts grid (not relWidgets)
    const cg = view.querySelector('.charts-grid:not(#relWidgets)');
    if (cg && !cg.id) cg.id = 'chartsGrid';
    
    // heatmap
    const hm = view.querySelector('.heatmap-section');
    if (hm && !hm.id) hm.id = 'heatmap';
    
    // wrap insights header + grid
    const ig = document.getElementById('insightsGrid');
    if (ig && !document.getElementById('insightsWrap')) {
        const wrap = document.createElement('div');
        wrap.id = 'insightsWrap';
        const header = ig.previousElementSibling;
        ig.parentNode.insertBefore(wrap, header);
        wrap.appendChild(header);
        wrap.appendChild(ig);
    }
    
    // timeline card
    const tl = document.getElementById('timeline');
    if (tl) {
        const card = tl.closest('.card');
        if (card && !card.id) card.id = 'timeline';
    }
    
    // mark data-cw
    const els = cwGetEls();
    Object.keys(els).forEach(k => { if (els[k]) { els[k].setAttribute('data-cw', k); els[k].setAttribute('data-cw-label', CW_LABELS[k]); } });
}

function cwGetEls() {
    const view = document.getElementById('view-dashboard');
    return {
        commandHub: document.getElementById('commandHub'),
        focusSuite: document.getElementById('focusSuiteContainer'),
        vitalsRow: document.getElementById('vitalsRow'),
        ambientRow: document.getElementById('ambientRow'),
        statsGrid: document.getElementById('statsGrid'),
        chartsGrid: document.getElementById('chartsGrid'),
        heatmap: document.getElementById('heatmap'),
        insights: document.getElementById('insightsWrap'),
        relWidgets: document.getElementById('relWidgets'),
        achievements: document.getElementById('achievementsSection'),
        timeline: document.getElementById('timeline')
    };
}

function cwApply() {
    const view = document.getElementById('view-dashboard');
    if (!view) return;
    cwPrepare();
    const els = cwGetEls();
    const order = cwGetOrder();
    const hidden = cwGetHidden();
    
    // Append in order (moves them)
    order.forEach(k => { if (els[k]) view.appendChild(els[k]); });
    // Any missing keys append at end
    Object.keys(els).forEach(k => { if (!order.includes(k) && els[k]) view.appendChild(els[k]); });
    
    // Visibility
    Object.keys(els).forEach(k => {
        if (els[k]) els[k].style.display = hidden.includes(k) ? 'none' : '';
    });
}

// ---------- Drawer ----------
let cwDragKey = null;

function openCustomize() {
    if (document.getElementById('customizeDrawer')) { closeCustomize(); return; }
    document.getElementById('view-dashboard').classList.add('customizing');
    
    const d = document.createElement('div');
    d.id = 'customizeDrawer';
    d.className = 'customize-drawer';
    d.innerHTML = `
        <div class="customize-header">
            <div class="customize-title">🎛️ سفارشی‌سازی داشبورد</div>
            <button class="icon-button" onclick="closeCustomize()">×</button>
        </div>
        <div class="customize-body">
            <div class="customize-hint">💡 ویجت‌ها را بکش تا ترتیب عوض شود. با 👁️ مخفی/نمایش بده.</div>
            <div id="cwList"></div>
        </div>
        <div class="customize-footer">
            <button class="btn btn-secondary" style="width:100%; justify-content:center;" onclick="cwReset()">🔄 بازنشانی به پیش‌فرض</button>
        </div>
    `;
    document.body.appendChild(d);
    cwRenderList();
}

function closeCustomize() {
    const d = document.getElementById('customizeDrawer');
    if (d) d.remove();
    document.getElementById('view-dashboard').classList.remove('customizing');
}

function cwRenderList() {
    const list = document.getElementById('cwList');
    if (!list) return;
    const order = cwGetOrder();
    const hidden = cwGetHidden();
    
    list.innerHTML = order.map(k => `
        <div class="cw-item" draggable="true" data-key="${k}"
             ondragstart="cwDragStart(event,'${k}')" ondragover="cwDragOver(event,'${k}')" ondragleave="cwDragLeave(event)" ondrop="cwDrop(event,'${k}')" ondragend="cwDragEnd()">
            <span class="cw-handle">⋮⋮</span>
            <span class="cw-name">${CW_LABELS[k] || k}</span>
            <button class="cw-eye ${hidden.includes(k) ? 'off' : ''}" onclick="cwToggle('${k}')">${hidden.includes(k) ? '🚫' : '👁️'}</button>
        </div>
    `).join('');
}

function cwDragStart(e, k) { cwDragKey = k; e.currentTarget.classList.add('dragging'); }
function cwDragOver(e, k) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}
function cwDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function cwDrop(e, k) {
    e.preventDefault();
    if (!cwDragKey || cwDragKey === k) return;
    const order = cwGetOrder();
    const from = order.indexOf(cwDragKey);
    const to = order.indexOf(k);
    order.splice(from, 1);
    order.splice(to, 0, cwDragKey);
    localStorage.setItem('crm_dash_order', JSON.stringify(order));
    cwRenderList();
    cwApply();
}
function cwDragEnd() { cwDragKey = null; cwRenderList(); }

function cwToggle(k) {
    let hidden = cwGetHidden();
    if (hidden.includes(k)) hidden = hidden.filter(x => x !== k);
    else hidden.push(k);
    localStorage.setItem('crm_dash_hidden', JSON.stringify(hidden));
    cwRenderList();
    cwApply();
}

function cwReset() {
    localStorage.removeItem('crm_dash_order');
    localStorage.removeItem('crm_dash_hidden');
    cwRenderList();
    cwApply();
    toast('🔄 چیدمان به پیش‌فرض برگشت', 'success');
}

// ---------- Inject FAB ----------
function injectCustomizeFab() {
    if (document.getElementById('customizeFab')) return;
    const fab = document.createElement('button');
    fab.id = 'customizeFab';
    fab.className = 'customize-fab';
    fab.title = 'سفارشی‌سازی داشبورد';
    fab.innerHTML = '⚙️';
    fab.onclick = openCustomize;
    document.body.appendChild(fab);
}

// Hook
const origRenderDashC = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashC();
    setTimeout(() => { cwPrepare(); cwApply(); injectCustomizeFab(); }, 200);
};

console.log('[Customize] Draggable dashboard loaded');