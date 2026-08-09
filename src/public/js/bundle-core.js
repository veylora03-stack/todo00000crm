// CRM PRO CORE BUNDLE (auto) 2026-08-10 00:11

/* === core.js === */
// ===== CORE MODULE =====
const API = window.location.origin;
let currentView = 'dashboard';
let currentData = { people: [], tasks: [], ideas: [], notes: [], projects: [], logs: [] };
let currentPanelItem = null;
let currentPanelType = null;
let taskFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    try { injectIcons(); } catch(e) { }
    try { setupNavigation(); } catch(e) { }
    try { setGreeting(); } catch(e) { }
    try { loadAllData(); } catch(e) { }
    try { setupKeyboard(); } catch(e) { }
    try { setupContextMenu(); } catch(e) { }
});

function injectIcons() {
    if (typeof icon !== 'function') return;
    const iconMap = { dashboard:'home', inbox:'inbox', people:'users', tasks:'check', projects:'rocket', ideas:'lightbulb', notes:'file', backups:'inbox', settings:'settings', reports:'dashboard' };
    document.querySelectorAll('.nav-link').forEach(link => {
        const v = link.dataset.view;
        const s = link.querySelector('.nav-icon');
        if (s && iconMap[v]) s.innerHTML = icon(iconMap[v], 16);
    });
    const si = document.querySelector('.topbar-search-btn .search-icon');
    if (si) si.innerHTML = icon('search', 14);
    document.querySelectorAll('.topbar-actions .icon-button').forEach((btn, i) => {
        const sp = btn.querySelector('span');
        if (sp) sp.innerHTML = icon(i === 0 ? 'bell' : 'settings', 16);
    });
    const cs = document.getElementById('cmdSearchIcon');
    if (cs) cs.innerHTML = icon('search', 16);
    const ii = document.getElementById('inboxIcon');
    if (ii) ii.innerHTML = icon('inbox', 24);
    document.querySelectorAll('.modal-header .icon-button span, .panel-header .icon-button span').forEach(sp => { sp.innerHTML = icon('close', 16); });
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const v = link.dataset.view;
            if (!v) return;
            switchView(v);
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function switchView(view) {
    // Lazy load modules for this view
    if (typeof lazyLoader !== 'undefined') {
        lazyLoader.loadView(view).catch(e => console.error('[Lazy]', e));
    }
    
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');
    updateBreadcrumb(view);
    if (view === 'backups' && typeof loadBackups === 'function') { loadBackups(); loadExportGrid(); }
    if (view === 'settings' && typeof setupSettingsTabs === 'function') setupSettingsTabs();
    if (view === 'reports' && typeof selectReportType === 'function') { if (typeof injectReportIcons === 'function') injectReportIcons(); selectReportType('overview'); }
}

function updateBreadcrumb(view) {
    const titles = { dashboard:'داشبورد', inbox:'Inbox', people:'مخاطبان', tasks:'کارها', projects:'پروژه‌ها', ideas:'ایده‌ها', notes:'یادداشت‌ها', backups:'پشتیبان‌ها', settings:'تنظیمات', reports:'گزارش‌ها' };
    const sep = document.getElementById('bc-sep');
    const cur = document.getElementById('bc-current');
    if (!sep || !cur) return;
    if (view === 'dashboard') { sep.style.display = 'none'; cur.style.display = 'none'; }
    else { sep.style.display = ''; if (typeof icon === 'function') sep.innerHTML = icon('chevronRight', 12); cur.style.display = ''; cur.textContent = titles[view] || view; }
}

function setGreeting() {
    const h = new Date().getHours();
    let g = 'سلام';
    if (h < 12) g = 'صبح بخیر ☀️'; else if (h < 18) g = 'ظهر بخیر 🌤'; else g = 'عصر بخیر 🌙';
    const el = document.getElementById('greeting');
    if (el) el.textContent = g;
}

async function api(endpoint, method, data) {
    method = method || 'GET';
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    const res = await fetch(API + '/api/' + endpoint, options);
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
}

async function loadAllData() {
    try {
        const r = await Promise.all([api('people'), api('tasks'), api('ideas'), api('notes'), api('projects'), api('activity_logs')]);
        currentData = {
            people: Array.isArray(r[0]) ? r[0] : [],
            tasks: Array.isArray(r[1]) ? r[1] : [],
            ideas: Array.isArray(r[2]) ? r[2] : [],
            notes: Array.isArray(r[3]) ? r[3] : [],
            projects: Array.isArray(r[4]) ? r[4] : [],
            logs: Array.isArray(r[5]) ? r[5] : []
        };
        renderAll();
    } catch (err) { toast('خطا در بارگذاری داده‌ها', 'error'); }
}

function renderAll() {
    try { renderDashboard(); } catch(e) { }
    try { renderPeople(); } catch(e) { }
    try { renderKanban(); } catch(e) { }
    try { renderIdeas(); } catch(e) { }
    try { renderNotes(); } catch(e) { }
    try { renderProjects(); } catch(e) { }
    try { updateCounts(); } catch(e) { }
}

function updateCounts() {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    set('count-people', currentData.people.length);
    set('count-tasks', currentData.tasks.length);
    set('count-ideas', currentData.ideas.length);
    set('count-notes', currentData.notes.length);
    set('count-projects', currentData.projects.length);
}

// ===== DASHBOARD =====
function renderDashboard() {
    renderStats();
    renderHeroStats();
    renderTimeline();
    renderOverview();
    renderHeatmap();
    renderActivityChart();
    renderInsights();
}

function renderStats() {
    const g = document.getElementById('statsGrid');
    if (!g) return;
    const d = currentData;
    const stats = [
        { id:'people', label:'مخاطبان', value:d.people.length, icon:'users', color:'#7c3aed' },
        { id:'tasks', label:'کارها', value:d.tasks.length, icon:'check', color:'#3b82f6' },
        { id:'ideas', label:'ایده‌ها', value:d.ideas.length, icon:'lightbulb', color:'#f59e0b' },
        { id:'projects', label:'پروژه‌ها', value:d.projects.length, icon:'rocket', color:'#10b981' }
    ];
    g.innerHTML = stats.map(s => {
        const ic = typeof icon === 'function' ? icon(s.icon, 16) : '';
        return '<div class="stat-card-v2"><div class="stat-card-top"><div class="stat-card-icon" style="background:' + s.color + '22;color:' + s.color + ';">' + ic + '</div><div class="stat-card-sparkline" id="spark_' + s.id + '"></div></div><div class="stat-card-value">' + s.value + '</div><div class="stat-card-label">' + s.label + '</div></div>';
    }).join('');
}

function renderHeroStats() {
    const el = document.getElementById('heroStats');
    if (!el) return;
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7*24*60*60*1000);
    const weekAct = currentData.logs.filter(l => new Date(l.createdAtUtc) >= weekStart).length;
    const done = currentData.tasks.filter(t => t.status === 'done').length;
    const rate = currentData.tasks.length > 0 ? Math.round((done / currentData.tasks.length) * 100) : 0;
    el.innerHTML = '<div class="hero-stat"><div class="hero-stat-value">' + weekAct + '</div><div class="hero-stat-label">فعالیت این هفته</div></div><div class="hero-stat"><div class="hero-stat-value">' + done + '</div><div class="hero-stat-label">کار تکمیل شده</div></div><div class="hero-stat"><div class="hero-stat-value">' + rate + '%</div><div class="hero-stat-label">نرخ تکمیل</div></div>';
}

function renderTimeline() {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    const logs = currentData.logs.slice(-8).reverse();
    if (!logs.length) { tl.innerHTML = '<div class="empty-state"><div class="empty-title">هنوز فعالیتی ثبت نشده</div></div>'; return; }
    tl.innerHTML = logs.map(log => {
        const cls = log.action === 'create' ? 'create' : log.action === 'update' ? 'update' : 'delete';
        return '<div class="timeline-item"><div class="timeline-dot ' + cls + '"></div><div class="timeline-content"><div class="timeline-text">' + log.details + '</div><div class="timeline-meta">' + getTimeAgo(new Date(log.createdAtUtc)) + '</div></div></div>';
    }).join('');
}

function getTimeAgo(date) {
    const s = Math.floor((new Date() - date) / 1000);
    if (s < 60) return 'لحظاتی پیش';
    const m = Math.floor(s / 60);
    if (m < 60) return m + ' دقیقه پیش';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' ساعت پیش';
    const d = Math.floor(h / 24);
    return d < 7 ? d + ' روز پیش' : date.toLocaleDateString('fa-IR');
}

function renderOverview() {
    const c = document.getElementById('overviewChart');
    if (!c) return;
    const t = currentData.tasks;
    const dist = [
        { label:'در انتظار', value:t.filter(x=>x.status==='pending').length },
        { label:'در حال انجام', value:t.filter(x=>x.status==='in-progress').length },
        { label:'بازبینی', value:t.filter(x=>x.status==='review').length },
        { label:'انجام شده', value:t.filter(x=>x.status==='done').length }
    ];
    const total = t.length;
    const rate = total > 0 ? Math.round((dist[3].value / total) * 100) : 0;
    c.innerHTML = '<div style="padding:8px 0;"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><div><div style="font-size:13px;font-weight:600;">وضعیت کارها</div><div style="font-size:11px;color:var(--text-tertiary);">' + total + ' کار</div></div><span class="pill ' + (rate >= 50 ? 'success' : 'warning') + '">' + rate + '% تکمیل</span></div><div id="taskDoughnut"></div></div>';
    setTimeout(() => { if (typeof Charts !== 'undefined') Charts.doughnut('taskDoughnut', dist, { colors:['#f59e0b','#3b82f6','#8b5cf6','#10b981'] }); }, 50);
}

function renderHeatmap() {
    const c = document.getElementById('heatmapContainer');
    if (!c || typeof Charts === 'undefined') return;
    const map = {};
    currentData.logs.forEach(l => { const k = new Date(l.createdAtUtc).toISOString().split('T')[0]; map[k] = (map[k] || 0) + 1; });
    const data = Object.keys(map).map(k => ({ date:k, count:map[k] }));
    Charts.heatmap('heatmapContainer', data, { colors:['#1c1c1f','#3d1f5c','#5b2c9a','#7c3aed','#a855f7'] });
}

function renderActivityChart() {
    const c = document.getElementById('activityChartContainer');
    if (!c || typeof Charts === 'undefined') return;
    const now = new Date();
    const names = ['یک','دو','سه','چهار','پنج','جمعه','شنبه'];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date(now); day.setDate(day.getDate() - i);
        const ds = new Date(day); ds.setHours(0,0,0,0);
        const de = new Date(day); de.setHours(23,59,59,999);
        const count = currentData.logs.filter(l => { const t = new Date(l.createdAtUtc); return t >= ds && t <= de; }).length;
        data.push({ label: names[day.getDay()], value: count });
    }
    Charts.bar('activityChartContainer', data, { width:600, height:220, color:'#7c3aed' });
}

function renderInsights() {
    const c = document.getElementById('insightsGrid');
    if (!c) return;
    const d = currentData;
    const dayCount = [0,0,0,0,0,0,0];
    d.logs.forEach(l => { dayCount[new Date(l.createdAtUtc).getDay()]++; });
    const maxIdx = dayCount.indexOf(Math.max.apply(null, dayCount));
    const dayNames = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه','شنبه'];
    const bestDay = dayCount[maxIdx] > 0 ? dayNames[maxIdx] : '-';
    const total = d.people.length + d.tasks.length + d.ideas.length + d.notes.length + d.projects.length;
    const mk = (n) => typeof icon === 'function' ? icon(n, 16) : '';
    c.innerHTML = '<div class="insight-card"><div class="insight-header"><div class="insight-icon" style="background:var(--success-subtle);color:var(--success);">' + mk('sparkle') + '</div><div class="insight-title">بهترین روز هفته</div></div><div class="insight-value">' + bestDay + '</div><div class="insight-desc">' + dayCount[maxIdx] + ' فعالیت</div></div><div class="insight-card"><div class="insight-header"><div class="insight-icon" style="background:var(--info-subtle);color:var(--info);">' + mk('activity') + '</div><div class="insight-title">مجموع آیتم‌ها</div></div><div class="insight-value">' + total + '</div><div class="insight-desc">در تمام بخش‌ها</div></div><div class="insight-card"><div class="insight-header"><div class="insight-icon" style="background:var(--warning-subtle);color:var(--warning);">' + mk('rocket') + '</div><div class="insight-title">فعالیت‌ها</div></div><div class="insight-value">' + d.logs.length + '</div><div class="insight-desc">کل فعالیت‌های ثبت شده</div></div>';
}

// ===== PEOPLE =====
function renderPeople() {
    const tbody = document.getElementById('peopleTableBody');
    if (!tbody) return;
    const people = currentData.people;
    if (!people.length) { tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-title">مخاطبی وجود ندارد</div></div></td></tr>'; return; }
    const colors = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ec4899','#ef4444'];
    tbody.innerHTML = people.map((p, i) => {
        const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2);
        const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';
        return '<tr onclick="openPersonPanel(\'' + p.id + '\')" oncontextmenu="showContextMenu(event,\'person\',\'' + p.id + '\')"><td><div class="cell-person"><div class="avatar" style="background:' + colors[i % colors.length] + ';">' + initials + '</div><div class="cell-person-info"><div class="cell-person-name">' + p.name + '</div><div class="cell-person-sub">' + (p.email || 'بدون ایمیل') + '</div></div></div></td><td>' + (p.company || '-') + '</td><td>' + (p.phone || '-') + '</td><td><span class="pill success">فعال</span></td><td style="color:var(--text-tertiary);font-size:12px;">' + new Date(p.createdAtUtc).toLocaleDateString('fa-IR') + '</td><td><button class="icon-button" onclick="event.stopPropagation();showContextMenu(event,\'person\',\'' + p.id + '\')">' + mk('moreVertical', 14) + '</button></td></tr>';
    }).join('');
}

function openPersonPanel(id) {
    const p = currentData.people.find(x => x.id === id);
    if (!p) return;
    currentPanelItem = p; currentPanelType = 'person';
    const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';
    document.getElementById('panelTitle').textContent = 'جزئیات مخاطب';
    document.getElementById('panelBody').innerHTML = '<div class="panel-hero"><div class="avatar" style="background:#7c3aed;width:56px;height:56px;font-size:18px;">' + initials + '</div><div><div class="panel-hero-name">' + p.name + '</div><div class="panel-hero-sub">' + (p.company || 'بدون شرکت') + '</div></div></div><div class="panel-section"><div class="panel-section-title">اطلاعات تماس</div><div class="panel-field"><div class="panel-field-icon">' + mk('mail', 14) + '</div><div class="panel-field-content"><div class="panel-field-label">ایمیل</div><div class="panel-field-value">' + (p.email || '-') + '</div></div></div><div class="panel-field"><div class="panel-field-icon">' + mk('phone', 14) + '</div><div class="panel-field-content"><div class="panel-field-label">تلفن</div><div class="panel-field-value">' + (p.phone || '-') + '</div></div></div><div class="panel-field"><div class="panel-field-icon">' + mk('building', 14) + '</div><div class="panel-field-content"><div class="panel-field-label">شرکت</div><div class="panel-field-value">' + (p.company || '-') + '</div></div></div></div>' + (p.notes ? '<div class="panel-section"><div class="panel-section-title">یادداشت</div><div style="font-size:13px;color:var(--text-secondary);">' + p.notes + '</div></div>' : '') + '<div id="attachmentsContainer"></div>';
    document.getElementById('panelActions').innerHTML = '<button class="btn btn-secondary" onclick="editPanelItem()">' + mk('edit', 14) + ' ویرایش</button><button class="btn btn-ghost" style="color:var(--danger);" onclick="confirmDelete(\'person\',\'' + p.id + '\')">' + mk('trash', 14) + ' حذف</button>';
    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('slidePanel').classList.add('active');
    if (typeof renderAttachmentsSection === 'function') renderAttachmentsSection('person', id, document.getElementById('attachmentsContainer'));
}

function editPanelItem() {
    if (!currentPanelItem || currentPanelType !== 'person') return;
    const p = currentPanelItem;
    document.getElementById('panelTitle').textContent = 'ویرایش مخاطب';
    document.getElementById('panelBody').innerHTML = '<div class="panel-edit-form"><div class="form-field"><label class="form-label">نام *</label><input class="form-input" name="name" value="' + p.name + '"/></div><div class="form-field"><label class="form-label">ایمیل</label><input class="form-input" type="email" name="email" value="' + (p.email || '') + '"/></div><div class="form-field"><label class="form-label">تلفن</label><input class="form-input" type="tel" name="phone" value="' + (p.phone || '') + '"/></div><div class="form-field"><label class="form-label">شرکت</label><input class="form-input" name="company" value="' + (p.company || '') + '"/></div><div class="form-field"><label class="form-label">یادداشت</label><textarea class="form-textarea" name="notes">' + (p.notes || '') + '</textarea></div></div>';
    document.getElementById('panelActions').innerHTML = '<button class="btn btn-secondary" onclick="openPersonPanel(\'' + p.id + '\')">انصراف</button><button class="btn btn-primary" onclick="saveEdit()">ذخیره</button>';
}

async function saveEdit() {
    if (!currentPanelItem) return;
    const form = document.querySelector('.panel-edit-form');
    const data = {};
    form.querySelectorAll('[name]').forEach(i => { data[i.name] = i.value; });
    if (!data.name) { toast('نام الزامی است', 'error'); return; }
    try {
        await api(currentPanelType + 's/' + currentPanelItem.id, 'PUT', data);
        toast('ذخیره شد', 'success');
        await loadAllData();
        openPersonPanel(currentPanelItem.id);
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

function confirmDelete(type, id) {
    const ci = document.getElementById('confirmIcon');
    if (ci && typeof icon === 'function') ci.innerHTML = icon('trash', 24);
    document.getElementById('confirmTitle').textContent = 'آیا مطمئن هستید؟';
    document.getElementById('confirmMessage').textContent = 'این عمل قابل بازگشت نیست.';
    document.getElementById('confirmBtn').onclick = () => executeDelete(type, id);
    document.getElementById('confirmOverlay').classList.add('active');
}

async function executeDelete(type, id) {
    try {
        await api(type + 's/' + id, 'DELETE');
        toast('حذف شد', 'success');
        closeConfirm(); closePanel();
        await loadAllData();
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

function closeConfirm() { document.getElementById('confirmOverlay').classList.remove('active'); }
function closePanel() { document.getElementById('panelOverlay').classList.remove('active'); document.getElementById('slidePanel').classList.remove('active'); currentPanelItem = null; currentPanelType = null; }

// ===== TASKS (Kanban) =====
function renderKanban() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;
    let tasks = currentData.tasks;
    if (taskFilter === 'high') tasks = tasks.filter(t => t.priority === 'high');
    else if (taskFilter === 'pending') tasks = tasks.filter(t => t.status === 'pending');
    else if (taskFilter === 'done') tasks = tasks.filter(t => t.status === 'done');
    const cols = [ {key:'pending',label:'در انتظار',dot:'pending'}, {key:'in-progress',label:'در حال انجام',dot:'progress'}, {key:'review',label:'بازبینی',dot:'review'}, {key:'done',label:'انجام شده',dot:'done'} ];
    board.innerHTML = cols.map(col => {
        const ct = tasks.filter(t => (t.status || 'pending') === col.key);
        return '<div class="kanban-col"><div class="kanban-col-header"><div class="kanban-col-title"><span class="kanban-col-dot ' + col.dot + '"></span><span>' + col.label + '</span></div><span class="kanban-col-count">' + ct.length + '</span></div><div class="kanban-cards">' + (ct.length ? ct.map(t => {
            const pr = t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral';
            const pl = t.priority === 'high' ? 'بالا' : t.priority === 'medium' ? 'متوسط' : 'کم';
            const dt = t.dueDate ? new Date(t.dueDate).toLocaleDateString('fa-IR') : '';
            return '<div class="kanban-card" oncontextmenu="showContextMenu(event,\'task\',\'' + t.id + '\')"><div class="kanban-card-title">' + t.title + '</div><div class="kanban-card-meta"><span class="pill ' + pr + '">' + pl + '</span>' + (dt ? '<span>' + dt + '</span>' : '') + '</div></div>';
        }).join('') : '<div style="color:var(--text-disabled);font-size:12px;text-align:center;padding:20px 0;">خالی</div>') + '</div></div>';
    }).join('');
}

function filterTasks(f) {
    taskFilter = f;
    document.querySelectorAll('#taskFilterBar .filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === f));
    renderKanban();
}

// ===== IDEAS / NOTES / PROJECTS =====
function renderIdeas() {
    const g = document.getElementById('ideasGrid');
    if (!g) return;
    if (!currentData.ideas.length) { g.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-title">ایده‌ای ثبت نشده</div></div>'; return; }
    g.innerHTML = currentData.ideas.map(i => '<div class="note-card" oncontextmenu="showContextMenu(event,\'idea\',\'' + i.id + '\')"><div class="note-card-header"><div class="note-card-icon">💡</div><span class="pill accent">' + (i.status || 'draft') + '</span></div><div class="note-card-title">' + i.title + '</div><div class="note-card-desc">' + (i.description || '') + '</div></div>').join('');
}

function renderNotes() {
    const g = document.getElementById('notesGrid');
    if (!g) return;
    if (!currentData.notes.length) { g.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-title">یادداشتی ثبت نشده</div></div>'; return; }
    g.innerHTML = currentData.notes.map(n => '<div class="note-card" oncontextmenu="showContextMenu(event,\'note\',\'' + n.id + '\')"><div class="note-card-header"><div class="note-card-icon" style="background:var(--info-subtle);color:var(--info);">📝</div></div><div class="note-card-title">' + n.title + '</div><div class="note-card-desc">' + (n.content || '') + '</div></div>').join('');
}

function renderProjects() {
    const g = document.getElementById('projectsGrid');
    if (!g) return;
    if (!currentData.projects.length) { g.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-title">پروژه‌ای ثبت نشده</div></div>'; return; }
    g.innerHTML = currentData.projects.map(p => '<div class="note-card" oncontextmenu="showContextMenu(event,\'project\',\'' + p.id + '\')"><div class="note-card-header"><div class="note-card-icon" style="background:var(--warning-subtle);color:var(--warning);">🚀</div><span class="pill success">' + (p.status || 'active') + '</span></div><div class="note-card-title">' + p.name + '</div><div class="note-card-desc">' + (p.description || '') + '</div></div>').join('');
}

// ===== CONTEXT MENU =====
function setupContextMenu() {
    document.addEventListener('click', () => { const m = document.getElementById('contextMenu'); if (m) m.classList.remove('active'); });
}

function showContextMenu(e, type, id) {
    e.preventDefault(); e.stopPropagation();
    const m = document.getElementById('contextMenu');
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';
    m.innerHTML = '<div class="context-menu-item" onclick="editItem(\'' + type + '\',\'' + id + '\')">' + mk('edit', 14) + '<span>ویرایش</span></div><div class="context-menu-item danger" onclick="confirmDelete(\'' + type + '\',\'' + id + '\')">' + mk('trash', 14) + '<span>حذف</span></div>';
    m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
    m.classList.add('active');
}

function editItem(type, id) {
    if (type === 'person') { closePanel(); setTimeout(() => { openPersonPanel(id); setTimeout(editPanelItem, 100); }, 200); }
}

// ===== COMMAND PALETTE =====
let cmdSelectedIndex = 0;
let cmdFilteredCommands = [];
let cmdSearchResults = [];
const commands = [
    { group:'اقدامات', id:'new-person', title:'افزودن مخاطب', sub:'مخاطب جدید', icon:'users', action:() => openModal('people') },
    { group:'اقدامات', id:'new-task', title:'افزودن کار', sub:'کار جدید', icon:'check', action:() => openModal('tasks') },
    { group:'اقدامات', id:'new-idea', title:'ثبت ایده', sub:'ایده جدید', icon:'lightbulb', action:() => openModal('ideas') },
    { group:'اقدامات', id:'new-note', title:'نوشتن یادداشت', sub:'یادداشت', icon:'file', action:() => openModal('notes') },
    { group:'نویگیشن', id:'go-dash', title:'داشبورد', sub:'نمای کلی', icon:'home', action:() => switchView('dashboard') },
    { group:'نویگیشن', id:'go-people', title:'مخاطبان', sub:'لیست', icon:'users', action:() => switchView('people') },
    { group:'نویگیشن', id:'go-tasks', title:'کارها', sub:'Kanban', icon:'check', action:() => switchView('tasks') },
    { group:'نویگیشن', id:'go-reports', title:'گزارش‌ها', sub:'PDF', icon:'dashboard', action:() => switchView('reports') }
];

function openCommandPalette() {
    document.getElementById('cmdOverlay').classList.add('active');
    document.getElementById('cmdInput').value = '';
    searchCommand('');
    setTimeout(() => document.getElementById('cmdInput').focus(), 50);
}
function closeCommandPalette() { document.getElementById('cmdOverlay').classList.remove('active'); }

async function searchCommand(q) {
    q = (q || '').toLowerCase().trim();
    if (!q) { cmdFilteredCommands = commands.slice(); cmdSearchResults = []; cmdSelectedIndex = 0; renderCommandResults(); return; }
    cmdFilteredCommands = commands.filter(c => c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q));
    cmdSearchResults = [];
    try {
        const r = await api('search?q=' + encodeURIComponent(q));
        (r.people || []).forEach(p => cmdSearchResults.push({ group:'مخاطبان', id:'sp-'+p.id, title:p.name, sub:p.email||'', icon:'users', action:() => { closeCommandPalette(); openPersonPanel(p.id); } }));
        (r.tasks || []).forEach(t => cmdSearchResults.push({ group:'کارها', id:'st-'+t.id, title:t.title, sub:'', icon:'check', action:() => { closeCommandPalette(); switchView('tasks'); } }));
    } catch(e) {}
    cmdSelectedIndex = 0;
    renderCommandResults();
}

function renderCommandResults() {
    const c = document.getElementById('cmdResults');
    if (!c) return;
    const all = cmdFilteredCommands.concat(cmdSearchResults);
    if (!all.length) { c.innerHTML = '<div class="empty-state" style="padding:20px;"><div class="empty-title">نتیجه‌ای یافت نشد</div></div>'; return; }
    const groups = {};
    all.forEach((item, i) => { if (!groups[item.group]) groups[item.group] = []; groups[item.group].push(Object.assign({}, item, { index: i })); });
    let html = '';
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';
    Object.keys(groups).forEach(g => {
        html += '<div class="cmd-group-title">' + g + '</div>';
        groups[g].forEach(item => {
            html += '<div class="cmd-item ' + (item.index === cmdSelectedIndex ? 'selected' : '') + '" onclick="executeCommand(' + item.index + ')">' + mk(item.icon, 14) + '<div class="cmd-item-content"><div class="cmd-item-title">' + item.title + '</div><div class="cmd-item-sub">' + item.sub + '</div></div></div>';
        });
    });
    c.innerHTML = html;
}

function executeCommand(i) {
    const all = cmdFilteredCommands.concat(cmdSearchResults);
    if (all[i]) { closeCommandPalette(); all[i].action(); }
}

function setupKeyboard() {
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('cmdOverlay').classList.contains('active') ? closeCommandPalette() : openCommandPalette(); return; }
        if (e.key === 'Escape') {
            if (document.getElementById('confirmOverlay').classList.contains('active')) closeConfirm();
            else if (document.getElementById('cmdOverlay').classList.contains('active')) closeCommandPalette();
            else if (document.getElementById('modalOverlay').classList.contains('active')) closeModal();
            else if (document.getElementById('slidePanel').classList.contains('active')) closePanel();
            return;
        }
        if (document.getElementById('cmdOverlay').classList.contains('active')) {
            const all = cmdFilteredCommands.concat(cmdSearchResults);
            if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelectedIndex = Math.min(cmdSelectedIndex + 1, all.length - 1); renderCommandResults(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelectedIndex = Math.max(cmdSelectedIndex - 1, 0); renderCommandResults(); }
            else if (e.key === 'Enter') { e.preventDefault(); executeCommand(cmdSelectedIndex); }
        }
    });
}

// ===== MODAL =====
const modalForms = {
    people: { title:'افزودن مخاطب جدید', fields:[ {name:'name',label:'نام',type:'text',required:true}, {name:'email',label:'ایمیل',type:'email'}, {name:'phone',label:'تلفن',type:'tel'}, {name:'company',label:'شرکت',type:'text'}, {name:'notes',label:'یادداشت',type:'textarea'} ], submit: async d => { d.tags = []; await api('people', 'POST', d); toast('مخاطب اضافه شد', 'success'); } },
    tasks: { title:'افزودن کار جدید', fields:[ {name:'title',label:'عنوان',type:'text',required:true}, {name:'description',label:'توضیحات',type:'textarea'}, {name:'priority',label:'اولویت',type:'select',options:[{value:'low',label:'کم'},{value:'medium',label:'متوسط'},{value:'high',label:'زیاد'}]}, {name:'dueDate',label:'تاریخ انجام',type:'date'} ], submit: async d => { d.status = 'pending'; d.tags = []; if (d.dueDate) d.dueDate = new Date(d.dueDate).toISOString(); await api('tasks', 'POST', d); toast('کار اضافه شد', 'success'); } },
    ideas: { title:'ثبت ایده', fields:[ {name:'title',label:'عنوان ایده',type:'text',required:true}, {name:'description',label:'توضیحات',type:'textarea'} ], submit: async d => { d.status = 'draft'; d.tags = []; await api('ideas', 'POST', d); toast('ایده ثبت شد', 'success'); } },
    notes: { title:'نوشتن یادداشت', fields:[ {name:'title',label:'عنوان',type:'text',required:true}, {name:'content',label:'متن',type:'textarea'} ], submit: async d => { d.tags = []; await api('notes', 'POST', d); toast('یادداشت ذخیره شد', 'success'); } },
    projects: { title:'تعریف پروژه', fields:[ {name:'name',label:'نام پروژه',type:'text',required:true}, {name:'description',label:'توضیحات',type:'textarea'} ], submit: async d => { d.status = 'active'; d.tags = []; await api('projects', 'POST', d); toast('پروژه ایجاد شد', 'success'); } }
};

let currentModalType = null;

function openModal(type) {
    const cfg = modalForms[type];
    if (!cfg) return;
    currentModalType = type;
    document.getElementById('modalTitle').textContent = cfg.title;
    const b = document.getElementById('modalBody');
    b.innerHTML = cfg.fields.map(f => {
        let inner = '';
        if (f.type === 'textarea') inner = '<textarea class="form-textarea" name="' + f.name + '"></textarea>';
        else if (f.type === 'select') inner = '<select class="form-select" name="' + f.name + '">' + f.options.map(o => '<option value="' + o.value + '">' + o.label + '</option>').join('') + '</select>';
        else inner = '<input class="form-input" type="' + f.type + '" name="' + f.name + '"/>';
        return '<div class="form-field"><label class="form-label">' + f.label + (f.required ? ' *' : '') + '</label>' + inner + '</div>';
    }).join('');
    document.getElementById('modalSubmit').onclick = submitModal;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); currentModalType = null; }
function closeModalOnOverlay(e) { if (e.target.id === 'modalOverlay') closeModal(); }

async function submitModal() {
    if (!currentModalType) return;
    const cfg = modalForms[currentModalType];
    const b = document.getElementById('modalBody');
    const data = {};
    cfg.fields.forEach(f => { const i = b.querySelector('[name="' + f.name + '"]'); if (i) data[f.name] = i.value; });
    for (const f of cfg.fields) { if (f.required && !data[f.name]) { toast('فیلد "' + f.label + '" الزامی است', 'error'); return; } }
    try { await cfg.submit(data); closeModal(); await loadAllData(); } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

// ===== TOAST =====
function toast(message, type) {
    type = type || 'info';
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';
    const im = { success:'check', error:'close', info:'sparkle' };
    t.innerHTML = '<div class="toast-icon">' + mk(im[type] || 'sparkle', 16) + '</div><div class="toast-content">' + message + '</div>';
    c.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 200); }, 3000);
}

/* === bus.js === */
// ===== EVENT BUS (Phase 32) - central pub/sub =====
// هدف: حذف زنجیره window.wrap ها؛ ماژول‌ها به جای wrap، subscribe می‌کنند.
const bus = (() => {
    const map = new Map();
    return {
        on(event, cb) {
            if (!map.has(event)) map.set(event, []);
            map.get(event).push(cb);
            return () => map.set(event, map.get(event).filter(f => f !== cb));
        },
        once(event, cb) {
            const off = this.on(event, d => { off(); cb(d); });
        },
        emit(event, data) {
            (map.get(event) || []).forEach(cb => {
                try { cb(data); } catch (e) { }
            });
        }
    };
})();

// Central tick scheduler (یک تایمر مرکزی به جای چند setInterval)
setInterval(() => bus.emit('tick:1s'), 1000);
setInterval(() => bus.emit('tick:30s'), 30000);
setInterval(() => bus.emit('tick:60s'), 60000);

// شروع مهاجرت: انتشار رویدادهای اصلی (بدون حذف wrap های فعلی)
const _origLoadAllDataBus = window.loadAllData;
window.loadAllData = async function() {
    const r = await _origLoadAllDataBus();
    bus.emit('data:loaded', currentData);
    return r;
};
const _origSwitchViewBus = window.switchView;
window.switchView = function(v) {
    _origSwitchViewBus(v);
    bus.emit('view:changed', v);
};

/* === store.js === */
// ===== CENTRAL STORE (Phase 34 - State Management) =====
const store = (() => {
    function save(entity) {
        if (typeof saveEntity === 'function') saveEntity(entity);
    }
    function emit(entity) {
        if (typeof bus !== 'undefined') bus.emit(entity + ':changed', currentData[entity]);
    }
    function notify(entity) {
        save(entity);
        emit(entity);
    }
    return {
        get(entity) { return currentData[entity] || []; },
        set(entity, arr) {
            currentData[entity] = arr;
            notify(entity);
            return arr;
        },
        add(entity, item) {
            if (!item.id) item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
            if (!item.createdAtUtc) item.createdAtUtc = new Date().toISOString();
            currentData[entity] = currentData[entity] || [];
            currentData[entity].push(item);
            notify(entity);
            return item;
        },
        update(entity, id, changes) {
            const arr = currentData[entity] || [];
            const idx = arr.findIndex(x => x.id === id);
            if (idx === -1) return null;
            arr[idx] = { ...arr[idx], ...changes, updatedAtUtc: new Date().toISOString() };
            notify(entity);
            return arr[idx];
        },
        remove(entity, id) {
            const arr = currentData[entity] || [];
            const idx = arr.findIndex(x => x.id === id);
            if (idx === -1) return false;
            arr.splice(idx, 1);
            notify(entity);
            return true;
        },
        find(entity, id) {
            return (currentData[entity] || []).find(x => x.id === id);
        }
    };
})();
console.log('[Store] Central store initialized');

/* === router.js === */
// ===== LAZY LOADER (Phase 40 - Chunked Loading) =====
// Loads JS chunks only when needed

const lazyLoader = (() => {
    const loaded = new Set(['bundle-core.js']);
    
    // Map view names to their required chunks
    const viewChunks = {
        'dashboard': ['bundle-charts.js'],
        'people': ['bundle-crm.js'],
        'tasks': ['bundle-productivity.js'],
        'ideas': ['bundle-knowledge.js'],
        'notes': ['bundle-knowledge.js'],
        'projects': ['bundle-crm.js'],
        'pipeline': ['bundle-crm.js'],
        'companies': ['bundle-crm.js'],
        'okr': ['bundle-productivity.js'],
        'inbox': ['bundle-charts.js', 'bundle-productivity.js'],
        'backups': ['bundle-system.js'],
        'reports': ['bundle-charts.js', 'bundle-system.js'],
        'settings': ['bundle-system.js'],
        'graph': ['bundle-knowledge.js'],
    };
    
    // Load a single chunk
    function loadChunk(src) {
        if (loaded.has(src)) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            // Check if already in DOM (loaded by index.html)
            const existing = document.querySelector(`script[src="/js/${src}"]`);
            if (existing) {
                if (existing.hasAttribute('data-loaded')) {
                    loaded.add(src);
                    resolve();
                    return;
                }
                // Wait for it to load
                existing.addEventListener('load', () => {
                    existing.setAttribute('data-loaded', 'true');
                    loaded.add(src);
                    resolve();
                });
                existing.addEventListener('error', () => reject(new Error('Failed: ' + src)));
                return;
            }
            
            const script = document.createElement('script');
            script.src = '/js/' + src;
            script.onload = () => {
                script.setAttribute('data-loaded', 'true');
                loaded.add(src);
                console.log('[Lazy] Loaded chunk:', src);
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(script);
        });
    }
    
    // Load all chunks for a view
    async function loadView(viewName) {
        const chunks = viewChunks[viewName];
        if (!chunks) return;
        
        const toLoad = chunks.filter(c => !loaded.has(c));
        if (toLoad.length === 0) return;
        
        console.log('[Lazy] Loading view:', viewName, toLoad);
        
        // Load all chunks in parallel
        await Promise.all(toLoad.map(loadChunk));
        
        console.log('[Lazy] View ready:', viewName);
    }
    
    return { loadView, loadChunk, loaded };
})();

console.log('[Lazy] Router initialized (chunked)');

/* === vault.js === */
// ===== VAULT MODULE (Phase 14) =====

const VAULT_HASH_KEY = 'crm_vault_hash';
const VAULT_UNLOCK_KEY = 'crm_vault_unlocked';
const AUTO_LOCK_MINUTES = 5;

async function hashPassword(pwd){const s=localStorage.getItem('crm_vault_salt')||(()=>{const a=new Uint8Array(16);crypto.getRandomValues(a);const x=Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem('crm_vault_salt',x);return x})();const d=new TextEncoder().encode(s+':'+pwd);const b=await crypto.subtle.digest('SHA-256',d);return 'v2_'+Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}

function isVaultEnabled() { return !!localStorage.getItem(VAULT_HASH_KEY); }
function isVaultUnlocked() { return sessionStorage.getItem(VAULT_UNLOCK_KEY) === '1'; }

function showVaultLock() {
    const existing = document.getElementById('vaultLock');
    if (existing) existing.remove();
    const hasPw = isVaultEnabled();
    const lock = document.createElement('div');
    lock.id = 'vaultLock';
    lock.className = 'vault-lock';
    lock.innerHTML = '<div class="vault-logo">🔒</div><div class="vault-title">CRM Pro</div><div class="vault-subtitle">' + (hasPw ? 'برای دسترسی به داده‌های خود، رمز عبور را وارد کنید' : 'Vault امنیتی — یک رمز عبور برای محافظت از داده‌های خود تنظیم کنید') + '</div><div class="vault-form" id="vaultForm">' +
        '<input type="password" id="vaultPwd" class="vault-input" placeholder="رمز عبور" autocomplete="off"/>' +
        (hasPw ? '' : '<input type="password" id="vaultPwd2" class="vault-input" placeholder="تایید رمز عبور"/>') +
        '<button class="vault-btn" onclick="submitVault()">' + (hasPw ? '🔓 باز کردن' : '🔐 تنظیم رمز') + '</button>' +
        (hasPw ? '<div class="vault-hint"><a href="#" onclick="resetVault(); return false;" style="color:#a1a1aa;">فراموشی رمز (پاک کردن داده‌ها)</a></div>' : '<div class="vault-hint">رمز خود را در جای امنی ذخیره کنید!</div>') +
        '</div>';
    document.body.appendChild(lock);
    setTimeout(() => document.getElementById('vaultPwd').focus(), 100);
    document.getElementById('vaultPwd').addEventListener('keydown', e => { if (e.key === 'Enter') submitVault(); });
    const p2 = document.getElementById('vaultPwd2');
    if (p2) p2.addEventListener('keydown', e => { if (e.key === 'Enter') submitVault(); });
}

async function submitVault() {
    const pwd = document.getElementById('vaultPwd').value;
    const pwd2 = document.getElementById('vaultPwd2');
    const hasPw = isVaultEnabled();
    const form = document.getElementById('vaultForm');
    
    if (!pwd) { showVaultError('لطفاً رمز عبور را وارد کنید'); return; }
    
    if (!hasPw) {
        if (!pwd2 || pwd !== pwd2.value) { showVaultError('رمزها مطابقت ندارند'); return; }
        if (pwd.length < 4) { showVaultError('رمز حداقل ۴ کاراکتر'); return; }
        localStorage.setItem(VAULT_HASH_KEY, hashPassword(pwd));
        sessionStorage.setItem(VAULT_UNLOCK_KEY, '1');
        toast('🔐 Vault فعال شد', 'success');
        closeVaultLock();
    } else {
        if (hashPassword(pwd) !== localStorage.getItem(VAULT_HASH_KEY)) {
            showVaultError('❌ رمز اشتباه است');
            return;
        }
        sessionStorage.setItem(VAULT_UNLOCK_KEY, '1');
        toast('🔓 خوش آمدید!', 'success');
        closeVaultLock();
    }
}

function showVaultError(msg) {
    const form = document.getElementById('vaultForm');
    let err = form.querySelector('.vault-error');
    if (!err) { err = document.createElement('div'); err.className = 'vault-error'; form.appendChild(err); }
    err.textContent = msg;
}

function closeVaultLock() {
    const lock = document.getElementById('vaultLock');
    if (lock) lock.remove();
    lastActivity = Date.now();
}

function lockVault() {
    sessionStorage.removeItem(VAULT_UNLOCK_KEY);
    showVaultLock();
}

function resetVault() {
    if (!confirm('آیا مطمئن هستید؟ این کار تمام داده‌ها و رمز عبور را پاک می‌کند!')) return;
    localStorage.removeItem(VAULT_HASH_KEY);
    sessionStorage.removeItem(VAULT_UNLOCK_KEY);
    toast('داده‌ها پاک شدند. صفحه ریفرش می‌شود...', 'info');
    setTimeout(() => location.reload(), 1500);
}

// Auto-lock after inactivity
let lastActivity = Date.now();
['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => {
    document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true });
});

setInterval(() => {
    if (isVaultEnabled() && isVaultUnlocked() && (Date.now() - lastActivity) > AUTO_LOCK_MINUTES * 60 * 1000) {
        lockVault();
    }
}, 30000);

// Settings UI
function addVaultSettings() {
    setTimeout(() => {
        const tabs = document.querySelectorAll('.settings-tab');
        const general = Array.from(tabs).find(t => t.dataset.tab === 'general');
        if (!general || general.querySelector('#vaultSettings')) return;
        
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.id = 'vaultSettings';
        section.innerHTML = '<div class="settings-section-title">🔒 Vault امنیتی</div><div class="settings-section-desc">محافظت از داده‌ها با رمز عبور</div><div class="setting-row"><div class="setting-info"><div class="setting-label">وضعیت</div><div class="setting-desc" id="vaultStatusText">' + (isVaultEnabled() ? '✅ فعال' : '❌ غیرفعال') + '</div></div><button class="btn ' + (isVaultEnabled() ? 'btn-ghost' : 'btn-primary') + '" onclick="toggleVaultSettings()" id="vaultToggleBtn">' + (isVaultEnabled() ? 'غیرفعال کردن' : 'فعال کردن') + '</button></div><div class="setting-row"><div class="setting-info"><div class="setting-label">قفل خودکار</div><div class="setting-desc">بعد از ۵ دقیقه عدم فعالیت</div></div><span class="vault-status unlocked">فعال</span></div>';
        const lastSection = general.querySelector('.settings-section:last-child');
        if (lastSection) lastSection.after(section);
        else general.appendChild(section);
    }, 600);
}

async function toggleVaultSettings() {
    if (isVaultEnabled()) {
        const pwd = prompt('برای غیرفعال کردن Vault، رمز فعلی را وارد کنید:');
        if (!pwd) return;
        if (hashPassword(pwd) !== localStorage.getItem(VAULT_HASH_KEY)) { toast('رمز اشتباه', 'error'); return; }
        localStorage.removeItem(VAULT_HASH_KEY);
        toast('Vault غیرفعال شد', 'success');
    } else {
        showVaultLock();
        return;
    }
    addVaultSettings();
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    addVaultSettings();
    if (isVaultEnabled() && !isVaultUnlocked()) {
        setTimeout(showVaultLock, 300);
    }
});

