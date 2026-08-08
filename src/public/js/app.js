
// ===== SAFE DOM HELPERS (Phase 9 Fix) =====
window.safeGetElement = function(id) {
    return document.getElementById(id);
};
window.safeClassList = function(id, action, className) {
    const el = document.getElementById(id);
    if (el && el.classList) {
        el.classList[action](className);
    }
};
window.safeSetHTML = function(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
};
// ===========================================

// ===== GLOBAL ERROR PROTECTION FOR DOM INIT =====
(function() {
    const origGetElementById = Document.prototype.getElementById;
    const origQuerySelector = Document.prototype.querySelector;
    
    // We won't override - instead, ensure critical paths handle nulls
    console.log('[CRM Pro] Safety wrapper loaded');
})();
// =================================================

// ===== SAFE DOM ACCESS HELPERS (added to fix null reference errors) =====
function safeEl(id) {
    return document.getElementById(id);
}
function safeAddClass(id, cls) {
    const el = document.getElementById(id);
    if (el) el.classList.add(cls);
}
function safeRemoveClass(id, cls) {
    const el = document.getElementById(id);
    if (el) el.classList.remove(cls);
}
function safeToggleClass(id, cls, force) {
    const el = document.getElementById(id);
    if (el) {
        if (typeof force === 'boolean') el.classList.toggle(cls, force);
        else el.classList.toggle(cls);
    }
}
// =====================================================================
const API = window.location.origin;
let currentView = 'dashboard';
let currentData = { people: [], tasks: [], ideas: [], notes: [], projects: [], logs: [] };
let currentPanelItem = null;
let currentPanelType = null;
let taskFilter = 'all';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => { try {
    try {
        try { injectIcons(); } catch(e) { console.warn('injectIcons error:', e); }
        try { setupNavigation(); } catch(e) { console.warn('setupNavigation error:', e); }
        try { setGreeting(); } catch(e) { console.warn('setGreeting error:', e); }
        try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
        try { setupKeyboard(); } catch(e) { console.warn('setupKeyboard error:', e); }
        try { setupContextMenu(); } catch(e) { console.warn('setupContextMenu error:', e); }
    } catch (err) {
        console.error('Init error:', err);
    }
});

function injectIcons() {
    const iconMap = {
        'dashboard': 'home', 'inbox': 'inbox', 'people': 'users',
        'tasks': 'check', 'projects': 'rocket', 'ideas': 'lightbulb', 'notes': 'file'
    };
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const view = link.dataset.view;
        const iconSpan = link.querySelector('.nav-icon');
        if (iconSpan && iconMap[view] && typeof icon === 'function') {
            iconSpan.innerHTML = icon(iconMap[view], 16);
        }
    });
    
    const searchIcon = document.querySelector('.topbar-search-btn .search-icon');
    if (searchIcon && typeof icon === 'function') searchIcon.innerHTML = icon('search', 14);
    
    const searchIcon2 = document.getElementById('cmdSearchIcon');
    if (searchIcon2 && typeof icon === 'function') searchIcon2.innerHTML = icon('search', 16);
    
    const inboxIcon = document.getElementById('inboxIcon');
    if (inboxIcon && typeof icon === 'function') inboxIcon.innerHTML = icon('inbox', 24);
    
    document.querySelectorAll('.topbar-actions .icon-button').forEach((btn, i) => {
        const span = btn.querySelector('span');
        if (span && typeof icon === 'function') span.innerHTML = icon(i === 0 ? 'bell' : 'settings', 16);
    });
    
    document.querySelectorAll('.modal-header .icon-button span, .panel-header .icon-button span').forEach(span => {
        if (typeof icon === 'function') span.innerHTML = icon('close', 16);
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const view = link.dataset.view;
            if (!view) return;
            switchView(view);
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');
    updateBreadcrumb(view);
    
    // Reload specific view data if needed
    if (view === 'dashboard' && currentData.logs) {
        renderDashboard();
    }
}

function updateBreadcrumb(view) {
    const titles = { dashboard: 'داشبورد', inbox: 'Inbox', people: 'مخاطبان', tasks: 'کارها', projects: 'پروژه‌ها', ideas: 'ایده‌ها', notes: 'یادداشت‌ها' };
    const sep = document.getElementById('bc-sep');
    const current = document.getElementById('bc-current');
    
    if (!sep || !current) return;
    
    if (view === 'dashboard') {
        sep.style.display = 'none';
        current.style.display = 'none';
    } else {
        sep.style.display = '';
        if (typeof icon === 'function') sep.innerHTML = icon('chevronRight', 12);
        current.style.display = '';
        current.textContent = titles[view] || view;
    }
}

function setGreeting() {
    const h = new Date().getHours();
    let g = 'سلام';
    if (h < 12) g = 'صبح بخیر ☀️';
    else if (h < 18) g = 'ظهر بخیر 🌤';
    else g = 'عصر بخیر 🌙';
    
    const el = document.getElementById('greeting');
    if (el) el.textContent = g;
}

async function api(endpoint, method = 'GET', data = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    const res = await fetch(`${API}/api/${endpoint}`, options);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function loadAllData() {
    try {
        const [people, tasks, ideas, notes, projects, logs] = await Promise.all([
            api('people'), api('tasks'), api('ideas'),
            api('notes'), api('projects'), api('activity_logs')
        ]);
        
        currentData = {
            people: Array.isArray(people) ? people : [],
            tasks: Array.isArray(tasks) ? tasks : [],
            ideas: Array.isArray(ideas) ? ideas : [],
            notes: Array.isArray(notes) ? notes : [],
            projects: Array.isArray(projects) ? projects : [],
            logs: Array.isArray(logs) ? logs : []
        };
        
        renderAll();
    } catch (err) {
        console.error('Error loading data:', err);
        toast('خطا در بارگذاری داده‌ها', 'error');
    }
}

function renderAll() {
    try { renderDashboard(); } catch(e) { console.error('Dashboard render:', e); }
    try { renderPeople(); } catch(e) { console.error('People render:', e); }
    try { renderKanban(); } catch(e) { console.error('Kanban render:', e); }
    try { renderIdeas(); } catch(e) { console.error('Ideas render:', e); }
    try { renderNotes(); } catch(e) { console.error('Notes render:', e); }
    try { renderProjects(); } catch(e) { console.error('Projects render:', e); }
    try { updateCounts(); } catch(e) { console.error('Counts update:', e); }
}

function updateCounts() {
    const d = currentData;
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('count-people', d.people.length);
    el('count-tasks', d.tasks.length);
    el('count-ideas', d.ideas.length);
    el('count-notes', d.notes.length);
    el('count-projects', d.projects.length);
}

// ===== DASHBOARD =====
function renderDashboard() { try {
    renderStats();
    renderHeroStats();
    renderTimeline();
    renderOverview();
    renderHeatmap();
    renderActivityChart();
    renderInsights();
}

function renderStats() {
    const d = currentData;
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    const now = new Date();
    const last7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const prev14to7 = new Date(now - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeek = d.logs.filter(l => new Date(l.createdAtUtc) >= last7).length;
    const lastWeek = d.logs.filter(l => { const t = new Date(l.createdAtUtc); return t >= prev14to7 && t < last7; }).length;
    const trendPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
    
    const sparklineData = [];
    for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        const count = d.logs.filter(l => { const t = new Date(l.createdAtUtc); return t >= dayStart && t <= dayEnd; }).length;
        sparklineData.push(count);
    }
    
    const stats = [
        { id: 'people', label: 'مخاطبان', value: d.people.length, icon: 'users', color: '#7c3aed' },
        { id: 'tasks', label: 'کارها', value: d.tasks.length, icon: 'check', color: '#3b82f6' },
        { id: 'ideas', label: 'ایده‌ها', value: d.ideas.length, icon: 'lightbulb', color: '#f59e0b' },
        { id: 'projects', label: 'پروژه‌ها', value: d.projects.length, icon: 'rocket', color: '#10b981' }
    ];
    
    statsGrid.className = 'stats-grid-v2';
    statsGrid.innerHTML = stats.map(s => {
        const sparkId = `sparkline_${s.id}`;
        const trendClass = trendPct >= 0 ? 'positive' : 'negative';
        const trendSign = trendPct >= 0 ? '+' : '';
        const iconHtml = typeof icon === 'function' ? icon(s.icon, 16) : '';
        
        return `
            <div class="stat-card-v2">
                <div class="stat-card-top">
                    <div class="stat-card-icon" style="background: ${s.color}22; color: ${s.color};">${iconHtml}</div>
                    <div class="stat-card-sparkline" id="${sparkId}"></div>
                </div>
                <div class="stat-card-value">${s.value}</div>
                <div class="stat-card-label">${s.label}</div>
                <span class="stat-card-change ${trendClass}">${trendPct >= 0 ? '↑' : '↓'} ${trendSign}${Math.abs(trendPct)}% این هفته</span>
            </div>
        `;
    }).join('');
    
    setTimeout(() => {
        if (typeof Charts !== 'undefined') {
            stats.forEach(s => {
                Charts.sparkline(`sparkline_${s.id}`, sparklineData, { color: s.color });
            });
        }
    }, 50);
}

function renderHeroStats() {
    const d = currentData;
    const heroStats = document.getElementById('heroStats');
    if (!heroStats) return;
    
    const now = new Date();
    const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const weekActivities = d.logs.filter(l => new Date(l.createdAtUtc) >= weekStart).length;
    const completedTasks = d.tasks.filter(t => t.status === 'done').length;
    const completionRate = d.tasks.length > 0 ? Math.round((completedTasks / d.tasks.length) * 100) : 0;
    
    heroStats.innerHTML = `
        <div class="hero-stat">
            <div class="hero-stat-value">${weekActivities}</div>
            <div class="hero-stat-label">فعالیت این هفته</div>
        </div>
        <div class="hero-stat">
            <div class="hero-stat-value">${completedTasks}</div>
            <div class="hero-stat-label">کار تکمیل شده</div>
        </div>
        <div class="hero-stat">
            <div class="hero-stat-value">${completionRate}%</div>
            <div class="hero-stat-label">نرخ تکمیل</div>
        </div>
    `;
}

function renderTimeline() {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    
    const logs = currentData.logs.slice(-8).reverse();
    if (!logs.length) {
        const iconHtml = typeof icon === 'function' ? icon('activity', 20) : '';
        tl.innerHTML = `<div class="empty-state"><div class="empty-icon">${iconHtml}</div><div class="empty-title">هنوز فعالیتی ثبت نشده</div></div>`;
        return;
    }
    
    tl.innerHTML = logs.map(log => {
        const iconMap = { person: 'users', task: 'check', idea: 'lightbulb', note: 'file', project: 'rocket' };
        const actionClass = log.action === 'create' ? 'create' : log.action === 'update' ? 'update' : 'delete';
        const iconHtml = typeof icon === 'function' ? icon(iconMap[log.entityType] || 'activity', 10) : '';
        return `
            <div class="timeline-item">
                <div class="timeline-dot ${actionClass}"></div>
                <div class="timeline-content">
                    <div class="timeline-text">${log.details}</div>
                    <div class="timeline-meta">${iconHtml} ${getTimeAgo(new Date(log.createdAtUtc))}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'لحظاتی پیش';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days} روز پیش` : date.toLocaleDateString('fa-IR');
}

function renderOverview() {
    const container = document.getElementById('overviewChart');
    if (!container) return;
    
    const tasks = currentData.tasks;
    const taskDist = [
        { label: 'در انتظار', value: tasks.filter(t => t.status === 'pending').length },
        { label: 'در حال انجام', value: tasks.filter(t => t.status === 'in-progress').length },
        { label: 'بازبینی', value: tasks.filter(t => t.status === 'review').length },
        { label: 'انجام شده', value: tasks.filter(t => t.status === 'done').length }
    ];
    
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / total) * 100) : 0;
    
    container.innerHTML = `
        <div style="padding: 8px 0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div>
                    <div style="font-size:13px; color:var(--text-primary); font-weight:600;">وضعیت کارها</div>
                    <div style="font-size:11px; color:var(--text-tertiary);">${total} کار در کل</div>
                </div>
                <span class="pill ${completionRate >= 50 ? 'success' : 'warning'}">${completionRate}% تکمیل</span>
            </div>
            <div id="taskDoughnut"></div>
        </div>
    `;
    
    setTimeout(() => {
        if (typeof Charts !== 'undefined') {
            Charts.doughnut('taskDoughnut', taskDist, { colors: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'] });
        }
    }, 50);
}

function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;
    
    const dateMap = {};
    currentData.logs.forEach(l => {
        const dateStr = new Date(l.createdAtUtc).toISOString().split('T')[0];
        dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
    });
    
    const heatmapData = Object.entries(dateMap).map(([date, count]) => ({ date, count }));
    
    if (typeof Charts !== 'undefined') {
        Charts.heatmap('heatmapContainer', heatmapData, { colors: ['#1c1c1f', '#3d1f5c', '#5b2c9a', '#7c3aed', '#a855f7'] });
    } else {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-tertiary);">Heatmap در حال بارگذاری...</div>';
    }
}

function renderActivityChart() {
    const container = document.getElementById('activityChartContainer');
    if (!container) return;
    
    const now = new Date();
    const dayNames = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
    const activityByDay = [];
    
    for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        const count = currentData.logs.filter(l => { const t = new Date(l.createdAtUtc); return t >= dayStart && t <= dayEnd; }).length;
        activityByDay.push({ label: dayNames[day.getDay()], value: count });
    }
    
    if (typeof Charts !== 'undefined') {
        Charts.bar('activityChartContainer', activityByDay, { width: 600, height: 220, color: '#7c3aed' });
    }
}

function renderInsights() {
    const container = document.getElementById('insightsGrid');
    if (!container) return;
    
    const d = currentData;
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    d.logs.forEach(l => { dayCount[new Date(l.createdAtUtc).getDay()]++; });
    
    const maxDayIdx = dayCount.indexOf(Math.max(...dayCount));
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const bestDay = dayCount[maxDayIdx] > 0 ? dayNames[maxDayIdx] : '-';
    const bestDayCount = dayCount[maxDayIdx];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const lastMonthLogs = d.logs.filter(l => new Date(l.createdAtUtc) >= thirtyDaysAgo);
    const avgDaily = lastMonthLogs.length > 0 ? (lastMonthLogs.length / 30).toFixed(1) : 0;
    
    const totalEntities = d.people.length + d.tasks.length + d.ideas.length + d.notes.length + d.projects.length;
    
    const mkIcon = (name) => typeof icon === 'function' ? icon(name, 16) : '';
    
    container.innerHTML = `
        <div class="insight-card">
            <div class="insight-header">
                <div class="insight-icon" style="background: var(--success-subtle); color: var(--success);">${mkIcon('sparkle')}</div>
                <div class="insight-title">بهترین روز هفته</div>
            </div>
            <div class="insight-value">${bestDay}</div>
            <div class="insight-desc">${bestDayCount} فعالیت در این روز</div>
            <div class="insight-bar"><div class="insight-bar-fill" style="width: ${Math.min(100, bestDayCount * 10)}%; background: var(--success);"></div></div>
        </div>
        <div class="insight-card">
            <div class="insight-header">
                <div class="insight-icon" style="background: var(--info-subtle); color: var(--info);">${mkIcon('activity')}</div>
                <div class="insight-title">میانگین روزانه</div>
            </div>
            <div class="insight-value">${avgDaily}</div>
            <div class="insight-desc">فعالیت در 30 روز گذشته</div>
            <div class="insight-bar"><div class="insight-bar-fill" style="width: ${Math.min(100, avgDaily * 10)}%; background: var(--info);"></div></div>
        </div>
        <div class="insight-card">
            <div class="insight-header">
                <div class="insight-icon" style="background: var(--warning-subtle); color: var(--warning);">${mkIcon('rocket')}</div>
                <div class="insight-title">مجموع آیتم‌ها</div>
            </div>
            <div class="insight-value">${totalEntities}</div>
            <div class="insight-desc">در تمام بخش‌های CRM</div>
            <div class="insight-bar"><div class="insight-bar-fill" style="width: ${Math.min(100, totalEntities * 2)}%; background: var(--warning);"></div></div>
        </div>
    `;
}

// ===== PEOPLE =====
function renderPeople() {
    const tbody = document.getElementById('peopleTableBody');
    if (!tbody) return;
    
    const people = currentData.people;
    if (!people.length) {
        const iconHtml = typeof icon === 'function' ? icon('users', 20) : '';
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">${iconHtml}</div><div class="empty-title">مخاطبی وجود ندارد</div></div></td></tr>`;
        return;
    }
    
    const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    
    tbody.innerHTML = people.map((p, i) => {
        const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2);
        const color = colors[i % colors.length];
        const date = new Date(p.createdAtUtc).toLocaleDateString('fa-IR');
        return `
            <tr onclick="openPersonPanel('${p.id}')" oncontextmenu="showContextMenu(event, 'person', '${p.id}')">
                <td>
                    <div class="cell-person">
                        <div class="avatar" style="background:${color};">${initials}</div>
                        <div class="cell-person-info">
                            <div class="cell-person-name">${p.name}</div>
                            <div class="cell-person-sub">${p.email || 'بدون ایمیل'}</div>
                        </div>
                    </div>
                </td>
                <td>${p.company || '-'}</td>
                <td>${p.phone || '-'}</td>
                <td><span class="pill success">فعال</span></td>
                <td style="color:var(--text-tertiary); font-size:12px;">${date}</td>
                <td><button class="icon-button" onclick="event.stopPropagation(); showContextMenu(event, 'person', '${p.id}')">${mkIcon('moreVertical', 14)}</button></td>
            </tr>
        `;
    }).join('');
}

function openPersonPanel(id) {
    const p = currentData.people.find(x => x.id === id);
    if (!p) return;
    
    currentPanelItem = p;
    currentPanelType = 'person';
    
    const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    
    document.getElementById('panelTitle').textContent = 'جزئیات مخاطب';
    (function(e){if(e)e.innerHTML= `
        <div class="panel-hero">
            <div class="avatar" style="background:#7c3aed; width:56px; height:56px; font-size:18px;">${initials}</div>
            <div>
                <div class="panel-hero-name">${p.name}</div>
                <div class="panel-hero-sub">${p.company || 'بدون شرکت'}</div>
            </div>
        </div>
        <div class="panel-section">
            <div class="panel-section-title">اطلاعات تماس</div>
            <div class="panel-field">
                <div class="panel-field-icon">${mkIcon('mail', 14)}</div>
                <div class="panel-field-content">
                    <div class="panel-field-label">ایمیل</div>
                    <div class="panel-field-value">${p.email || '-'}</div>
                </div>
            </div>
            <div class="panel-field">
                <div class="panel-field-icon">${mkIcon('phone', 14)}</div>
                <div class="panel-field-content">
                    <div class="panel-field-label">تلفن</div>
                    <div class="panel-field-value">${p.phone || '-'}</div>
                </div>
            </div>
            <div class="panel-field">
                <div class="panel-field-icon">${mkIcon('building', 14)}</div>
                <div class="panel-field-content">
                    <div class="panel-field-label">شرکت</div>
                    <div class="panel-field-value">${p.company || '-'}</div>
                </div>
            </div>
        </div>
        ${p.notes ? `<div class="panel-section"><div class="panel-section-title">یادداشت</div><div style="font-size:13px; color:var(--text-secondary); line-height:1.6;">${p.notes}</div></div>` : ''}
    `;
    
    (function(e){if(e)e.innerHTML= `
        <button class="btn btn-secondary" onclick="editPanelItem()">${mkIcon('edit', 14)} ویرایش</button>
        <button class="btn btn-ghost" style="color:var(--danger);" onclick="confirmDelete('person', '${p.id}')">${mkIcon('trash', 14)} حذف</button>
    `;
    
     const __el_539 = document.getElementById('panelOverlay');
     if (__el_539) __el_539.classList.add('active');
     const __el_540 = document.getElementById('slidePanel');
     if (__el_540) __el_540.classList.add('active');
}

function editPanelItem() {
    if (!currentPanelItem || !currentPanelType) return;
    
    if (currentPanelType === 'person') {
        document.getElementById('panelTitle').textContent = 'ویرایش مخاطب';
        (function(e){if(e)e.innerHTML= `
            <div class="panel-edit-form">
                <div class="form-field"><label class="form-label">نام *</label><input class="form-input" name="name" value="${currentPanelItem.name}" /></div>
                <div class="form-field"><label class="form-label">ایمیل</label><input class="form-input" type="email" name="email" value="${currentPanelItem.email || ''}" /></div>
                <div class="form-field"><label class="form-label">تلفن</label><input class="form-input" type="tel" name="phone" value="${currentPanelItem.phone || ''}" /></div>
                <div class="form-field"><label class="form-label">شرکت</label><input class="form-input" name="company" value="${currentPanelItem.company || ''}" /></div>
                <div class="form-field"><label class="form-label">یادداشت</label><textarea class="form-textarea" name="notes">${currentPanelItem.notes || ''}</textarea></div>
            </div>
        `;
        
        (function(e){if(e)e.innerHTML= `
            <button class="btn btn-secondary" onclick="cancelEdit()">انصراف</button>
            <button class="btn btn-primary" onclick="saveEdit()">ذخیره</button>
        `;
    }
}

function cancelEdit() {
    if (currentPanelType === 'person' && currentPanelItem) {
        openPersonPanel(currentPanelItem.id);
    }
}

async function saveEdit() {
    if (!currentPanelItem || !currentPanelType) return;
    
    const form = document.querySelector('.panel-edit-form');
    const data = {};
    form.querySelectorAll('[name]').forEach(input => { data[input.name] = input.value; });
    
    if (!data.name) { toast('نام الزامی است', 'error'); return; }
    
    try {
        await api(`${currentPanelType}s/${currentPanelItem.id}`, 'PUT', data);
        toast('با موفقیت ذخیره شد', 'success');
        await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
        openPersonPanel(currentPanelItem.id);
    } catch (err) {
        toast('خطا در ذخیره: ' + err.message, 'error');
    }
}

function confirmDelete(type, id) {
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    (function(e){if(e)e.innerHTML= mkIcon('trash', 24);
    document.getElementById('confirmTitle').textContent = 'آیا مطمئن هستید؟';
    document.getElementById('confirmMessage').textContent = 'این عمل قابل بازگشت نیست.';
    document.getElementById('confirmBtn').onclick = () => executeDelete(type, id);
     const __el_596 = document.getElementById('confirmOverlay');
     if (__el_596) __el_596.classList.add('active');
}

async function executeDelete(type, id) {
    try {
        await api(`${type}s/${id}`, 'DELETE');
        toast('با موفقیت حذف شد', 'success');
        closeConfirm();
        closePanel();
        await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
    } catch (err) {
        toast('خطا در حذف: ' + err.message, 'error');
    }
}

function closeConfirm() {
     const __el_612 = document.getElementById('confirmOverlay');
     if (__el_612) __el_612.classList.remove('active');
}

function closePanel() {
     const __el_616 = document.getElementById('panelOverlay');
     if (__el_616) __el_616.classList.remove('active');
     const __el_617 = document.getElementById('slidePanel');
     if (__el_617) __el_617.classList.remove('active');
    currentPanelItem = null;
    currentPanelType = null;
}

// ===== TASKS =====
function renderKanban() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;
    
    let tasks = currentData.tasks;
    if (taskFilter === 'high') tasks = tasks.filter(t => t.priority === 'high');
    else if (taskFilter === 'pending') tasks = tasks.filter(t => t.status === 'pending');
    else if (taskFilter === 'done') tasks = tasks.filter(t => t.status === 'done');
    
    const columns = [
        { key: 'pending', label: 'در انتظار', dot: 'pending' },
        { key: 'in-progress', label: 'در حال انجام', dot: 'progress' },
        { key: 'review', label: 'بازبینی', dot: 'review' },
        { key: 'done', label: 'انجام شده', dot: 'done' }
    ];
    
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    
    board.innerHTML = columns.map(col => {
        const colTasks = tasks.filter(t => (t.status || 'pending') === col.key);
        return `
            <div class="kanban-col">
                <div class="kanban-col-header">
                    <div class="kanban-col-title">
                        <span class="kanban-col-dot ${col.dot}"></span>
                        <span>${col.label}</span>
                    </div>
                    <span class="kanban-col-count">${colTasks.length}</span>
                </div>
                <div class="kanban-cards">
                    ${colTasks.length ? colTasks.map(t => {
                        const priority = t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral';
                        const priorityLabel = t.priority === 'high' ? 'بالا' : t.priority === 'medium' ? 'متوسط' : 'کم';
                        const date = t.dueDate ? new Date(t.dueDate).toLocaleDateString('fa-IR') : '';
                        return `
                            <div class="kanban-card" oncontextmenu="showContextMenu(event, 'task', '${t.id}')">
                                <div class="kanban-card-title">${t.title}</div>
                                <div class="kanban-card-meta">
                                    <span class="pill ${priority}">${priorityLabel}</span>
                                    ${date ? `<span style="display:flex; align-items:center; gap:4px;">${mkIcon('calendar', 11)} ${date}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('') : '<div style="color:var(--text-disabled); font-size:12px; text-align:center; padding:20px 0;">خالی</div>'}
                </div>
            </div>
        `;
    }).join('');
}

function filterTasks(filter) {
    taskFilter = filter;
    document.querySelectorAll('#taskFilterBar .filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    renderKanban();
}

// ===== IDEAS =====
function renderIdeas() {
    const grid = document.getElementById('ideasGrid');
    if (!grid) return;
    
    if (!currentData.ideas.length) {
        const iconHtml = typeof icon === 'function' ? icon('lightbulb', 20) : '';
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">${iconHtml}</div><div class="empty-title">ایده‌ای ثبت نشده</div></div>`;
        return;
    }
    
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    grid.innerHTML = currentData.ideas.map(i => `
        <div class="note-card" oncontextmenu="showContextMenu(event, 'idea', '${i.id}')">
            <div class="note-card-header">
                <div class="note-card-icon">${mkIcon('lightbulb', 14)}</div>
                <span class="pill accent">${i.status || 'draft'}</span>
            </div>
            <div class="note-card-title">${i.title}</div>
            <div class="note-card-desc">${i.description || 'بدون توضیح'}</div>
            <div class="note-card-footer">
                <span style="display:flex; align-items:center; gap:4px;">${mkIcon('clock', 11)} ${new Date(i.createdAtUtc).toLocaleDateString('fa-IR')}</span>
                <button class="icon-button" onclick="event.stopPropagation(); showContextMenu(event, 'idea', '${i.id}')">${mkIcon('moreVertical', 12)}</button>
            </div>
        </div>
    `).join('');
}

// ===== NOTES =====
function renderNotes() {
    const grid = document.getElementById('notesGrid');
    if (!grid) return;
    
    if (!currentData.notes.length) {
        const iconHtml = typeof icon === 'function' ? icon('file', 20) : '';
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">${iconHtml}</div><div class="empty-title">یادداشتی ثبت نشده</div></div>`;
        return;
    }
    
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    grid.innerHTML = currentData.notes.map(n => `
        <div class="note-card" oncontextmenu="showContextMenu(event, 'note', '${n.id}')">
            <div class="note-card-header">
                <div class="note-card-icon" style="background:var(--info-subtle); color:var(--info);">${mkIcon('file', 14)}</div>
            </div>
            <div class="note-card-title">${n.title}</div>
            <div class="note-card-desc">${n.content || ''}</div>
            <div class="note-card-footer">
                <span style="display:flex; align-items:center; gap:4px;">${mkIcon('clock', 11)} ${new Date(n.createdAtUtc).toLocaleDateString('fa-IR')}</span>
                <button class="icon-button" onclick="event.stopPropagation(); showContextMenu(event, 'note', '${n.id}')">${mkIcon('moreVertical', 12)}</button>
            </div>
        </div>
    `).join('');
}

// ===== PROJECTS =====
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    if (!currentData.projects.length) {
        const iconHtml = typeof icon === 'function' ? icon('rocket', 20) : '';
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">${iconHtml}</div><div class="empty-title">پروژه‌ای ثبت نشده</div></div>`;
        return;
    }
    
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    grid.innerHTML = currentData.projects.map(p => `
        <div class="note-card" oncontextmenu="showContextMenu(event, 'project', '${p.id}')">
            <div class="note-card-header">
                <div class="note-card-icon" style="background:var(--warning-subtle); color:var(--warning);">${mkIcon('rocket', 14)}</div>
                <span class="pill success">${p.status || 'active'}</span>
            </div>
            <div class="note-card-title">${p.name}</div>
            <div class="note-card-desc">${p.description || 'بدون توضیح'}</div>
            <div class="note-card-footer">
                <span style="display:flex; align-items:center; gap:4px;">${mkIcon('clock', 11)} ${p.startDate ? new Date(p.startDate).toLocaleDateString('fa-IR') : '-'}</span>
                <button class="icon-button" onclick="event.stopPropagation(); showContextMenu(event, 'project', '${p.id}')">${mkIcon('moreVertical', 12)}</button>
            </div>
        </div>
    `).join('');
}

// ===== CONTEXT MENU =====
function setupContextMenu() {
    document.addEventListener('click', () => {
        const menu = document.getElementById('contextMenu');
        if (menu) menu.classList.remove('active');
    });
}

function showContextMenu(e, type, id) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('contextMenu');
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    
    menu.innerHTML = `
        <div class="context-menu-item" onclick="editItem('${type}', '${id}')">${mkIcon('edit', 14)}<span>ویرایش</span></div>
        <div class="context-menu-item danger" onclick="confirmDelete('${type}', '${id}')">${mkIcon('trash', 14)}<span>حذف</span></div>
    `;
    
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.classList.add('active');
}

function editItem(type, id) {
    if (type === 'person') {
        closePanel();
        setTimeout(() => { openPersonPanel(id); setTimeout(() => editPanelItem(), 100); }, 200);
    }
}

// ===== COMMAND PALETTE =====
const commands = [
    { group: 'اقدامات', id: 'new-person', title: 'افزودن مخاطب', sub: 'ایجاد مخاطب جدید', icon: 'users', action: () => openModal('people') },
    { group: 'اقدامات', id: 'new-task', title: 'افزودن کار', sub: 'ایجاد کار جدید', icon: 'check', action: () => openModal('tasks') },
    { group: 'اقدامات', id: 'new-idea', title: 'ثبت ایده', sub: 'ایده جدید', icon: 'lightbulb', action: () => openModal('ideas') },
    { group: 'اقدامات', id: 'new-note', title: 'نوشتن یادداشت', sub: 'یادداشت شخصی', icon: 'file', action: () => openModal('notes') },
    { group: 'اقدامات', id: 'new-project', title: 'تعریف پروژه', sub: 'پروژه جدید', icon: 'rocket', action: () => openModal('projects') },
    { group: 'نویگیشن', id: 'go-dash', title: 'داشبورد', sub: 'نمای کلی', icon: 'home', action: () => switchView('dashboard') },
    { group: 'نویگیشن', id: 'go-people', title: 'مخاطبان', sub: 'لیست مخاطبان', icon: 'users', action: () => switchView('people') },
    { group: 'نویگیشن', id: 'go-tasks', title: 'کارها', sub: 'Kanban board', icon: 'check', action: () => switchView('tasks') },
    { group: 'نویگیشن', id: 'go-ideas', title: 'ایده‌ها', sub: 'لیست ایده‌ها', icon: 'lightbulb', action: () => switchView('ideas') },
    { group: 'نویگیشن', id: 'go-notes', title: 'یادداشت‌ها', sub: 'لیست یادداشت‌ها', icon: 'file', action: () => switchView('notes') },
    { group: 'نویگیشن', id: 'go-projects', title: 'پروژه‌ها', sub: 'لیست پروژه‌ها', icon: 'rocket', action: () => switchView('projects') }
];

let cmdSelectedIndex = 0;
let cmdFilteredCommands = [...commands];
let cmdSearchResults = [];

function openCommandPalette() {
     const __el_815 = document.getElementById('cmdOverlay');
     if (__el_815) __el_815.classList.add('active');
    document.getElementById('cmdInput').value = '';
    searchCommand('');
    setTimeout(() => document.getElementById('cmdInput').focus(), 50);
}

function closeCommandPalette() {
     const __el_822 = document.getElementById('cmdOverlay');
     if (__el_822) __el_822.classList.remove('active');
}

async function searchCommand(query) {
    const q = query.toLowerCase().trim();
    
    if (!q) {
        cmdFilteredCommands = [...commands];
        cmdSearchResults = [];
        cmdSelectedIndex = 0;
        renderCommandResults();
        return;
    }
    
    cmdFilteredCommands = commands.filter(c => c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q));
    
    try {
        const results = await api(`search?q=${encodeURIComponent(query)}`);
        cmdSearchResults = [];
        
        const mkItem = (group, type, item, title, sub, icon) => ({
            group, id: `search-${type}-${item.id}`, title, sub, icon,
            action: () => { closeCommandPalette(); switchView(type === 'person' ? 'people' : type + 's'); }
        });
        
        (results.people || []).forEach(p => cmdSearchResults.push(mkItem('مخاطبان', 'person', p, p.name, p.email || p.company || 'مخاطب', 'users')));
        (results.tasks || []).forEach(t => cmdSearchResults.push(mkItem('کارها', 'task', t, t.title, t.description || 'کار', 'check')));
        (results.ideas || []).forEach(i => cmdSearchResults.push(mkItem('ایده‌ها', 'idea', i, i.title, i.description || 'ایده', 'lightbulb')));
        (results.notes || []).forEach(n => cmdSearchResults.push(mkItem('یادداشت‌ها', 'note', n, n.title, 'یادداشت', 'file')));
        (results.projects || []).forEach(p => cmdSearchResults.push(mkItem('پروژه‌ها', 'project', p, p.name, p.description || 'پروژه', 'rocket')));
    } catch (err) {
        console.error('Search error:', err);
    }
    
    cmdSelectedIndex = 0;
    renderCommandResults();
}

function renderCommandResults() {
    const container = document.getElementById('cmdResults');
    const allItems = [...cmdFilteredCommands, ...cmdSearchResults];
    
    if (!allItems.length) {
        container.innerHTML = `<div class="empty-state" style="padding:20px;"><div class="empty-title">نتیجه‌ای یافت نشد</div></div>`;
        return;
    }
    
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    const groups = {};
    allItems.forEach((item, i) => {
        if (!groups[item.group]) groups[item.group] = [];
        groups[item.group].push({ ...item, index: i });
    });
    
    let html = '';
    for (const [group, items] of Object.entries(groups)) {
        html += `<div class="cmd-group-title">${group}</div>`;
        html += items.map(item => `
            <div class="cmd-item ${item.index === cmdSelectedIndex ? 'selected' : ''}" onclick="executeCommand(${item.index})">
                ${mkIcon(item.icon, 14)}
                <div class="cmd-item-content">
                    <div class="cmd-item-title">${item.title}</div>
                    <div class="cmd-item-sub">${item.sub}</div>
                </div>
            </div>
        `).join('');
    }
    container.innerHTML = html;
}

function executeCommand(index) {
    const allItems = [...cmdFilteredCommands, ...cmdSearchResults];
    const cmd = allItems[index];
    if (cmd) { closeCommandPalette(); cmd.action(); }
}

// ===== KEYBOARD =====
function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
             const __el_903 = document.getElementById('cmdOverlay');
             if (__el_903) __el_903.classList.contains('active');
            return;
        }
        
        if (e.key === 'Escape') {
            if (document.getElementById('confirmOverlay').classList.contains('active')) closeConfirm();
             const __el_909 = document.getElementById('cmdOverlay');
             if (__el_909) __el_909.classList.contains('active');
             const __el_910 = document.getElementById('modalOverlay');
             if (__el_910) __el_910.classList.contains('active');
             const __el_911 = document.getElementById('slidePanel');
             if (__el_911) __el_911.classList.contains('active');
            return;
        }
        
        if (document.getElementById('cmdOverlay').classList.contains('active')) {
            const allItems = [...cmdFilteredCommands, ...cmdSearchResults];
            if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelectedIndex = Math.min(cmdSelectedIndex + 1, allItems.length - 1); renderCommandResults(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelectedIndex = Math.max(cmdSelectedIndex - 1, 0); renderCommandResults(); }
            else if (e.key === 'Enter') { e.preventDefault(); executeCommand(cmdSelectedIndex); }
        }
    });
}

// ===== MODAL =====
const modalForms = {
    people: {
        title: 'افزودن مخاطب جدید',
        fields: [
            { name: 'name', label: 'نام', type: 'text', required: true },
            { name: 'email', label: 'ایمیل', type: 'email' },
            { name: 'phone', label: 'تلفن', type: 'tel' },
            { name: 'company', label: 'شرکت', type: 'text' },
            { name: 'notes', label: 'یادداشت', type: 'textarea' }
        ],
        submit: async (d) => { d.tags = []; await api('people', 'POST', d); toast('مخاطب اضافه شد', 'success'); }
    },
    tasks: {
        title: 'افزودن کار جدید',
        fields: [
            { name: 'title', label: 'عنوان', type: 'text', required: true },
            { name: 'description', label: 'توضیحات', type: 'textarea' },
            { name: 'priority', label: 'اولویت', type: 'select', options: [{ value: 'low', label: 'کم' }, { value: 'medium', label: 'متوسط' }, { value: 'high', label: 'زیاد' }] },
            { name: 'dueDate', label: 'تاریخ انجام', type: 'date' }
        ],
        submit: async (d) => {
            d.status = 'pending'; d.tags = [];
            if (d.dueDate) d.dueDate = new Date(d.dueDate).toISOString();
            await api('tasks', 'POST', d); toast('کار اضافه شد', 'success');
        }
    },
    ideas: {
        title: 'ثبت ایده جدید',
        fields: [
            { name: 'title', label: 'عنوان ایده', type: 'text', required: true },
            { name: 'description', label: 'توضیحات', type: 'textarea' }
        ],
        submit: async (d) => { d.status = 'draft'; d.tags = []; await api('ideas', 'POST', d); toast('ایده ثبت شد', 'success'); }
    },
    notes: {
        title: 'نوشتن یادداشت',
        fields: [
            { name: 'title', label: 'عنوان', type: 'text', required: true },
            { name: 'content', label: 'متن یادداشت', type: 'textarea' }
        ],
        submit: async (d) => { d.tags = []; await api('notes', 'POST', d); toast('یادداشت ذخیره شد', 'success'); }
    },
    projects: {
        title: 'تعریف پروژه جدید',
        fields: [
            { name: 'name', label: 'نام پروژه', type: 'text', required: true },
            { name: 'description', label: 'توضیحات', type: 'textarea' },
            { name: 'startDate', label: 'تاریخ شروع', type: 'date' },
            { name: 'endDate', label: 'تاریخ پایان', type: 'date' }
        ],
        submit: async (d) => {
            d.status = 'active'; d.tags = [];
            if (d.startDate) d.startDate = new Date(d.startDate).toISOString();
            if (d.endDate) d.endDate = new Date(d.endDate).toISOString();
            await api('projects', 'POST', d); toast('پروژه ایجاد شد', 'success');
        }
    }
};

let currentModalType = null;

function openModal(type) {
    const cfg = modalForms[type];
    if (!cfg) return;
    currentModalType = type;
    document.getElementById('modalTitle').textContent = cfg.title;
    
    const body = document.getElementById('modalBody');
    body.innerHTML = cfg.fields.map(f => `
        <div class="form-field">
            <label class="form-label">${f.label}${f.required ? ' *' : ''}</label>
            ${f.type === 'textarea' ? `<textarea class="form-textarea" name="${f.name}" ${f.required ? 'required' : ''}></textarea>` :
              f.type === 'select' ? `<select class="form-select" name="${f.name}">${f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}</select>` :
              `<input class="form-input" type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''} />`}
        </div>
    `).join('');
    
    document.getElementById('modalSubmit').onclick = submitModal;
     const __el_1003 = document.getElementById('modalOverlay');
     if (__el_1003) __el_1003.classList.add('active');
}

function closeModal() {
     const __el_1007 = document.getElementById('modalOverlay');
     if (__el_1007) __el_1007.classList.remove('active');
    currentModalType = null;
}

function closeModalOnOverlay(e) {
    if (e.target.id === 'modalOverlay') closeModal();
}

async function submitModal() {
    if (!currentModalType) return;
    const cfg = modalForms[currentModalType];
    const body = document.getElementById('modalBody');
    const data = {};
    cfg.fields.forEach(f => {
        const input = body.querySelector(`[name="${f.name}"]`);
        if (input) data[f.name] = input.value;
    });
    
    for (const f of cfg.fields) {
        if (f.required && !data[f.name]) { toast(`فیلد "${f.label}" الزامی است`, 'error'); return; }
    }
    
    try {
        await cfg.submit(data);
        closeModal();
        await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
    } catch (err) {
        toast('خطا در ذخیره: ' + err.message, 'error');
    }
}

// ===== TOAST =====
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    const mkIcon = (name, size) => typeof icon === 'function' ? icon(name, size) : '';
    const iconMap = { success: 'check', error: 'close', info: 'sparkle' };
    toastEl.innerHTML = `<div class="toast-icon">${mkIcon(iconMap[type] || 'sparkle', 16)}</div><div class="toast-content">${message}</div>`;
    container.appendChild(toastEl);
    setTimeout(() => { toastEl.classList.add('removing'); setTimeout(() => toastEl.remove(), 200); }, 3000);
}

// ===== SETTINGS TABS =====
function setupSettingsTabs() {
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            
            document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('.settings-tab').forEach(t => {
                t.style.display = t.dataset.tab === tab ? 'block' : 'none';
            });
        });
    });
}

// ===== BACKUP MANAGER =====
async function loadBackups() {
    const list = document.getElementById('backupList');
    if (!list) return;
    
    list.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
    
    try {
        const response = await fetch(`${API}/api/backups`);
        const backups = await response.json();
        
        if (!Array.isArray(backups) || backups.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${icon('inbox', 20)}</div>
                    <div class="empty-title">نسخه پشتیبانی وجود ندارد</div>
                    <div class="empty-desc">اولین نسخه پشتیبان خود را ایجاد کنید</div>
                </div>
            `;
            return;
        }
        
        list.innerHTML = backups.map(b => {
            const sizeKB = (b.size / 1024).toFixed(1);
            const date = new Date(b.createdAt).toLocaleString('fa-IR');
            const meta = b.metadata;
            const itemsCount = meta && meta.items 
                ? `👥 ${meta.items.people || 0} | ✓ ${meta.items.tasks || 0} | 💡 ${meta.items.ideas || 0}`
                : '';
            
            return `
                <div class="backup-item">
                    <div class="backup-icon">${icon('inbox', 16)}</div>
                    <div class="backup-info">
                        <div class="backup-name">
                            ${b.name.replace('.zip', '')}
                        </div>
                        <div class="backup-meta">
                            <span class="backup-meta-item">📅 ${date}</span>
                            <span class="backup-meta-item">💾 ${sizeKB} KB</span>
                            ${itemsCount ? `<span class="backup-meta-item">${itemsCount}</span>` : ''}
                        </div>
                    </div>
                    <div class="backup-actions">
                        <button class="btn btn-secondary" onclick="restoreBackup('${b.name}')" title="بازیابی">
                            ${icon('activity', 14)}
                        </button>
                        <button class="btn btn-secondary" onclick="downloadBackup('${b.name}')" title="دانلود">
                            ${icon('check', 14)}
                        </button>
                        <button class="btn btn-ghost" style="color:var(--danger);" onclick="deleteBackup('${b.name}')" title="حذف">
                            ${icon('trash', 14)}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><div class="empty-title">خطا در بارگذاری</div><div class="empty-desc">${err.message}</div></div>`;
    }
}

async function createBackup() {
    const name = prompt('نام پشتیبان (اختیاری):', '');
    if (name === null) return;
    
    try {
        toast('در حال ایجاد پشتیبان...', 'info');
        const response = await fetch(`${API}/api/backups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name || '' })
        });
        const result = await response.json();
        
        if (result.success) {
            toast('پشتیبان با موفقیت ایجاد شد', 'success');
            loadBackups();
        } else {
            toast('خطا: ' + (result.error || 'نامشخص'), 'error');
        }
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

async function restoreBackup(name) {
    if (!confirm(`آیا از بازیابی "${name}" مطمئن هستید؟\n\nاین عمل داده‌های فعلی را با داده‌های پشتیبان جایگزین می‌کند. یک پشتیبان خودکار قبل از بازیابی ایجاد خواهد شد.`)) {
        return;
    }
    
    try {
        toast('در حال بازیابی...', 'info');
        const response = await fetch(`${API}/api/backups/${encodeURIComponent(name)}/restore`, { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            toast('بازیابی با موفقیت انجام شد! در حال بارگذاری مجدد...', 'success');
            setTimeout(() => loadAllData(), 1000);
            setTimeout(() => loadBackups(), 1500);
        } else {
            toast('خطا: ' + (result.error || 'نامشخص'), 'error');
        }
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

async function deleteBackup(name) {
    if (!confirm(`آیا از حذف "${name}" مطمئن هستید؟`)) return;
    
    try {
        const response = await fetch(`${API}/api/backups/${encodeURIComponent(name)}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
            toast('پشتیبان حذف شد', 'success');
            loadBackups();
        } else {
            toast('خطا در حذف', 'error');
        }
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

function downloadBackup(name) {
    window.open(`${API}/api/backup/download/${encodeURIComponent(name)}`, '_blank');
    toast('دانلود شروع شد', 'info');
}

// ===== EXPORT / IMPORT =====
async function loadExportGrid() {
    const grid = document.getElementById('exportGrid');
    if (!grid) return;
    
    const entities = [
        { name: 'people', label: 'مخاطبان', icon: 'users', color: '#7c3aed' },
        { name: 'tasks', label: 'کارها', icon: 'check', color: '#3b82f6' },
        { name: 'ideas', label: 'ایده‌ها', icon: 'lightbulb', color: '#f59e0b' },
        { name: 'notes', label: 'یادداشت‌ها', icon: 'file', color: '#10b981' },
        { name: 'projects', label: 'پروژه‌ها', icon: 'rocket', color: '#ec4899' },
        { name: 'activity_logs', label: 'فعالیت‌ها', icon: 'activity', color: '#8b5cf6' }
    ];
    
    grid.innerHTML = entities.map(e => {
        const count = currentData[e.name] ? currentData[e.name].length : 0;
        return `
            <div class="export-card">
                <div class="export-card-header">
                    <div class="export-card-icon" style="background:${e.color}22; color:${e.color};">
                        ${icon(e.icon, 14)}
                    </div>
                    <div>
                        <div class="export-card-title">${e.label}</div>
                        <div class="export-card-count">${count} مورد</div>
                    </div>
                </div>
                <div class="export-card-actions">
                    <button class="btn btn-secondary" onclick="exportEntity('${e.name}')">📥 خروجی</button>
                    <button class="btn btn-secondary" onclick="openImportModal('${e.name}')">📤 ورودی</button>
                </div>
            </div>
        `;
    }).join('');
}

async function exportEntity(entity) {
    try {
        const response = await fetch(`${API}/api/export/${entity}`);
        const result = await response.json();
        
        if (result.success) {
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${entity}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast(`${result.count} مورد از ${entity} صادر شد`, 'success');
        } else {
            toast('خطا در خروجی', 'error');
        }
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

let currentImportEntity = null;
let currentImportData = null;
let currentImportMode = 'append';

function openImportModal(entity) {
    currentImportEntity = entity;
    currentImportData = null;
    currentImportMode = 'append';
    
    document.getElementById('modalTitle').textContent = `ورودی داده به ${entity}`;
    (function(e){if(e)e.innerHTML= `
        <div class="import-dropzone" id="importDropzone" onclick="document.getElementById('importFileInput').click()">
            <div class="import-dropzone-icon">${icon('inbox', 24)}</div>
            <div class="import-dropzone-text">فایل JSON خود را اینجا رها کنید یا کلیک کنید</div>
            <div class="import-dropzone-hint">فقط فایل‌های JSON معتبر</div>
            <input type="file" id="importFileInput" accept=".json" style="display:none;" onchange="handleImportFile(event)" />
        </div>
        
        <div id="importPreview" style="display:none;"></div>
        
        <div style="margin-top:12px;">
            <div class="form-label">حالت ورودی:</div>
            <div class="import-options">
                <div class="import-option active" onclick="setImportMode('append', this)">
                    <div class="import-option-title">افزودن (Append)</div>
                    <div class="import-option-desc">به داده‌های فعلی اضافه شود</div>
                </div>
                <div class="import-option" onclick="setImportMode('replace', this)">
                    <div class="import-option-title">جایگزینی (Replace)</div>
                    <div class="import-option-desc">جایگزین داده‌های فعلی شود</div>
                </div>
            </div>
        </div>
    `;
    
    // Drag and drop
    const dropzone = document.getElementById('importDropzone');
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) processImportFile(file);
    });
    
    document.getElementById('modalSubmit').onclick = submitImport;
     const __el_1307 = document.getElementById('modalOverlay');
     if (__el_1307) __el_1307.classList.add('active');
}

function setImportMode(mode, el) {
    currentImportMode = mode;
    document.querySelectorAll('.import-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (file) processImportFile(file);
}

function processImportFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                toast('فایل باید یک آرایه JSON باشد', 'error');
                return;
            }
            currentImportData = data;
            
            (function(e){if(e)e.innerHTML= `
                <div class="import-dropzone-icon" style="color:var(--success);">✓</div>
                <div class="import-dropzone-text">فایل "${file.name}" بارگذاری شد</div>
                <div class="import-dropzone-hint">${data.length} مورد آماده ورودی</div>
            `;
            
            document.getElementById('importPreview').style.display = 'block';
            (function(e){if(e)e.innerHTML= `
                <div style="padding:10px; background:var(--bg-surface-2); border-radius:var(--radius-sm); font-size:12px;">
                    <div style="color:var(--success); margin-bottom:6px;">✓ فایل معتبر است</div>
                    <div style="color:var(--text-secondary);">تعداد آیتم‌ها: <strong>${data.length}</strong></div>
                </div>
            `;
        } catch (err) {
            toast('فایل JSON نامعتبر است', 'error');
        }
    };
    reader.readAsText(file);
}

async function submitImport() {
    if (!currentImportData) {
        toast('لطفاً ابتدا یک فایل انتخاب کنید', 'error');
        return;
    }
    
    try {
        toast('در حال ورودی داده‌ها...', 'info');
        const response = await fetch(`${API}/api/import/${currentImportEntity}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: currentImportData,
                mode: currentImportMode
            })
        });
        const result = await response.json();
        
        if (result.success) {
            toast(`${result.imported} مورد با موفقیت وارد شد`, 'success');
            closeModal();
            try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
            if (document.getElementById('exportGrid')) loadExportGrid();
        } else {
            toast('خطا: ' + (result.error || 'نامشخص'), 'error');
        }
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

// ===== ATTACHMENTS =====
async function loadAttachments(entityType, entityId) {
    try {
        const response = await fetch(`${API}/api/attachments/${entityType}/${entityId}`);
        const attachments = await response.json();
        return Array.isArray(attachments) ? attachments : [];
    } catch {
        return [];
    }
}

async function renderAttachmentsSection(entityType, entityId, container) {
    const attachments = await loadAttachments(entityType, entityId);
    
    const images = attachments.filter(a => a.mimeType && a.mimeType.startsWith('image/'));
    const files = attachments.filter(a => !a.mimeType || !a.mimeType.startsWith('image/'));
    
    container.innerHTML = `
        <div class="attachments-section">
            <div class="attachments-header">
                <div class="attachments-title">
                    ${icon('inbox', 14)}
                    <span>پیوست‌ها (${attachments.length})</span>
                </div>
            </div>
            <div class="attachments-grid">
                ${images.map(att => `
                    <div class="attachment-item" onclick="openAttachment('${att.fileName}')">
                        <img src="${API}/api/attachment/${att.fileName}" alt="${att.originalName}" />
                        <button class="attachment-delete" onclick="event.stopPropagation(); deleteAttachment('${att.id}', '${entityType}', '${entityId}')">×</button>
                    </div>
                `).join('')}
                ${files.map(att => `
                    <div class="attachment-item" onclick="openAttachment('${att.fileName}')" title="${att.originalName}">
                        <div class="file-icon">${icon('file', 20)}</div>
                        <button class="attachment-delete" onclick="event.stopPropagation(); deleteAttachment('${att.id}', '${entityType}', '${entityId}')">×</button>
                    </div>
                `).join('')}
                <label class="upload-btn">
                    ${icon('plus', 16)}
                    <span>افزودن</span>
                    <input type="file" style="display:none;" onchange="uploadAttachment(event, '${entityType}', '${entityId}')" multiple />
                </label>
            </div>
        </div>
    `;
}

function openAttachment(fileName) {
    window.open(`${API}/api/attachment/${fileName}`, '_blank');
}

async function uploadAttachment(event, entityType, entityId) {
    const files = event.target.files;
    if (!files.length) return;
    
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target.result.split(',')[1];
            
            try {
                toast(`در حال آپلود ${file.name}...`, 'info');
                const response = await fetch(`${API}/api/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        entityType,
                        entityId,
                        fileName: file.name,
                        fileData: base64,
                        mimeType: file.type
                    })
                });
                const result = await response.json();
                
                if (result.id) {
                    toast(`${file.name} آپلود شد`, 'success');
                    const section = document.getElementById('attachmentsContainer');
                    if (section) renderAttachmentsSection(entityType, entityId, section);
                }
            } catch (err) {
                toast('خطا در آپلود: ' + err.message, 'error');
            }
        };
        reader.readAsDataURL(file);
    }
}

async function deleteAttachment(attachmentId, entityType, entityId) {
    if (!confirm('آیا از حذف این پیوست مطمئن هستید؟')) return;
    
    try {
        const response = await fetch(`${API}/api/attachment/${attachmentId}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
            toast('پیوست حذف شد', 'success');
            const section = document.getElementById('attachmentsContainer');
            if (section) renderAttachmentsSection(entityType, entityId, section);
        }
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

// Patch openPersonPanel to include attachments
const originalOpenPersonPanel = openPersonPanel;
openPersonPanel = async function(id) {
    originalOpenPersonPanel(id);
    
    // Add attachments section after panel opens
    setTimeout(async () => {
        const panelBody = document.getElementById('panelBody');
        if (panelBody && currentPanelType === 'person') {
            const attachContainer = document.createElement('div');
            attachContainer.id = 'attachmentsContainer';
            panelBody.appendChild(attachContainer);
            renderAttachmentsSection('person', id, attachContainer);
        }
    }, 100);
};

// Patch switchView to load backups/exports on demand
const originalSwitchView = switchView;
switchView = function(view) {
    originalSwitchView(view);
    
    if (view === 'backups') {
        loadBackups();
        loadExportGrid();
    } else if (view === 'settings') {
        setupSettingsTabs();
    }
};

// Add icons to new nav items
setTimeout(() => {
    document.querySelectorAll('.nav-link').forEach(link => {
        const view = link.dataset.view;
        const iconSpan = link.querySelector('.nav-icon');
        if (!iconSpan || iconSpan.innerHTML) return;
        
        const iconMap = {
            'backups': 'inbox',
            'settings': 'settings'
        };
        
        if (iconMap[view] && typeof icon === 'function') {
            iconSpan.innerHTML = icon(iconMap[view], 16);
        }
    });
    
    // Settings page icons
    const sGeneral = document.getElementById('settingsGeneralIcon');
    const sBackup = document.getElementById('settingsBackupIcon');
    const sAppearance = document.getElementById('settingsAppearanceIcon');
    const sAbout = document.getElementById('settingsAboutIcon');
    const createBackupIcon = document.getElementById('createBackupIcon');
    
    if (typeof icon === 'function') {
        if (sGeneral) sGeneral.innerHTML = icon('settings', 14);
        if (sBackup) sBackup.innerHTML = icon('inbox', 14);
        if (sAppearance) sAppearance.innerHTML = icon('sparkle', 14);
        if (sAbout) sAbout.innerHTML = icon('home', 14);
        if (createBackupIcon) createBackupIcon.innerHTML = icon('plus', 14);
    }
}, 100);

// ===== CALENDAR VIEW =====
let currentTaskView = 'kanban';
let currentCalendarDate = new Date();
let selectedCalendarDay = null;

// Jalali (Persian) Calendar Conversion
// Based on algorithm by Kazimierz M. Borkowski
function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy, jm, jd, days;
    
    gy = (gm <= 2) ? (gy - 1) : gy;
    days = 355666 + (365 * gy) + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) + gd + g_d_m[gm - 1];
    jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    
    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    
    if (days < 186) {
        jm = 1 + Math.floor(days / 31);
        jd = 1 + (days % 31);
    } else {
        jm = 7 + Math.floor((days - 186) / 30);
        jd = 1 + ((days - 186) % 30);
    }
    
    return { jy, jm, jd };
}

function jalaliToGregorian(jy, jm, jd) {
    let gy, gm, gd, days, sal_a, v;
    
    jy += 1595;
    days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    
    gd = days + 1;
    sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
        gd -= sal_a[gm];
    }
    
    return { gy, gm, gd };
}

function isJalaliLeapYear(jy) {
    const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    const jp = breaks[0];
    let jump = 0;
    for (let i = 1; i < breaks.length; i++) {
        const jm = breaks[i];
        jump = jm - jp;
        if (jy < jm) break;
    }
    let n = jy - jp;
    if (jump - n < 6) n = n - jump + Math.floor((jump + 4) / 33) * 33;
    let leap = ((n + 1) % 33 - 1) % 4;
    if (leap === -1) leap = 4;
    return leap === 0;
}

function jalaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isJalaliLeapYear(jy) ? 30 : 29;
}

function toPersianDigits(num) {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, d => persianDigits[d]);
}

const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const persianWeekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const persianWeekdaysFull = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

function switchTaskView(view) {
    currentTaskView = view;
    
    document.querySelectorAll('#taskViewToggle .view-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    const kanbanView = document.getElementById('kanbanView');
    const calendarView = document.getElementById('calendarView');
    
    if (view === 'kanban') {
        kanbanView.style.display = 'block';
        calendarView.style.display = 'none';
    } else {
        kanbanView.style.display = 'none';
        calendarView.style.display = 'block';
        renderCalendar();
    }
}

function changeMonth(delta) {
    const jDate = gregorianToJalali(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, currentCalendarDate.getDate());
    let newMonth = jDate.jm + delta;
    let newYear = jDate.jy;
    
    if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    } else if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    }
    
    const gDate = jalaliToGregorian(newYear, newMonth, 1);
    currentCalendarDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
    selectedCalendarDay = null;
    renderCalendar();
}

function goToToday() {
    currentCalendarDate = new Date();
    selectedCalendarDay = null;
    renderCalendar();
}

function renderCalendar() {
    const weekdaysEl = document.getElementById('calendarWeekdays');
    const bodyEl = document.getElementById('calendarBody');
    const titleEl = document.getElementById('calendarTitle');
    
    if (!weekdaysEl || !bodyEl) return;
    
    // Render weekdays (Saturday first in Persian calendar)
    weekdaysEl.innerHTML = persianWeekdays.map((d, i) => 
        `<div class="calendar-weekday ${i === 6 ? 'weekend' : ''}">${d}</div>`
    ).join('');
    
    // Get current Jalali date
    const todayJ = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    const viewJ = gregorianToJalali(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, currentCalendarDate.getDate());
    
    // Set title
    titleEl.textContent = `${persianMonths[viewJ.jm - 1]} ${toPersianDigits(viewJ.jy)}`;
    
    // Calculate first day of month
    const monthLength = jalaliMonthLength(viewJ.jy, viewJ.jm);
    const firstDayG = jalaliToGregorian(viewJ.jy, viewJ.jm, 1);
    const firstDayDate = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd);
    
    // Persian week starts on Saturday (JS: Saturday = 6)
    // We need to offset to start from Saturday
    let startDayOfWeek = firstDayDate.getDay(); // 0=Sun, 6=Sat
    // Convert to Persian week (Sat=0, Sun=1, ..., Fri=6)
    let persianOffset = (startDayOfWeek + 1) % 7;
    
    // Calculate previous month days to show
    const prevMonthLength = jalaliMonthLength(viewJ.jy, viewJ.jm === 1 ? 12 : viewJ.jm - 1);
    
    // Build tasks by date map
    const tasks = currentData.tasks;
    const tasksByDate = {};
    tasks.forEach(task => {
        if (task.dueDate) {
            const d = new Date(task.dueDate);
            const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
            const dateKey = `${jDate.jy}-${String(jDate.jm).padStart(2, '0')}-${String(jDate.jd).padStart(2, '0')}`;
            if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
            tasksByDate[dateKey].push(task);
        }
    });
    
    // Build calendar grid (6 weeks = 42 cells)
    let html = '';
    let dayCounter = 1;
    let nextMonthDay = 1;
    
    // Stats
    let monthTaskCount = 0;
    let highCount = 0, mediumCount = 0, lowCount = 0;
    
    for (let i = 0; i < 42; i++) {
        let dayNum, isOtherMonth = false, isToday = false, dateKey, jy, jm, jd;
        
        if (i < persianOffset) {
            // Previous month
            dayNum = prevMonthLength - persianOffset + i + 1;
            isOtherMonth = true;
            const pm = viewJ.jm === 1 ? 12 : viewJ.jm - 1;
            const py = viewJ.jm === 1 ? viewJ.jy - 1 : viewJ.jy;
            jy = py; jm = pm; jd = dayNum;
        } else if (dayCounter <= monthLength) {
            // Current month
            dayNum = dayCounter;
            jy = viewJ.jy; jm = viewJ.jm; jd = dayCounter;
            isToday = (jy === todayJ.jy && jm === todayJ.jm && jd === todayJ.jd);
            dayCounter++;
        } else {
            // Next month
            dayNum = nextMonthDay;
            isOtherMonth = true;
            const nm = viewJ.jm === 12 ? 1 : viewJ.jm + 1;
            const ny = viewJ.jm === 12 ? viewJ.jy + 1 : viewJ.jy;
            jy = ny; jm = nm; jd = dayNum;
            nextMonthDay++;
        }
        
        dateKey = `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
        const dayTasks = tasksByDate[dateKey] || [];
        const isWeekend = (i % 7) === 6; // Friday
        const hasTasks = dayTasks.length > 0;
        
        if (!isOtherMonth) {
            monthTaskCount += dayTasks.length;
            dayTasks.forEach(t => {
                if (t.priority === 'high') highCount++;
                else if (t.priority === 'medium') mediumCount++;
                else lowCount++;
            });
        }
        
        const isSelected = selectedCalendarDay === dateKey;
        
        html += `
            <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${hasTasks ? 'has-tasks' : ''}" 
                 onclick="selectCalendarDay('${dateKey}')"
                 data-date="${dateKey}">
                <div class="day-number">${toPersianDigits(dayNum)}</div>
                <div class="day-tasks">
                    ${dayTasks.slice(0, 2).map(t => `
                        <div class="day-task priority-${t.priority || 'low'} ${t.status === 'done' ? 'status-done' : ''}" 
                             onclick="event.stopPropagation(); openTaskDetail('${t.id}')">
                            ${t.title}
                        </div>
                    `).join('')}
                    ${dayTasks.length > 2 ? `<div class="day-more">+${toPersianDigits(dayTasks.length - 2)} مورد</div>` : ''}
                </div>
            </div>
        `;
    }
    
    bodyEl.innerHTML = html;
    
    // Update stats
    document.getElementById('statHighPriority').textContent = toPersianDigits(highCount);
    document.getElementById('statMediumPriority').textContent = toPersianDigits(mediumCount);
    document.getElementById('statLowPriority').textContent = toPersianDigits(lowCount);
    document.getElementById('calendarTaskCount').textContent = `${toPersianDigits(monthTaskCount)} کار در این ماه`;
    
    // If a day was selected, re-render its detail
    if (selectedCalendarDay) {
        renderDayDetail(selectedCalendarDay);
    }
}

function selectCalendarDay(dateKey) {
    selectedCalendarDay = dateKey;
    
    // Highlight selected day
    document.querySelectorAll('.calendar-day').forEach(day => {
        if (day.dataset.date === dateKey) {
            day.style.outline = '2px solid var(--accent)';
            day.style.outlineOffset = '-2px';
        } else {
            day.style.outline = 'none';
        }
    });
    
    renderDayDetail(dateKey);
}

function renderDayDetail(dateKey) {
    const panel = document.getElementById('dayDetailPanel');
    if (!panel) return;
    
    const [jy, jm, jd] = dateKey.split('-').map(Number);
    const gDate = jalaliToGregorian(jy, jm, jd);
    const date = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
    
    // Get day name
    const dayOfWeek = (date.getDay() + 1) % 7;
    const dayName = persianWeekdaysFull[dayOfWeek];
    
    // Get tasks for this day
    const tasks = currentData.tasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        return `${jDate.jy}-${String(jDate.jm).padStart(2, '0')}-${String(jDate.jd).padStart(2, '0')}` === dateKey;
    });
    
    if (tasks.length === 0) {
        panel.innerHTML = `
            <div class="day-detail-panel">
                <div class="day-detail-header">
                    <div>
                        <div class="day-detail-title">${dayName}</div>
                        <div class="day-detail-date">${toPersianDigits(jd)} ${persianMonths[jm - 1]} ${toPersianDigits(jy)}</div>
                    </div>
                    <button class="btn btn-ghost" onclick="document.getElementById('dayDetailPanel').style.display='none'">
                        <span>×</span>
                    </button>
                </div>
                <div class="day-detail-body">
                    <div class="empty-state" style="padding:30px 20px;">
                        <div class="empty-icon">${typeof icon === 'function' ? icon('check', 24) : '✓'}</div>
                        <div class="empty-title">کار برنامه‌ریزی شده‌ای وجود ندارد</div>
                        <div class="empty-desc">برای این روز کاری تعریف نشده است</div>
                        <button class="btn btn-primary" onclick="openModalForDate('${dateKey}')" style="margin-top:12px;">
                            + افزودن کار جدید
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <div class="day-detail-panel">
                <div class="day-detail-header">
                    <div>
                        <div class="day-detail-title">${dayName} - ${toPersianDigits(tasks.length)} کار</div>
                        <div class="day-detail-date">${toPersianDigits(jd)} ${persianMonths[jm - 1]} ${toPersianDigits(jy)}</div>
                    </div>
                    <button class="btn btn-ghost" onclick="document.getElementById('dayDetailPanel').style.display='none'">
                        ×
                    </button>
                </div>
                <div class="day-detail-body">
                    <div class="day-task-list">
                        ${tasks.map(t => `
                            <div class="day-task-item" onclick="openTaskDetail('${t.id}')">
                                <div class="day-task-status ${t.status === 'done' ? 'done' : ''}" 
                                     onclick="event.stopPropagation(); toggleTaskStatus('${t.id}')">
                                    ${t.status === 'done' ? '✓' : ''}
                                </div>
                                <div class="day-task-content">
                                    <div class="day-task-title ${t.status === 'done' ? 'done' : ''}">${t.title}</div>
                                    <div class="day-task-meta">
                                        <span class="pill ${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'success'}">
                                            ${t.priority === 'high' ? 'بالا' : t.priority === 'medium' ? 'متوسط' : 'کم'}
                                        </span>
                                        <span>${t.status === 'pending' ? 'در انتظار' : t.status === 'in-progress' ? 'در حال انجام' : t.status === 'review' ? 'بازبینی' : 'انجام شده'}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary" onclick="openModalForDate('${dateKey}')" style="margin-top:12px; width:100%; justify-content:center;">
                        + افزودن کار جدید
                    </button>
                </div>
            </div>
        `;
    }
    
    panel.style.display = 'block';
}

async function toggleTaskStatus(taskId) {
    const task = currentData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    
    try {
        await api(`tasks/${taskId}`, 'PUT', { status: newStatus });
        toast(newStatus === 'done' ? 'کار تکمیل شد!' : 'کار به حالت در انتظار بازگشت', 'success');
        await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
        renderCalendar();
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

function openTaskDetail(taskId) {
    const task = currentData.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Switch to tasks view and open detail
    if (currentView !== 'tasks') {
        switchView('tasks');
    }
    
    // Open modal to edit
    openEditTaskModal(task);
}

function openEditTaskModal(task) {
    currentModalType = 'tasks';
    document.getElementById('modalTitle').textContent = 'ویرایش کار';
    
    const body = document.getElementById('modalBody');
    const dueDateValue = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    
    body.innerHTML = `
        <div class="form-field">
            <label class="form-label">عنوان *</label>
            <input class="form-input" name="title" value="${task.title}" required />
        </div>
        <div class="form-field">
            <label class="form-label">توضیحات</label>
            <textarea class="form-textarea" name="description">${task.description || ''}</textarea>
        </div>
        <div class="form-field">
            <label class="form-label">اولویت</label>
            <select class="form-select" name="priority">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>کم</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>متوسط</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>زیاد</option>
            </select>
        </div>
        <div class="form-field">
            <label class="form-label">وضعیت</label>
            <select class="form-select" name="status">
                <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>در انتظار</option>
                <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>در حال انجام</option>
                <option value="review" ${task.status === 'review' ? 'selected' : ''}>بازبینی</option>
                <option value="done" ${task.status === 'done' ? 'selected' : ''}>انجام شده</option>
            </select>
        </div>
        <div class="form-field">
            <label class="form-label">تاریخ انجام</label>
            <input class="form-input" type="date" name="dueDate" value="${dueDateValue}" />
        </div>
    `;
    
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {};
        body.querySelectorAll('[name]').forEach(input => {
            data[input.name] = input.value;
        });
        
        if (!data.title) {
            toast('عنوان الزامی است', 'error');
            return;
        }
        
        if (data.dueDate) data.dueDate = new Date(data.dueDate).toISOString();
        
        try {
            await api(`tasks/${task.id}`, 'PUT', data);
            toast('کار با موفقیت ویرایش شد', 'success');
            closeModal();
            await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
            if (currentTaskView === 'calendar') renderCalendar();
        } catch (err) {
            toast('خطا: ' + err.message, 'error');
        }
    };
    
     const __el_2018 = document.getElementById('modalOverlay');
     if (__el_2018) __el_2018.classList.add('active');
}

function openModalForDate(dateKey) {
    const [jy, jm, jd] = dateKey.split('-').map(Number);
    const gDate = jalaliToGregorian(jy, jm, jd);
    const dateValue = `${gDate.gy}-${String(gDate.gm).padStart(2, '0')}-${String(gDate.gd).padStart(2, '0')}`;
    
    openModal('tasks');
    
    // Set the date after modal opens
    setTimeout(() => {
        const dateInput = document.querySelector('[name="dueDate"]');
        if (dateInput) dateInput.value = dateValue;
    }, 50);
}

// Inject view toggle icons
function injectTaskViewIcons() {
    const kanbanIcon = document.getElementById('kanbanViewIcon');
    const calendarIcon = document.getElementById('calendarViewIcon');
    
    if (typeof icon === 'function') {
        if (kanbanIcon) kanbanIcon.innerHTML = icon('dashboard', 14);
        if (calendarIcon) calendarIcon.innerHTML = icon('calendar', 14);
    }
}

// Auto-inject icons after DOM ready
setTimeout(injectTaskViewIcons, 200);

// ===== ADVANCED CALENDAR FEATURES =====
let currentWeekDate = new Date();
let draggedTask = null;

// Override switchTaskView to support week view
const originalSwitchTaskView = window.switchTaskView;
window.switchTaskView = function(view) {
    currentTaskView = view;
    
    document.querySelectorAll('#taskViewToggle .view-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    const kanbanView = document.getElementById('kanbanView');
    const calendarView = document.getElementById('calendarView');
    const weekView = document.getElementById('weekView');
    
    kanbanView.style.display = view === 'kanban' ? 'block' : 'none';
    calendarView.style.display = view === 'calendar' ? 'block' : 'none';
    weekView.style.display = view === 'week' ? 'block' : 'none';
    
    if (view === 'calendar') renderCalendar();
    if (view === 'week') renderWeekView();
};

// ===== WEEK VIEW =====
function changeWeek(delta) {
    currentWeekDate.setDate(currentWeekDate.getDate() + (delta * 7));
    renderWeekView();
}

function goToThisWeek() {
    currentWeekDate = new Date();
    renderWeekView();
}

function renderWeekView() {
    const headerEl = document.getElementById('weekHeader');
    const bodyEl = document.getElementById('weekBody');
    const titleEl = document.getElementById('weekTitle');
    
    if (!headerEl || !bodyEl) return;
    
    // Get start of week (Saturday in Persian calendar)
    const weekStart = new Date(currentWeekDate);
    const dayOfWeek = weekStart.getDay();
    const daysToSubtract = (dayOfWeek + 1) % 7; // Saturday = 0 in Persian week
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    
    // Get week dates
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        weekDates.push(date);
    }
    
    // Title (first and last day of week in Jalali)
    const firstJ = gregorianToJalali(weekDates[0].getFullYear(), weekDates[0].getMonth() + 1, weekDates[0].getDate());
    const lastJ = gregorianToJalali(weekDates[6].getFullYear(), weekDates[6].getMonth() + 1, weekDates[6].getDate());
    titleEl.textContent = `${toPersianDigits(firstJ.jd)} ${persianMonths[firstJ.jm - 1]} تا ${toPersianDigits(lastJ.jd)} ${persianMonths[lastJ.jm - 1]} ${toPersianDigits(lastJ.jy)}`;
    
    // Header
    const today = new Date();
    const todayJ = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    let headerHtml = '<div class="week-time-header"></div>';
    weekDates.forEach(date => {
        const jDate = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const dayIdx = (date.getDay() + 1) % 7;
        const isToday = jDate.jy === todayJ.jy && jDate.jm === todayJ.jm && jDate.jd === todayJ.jd;
        
        headerHtml += `
            <div class="week-day-header ${isToday ? 'today' : ''}">
                <div class="week-day-name">${persianWeekdays[dayIdx]}</div>
                <div class="week-day-number">${toPersianDigits(jDate.jd)}</div>
            </div>
        `;
    });
    headerEl.innerHTML = headerHtml;
    
    // Body - Time slots
    let timeColumnHtml = '<div class="week-time-column">';
    for (let hour = 0; hour < 24; hour++) {
        const hourStr = String(hour).padStart(2, '0') + ':00';
        timeColumnHtml += `<div class="week-time-slot">${hourStr}</div>`;
    }
    timeColumnHtml += '</div>';
    
    // Body - Day columns
    let dayColumnsHtml = '';
    weekDates.forEach((date, dayIndex) => {
        const jDate = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const dateKey = `${jDate.jy}-${String(jDate.jm).padStart(2, '0')}-${String(jDate.jd).padStart(2, '0')}`;
        const isToday = jDate.jy === todayJ.jy && jDate.jm === todayJ.jm && jDate.jd === todayJ.jd;
        
        let dayHtml = `<div class="week-day-column ${isToday ? 'today' : ''}" data-date="${dateKey}">`;
        for (let hour = 0; hour < 24; hour++) {
            dayHtml += `<div class="week-hour-slot" onclick="quickAddTaskForDateTime('${dateKey}', ${hour})"></div>`;
        }
        dayHtml += '</div>';
        dayColumnsHtml += dayHtml;
    });
    
    bodyEl.innerHTML = timeColumnHtml + dayColumnsHtml;
    
    // Render tasks on week view
    renderTasksOnWeekView(weekDates);
    
    // Add current time indicator
    renderCurrentTimeIndicator();
}

function renderTasksOnWeekView(weekDates) {
    const bodyEl = document.getElementById('weekBody');
    if (!bodyEl) return;
    
    const tasks = currentData.tasks;
    
    weekDates.forEach((date, dayIndex) => {
        const jDate = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
        const dateKey = `${jDate.jy}-${String(jDate.jm).padStart(2, '0')}-${String(jDate.jd).padStart(2, '0')}`;
        
        const dayTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            const tj = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
            return `${tj.jy}-${String(tj.jm).padStart(2, '0')}-${String(tj.jd).padStart(2, '0')}` === dateKey;
        });
        
        const dayColumn = bodyEl.querySelector(`.week-day-column[data-date="${dateKey}"]`);
        if (!dayColumn) return;
        
        dayTasks.forEach(task => {
            // Extract time from dueDate (default to 9 AM)
            const taskDate = new Date(task.dueDate);
            const hour = taskDate.getHours() || 9;
            const duration = task.duration || 1; // Default 1 hour
            
            const taskEl = document.createElement('div');
            taskEl.className = `week-task priority-${task.priority || 'medium'}`;
            taskEl.style.top = `${hour * 60}px`;
            taskEl.style.height = `${duration * 60 - 4}px`;
            taskEl.draggable = true;
            taskEl.dataset.taskId = task.id;
            
            const timeStr = `${String(hour).padStart(2, '0')}:${String(taskDate.getMinutes()).padStart(2, '0')}`;
            
            taskEl.innerHTML = `
                <div class="week-task-title">${task.title}</div>
                <div class="week-task-time">${timeStr} - ${duration}h</div>
            `;
            
            taskEl.onclick = (e) => {
                e.stopPropagation();
                openEditTaskModal(task);
            };
            
            // Drag and drop
            taskEl.ondragstart = (e) => {
                draggedTask = task;
                e.dataTransfer.effectAllowed = 'move';
                taskEl.classList.add('drag-ghost');
            };
            
            taskEl.ondragend = () => {
                taskEl.classList.remove('drag-ghost');
                draggedTask = null;
            };
            
            dayColumn.appendChild(taskEl);
        });
    });
    
    // Add drag-over handlers for week hour slots
    bodyEl.querySelectorAll('.week-hour-slot').forEach(slot => {
        slot.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            slot.style.background = 'var(--accent-subtle)';
        };
        
        slot.ondragleave = () => {
            slot.style.background = '';
        };
        
        slot.ondrop = async (e) => {
            e.preventDefault();
            slot.style.background = '';
            
            if (!draggedTask) return;
            
            const dayColumn = slot.parentElement;
            const newDateKey = dayColumn.dataset.date;
            const hourIndex = Array.from(dayColumn.children).indexOf(slot);
            
            // Update task
            const [jy, jm, jd] = newDateKey.split('-').map(Number);
            const gDate = jalaliToGregorian(jy, jm, jd);
            const newDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd, hourIndex, 0, 0);
            
            try {
                await api(`tasks/${draggedTask.id}`, 'PUT', { dueDate: newDate.toISOString() });
                toast('کار جابجا شد', 'success');
                await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
                renderWeekView();
            } catch (err) {
                toast('خطا: ' + err.message, 'error');
            }
        };
    });
}

function renderCurrentTimeIndicator() {
    const bodyEl = document.getElementById('weekBody');
    if (!bodyEl) return;
    
    // Remove existing
    bodyEl.querySelectorAll('.current-time-line').forEach(el => el.remove());
    
    const now = new Date();
    const todayJ = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayDateKey = `${todayJ.jy}-${String(todayJ.jm).padStart(2, '0')}-${String(todayJ.jd).padStart(2, '0')}`;
    
    const todayColumn = bodyEl.querySelector(`.week-day-column[data-date="${todayDateKey}"]`);
    if (!todayColumn) return;
    
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const top = minutesSinceMidnight;
    
    const line = document.createElement('div');
    line.className = 'current-time-line';
    line.style.top = `${top}px`;
    
    todayColumn.appendChild(line);
}

// Quick add task for specific date/time
function quickAddTaskForDateTime(dateKey, hour) {
    const [jy, jm, jd] = dateKey.split('-').map(Number);
    const gDate = jalaliToGregorian(jy, jm, jd);
    const date = new Date(gDate.gy, gDate.gm - 1, gDate.gd, hour, 0, 0);
    
    openModal('tasks');
    
    setTimeout(() => {
        const dateInput = document.querySelector('[name="dueDate"]');
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.name = 'dueTime';
        timeInput.className = 'form-input';
        timeInput.value = `${String(hour).padStart(2, '0')}:00`;
        
        if (dateInput) {
            dateInput.value = date.toISOString().split('T')[0];
            
            // Add time field after date field
            const timeFieldDiv = document.createElement('div');
            timeFieldDiv.className = 'form-field';
            timeFieldDiv.innerHTML = `
                <label class="form-label">ساعت</label>
            `;
            timeFieldDiv.appendChild(timeInput);
            dateInput.parentElement.parentElement.appendChild(timeFieldDiv);
        }
    }, 50);
}

// ===== ENHANCED MONTH CALENDAR WITH HOLIDAYS =====
const originalRenderCalendar = window.renderCalendar;
window.renderCalendar = function() {
    const weekdaysEl = document.getElementById('calendarWeekdays');
    const bodyEl = document.getElementById('calendarBody');
    const titleEl = document.getElementById('calendarTitle');
    
    if (!weekdaysEl || !bodyEl) return;
    
    // Render weekdays
    weekdaysEl.innerHTML = persianWeekdays.map((d, i) => 
        `<div class="calendar-weekday ${i === 6 ? 'weekend' : ''}">${d}</div>`
    ).join('');
    
    // Get current Jalali date
    const todayJ = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    const viewJ = gregorianToJalali(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, currentCalendarDate.getDate());
    
    // Set title
    titleEl.textContent = `${persianMonths[viewJ.jm - 1]} ${toPersianDigits(viewJ.jy)}`;
    
    const monthLength = jalaliMonthLength(viewJ.jy, viewJ.jm);
    const firstDayG = jalaliToGregorian(viewJ.jy, viewJ.jm, 1);
    const firstDayDate = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd);
    
    let startDayOfWeek = firstDayDate.getDay();
    let persianOffset = (startDayOfWeek + 1) % 7;
    
    const prevMonthLength = jalaliMonthLength(viewJ.jy, viewJ.jm === 1 ? 12 : viewJ.jm - 1);
    
    // Build tasks by date map
    const tasks = currentData.tasks;
    const tasksByDate = {};
    tasks.forEach(task => {
        if (task.dueDate) {
            const d = new Date(task.dueDate);
            const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
            const dateKey = `${jDate.jy}-${String(jDate.jm).padStart(2, '0')}-${String(jDate.jd).padStart(2, '0')}`;
            if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
            tasksByDate[dateKey].push(task);
        }
    });
    
    // Build calendar grid
    let html = '';
    let dayCounter = 1;
    let nextMonthDay = 1;
    
    let monthTaskCount = 0;
    let highCount = 0, mediumCount = 0, lowCount = 0;
    
    for (let i = 0; i < 42; i++) {
        let dayNum, isOtherMonth = false, isToday = false, dateKey, jy, jm, jd;
        
        if (i < persianOffset) {
            dayNum = prevMonthLength - persianOffset + i + 1;
            isOtherMonth = true;
            const pm = viewJ.jm === 1 ? 12 : viewJ.jm - 1;
            const py = viewJ.jm === 1 ? viewJ.jy - 1 : viewJ.jy;
            jy = py; jm = pm; jd = dayNum;
        } else if (dayCounter <= monthLength) {
            dayNum = dayCounter;
            jy = viewJ.jy; jm = viewJ.jm; jd = dayCounter;
            isToday = (jy === todayJ.jy && jm === todayJ.jm && jd === todayJ.jd);
            dayCounter++;
        } else {
            dayNum = nextMonthDay;
            isOtherMonth = true;
            const nm = viewJ.jm === 12 ? 1 : viewJ.jm + 1;
            const ny = viewJ.jm === 12 ? viewJ.jy + 1 : viewJ.jy;
            jy = ny; jm = nm; jd = dayNum;
            nextMonthDay++;
        }
        
        dateKey = `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
        const dayTasks = tasksByDate[dateKey] || [];
        const isWeekend = (i % 7) === 6;
        const hasTasks = dayTasks.length > 0;
        
        // Check holiday
        const holiday = (typeof isHoliday === 'function') ? isHoliday(jy, jm, jd) : null;
        const isHolidayDay = holiday !== null && holiday !== undefined;
        
        if (!isOtherMonth) {
            monthTaskCount += dayTasks.length;
            dayTasks.forEach(t => {
                if (t.priority === 'high') highCount++;
                else if (t.priority === 'medium') mediumCount++;
                else lowCount++;
            });
        }
        
        const isSelected = selectedCalendarDay === dateKey;
        
        html += `
            <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${hasTasks ? 'has-tasks' : ''} ${isHolidayDay ? 'holiday' : ''}" 
                 onclick="selectCalendarDay('${dateKey}')"
                 data-date="${dateKey}"
                 ondragover="event.preventDefault(); this.classList.add('drag-over');"
                 ondragleave="this.classList.remove('drag-over');"
                 ondrop="handleCalendarDrop(event, '${dateKey}'); this.classList.remove('drag-over');">
                <div class="day-number">${toPersianDigits(dayNum)}</div>
                ${isHolidayDay ? `<div class="holiday-badge" title="${holiday.title}">🎉</div>` : ''}
                <div class="day-tasks">
                    ${dayTasks.slice(0, 2).map(t => `
                        <div class="day-task priority-${t.priority || 'low'} ${t.status === 'done' ? 'status-done' : ''}" 
                             draggable="true"
                             ondragstart="startDragTask(event, '${t.id}')"
                             onclick="event.stopPropagation(); openTaskDetail('${t.id}')">
                            ${t.title}
                        </div>
                    `).join('')}
                    ${dayTasks.length > 2 ? `<div class="day-more">+${toPersianDigits(dayTasks.length - 2)} مورد</div>` : ''}
                </div>
                ${!isOtherMonth ? `<button class="quick-add-btn" onclick="event.stopPropagation(); quickAddForDate('${dateKey}')">+</button>` : ''}
            </div>
        `;
    }
    
    bodyEl.innerHTML = html;
    
    // Update stats
    if (document.getElementById('statHighPriority')) {
        document.getElementById('statHighPriority').textContent = toPersianDigits(highCount);
        document.getElementById('statMediumPriority').textContent = toPersianDigits(mediumCount);
        document.getElementById('statLowPriority').textContent = toPersianDigits(lowCount);
        document.getElementById('calendarTaskCount').textContent = `${toPersianDigits(monthTaskCount)} کار در این ماه`;
    }
    
    // Add holidays count
    const monthHolidays = (typeof getHolidaysForMonth === 'function') ? getHolidaysForMonth(viewJ.jy, viewJ.jm) : [];
    if (monthHolidays.length > 0) {
        const statsContainer = document.querySelector('.calendar-stats');
        if (statsContainer) {
            // Add holidays indicator if not already there
            const existingHolidayStat = statsContainer.querySelector('.holiday-stat');
            if (!existingHolidayStat) {
                const holidayStat = document.createElement('div');
                holidayStat.className = 'calendar-stat holiday-stat';
                holidayStat.innerHTML = `
                    <div class="calendar-stat-dot" style="background:var(--danger);"></div>
                    <span>${toPersianDigits(monthHolidays.length)}</span> تعطیلات
                `;
                statsContainer.appendChild(holidayStat);
            }
        }
    }
    
    if (selectedCalendarDay) {
        renderDayDetail(selectedCalendarDay);
    }
};

// Quick add for a date
function quickAddForDate(dateKey) {
    const [jy, jm, jd] = dateKey.split('-').map(Number);
    const gDate = jalaliToGregorian(jy, jm, jd);
    const dateValue = `${gDate.gy}-${String(gDate.gm).padStart(2, '0')}-${String(gDate.gd).padStart(2, '0')}`;
    
    openModal('tasks');
    
    setTimeout(() => {
        const dateInput = document.querySelector('[name="dueDate"]');
        if (dateInput) dateInput.value = dateValue;
    }, 50);
}

// Drag and drop on calendar
function startDragTask(event, taskId) {
    draggedTask = currentData.tasks.find(t => t.id === taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
}

async function handleCalendarDrop(event, targetDateKey) {
    event.preventDefault();
    
    if (!draggedTask) return;
    
    const [jy, jm, jd] = targetDateKey.split('-').map(Number);
    const gDate = jalaliToGregorian(jy, jm, jd);
    const newDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd, 9, 0, 0);
    
    try {
        await api(`tasks/${draggedTask.id}`, 'PUT', { dueDate: newDate.toISOString() });
        toast('✅ کار جابجا شد', 'success');
        draggedTask = null;
        await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
        renderCalendar();
    } catch (err) {
        toast('خطا: ' + err.message, 'error');
    }
}

// Inject week view icon
const originalInjectTaskViewIcons = window.injectTaskViewIcons;
window.injectTaskViewIcons = function() {
    if (originalInjectTaskViewIcons) originalInjectTaskViewIcons();
    
    const weekIcon = document.getElementById('weekViewIcon');
    if (typeof icon === 'function' && weekIcon) {
        weekIcon.innerHTML = icon('calendar', 14);
    }
};

// Refresh icons after adding new ones
setTimeout(() => {
    if (typeof injectTaskViewIcons === 'function') injectTaskViewIcons();
}, 300);

// Update current time line every minute
setInterval(() => {
    if (currentTaskView === 'week') {
        renderCurrentTimeIndicator();
    }
}, 60000);

// ===== NOTIFICATION SYSTEM =====
let notificationInterval = null;
let currentNotifications = [];

// Initialize notification system
function initNotifications() {
    // Request permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Check for notifications every 30 seconds
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(checkNotifications, 30000);
    
    // Initial check
    setTimeout(checkNotifications, 2000);
    
    // Inject bell icon
    setTimeout(() => {
        const bellBtn = document.getElementById('notificationBtn');
        if (bellBtn && typeof icon === 'function') {
            const span = bellBtn.querySelector('span');
            if (span && !span.innerHTML) span.innerHTML = icon('bell', 16);
        }
    }, 300);
}

async function checkNotifications() {
    try {
        const response = await fetch(`${API}/api/notifications?minutes=5`);
        const reminders = await response.json();
        
        currentNotifications = reminders || [];
        
        // Update badge
        const badge = document.getElementById('notifBadge');
        if (badge) {
            if (currentNotifications.length > 0) {
                badge.textContent = currentNotifications.length;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Show browser notifications for new reminders
        currentNotifications.forEach(async (notif) => {
            if (!notif._shown) {
                showBrowserNotification(notif);
                notif._shown = true;
                
                // Mark as notified
                await fetch(`${API}/api/notifications`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId: notif.id })
                });
            }
        });
        
        // Update dropdown if open
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            renderNotificationDropdown();
        }
    } catch (err) {
        console.error('Error checking notifications:', err);
    }
}

function showBrowserNotification(notif) {
    // In-app toast
    showInAppToast(notif);
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(notif.title, {
            body: notif.message || '',
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-192.svg',
            tag: notif.id,
            requireInteraction: false
        });
        
        notification.onclick = () => {
            window.focus();
            switchView('tasks');
            notification.close();
        };
        
        // Auto-close after 8 seconds
        setTimeout(() => notification.close(), 8000);
    }
    
    // Play sound (optional)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQQBAACAhIqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAgMEBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJT');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore autoplay errors
    } catch {}
}

function showInAppToast(notif) {
    const toast = document.createElement('div');
    toast.className = `browser-toast ${notif.type}`;
    toast.innerHTML = `
        <div class="browser-toast-icon">${notif.type === 'overdue' ? '⚠️' : '⏰'}</div>
        <div class="browser-toast-content">
            <div class="browser-toast-title">${notif.title}</div>
            <div class="browser-toast-message">${notif.message || ''}</div>
        </div>
        <button class="browser-toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;
    
    dropdown.classList.toggle('active');
    
    if (dropdown.classList.contains('active')) {
        renderNotificationDropdown();
        
        // Close on outside click
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!e.target.closest('#notifDropdown') && !e.target.closest('#notificationBtn')) {
                    dropdown.classList.remove('active');
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);
    }
}

function renderNotificationDropdown() {
    const list = document.getElementById('notifList');
    if (!list) return;
    
    if (currentNotifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <div class="notification-empty-icon">🔔</div>
                <div>اعلانی وجود ندارد</div>
            </div>
        `;
        return;
    }
    
    list.innerHTML = currentNotifications.map(notif => {
        const icon = notif.type === 'overdue' ? '⚠️' : '⏰';
        const iconClass = notif.type;
        const timeStr = notif.reminderAt 
            ? new Date(notif.reminderAt).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            : '';
        
        return `
            <div class="notification-item" onclick="handleNotificationClick('${notif.id}')">
                <div class="notification-item-icon ${iconClass}">${icon}</div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${notif.title}</div>
                    <div class="notification-item-message">${notif.message || ''}</div>
                    <div class="notification-item-meta">
                        ${timeStr ? `<span>⏰ ${timeStr}</span>` : ''}
                        <span class="pill ${notif.priority === 'high' ? 'danger' : notif.priority === 'medium' ? 'warning' : 'success'}">
                            ${notif.priority === 'high' ? 'بالا' : notif.priority === 'medium' ? 'متوسط' : 'کم'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function handleNotificationClick(taskId) {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    // Switch to tasks view
    switchView('tasks');
    
    // Try to find and open the task
    const task = currentData.tasks.find(t => t.id === taskId);
    if (task && typeof openEditTaskModal === 'function') {
        setTimeout(() => openEditTaskModal(task), 300);
    }
}

function clearAllNotifications() {
    currentNotifications = [];
    renderNotificationDropdown();
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
}

// ===== ENHANCED TASK MODAL WITH REMINDER =====
const originalOpenModal = window.openModal;
window.openModal = function(type) {
    originalOpenModal(type);
    
    if (type === 'tasks') {
        setTimeout(() => {
            const modalBody = document.getElementById('modalBody');
            if (!modalBody) return;
            
            // Add reminder section
            const reminderSection = document.createElement('div');
            reminderSection.className = 'reminder-section';
            reminderSection.innerHTML = `
                <div class="reminder-section-title">⏰ یادآوری</div>
                <div class="form-field">
                    <label class="form-label">یادآوری قبل از موعد</label>
                    <div class="reminder-options">
                        <div class="reminder-option" onclick="setReminder(this, '5')">5 دقیقه</div>
                        <div class="reminder-option" onclick="setReminder(this, '15')">15 دقیقه</div>
                        <div class="reminder-option" onclick="setReminder(this, '30')">30 دقیقه</div>
                        <div class="reminder-option" onclick="setReminder(this, '60')">1 ساعت</div>
                        <div class="reminder-option" onclick="setReminder(this, '1440')">1 روز</div>
                        <div class="reminder-option" onclick="setReminder(this, '')">بدون</div>
                    </div>
                    <input type="hidden" name="reminderMinutes" value="" />
                </div>
                
                <div class="reminder-section-title" style="margin-top:12px;">🔁 تکرار</div>
                <div class="form-field">
                    <label class="form-label">تکرار به صورت</label>
                    <select class="form-select" name="recurring">
                        <option value="none">بدون تکرار</option>
                        <option value="daily">روزانه</option>
                        <option value="weekly">هفتگی</option>
                        <option value="monthly">ماهانه</option>
                        <option value="yearly">سالانه</option>
                    </select>
                </div>
            `;
            
            modalBody.appendChild(reminderSection);
        }, 100);
    }
};

function setReminder(el, minutes) {
    document.querySelectorAll('.reminder-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    const input = document.querySelector('[name="reminderMinutes"]');
    if (input) input.value = minutes;
}

// Override submitModal to handle reminder
const originalSubmitModal = window.submitModal;
window.submitModal = async function() {
    if (!currentModalType) return;
    const cfg = modalForms[currentModalType];
    const body = document.getElementById('modalBody');
    const data = {};
    
    cfg.fields.forEach(f => {
        const input = body.querySelector(`[name="${f.name}"]`);
        if (input) data[f.name] = input.value;
    });
    
    // Get reminder and recurring data
    const reminderMinutes = body.querySelector('[name="reminderMinutes"]');
    const recurring = body.querySelector('[name="recurring"]');
    
    if (reminderMinutes && reminderMinutes.value && data.dueDate) {
        const dueDate = new Date(data.dueDate);
        const reminderTime = new Date(dueDate.getTime() - parseInt(reminderMinutes.value) * 60000);
        data.reminderAt = reminderTime.toISOString();
    } else {
        data.reminderAt = '';
    }
    
    data.recurring = recurring ? recurring.value : 'none';
    
    for (const f of cfg.fields) {
        if (f.required && !data[f.name]) {
            toast(`فیلد "${f.label}" الزامی است`, 'error');
            return;
        }
    }
    
    try {
        await cfg.submit(data);
        closeModal();
        await try { loadAllData(); } catch(e) { console.warn('loadAllData error:', e); }
        
        // Process recurring tasks
        if (currentModalType === 'tasks') {
            await fetch(`${API}/api/recurring/process`, { method: 'POST' });
        }
    } catch (err) {
        toast('خطا در ذخیره: ' + err.message, 'error');
    }
};

// Enhance renderKanban to show overdue and recurring badges
const originalRenderKanban = window.renderKanban;
window.renderKanban = function() {
    if (originalRenderKanban) originalRenderKanban();
    
    // Add badges to kanban cards
    setTimeout(() => {
        const now = new Date();
        document.querySelectorAll('.kanban-card').forEach(card => {
            const titleEl = card.querySelector('.kanban-card-title');
            if (!titleEl) return;
            
            // Find the task
            const taskId = card.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (!taskId) return;
            
            const task = currentData.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            // Add recurring badge
            if (task.recurring && task.recurring !== 'none') {
                const recurLabels = { daily: 'روزانه', weekly: 'هفتگی', monthly: 'ماهانه', yearly: 'سالانه' };
                const badge = `<span class="recurring-badge">🔁 ${recurLabels[task.recurring] || task.recurring}</span>`;
                if (!titleEl.innerHTML.includes('recurring-badge')) {
                    titleEl.innerHTML = badge + ' ' + titleEl.innerHTML;
                }
            }
            
            // Mark overdue
            if (task.dueDate && task.status !== 'done') {
                const dueDate = new Date(task.dueDate);
                if (dueDate < now) {
                    card.classList.add('overdue');
                    const metaEl = card.querySelector('.kanban-card-meta');
                    if (metaEl && !metaEl.innerHTML.includes('overdue-indicator')) {
                        metaEl.innerHTML = `<span class="overdue-indicator">⚠️ عقب‌افتاده</span>` + metaEl.innerHTML;
                    }
                }
            }
        });
    }, 100);
};

// Initialize notifications when DOM is ready
setTimeout(initNotifications, 500);

// ===== REPORTS SYSTEM =====
let currentReportType = 'overview';

function selectReportType(type) {
    currentReportType = type;
    
    document.querySelectorAll('.report-type-item').forEach(item => {
        item.classList.toggle('active', item.dataset.type === type);
    });
    
    generateReport();
}

function getDateRange(range) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = null;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    switch (range) {
        case 'today':
            start = today;
            break;
        case 'week':
            start = new Date(today);
            const dayOfWeek = start.getDay();
            const persianDay = (dayOfWeek + 1) % 7; // Saturday = 0
            start.setDate(start.getDate() - persianDay);
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            return null;
    }
    
    return { start, end };
}

function isInRange(dateStr, range) {
    if (!range) return true;
    if (!dateStr) return false;
    
    try {
        const date = new Date(dateStr);
        return date >= range.start && date <= range.end;
    } catch {
        return false;
    }
}

function generateReport() {
    const preview = document.getElementById('reportPreview');
    const printActions = document.getElementById('printActions');
    const dateRange = document.getElementById('reportDateRange').value;
    const range = getDateRange(dateRange);
    
    if (!preview) return;
    
    preview.innerHTML = `
        <div class="print-loading">
            <div class="print-loading-spinner"></div>
            <div>در حال تولید گزارش...</div>
        </div>
    `;
    
    setTimeout(() => {
        let html = '';
        const rangeLabel = {
            'all': 'همه زمان‌ها',
            'today': 'امروز',
            'week': 'این هفته',
            'month': 'این ماه',
            'year': 'امسال'
        }[dateRange];
        
        switch (currentReportType) {
            case 'overview':
                html = generateOverviewReport(range, rangeLabel);
                break;
            case 'tasks':
                html = generateTasksReport(range, rangeLabel);
                break;
            case 'people':
                html = generatePeopleReport(range, rangeLabel);
                break;
            case 'overdue':
                html = generateOverdueReport();
                break;
            case 'activity':
                html = generateActivityReport(range, rangeLabel);
                break;
            case 'weekly':
                html = generateWeeklyReport();
                break;
        }
        
        preview.innerHTML = html;
        if (printActions) printActions.style.display = 'flex';
    }, 300);
}

function getReportHeader(title, subtitle) {
    const now = new Date();
    const jDate = typeof gregorianToJalali === 'function' 
        ? gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
        : null;
    
    const dateStr = jDate 
        ? `${toPersianDigits(jDate.jd)} ${persianMonths[jDate.jm - 1]} ${toPersianDigits(jDate.jy)}`
        : now.toLocaleDateString('fa-IR');
    
    const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div class="print-area">
            <div class="print-container">
                <div class="print-header">
                    <div class="print-brand">
                        <div class="print-logo">C</div>
                        <div class="print-brand-text">
                            <h1>CRM Pro</h1>
                            <p>سیستم مدیریت ارتباط با مشتری</p>
                        </div>
                    </div>
                    <div class="print-meta">
                        <div>📅 تاریخ: ${dateStr}</div>
                        <div>⏰ ساعت: ${timeStr}</div>
                    </div>
                </div>
                <h2 class="print-title">${title}</h2>
                <p class="print-subtitle">${subtitle}</p>
    `;
}

function getReportFooter() {
    return `
                <div class="print-footer">
                    <div>CRM Pro - نسخه 1.0</div>
                    <div>این گزارش به صورت خودکار تولید شده است</div>
                </div>
            </div>
        </div>
    `;
}

function generateOverviewReport(range, rangeLabel) {
    const data = currentData;
    const toPD = typeof toPersianDigits === 'function' ? toPersianDigits : (n) => n;
    
    const totalPeople = data.people.length;
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter(t => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalIdeas = data.ideas.length;
    const totalProjects = data.projects.length;
    
    const pendingTasks = data.tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = data.tasks.filter(t => t.status === 'in-progress').length;
    const reviewTasks = data.tasks.filter(t => t.status === 'review').length;
    
    return getReportHeader('گزارش کلی', `خلاصه وضعیت سیستم - ${rangeLabel}`) + `
        <div class="print-section">
            <div class="print-section-title">📊 آمار کلی</div>
            <div class="print-stats">
                <div class="print-stat accent">
                    <div class="print-stat-value">${toPD(totalPeople)}</div>
                    <div class="print-stat-label">مخاطبان</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value">${toPD(totalTasks)}</div>
                    <div class="print-stat-label">کارها</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value">${toPD(completedTasks)}</div>
                    <div class="print-stat-label">کارهای تکمیل شده</div>
                </div>
                <div class="print-stat accent">
                    <div class="print-stat-value">${toPD(completionRate)}%</div>
                    <div class="print-stat-label">نرخ تکمیل</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value">${toPD(totalIdeas)}</div>
                    <div class="print-stat-label">ایده‌ها</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value">${toPD(totalProjects)}</div>
                    <div class="print-stat-label">پروژه‌ها</div>
                </div>
            </div>
        </div>
        
        <div class="print-section">
            <div class="print-section-title">✅ وضعیت کارها</div>
            <div class="print-chart">
                <div class="print-chart-title">توزیع وضعیت کارها</div>
                <div class="print-bars">
                    <div class="print-bar-item">
                        <div class="print-bar" style="height: ${totalTasks ? (pendingTasks/totalTasks)*120 : 0}px; background: linear-gradient(to top, #71717a, #a1a1aa);">
                            <span class="print-bar-value">${toPD(pendingTasks)}</span>
                        </div>
                        <div class="print-bar-label">در انتظار</div>
                    </div>
                    <div class="print-bar-item">
                        <div class="print-bar" style="height: ${totalTasks ? (inProgressTasks/totalTasks)*120 : 0}px; background: linear-gradient(to top, #3b82f6, #60a5fa);">
                            <span class="print-bar-value">${toPD(inProgressTasks)}</span>
                        </div>
                        <div class="print-bar-label">در حال انجام</div>
                    </div>
                    <div class="print-bar-item">
                        <div class="print-bar" style="height: ${totalTasks ? (reviewTasks/totalTasks)*120 : 0}px; background: linear-gradient(to top, #f59e0b, #fbbf24);">
                            <span class="print-bar-value">${toPD(reviewTasks)}</span>
                        </div>
                        <div class="print-bar-label">بازبینی</div>
                    </div>
                    <div class="print-bar-item">
                        <div class="print-bar" style="height: ${totalTasks ? (completedTasks/totalTasks)*120 : 0}px; background: linear-gradient(to top, #10b981, #34d399);">
                            <span class="print-bar-value">${toPD(completedTasks)}</span>
                        </div>
                        <div class="print-bar-label">انجام شده</div>
                    </div>
                </div>
            </div>
        </div>
    ` + getReportFooter();
}

function generateTasksReport(range, rangeLabel) {
    const tasks = currentData.tasks;
    const toPD = typeof toPersianDigits === 'function' ? toPersianDigits : (n) => n;
    
    const filteredTasks = tasks.filter(t => {
        if (!range) return true;
        return isInRange(t.createdAtUtc, range) || isInRange(t.dueDate, range);
    });
    
    const completed = filteredTasks.filter(t => t.status === 'done').length;
    const overdue = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    
    let html = getReportHeader('گزارش کارها', `${toPD(filteredTasks.length)} کار در بازه ${rangeLabel}`) + `
        <div class="print-section">
            <div class="print-stats">
                <div class="print-stat accent">
                    <div class="print-stat-value">${toPD(filteredTasks.length)}</div>
                    <div class="print-stat-label">مجموع کارها</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value" style="color:#10b981;">${toPD(completed)}</div>
                    <div class="print-stat-label">تکمیل شده</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value" style="color:#ef4444;">${toPD(overdue)}</div>
                    <div class="print-stat-label">عقب‌افتاده</div>
                </div>
            </div>
        </div>
        
        <div class="print-section">
            <div class="print-section-title">📋 لیست کارها</div>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>عنوان</th>
                        <th>وضعیت</th>
                        <th>اولویت</th>
                        <th>تاریخ سررسید</th>
                        <th>تکرار</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (filteredTasks.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center; padding:30px; color:#a1a1aa;">کاری یافت نشد</td></tr>';
    } else {
        filteredTasks.forEach(t => {
            const statusLabel = { pending: 'در انتظار', 'in-progress': 'در حال انجام', review: 'بازبینی', done: 'انجام شده' }[t.status] || t.status;
            const statusClass = { pending: 'neutral', 'in-progress': 'info', review: 'warning', done: 'success' }[t.status] || 'neutral';
            const priorityLabel = { low: 'کم', medium: 'متوسط', high: 'بالا' }[t.priority] || 'متوسط';
            const priorityClass = { low: 'success', medium: 'warning', high: 'danger' }[t.priority] || 'neutral';
            const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString('fa-IR') : '-';
            const recurring = { none: '-', daily: 'روزانه', weekly: 'هفتگی', monthly: 'ماهانه', yearly: 'سالانه' }[t.recurring] || '-';
            
            html += `
                <tr>
                    <td><strong>${t.title}</strong></td>
                    <td><span class="print-badge ${statusClass}">${statusLabel}</span></td>
                    <td><span class="print-badge ${priorityClass}">${priorityLabel}</span></td>
                    <td>${dueDate}</td>
                    <td>${recurring}</td>
                </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </div>
    ` + getReportFooter();
    
    return html;
}

function generatePeopleReport(range, rangeLabel) {
    const people = currentData.people;
    const toPD = typeof toPersianDigits === 'function' ? toPersianDigits : (n) => n;
    
    const filteredPeople = people.filter(p => {
        if (!range) return true;
        return isInRange(p.createdAtUtc, range);
    });
    
    let html = getReportHeader('گزارش مخاطبان', `${toPD(filteredPeople.length)} مخاطب`) + `
        <div class="print-section">
            <div class="print-section-title">👥 لیست مخاطبان</div>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>نام</th>
                        <th>ایمیل</th>
                        <th>تلفن</th>
                        <th>شرکت</th>
                        <th>تاریخ ثبت</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (filteredPeople.length === 0) {
        html += '<tr><td colspan="5" style="text-align:center; padding:30px; color:#a1a1aa;">مخاطبی یافت نشد</td></tr>';
    } else {
        filteredPeople.forEach(p => {
            const date = new Date(p.createdAtUtc).toLocaleDateString('fa-IR');
            html += `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.email || '-'}</td>
                    <td>${p.phone || '-'}</td>
                    <td>${p.company || '-'}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </div>
    ` + getReportFooter();
    
    return html;
}

function generateOverdueReport() {
    const tasks = currentData.tasks;
    const toPD = typeof toPersianDigits === 'function' ? toPersianDigits : (n) => n;
    const now = new Date();
    
    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        return new Date(t.dueDate) < now;
    });
    
    let html = getReportHeader('گزارش کارهای عقب‌افتاده', `${toPD(overdueTasks.length)} کار نیاز به پیگیری دارد`) + `
        <div class="print-section">
            <div class="print-stats">
                <div class="print-stat">
                    <div class="print-stat-value" style="color:#ef4444;">${toPD(overdueTasks.length)}</div>
                    <div class="print-stat-label">کل کارهای عقب‌افتاده</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value" style="color:#ef4444;">${toPD(overdueTasks.filter(t => t.priority === 'high').length)}</div>
                    <div class="print-stat-label">اولویت بالا</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value" style="color:#f59e0b;">${toPD(overdueTasks.filter(t => t.priority === 'medium').length)}</div>
                    <div class="print-stat-label">اولویت متوسط</div>
                </div>
            </div>
        </div>
        
        <div class="print-section">
            <div class="print-section-title">⚠️ لیست کارهای عقب‌افتاده</div>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>عنوان</th>
                        <th>اولویت</th>
                        <th>تاریخ سررسید</th>
                        <th>روزهای تأخیر</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (overdueTasks.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center; padding:30px; color:#10b981;">✅ همه کارها به موقع هستند!</td></tr>';
    } else {
        overdueTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).forEach(t => {
            const dueDate = new Date(t.dueDate);
            const daysLate = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
            const priorityLabel = { low: 'کم', medium: 'متوسط', high: 'بالا' }[t.priority] || 'متوسط';
            const priorityClass = { low: 'success', medium: 'warning', high: 'danger' }[t.priority] || 'neutral';
            
            html += `
                <tr>
                    <td><strong>${t.title}</strong></td>
                    <td><span class="print-badge ${priorityClass}">${priorityLabel}</span></td>
                    <td>${dueDate.toLocaleDateString('fa-IR')}</td>
                    <td><span class="print-badge danger">${toPD(daysLate)} روز</span></td>
                </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </div>
    ` + getReportFooter();
    
    return html;
}

function generateActivityReport(range, rangeLabel) {
    const logs = currentData.logs;
    const toPD = typeof toPersianDigits === 'function' ? toPersianDigits : (n) => n;
    
    const filteredLogs = logs.filter(l => {
        if (!range) return true;
        return isInRange(l.createdAtUtc, range);
    }).slice(-50);
    
    let html = getReportHeader('گزارش فعالیت‌ها', `${toPD(filteredLogs.length)} فعالیت اخیر`) + `
        <div class="print-section">
            <div class="print-section-title">📝 لیست فعالیت‌ها</div>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>نوع</th>
                        <th>اقدام</th>
                        <th>جزئیات</th>
                        <th>تاریخ</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (filteredLogs.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center; padding:30px; color:#a1a1aa;">فعالیتی یافت نشد</td></tr>';
    } else {
        const typeLabels = { person: 'مخاطب', task: 'کار', idea: 'ایده', note: 'یادداشت', project: 'پروژه' };
        const actionLabels = { create: 'ایجاد', update: 'ویرایش', delete: 'حذف' };
        
        filteredLogs.slice().reverse().forEach(l => {
            const date = new Date(l.createdAtUtc).toLocaleString('fa-IR');
            const typeLabel = typeLabels[l.entityType] || l.entityType;
            const actionLabel = actionLabels[l.action] || l.action;
            
            html += `
                <tr>
                    <td>${typeLabel}</td>
                    <td><span class="print-badge info">${actionLabel}</span></td>
                    <td>${l.details}</td>
                    <td style="font-size:11px; color:#71717a;">${date}</td>
                </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </div>
    ` + getReportFooter();
    
    return html;
}

function generateWeeklyReport() {
    const now = new Date();
    const toPD = typeof toPersianDigits === 'function' ? toPersianDigits : (n) => n;
    
    // Get this week (Saturday to Friday)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const persianDay = (dayOfWeek + 1) % 7;
    weekStart.setDate(weekStart.getDate() - persianDay);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekRange = { start: weekStart, end: weekEnd };
    
    const tasks = currentData.tasks;
    const logs = currentData.logs;
    
    const weekTasks = tasks.filter(t => 
        isInRange(t.dueDate, weekRange) || isInRange(t.createdAtUtc, weekRange)
    );
    
    const completedThisWeek = weekTasks.filter(t => 
        t.status === 'done' && isInRange(t.updatedAtUtc, weekRange)
    ).length;
    
    const weekActivities = logs.filter(l => isInRange(l.createdAtUtc, weekRange)).length;
    
    // Get Jalali dates
    const startJ = typeof gregorianToJalali === 'function' 
        ? gregorianToJalali(weekStart.getFullYear(), weekStart.getMonth() + 1, weekStart.getDate())
        : null;
    const endJ = typeof gregorianToJalali === 'function'
        ? gregorianToJalali(weekEnd.getFullYear(), weekEnd.getMonth() + 1, weekEnd.getDate())
        : null;
    
    const weekLabel = startJ && endJ
        ? `${toPD(startJ.jd)} ${persianMonths[startJ.jm - 1]} تا ${toPD(endJ.jd)} ${persianMonths[endJ.jm - 1]}`
        : weekStart.toLocaleDateString('fa-IR') + ' تا ' + weekEnd.toLocaleDateString('fa-IR');
    
    // Daily stats
    const dailyStats = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        const count = logs.filter(l => {
            const t = new Date(l.createdAtUtc);
            return t >= dayStart && t <= dayEnd;
        }).length;
        
        const jDay = typeof gregorianToJalali === 'function'
            ? gregorianToJalali(day.getFullYear(), day.getMonth() + 1, day.getDate())
            : null;
        const dayName = jDay ? persianWeekdays[(day.getDay() + 1) % 7] : '';
        
        dailyStats.push({ label: dayName, value: count });
    }
    
    const maxDaily = Math.max(...dailyStats.map(d => d.value), 1);
    
    let html = getReportHeader('گزارش هفتگی', `عملکرد هفته ${weekLabel}`) + `
        <div class="print-section">
            <div class="print-stats">
                <div class="print-stat accent">
                    <div class="print-stat-value">${toPD(weekTasks.length)}</div>
                    <div class="print-stat-label">کارهای این هفته</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value" style="color:#10b981;">${toPD(completedThisWeek)}</div>
                    <div class="print-stat-label">تکمیل شده</div>
                </div>
                <div class="print-stat">
                    <div class="print-stat-value">${toPD(weekActivities)}</div>
                    <div class="print-stat-label">فعالیت‌ها</div>
                </div>
            </div>
        </div>
        
        <div class="print-section">
            <div class="print-section-title">📊 فعالیت روزانه این هفته</div>
            <div class="print-chart">
                <div class="print-bars">
                    ${dailyStats.map(d => `
                        <div class="print-bar-item">
                            <div class="print-bar" style="height: ${(d.value/maxDaily)*120}px;">
                                <span class="print-bar-value">${toPD(d.value)}</span>
                            </div>
                            <div class="print-bar-label">${d.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <div class="print-section">
            <div class="print-section-title">📋 کارهای این هفته</div>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>عنوان</th>
                        <th>وضعیت</th>
                        <th>اولویت</th>
                        <th>تاریخ سررسید</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (weekTasks.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center; padding:30px; color:#a1a1aa;">کاری برای این هفته نیست</td></tr>';
    } else {
        weekTasks.forEach(t => {
            const statusLabel = { pending: 'در انتظار', 'in-progress': 'در حال انجام', review: 'بازبینی', done: 'انجام شده' }[t.status] || t.status;
            const statusClass = { pending: 'neutral', 'in-progress': 'info', review: 'warning', done: 'success' }[t.status] || 'neutral';
            const priorityLabel = { low: 'کم', medium: 'متوسط', high: 'بالا' }[t.priority] || 'متوسط';
            const priorityClass = { low: 'success', medium: 'warning', high: 'danger' }[t.priority] || 'neutral';
            const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString('fa-IR') : '-';
            
            html += `
                <tr>
                    <td><strong>${t.title}</strong></td>
                    <td><span class="print-badge ${statusClass}">${statusLabel}</span></td>
                    <td><span class="print-badge ${priorityClass}">${priorityLabel}</span></td>
                    <td>${dueDate}</td>
                </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </div>
    ` + getReportFooter();
    
    return html;
}

function printReport() {
    window.print();
}

// Inject report icons
function injectReportIcons() {
    const icons = {
        'iconOverview': 'dashboard',
        'iconTasks': 'check',
        'iconPeople': 'users',
        'iconOverdue': 'clock',
        'iconActivity': 'activity',
        'iconWeekly': 'calendar'
    };
    
    if (typeof icon !== 'function') return;
    
    Object.entries(icons).forEach(([id, iconName]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = icon(iconName, 16);
    });
}

// Auto-inject icons
setTimeout(injectReportIcons, 300);

// Auto-generate report when entering reports view
const originalSwitchViewReports = window.switchView;
window.switchView = function(view) {
    if (originalSwitchViewReports) originalSwitchViewReports(view);
    
    if (view === 'reports') {
        setTimeout(() => {
            injectReportIcons();
            selectReportType('overview');
        }, 200);
    }
};
