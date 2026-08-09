// CRM PRO BUNDLE (auto) 2026-08-09 21:15

/* === core.js === */
// ===== CORE MODULE =====
const API = window.location.origin;
let currentView = 'dashboard';
let currentData = { people: [], tasks: [], ideas: [], notes: [], projects: [], logs: [] };
let currentPanelItem = null;
let currentPanelType = null;
let taskFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    try { injectIcons(); } catch(e) { console.warn('injectIcons:', e); }
    try { setupNavigation(); } catch(e) { console.warn('setupNavigation:', e); }
    try { setGreeting(); } catch(e) { console.warn('setGreeting:', e); }
    try { loadAllData(); } catch(e) { console.warn('loadAllData:', e); }
    try { setupKeyboard(); } catch(e) { console.warn('setupKeyboard:', e); }
    try { setupContextMenu(); } catch(e) { console.warn('setupContextMenu:', e); }
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
    } catch (err) { console.error('loadAllData:', err); toast('خطا در بارگذاری داده‌ها', 'error'); }
}

function renderAll() {
    try { renderDashboard(); } catch(e) { console.warn(e); }
    try { renderPeople(); } catch(e) { console.warn(e); }
    try { renderKanban(); } catch(e) { console.warn(e); }
    try { renderIdeas(); } catch(e) { console.warn(e); }
    try { renderNotes(); } catch(e) { console.warn(e); }
    try { renderProjects(); } catch(e) { console.warn(e); }
    try { updateCounts(); } catch(e) { console.warn(e); }
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
                try { cb(data); } catch (e) { console.warn('[bus]', event, e); }
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

console.log('[Bus] Event bus + central tick loaded');

/* === calendar.js === */
// ===== CALENDAR MODULE =====
let currentTaskView = 'kanban';
let currentCalendarDate = new Date();
let selectedCalendarDay = null;
let currentWeekDate = new Date();
let draggedTask = null;

// ===== JALALI CONVERSION =====
function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy, jm, jd, days;
    gy = (gm <= 2) ? (gy - 1) : gy;
    days = 355666 + (365 * gy) + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) + gd + g_d_m[gm - 1];
    jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31); }
    else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
    return { jy, jm, jd };
}

function jalaliToGregorian(jy, jm, jd) {
    let gy, gm, gd, days, sal_a, v;
    jy += 1595;
    days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    gd = days + 1;
    sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) { gd -= sal_a[gm]; }
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
    const pd = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, d => pd[d]);
}

const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const persianWeekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const persianWeekdaysFull = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

function switchTaskView(view) {
    currentTaskView = view;
    document.querySelectorAll('#taskViewToggle .view-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    const kv = document.getElementById('kanbanView');
    const cv = document.getElementById('calendarView');
    const wv = document.getElementById('weekView');
    if (kv) kv.style.display = view === 'kanban' ? 'block' : 'none';
    if (cv) cv.style.display = view === 'calendar' ? 'block' : 'none';
    if (wv) wv.style.display = view === 'week' ? 'block' : 'none';
    if (view === 'calendar') renderCalendar();
    if (view === 'week') renderWeekView();
}

function changeMonth(delta) {
    const j = gregorianToJalali(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, currentCalendarDate.getDate());
    let nm = j.jm + delta, ny = j.jy;
    if (nm < 1) { nm = 12; ny--; }
    else if (nm > 12) { nm = 1; ny++; }
    const g = jalaliToGregorian(ny, nm, 1);
    currentCalendarDate = new Date(g.gy, g.gm - 1, g.gd);
    selectedCalendarDay = null;
    renderCalendar();
}

function goToToday() {
    currentCalendarDate = new Date();
    selectedCalendarDay = null;
    renderCalendar();
}

function renderCalendar() {
    const we = document.getElementById('calendarWeekdays');
    const be = document.getElementById('calendarBody');
    const te = document.getElementById('calendarTitle');
    if (!we || !be) return;
    
    we.innerHTML = persianWeekdays.map((d, i) => '<div class="calendar-weekday ' + (i === 6 ? 'weekend' : '') + '">' + d + '</div>').join('');
    
    const todayJ = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
    const viewJ = gregorianToJalali(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, currentCalendarDate.getDate());
    
    te.textContent = persianMonths[viewJ.jm - 1] + ' ' + toPersianDigits(viewJ.jy);
    
    const ml = jalaliMonthLength(viewJ.jy, viewJ.jm);
    const fdg = jalaliToGregorian(viewJ.jy, viewJ.jm, 1);
    const fdd = new Date(fdg.gy, fdg.gm - 1, fdg.gd);
    let sdow = fdd.getDay();
    let po = (sdow + 1) % 7;
    const pml = jalaliMonthLength(viewJ.jy, viewJ.jm === 1 ? 12 : viewJ.jm - 1);
    
    const tasks = currentData.tasks;
    const tbd = {};
    tasks.forEach(t => {
        if (t.dueDate) {
            const d = new Date(t.dueDate);
            const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
            const k = j.jy + '-' + String(j.jm).padStart(2, '0') + '-' + String(j.jd).padStart(2, '0');
            if (!tbd[k]) tbd[k] = [];
            tbd[k].push(t);
        }
    });
    
    let html = '';
    let dc = 1, nmd = 1, mtc = 0, hc = 0, mc = 0, lc = 0;
    
    for (let i = 0; i < 42; i++) {
        let dn, om = false, it = false, dk, jy, jm, jd;
        if (i < po) { dn = pml - po + i + 1; om = true; const pm = viewJ.jm === 1 ? 12 : viewJ.jm - 1; const py = viewJ.jm === 1 ? viewJ.jy - 1 : viewJ.jy; jy = py; jm = pm; jd = dn; }
        else if (dc <= ml) { dn = dc; jy = viewJ.jy; jm = viewJ.jm; jd = dc; it = (jy === todayJ.jy && jm === todayJ.jm && jd === todayJ.jd); dc++; }
        else { dn = nmd; om = true; const nm = viewJ.jm === 12 ? 1 : viewJ.jm + 1; const ny = viewJ.jm === 12 ? viewJ.jy + 1 : viewJ.jy; jy = ny; jm = nm; jd = dn; nmd++; }
        
        dk = jy + '-' + String(jm).padStart(2, '0') + '-' + String(jd).padStart(2, '0');
        const dt = tbd[dk] || [];
        const iw = (i % 7) === 6;
        const ht = dt.length > 0;
        const hd = (typeof isHoliday === 'function') ? isHoliday(jy, jm, jd) : null;
        const ihd = hd !== null && hd !== undefined;
        
        if (!om) { mtc += dt.length; dt.forEach(t => { if (t.priority === 'high') hc++; else if (t.priority === 'medium') mc++; else lc++; }); }
        
        html += '<div class="calendar-day ' + (om ? 'other-month ' : '') + (it ? 'today ' : '') + (iw ? 'weekend ' : '') + (ht ? 'has-tasks ' : '') + (ihd ? 'holiday ' : '') + '" onclick="selectCalendarDay(\'' + dk + '\')" data-date="' + dk + '" ondragover="event.preventDefault(); this.classList.add(\'drag-over\');" ondragleave="this.classList.remove(\'drag-over\');" ondrop="handleCalendarDrop(event, \'' + dk + '\'); this.classList.remove(\'drag-over\');"><div class="day-number">' + toPersianDigits(dn) + '</div>' + (ihd ? '<div class="holiday-badge" title="' + hd.title + '">🎉</div>' : '') + '<div class="day-tasks">' + dt.slice(0, 2).map(t => '<div class="day-task priority-' + (t.priority || 'low') + ' ' + (t.status === 'done' ? 'status-done' : '') + '" draggable="true" ondragstart="startDragTask(event, \'' + t.id + '\')" onclick="event.stopPropagation(); openTaskDetail(\'' + t.id + '\')">' + t.title + '</div>').join('') + (dt.length > 2 ? '<div class="day-more">+' + toPersianDigits(dt.length - 2) + ' مورد</div>' : '') + '</div>' + (!om ? '<button class="quick-add-btn" onclick="event.stopPropagation(); quickAddForDate(\'' + dk + '\')">+</button>' : '') + '</div>';
    }
    
    be.innerHTML = html;
    
    const shp = document.getElementById('statHighPriority');
    if (shp) {
        shp.textContent = toPersianDigits(hc);
        document.getElementById('statMediumPriority').textContent = toPersianDigits(mc);
        document.getElementById('statLowPriority').textContent = toPersianDigits(lc);
        document.getElementById('calendarTaskCount').textContent = toPersianDigits(mtc) + ' کار در این ماه';
    }
    
    if (selectedCalendarDay) renderDayDetail(selectedCalendarDay);
}

function selectCalendarDay(dk) {
    selectedCalendarDay = dk;
    document.querySelectorAll('.calendar-day').forEach(d => {
        if (d.dataset.date === dk) { d.style.outline = '2px solid var(--accent)'; d.style.outlineOffset = '-2px'; }
        else { d.style.outline = 'none'; }
    });
    renderDayDetail(dk);
}

function renderDayDetail(dk) {
    const p = document.getElementById('dayDetailPanel');
    if (!p) return;
    const [jy, jm, jd] = dk.split('-').map(Number);
    const g = jalaliToGregorian(jy, jm, jd);
    const date = new Date(g.gy, g.gm - 1, g.gd);
    const dow = (date.getDay() + 1) % 7;
    const dn = persianWeekdaysFull[dow];
    const tasks = currentData.tasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        return (j.jy + '-' + String(j.jm).padStart(2, '0') + '-' + String(j.jd).padStart(2, '0')) === dk;
    });
    
    if (tasks.length === 0) {
        p.innerHTML = '<div class="day-detail-panel"><div class="day-detail-header"><div><div class="day-detail-title">' + dn + '</div><div class="day-detail-date">' + toPersianDigits(jd) + ' ' + persianMonths[jm - 1] + ' ' + toPersianDigits(jy) + '</div></div><button class="btn btn-ghost" onclick="document.getElementById(\'dayDetailPanel\').style.display=\'none\'">×</button></div><div class="day-detail-body"><div class="empty-state" style="padding:30px 20px;"><div class="empty-title">کار برنامه‌ریزی شده‌ای وجود ندارد</div><button class="btn btn-primary" onclick="openModalForDate(\'' + dk + '\')" style="margin-top:12px;">+ افزودن کار جدید</button></div></div></div>';
    } else {
        p.innerHTML = '<div class="day-detail-panel"><div class="day-detail-header"><div><div class="day-detail-title">' + dn + ' - ' + toPersianDigits(tasks.length) + ' کار</div><div class="day-detail-date">' + toPersianDigits(jd) + ' ' + persianMonths[jm - 1] + ' ' + toPersianDigits(jy) + '</div></div><button class="btn btn-ghost" onclick="document.getElementById(\'dayDetailPanel\').style.display=\'none\'">×</button></div><div class="day-detail-body"><div class="day-task-list">' + tasks.map(t => '<div class="day-task-item" onclick="openTaskDetail(\'' + t.id + '\')"><div class="day-task-status ' + (t.status === 'done' ? 'done' : '') + '" onclick="event.stopPropagation(); toggleTaskStatus(\'' + t.id + '\')">' + (t.status === 'done' ? '✓' : '') + '</div><div class="day-task-content"><div class="day-task-title ' + (t.status === 'done' ? 'done' : '') + '">' + t.title + '</div><div class="day-task-meta"><span class="pill ' + (t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'success') + '">' + (t.priority === 'high' ? 'بالا' : t.priority === 'medium' ? 'متوسط' : 'کم') + '</span></div></div></div>').join('') + '</div><button class="btn btn-secondary" onclick="openModalForDate(\'' + dk + '\')" style="margin-top:12px; width:100%; justify-content:center;">+ افزودن کار جدید</button></div></div>';
    }
    p.style.display = 'block';
}

async function toggleTaskStatus(tid) {
    const t = currentData.tasks.find(x => x.id === tid);
    if (!t) return;
    const ns = t.status === 'done' ? 'pending' : 'done';
    try { await api('tasks/' + tid, 'PUT', { status: ns }); toast(ns === 'done' ? 'کار تکمیل شد!' : 'به حالت در انتظار بازگشت', 'success'); await loadAllData(); renderCalendar(); } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

function openTaskDetail(tid) {
    const t = currentData.tasks.find(x => x.id === tid);
    if (!t) return;
    if (currentView !== 'tasks') switchView('tasks');
    openEditTaskModal(t);
}

function openEditTaskModal(task) {
    currentModalType = 'tasks';
    document.getElementById('modalTitle').textContent = 'ویرایش کار';
    const b = document.getElementById('modalBody');
    const dv = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    b.innerHTML = '<div class="form-field"><label class="form-label">عنوان *</label><input class="form-input" name="title" value="' + task.title + '" required/></div><div class="form-field"><label class="form-label">توضیحات</label><textarea class="form-textarea" name="description">' + (task.description || '') + '</textarea></div><div class="form-field"><label class="form-label">اولویت</label><select class="form-select" name="priority"><option value="low"' + (task.priority === 'low' ? ' selected' : '') + '>کم</option><option value="medium"' + (task.priority === 'medium' ? ' selected' : '') + '>متوسط</option><option value="high"' + (task.priority === 'high' ? ' selected' : '') + '>زیاد</option></select></div><div class="form-field"><label class="form-label">وضعیت</label><select class="form-select" name="status"><option value="pending"' + (task.status === 'pending' ? ' selected' : '') + '>در انتظار</option><option value="in-progress"' + (task.status === 'in-progress' ? ' selected' : '') + '>در حال انجام</option><option value="review"' + (task.status === 'review' ? ' selected' : '') + '>بازبینی</option><option value="done"' + (task.status === 'done' ? ' selected' : '') + '>انجام شده</option></select></div><div class="form-field"><label class="form-label">تاریخ انجام</label><input class="form-input" type="date" name="dueDate" value="' + dv + '"/></div>';
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {};
        b.querySelectorAll('[name]').forEach(i => { data[i.name] = i.value; });
        if (!data.title) { toast('عنوان الزامی است', 'error'); return; }
        if (data.dueDate) data.dueDate = new Date(data.dueDate).toISOString();
        try { await api('tasks/' + task.id, 'PUT', data); toast('کار ویرایش شد', 'success'); closeModal(); await loadAllData(); if (currentTaskView === 'calendar') renderCalendar(); } catch (e) { toast('خطا: ' + e.message, 'error'); }
    };
    document.getElementById('modalOverlay').classList.add('active');
}

function openModalForDate(dk) {
    const [jy, jm, jd] = dk.split('-').map(Number);
    const g = jalaliToGregorian(jy, jm, jd);
    const dv = g.gy + '-' + String(g.gm).padStart(2, '0') + '-' + String(g.gd).padStart(2, '0');
    openModal('tasks');
    setTimeout(() => { const di = document.querySelector('[name="dueDate"]'); if (di) di.value = dv; }, 50);
}

function quickAddForDate(dk) { openModalForDate(dk); }

function startDragTask(e, tid) {
    draggedTask = currentData.tasks.find(t => t.id === tid);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tid);
}

async function handleCalendarDrop(e, tdk) {
    e.preventDefault();
    if (!draggedTask) return;
    const [jy, jm, jd] = tdk.split('-').map(Number);
    const g = jalaliToGregorian(jy, jm, jd);
    const nd = new Date(g.gy, g.gm - 1, g.gd, 9, 0, 0);
    try { await api('tasks/' + draggedTask.id, 'PUT', { dueDate: nd.toISOString() }); toast('✅ کار جابجا شد', 'success'); draggedTask = null; await loadAllData(); renderCalendar(); } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

// ===== WEEK VIEW =====
function changeWeek(delta) {
    currentWeekDate.setDate(currentWeekDate.getDate() + (delta * 7));
    renderWeekView();
}

function goToThisWeek() { currentWeekDate = new Date(); renderWeekView(); }

function renderWeekView() {
    const he = document.getElementById('weekHeader');
    const be = document.getElementById('weekBody');
    const te = document.getElementById('weekTitle');
    if (!he || !be) return;
    
    const ws = new Date(currentWeekDate);
    const dow = ws.getDay();
    const dts = (dow + 1) % 7;
    ws.setDate(ws.getDate() - dts);
    ws.setHours(0, 0, 0, 0);
    
    const wd = [];
    for (let i = 0; i < 7; i++) { const d = new Date(ws); d.setDate(d.getDate() + i); wd.push(d); }
    
    const fj = gregorianToJalali(wd[0].getFullYear(), wd[0].getMonth() + 1, wd[0].getDate());
    const lj = gregorianToJalali(wd[6].getFullYear(), wd[6].getMonth() + 1, wd[6].getDate());
    te.textContent = toPersianDigits(fj.jd) + ' ' + persianMonths[fj.jm - 1] + ' تا ' + toPersianDigits(lj.jd) + ' ' + persianMonths[lj.jm - 1] + ' ' + toPersianDigits(lj.jy);
    
    const today = new Date();
    const todayJ = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    let hh = '<div class="week-time-header"></div>';
    wd.forEach(d => {
        const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const di = (d.getDay() + 1) % 7;
        const it = j.jy === todayJ.jy && j.jm === todayJ.jm && j.jd === todayJ.jd;
        hh += '<div class="week-day-header ' + (it ? 'today' : '') + '"><div class="week-day-name">' + persianWeekdays[di] + '</div><div class="week-day-number">' + toPersianDigits(j.jd) + '</div></div>';
    });
    he.innerHTML = hh;
    
    let tc = '<div class="week-time-column">';
    for (let h = 0; h < 24; h++) { tc += '<div class="week-time-slot">' + String(h).padStart(2, '0') + ':00</div>'; }
    tc += '</div>';
    
    let dc = '';
    wd.forEach((d, i) => {
        const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const dk = j.jy + '-' + String(j.jm).padStart(2, '0') + '-' + String(j.jd).padStart(2, '0');
        const it = j.jy === todayJ.jy && j.jm === todayJ.jm && j.jd === todayJ.jd;
        let dh = '<div class="week-day-column ' + (it ? 'today' : '') + '" data-date="' + dk + '">';
        for (let h = 0; h < 24; h++) { dh += '<div class="week-hour-slot" onclick="quickAddTaskForDateTime(\'' + dk + '\', ' + h + ')"></div>'; }
        dh += '</div>';
        dc += dh;
    });
    
    be.innerHTML = tc + dc;
    renderTasksOnWeekView(wd);
    renderCurrentTimeIndicator();
}

function renderTasksOnWeekView(wd) {
    const be = document.getElementById('weekBody');
    if (!be) return;
    wd.forEach((d, i) => {
        const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const dk = j.jy + '-' + String(j.jm).padStart(2, '0') + '-' + String(j.jd).padStart(2, '0');
        const dt = currentData.tasks.filter(t => {
            if (!t.dueDate) return false;
            const td = new Date(t.dueDate);
            const tj = gregorianToJalali(td.getFullYear(), td.getMonth() + 1, td.getDate());
            return (tj.jy + '-' + String(tj.jm).padStart(2, '0') + '-' + String(tj.jd).padStart(2, '0')) === dk;
        });
        const dc = be.querySelector('.week-day-column[data-date="' + dk + '"]');
        if (!dc) return;
        dt.forEach(t => {
            const td = new Date(t.dueDate);
            const h = td.getHours() || 9;
            const dur = t.duration || 1;
            const te = document.createElement('div');
            te.className = 'week-task priority-' + (t.priority || 'medium');
            te.style.top = (h * 60) + 'px';
            te.style.height = (dur * 60 - 4) + 'px';
            te.draggable = true;
            te.dataset.taskId = t.id;
            const ts = String(h).padStart(2, '0') + ':' + String(td.getMinutes()).padStart(2, '0');
            te.innerHTML = '<div class="week-task-title">' + t.title + '</div><div class="week-task-time">' + ts + ' - ' + dur + 'h</div>';
            te.onclick = e => { e.stopPropagation(); openEditTaskModal(t); };
            dc.appendChild(te);
        });
    });
}

function renderCurrentTimeIndicator() {
    const be = document.getElementById('weekBody');
    if (!be) return;
    be.querySelectorAll('.current-time-line').forEach(el => el.remove());
    const now = new Date();
    const todayJ = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const tdk = todayJ.jy + '-' + String(todayJ.jm).padStart(2, '0') + '-' + String(todayJ.jd).padStart(2, '0');
    const tc = be.querySelector('.week-day-column[data-date="' + tdk + '"]');
    if (!tc) return;
    const m = now.getHours() * 60 + now.getMinutes();
    const l = document.createElement('div');
    l.className = 'current-time-line';
    l.style.top = m + 'px';
    tc.appendChild(l);
}

function quickAddTaskForDateTime(dk, h) {
    const [jy, jm, jd] = dk.split('-').map(Number);
    const g = jalaliToGregorian(jy, jm, jd);
    const d = new Date(g.gy, g.gm - 1, g.gd, h, 0, 0);
    openModal('tasks');
    setTimeout(() => {
        const di = document.querySelector('[name="dueDate"]');
        if (di) di.value = d.toISOString().split('T')[0];
    }, 50);
}

function injectTaskViewIcons() {
    const ki = document.getElementById('kanbanViewIcon');
    const ci = document.getElementById('calendarViewIcon');
    const wi = document.getElementById('weekViewIcon');
    if (typeof icon === 'function') {
        if (ki) ki.innerHTML = icon('dashboard', 14);
        if (ci) ci.innerHTML = icon('calendar', 14);
        if (wi) wi.innerHTML = icon('calendar', 14);
    }
}

setTimeout(() => {
    injectTaskViewIcons();
    setInterval(() => { if (currentTaskView === 'week') renderCurrentTimeIndicator(); }, 60000);
}, 300);

console.log('[Calendar] Module loaded');

/* === reports.js === */
// ===== REPORTS MODULE =====
let currentReportType = 'overview';

function selectReportType(type) {
    currentReportType = type;
    document.querySelectorAll('.report-type-item').forEach(i => i.classList.toggle('active', i.dataset.type === type));
    generateReport();
}

function getDateRange(range) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = null;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    switch (range) {
        case 'today': start = today; break;
        case 'week': start = new Date(today); const dw = (start.getDay() + 1) % 7; start.setDate(start.getDate() - dw); break;
        case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'year': start = new Date(now.getFullYear(), 0, 1); break;
        default: return null;
    }
    return { start, end };
}

function isInRange(dateStr, range) {
    if (!range) return true;
    if (!dateStr) return false;
    try { const d = new Date(dateStr); return d >= range.start && d <= range.end; } catch (e) { return false; }
}

function getReportHeader(title, subtitle) {
    const now = new Date();
    const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const ds = toPersianDigits(j.jd) + ' ' + persianMonths[j.jm - 1] + ' ' + toPersianDigits(j.jy);
    const ts = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return '<div class="print-area"><div class="print-container"><div class="print-header"><div class="print-brand"><div class="print-logo">C</div><div class="print-brand-text"><h1>CRM Pro</h1><p>سیستم مدیریت ارتباط با مشتری</p></div></div><div class="print-meta"><div>📅 تاریخ: ' + ds + '</div><div>⏰ ساعت: ' + ts + '</div></div></div><h2 class="print-title">' + title + '</h2><p class="print-subtitle">' + subtitle + '</p>';
}

function getReportFooter() {
    return '<div class="print-footer"><div>CRM Pro - نسخه 1.0</div><div>این گزارش به صورت خودکار تولید شده است</div></div></div></div>';
}

function generateReport() {
    const preview = document.getElementById('reportPreview');
    const pa = document.getElementById('printActions');
    const dr = document.getElementById('reportDateRange').value;
    const range = getDateRange(dr);
    if (!preview) return;
    preview.innerHTML = '<div class="print-loading"><div class="print-loading-spinner"></div><div>در حال تولید گزارش...</div></div>';
    setTimeout(() => {
        let html = '';
        const rl = { all: 'همه زمان‌ها', today: 'امروز', week: 'این هفته', month: 'این ماه', year: 'امسال' }[dr];
        switch (currentReportType) {
            case 'overview': html = genOverview(range, rl); break;
            case 'tasks': html = genTasks(range, rl); break;
            case 'people': html = genPeople(range, rl); break;
            case 'overdue': html = genOverdue(); break;
            case 'activity': html = genActivity(range, rl); break;
            case 'weekly': html = genWeekly(); break;
        }
        preview.innerHTML = html;
        if (pa) pa.style.display = 'flex';
    }, 300);
}

function genOverview(range, rl) {
    const d = currentData;
    const tp = d.people.length, tt = d.tasks.length;
    const ct = d.tasks.filter(t => t.status === 'done').length;
    const cr = tt > 0 ? Math.round((ct / tt) * 100) : 0;
    return getReportHeader('گزارش کلی', 'خلاصه وضعیت - ' + rl) +
        '<div class="print-section"><div class="print-section-title">📊 آمار کلی</div><div class="print-stats">' +
        '<div class="print-stat accent"><div class="print-stat-value">' + toPersianDigits(tp) + '</div><div class="print-stat-label">مخاطبان</div></div>' +
        '<div class="print-stat"><div class="print-stat-value">' + toPersianDigits(tt) + '</div><div class="print-stat-label">کارها</div></div>' +
        '<div class="print-stat"><div class="print-stat-value">' + toPersianDigits(ct) + '</div><div class="print-stat-label">تکمیل شده</div></div>' +
        '<div class="print-stat accent"><div class="print-stat-value">' + toPersianDigits(cr) + '%</div><div class="print-stat-label">نرخ تکمیل</div></div>' +
        '<div class="print-stat"><div class="print-stat-value">' + toPersianDigits(d.ideas.length) + '</div><div class="print-stat-label">ایده‌ها</div></div>' +
        '<div class="print-stat"><div class="print-stat-value">' + toPersianDigits(d.projects.length) + '</div><div class="print-stat-label">پروژه‌ها</div></div>' +
        '</div></div>' + getReportFooter();
}

function genTasks(range, rl) {
    const tasks = currentData.tasks.filter(t => !range || isInRange(t.createdAtUtc, range) || isInRange(t.dueDate, range));
    let html = getReportHeader('گزارش کارها', toPersianDigits(tasks.length) + ' کار - ' + rl) +
        '<div class="print-section"><div class="print-section-title">📋 لیست کارها</div><table class="print-table"><thead><tr><th>عنوان</th><th>وضعیت</th><th>اولویت</th><th>سررسید</th></tr></thead><tbody>';
    if (!tasks.length) html += '<tr><td colspan="4" style="text-align:center;padding:30px;color:#a1a1aa;">کاری یافت نشد</td></tr>';
    else tasks.forEach(t => {
        const sl = { pending: 'در انتظار', 'in-progress': 'در حال انجام', review: 'بازبینی', done: 'انجام شده' }[t.status] || t.status;
        const sc = { pending: 'neutral', 'in-progress': 'info', review: 'warning', done: 'success' }[t.status] || 'neutral';
        const pl = { low: 'کم', medium: 'متوسط', high: 'بالا' }[t.priority] || 'متوسط';
        const pc = { low: 'success', medium: 'warning', high: 'danger' }[t.priority] || 'neutral';
        const dd = t.dueDate ? new Date(t.dueDate).toLocaleDateString('fa-IR') : '-';
        html += '<tr><td><strong>' + t.title + '</strong></td><td><span class="print-badge ' + sc + '">' + sl + '</span></td><td><span class="print-badge ' + pc + '">' + pl + '</span></td><td>' + dd + '</td></tr>';
    });
    html += '</tbody></table></div>' + getReportFooter();
    return html;
}

function genPeople(range, rl) {
    const people = currentData.people.filter(p => !range || isInRange(p.createdAtUtc, range));
    let html = getReportHeader('گزارش مخاطبان', toPersianDigits(people.length) + ' مخاطب') +
        '<div class="print-section"><div class="print-section-title">👥 لیست مخاطبان</div><table class="print-table"><thead><tr><th>نام</th><th>ایمیل</th><th>تلفن</th><th>شرکت</th></tr></thead><tbody>';
    if (!people.length) html += '<tr><td colspan="4" style="text-align:center;padding:30px;color:#a1a1aa;">مخاطبی یافت نشد</td></tr>';
    else people.forEach(p => { html += '<tr><td><strong>' + p.name + '</strong></td><td>' + (p.email || '-') + '</td><td>' + (p.phone || '-') + '</td><td>' + (p.company || '-') + '</td></tr>'; });
    html += '</tbody></table></div>' + getReportFooter();
    return html;
}

function genOverdue() {
    const now = new Date();
    const od = currentData.tasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now);
    let html = getReportHeader('گزارش کارهای عقب‌افتاده', toPersianDigits(od.length) + ' کار نیاز به پیگیری') +
        '<div class="print-section"><div class="print-section-title">⚠️ لیست</div><table class="print-table"><thead><tr><th>عنوان</th><th>اولویت</th><th>سررسید</th><th>تأخیر</th></tr></thead><tbody>';
    if (!od.length) html += '<tr><td colspan="4" style="text-align:center;padding:30px;color:#10b981;">✅ همه کارها به موقع هستند!</td></tr>';
    else od.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).forEach(t => {
        const dl = Math.floor((now - new Date(t.dueDate)) / 86400000);
        const pl = { low: 'کم', medium: 'متوسط', high: 'بالا' }[t.priority] || 'متوسط';
        const pc = { low: 'success', medium: 'warning', high: 'danger' }[t.priority] || 'neutral';
        html += '<tr><td><strong>' + t.title + '</strong></td><td><span class="print-badge ' + pc + '">' + pl + '</span></td><td>' + new Date(t.dueDate).toLocaleDateString('fa-IR') + '</td><td><span class="print-badge danger">' + toPersianDigits(dl) + ' روز</span></td></tr>';
    });
    html += '</tbody></table></div>' + getReportFooter();
    return html;
}

function genActivity(range, rl) {
    const logs = currentData.logs.filter(l => !range || isInRange(l.createdAtUtc, range)).slice(-50).reverse();
    let html = getReportHeader('گزارش فعالیت‌ها', toPersianDigits(logs.length) + ' فعالیت اخیر') +
        '<div class="print-section"><div class="print-section-title">📝 فعالیت‌ها</div><table class="print-table"><thead><tr><th>نوع</th><th>اقدام</th><th>جزئیات</th><th>تاریخ</th></tr></thead><tbody>';
    const tl = { person: 'مخاطب', task: 'کار', idea: 'ایده', note: 'یادداشت', project: 'پروژه' };
    const al = { create: 'ایجاد', update: 'ویرایش', delete: 'حذف' };
    if (!logs.length) html += '<tr><td colspan="4" style="text-align:center;padding:30px;color:#a1a1aa;">فعالیتی یافت نشد</td></tr>';
    else logs.forEach(l => { html += '<tr><td>' + (tl[l.entityType] || l.entityType) + '</td><td><span class="print-badge info">' + (al[l.action] || l.action) + '</span></td><td>' + l.details + '</td><td style="font-size:11px;color:#71717a;">' + new Date(l.createdAtUtc).toLocaleString('fa-IR') + '</td></tr>'; });
    html += '</tbody></table></div>' + getReportFooter();
    return html;
}

function genWeekly() {
    const now = new Date();
    const ws = new Date(now);
    const dw = (ws.getDay() + 1) % 7;
    ws.setDate(ws.getDate() - dw); ws.setHours(0, 0, 0, 0);
    const we = new Date(ws); we.setDate(we.getDate() + 6); we.setHours(23, 59, 59, 999);
    const wr = { start: ws, end: we };
    const wt = currentData.tasks.filter(t => isInRange(t.dueDate, wr) || isInRange(t.createdAtUtc, wr));
    const wa = currentData.logs.filter(l => isInRange(l.createdAtUtc, wr)).length;
    const sj = gregorianToJalali(ws.getFullYear(), ws.getMonth() + 1, ws.getDate());
    const ej = gregorianToJalali(we.getFullYear(), we.getMonth() + 1, we.getDate());
    const wl = toPersianDigits(sj.jd) + ' ' + persianMonths[sj.jm - 1] + ' تا ' + toPersianDigits(ej.jd) + ' ' + persianMonths[ej.jm - 1];
    return getReportHeader('گزارش هفتگی', 'عملکرد هفته ' + wl) +
        '<div class="print-section"><div class="print-stats"><div class="print-stat accent"><div class="print-stat-value">' + toPersianDigits(wt.length) + '</div><div class="print-stat-label">کارهای این هفته</div></div><div class="print-stat"><div class="print-stat-value">' + toPersianDigits(wa) + '</div><div class="print-stat-label">فعالیت‌ها</div></div></div></div>' +
        '<div class="print-section"><div class="print-section-title">📋 کارهای این هفته</div><table class="print-table"><thead><tr><th>عنوان</th><th>وضعیت</th><th>سررسید</th></tr></thead><tbody>' +
        (wt.length ? wt.map(t => '<tr><td><strong>' + t.title + '</strong></td><td>' + ({ pending: 'در انتظار', 'in-progress': 'در حال انجام', review: 'بازبینی', done: 'انجام شده' }[t.status] || t.status) + '</td><td>' + (t.dueDate ? new Date(t.dueDate).toLocaleDateString('fa-IR') : '-') + '</td></tr>').join('') : '<tr><td colspan="3" style="text-align:center;padding:30px;color:#a1a1aa;">کاری برای این هفته نیست</td></tr>') +
        '</tbody></table></div>' + getReportFooter();
}

function printReport() { window.print(); }

function injectReportIcons() {
    const icons = { iconOverview: 'dashboard', iconTasks: 'check', iconPeople: 'users', iconOverdue: 'clock', iconActivity: 'activity', iconWeekly: 'calendar' };
    if (typeof icon !== 'function') return;
    Object.keys(icons).forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = icon(icons[id], 16); });
}

setTimeout(injectReportIcons, 300);
console.log('[Reports] Module loaded');

/* === notifications.js === */
// ===== NOTIFICATIONS MODULE =====
let notificationInterval = null;
let currentNotifications = [];

function initNotifications() {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(checkNotifications, 30000);
    setTimeout(checkNotifications, 2000);
}

async function checkNotifications() {
    try {
        const r = await api('notifications?minutes=5');
        currentNotifications = Array.isArray(r) ? r : [];
        const badge = document.getElementById('notifBadge');
        if (badge) {
            if (currentNotifications.length > 0) { badge.textContent = currentNotifications.length; badge.style.display = 'flex'; }
            else badge.style.display = 'none';
        }
        currentNotifications.forEach(async n => {
            if (!n._shown) {
                showBrowserNotification(n);
                n._shown = true;
                await api('notifications', 'POST', { taskId: n.id });
            }
        });
        const dd = document.getElementById('notifDropdown');
        if (dd && dd.classList.contains('active')) renderNotificationDropdown();
    } catch (e) { console.warn('checkNotifications:', e); }
}

function showBrowserNotification(n) {
    showInAppToast(n);
    if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(n.title, { body: n.message || '', icon: '/icons/icon-192.svg', tag: n.id });
        notif.onclick = () => { window.focus(); switchView('tasks'); notif.close(); };
        setTimeout(() => notif.close(), 8000);
    }
}

function showInAppToast(n) {
    const t = document.createElement('div');
    t.className = 'browser-toast ' + n.type;
    t.innerHTML = '<div class="browser-toast-icon">' + (n.type === 'overdue' ? '⚠️' : '⏰') + '</div><div class="browser-toast-content"><div class="browser-toast-title">' + n.title + '</div><div class="browser-toast-message">' + (n.message || '') + '</div></div><button class="browser-toast-close" onclick="this.parentElement.remove()">×</button>';
    document.body.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 6000);
}

function toggleNotificationDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    dd.classList.toggle('active');
    if (dd.classList.contains('active')) {
        renderNotificationDropdown();
        setTimeout(() => {
            const ch = e => { if (!e.target.closest('#notifDropdown') && !e.target.closest('#notificationBtn')) { dd.classList.remove('active'); document.removeEventListener('click', ch); } };
            document.addEventListener('click', ch);
        }, 100);
    }
}

function renderNotificationDropdown() {
    const l = document.getElementById('notifList');
    if (!l) return;
    if (!currentNotifications.length) { l.innerHTML = '<div class="notification-empty"><div class="notification-empty-icon">🔔</div><div>اعلانی وجود ندارد</div></div>'; return; }
    l.innerHTML = currentNotifications.map(n => {
        const ic = n.type === 'overdue' ? '⚠️' : '⏰';
        return '<div class="notification-item" onclick="handleNotificationClick(\'' + n.id + '\')"><div class="notification-item-icon ' + n.type + '">' + ic + '</div><div class="notification-item-content"><div class="notification-item-title">' + n.title + '</div><div class="notification-item-message">' + (n.message || '') + '</div></div></div>';
    }).join('');
}

function handleNotificationClick(tid) {
    const dd = document.getElementById('notifDropdown');
    if (dd) dd.classList.remove('active');
    switchView('tasks');
    const t = currentData.tasks.find(x => x.id === tid);
    if (t && typeof openEditTaskModal === 'function') setTimeout(() => openEditTaskModal(t), 300);
}

function clearAllNotifications() {
    currentNotifications = [];
    renderNotificationDropdown();
    const b = document.getElementById('notifBadge');
    if (b) b.style.display = 'none';
}

// Enhance tasks modal with reminder + recurring
if (typeof modalForms !== 'undefined' && modalForms.tasks) {
    const origTaskSubmit = modalForms.tasks.submit;
    modalForms.tasks.submit = async (d) => {
        const body = document.getElementById('modalBody');
        const rm = body ? body.querySelector('[name="reminderMinutes"]') : null;
        const rc = body ? body.querySelector('[name="recurring"]') : null;
        if (rm && rm.value && d.dueDate) {
            const due = new Date(d.dueDate);
            d.reminderAt = new Date(due.getTime() - parseInt(rm.value) * 60000).toISOString();
        } else d.reminderAt = '';
        d.recurring = rc ? rc.value : 'none';
        await origTaskSubmit(d);
        try { await api('recurring/process', 'POST'); } catch (e) {}
    };
}

// Add reminder UI when tasks modal opens
const origOpenModal = window.openModal;
window.openModal = function(type) {
    origOpenModal(type);
    if (type === 'tasks') {
        setTimeout(() => {
            const mb = document.getElementById('modalBody');
            if (!mb || mb.querySelector('.reminder-section')) return;
            const rs = document.createElement('div');
            rs.className = 'reminder-section';
            rs.innerHTML = '<div class="reminder-section-title">⏰ یادآوری</div><div class="form-field"><div class="reminder-options"><div class="reminder-option" onclick="setReminder(this,\'5\')">5 دقیقه</div><div class="reminder-option" onclick="setReminder(this,\'15\')">15 دقیقه</div><div class="reminder-option" onclick="setReminder(this,\'30\')">30 دقیقه</div><div class="reminder-option" onclick="setReminder(this,\'60\')">1 ساعت</div><div class="reminder-option" onclick="setReminder(this,\'1440\')">1 روز</div><div class="reminder-option" onclick="setReminder(this,\'\')">بدون</div></div><input type="hidden" name="reminderMinutes" value=""/></div><div class="reminder-section-title" style="margin-top:12px;">🔁 تکرار</div><div class="form-field"><select class="form-select" name="recurring"><option value="none">بدون تکرار</option><option value="daily">روزانه</option><option value="weekly">هفتگی</option><option value="monthly">ماهانه</option><option value="yearly">سالانه</option></select></div>';
            mb.appendChild(rs);
        }, 100);
    }
};

function setReminder(el, minutes) {
    document.querySelectorAll('.reminder-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    const i = document.querySelector('[name="reminderMinutes"]');
    if (i) i.value = minutes;
}

setTimeout(initNotifications, 500);
console.log('[Notifications] Module loaded');

/* === backup.js === */
// ===== BACKUP MODULE =====
async function loadBackups() {
    const l = document.getElementById('backupList');
    if (!l) return;
    l.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
    try {
        const r = await api('backups');
        const backups = Array.isArray(r) ? r : [];
        if (!backups.length) { l.innerHTML = '<div class="empty-state"><div class="empty-title">نسخه پشتیبانی وجود ندارد</div><div class="empty-desc">اولین نسخه پشتیبان خود را ایجاد کنید</div></div>'; return; }
        l.innerHTML = backups.map(b => {
            const kb = (b.size / 1024).toFixed(1);
            const dt = new Date(b.createdAt).toLocaleString('fa-IR');
            return '<div class="backup-item"><div class="backup-icon">📦</div><div class="backup-info"><div class="backup-name">' + b.name.replace('.zip', '') + '</div><div class="backup-meta"><span>📅 ' + dt + '</span><span>💾 ' + kb + ' KB</span></div></div><div class="backup-actions"><button class="btn btn-secondary" onclick="restoreBackup(\'' + b.name + '\')">بازیابی</button><button class="btn btn-ghost" style="color:var(--danger);" onclick="deleteBackup(\'' + b.name + '\')">حذف</button></div></div>';
        }).join('');
    } catch (e) { l.innerHTML = '<div class="empty-state"><div class="empty-title">خطا در بارگذاری</div></div>'; }
}

async function createBackup() {
    const name = prompt('نام پشتیبان (اختیاری):', '');
    if (name === null) return;
    try {
        toast('در حال ایجاد پشتیبان...', 'info');
        const r = await api('backups', 'POST', { name: name || '' });
        if (r.success) { toast('پشتیبان ایجاد شد', 'success'); loadBackups(); }
        else toast('خطا: ' + (r.error || 'نامشخص'), 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

async function restoreBackup(name) {
    if (!confirm('آیا از بازیابی "' + name + '" مطمئن هستید؟\nداده‌های فعلی جایگزین می‌شوند.')) return;
    try {
        toast('در حال بازیابی...', 'info');
        const r = await api('backups/' + encodeURIComponent(name) + '/restore', 'POST');
        if (r.success) { toast('بازیابی شد! در حال بارگذاری...', 'success'); setTimeout(() => loadAllData(), 1000); setTimeout(() => loadBackups(), 1500); }
        else toast('خطا: ' + (r.error || 'نامشخص'), 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

async function deleteBackup(name) {
    if (!confirm('آیا از حذف "' + name + '" مطمئن هستید؟')) return;
    try {
        const r = await api('backups/' + encodeURIComponent(name), 'DELETE');
        if (r.success) { toast('حذف شد', 'success'); loadBackups(); }
        else toast('خطا در حذف', 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

async function loadExportGrid() {
    const g = document.getElementById('exportGrid');
    if (!g) return;
    const ents = [
        { name: 'people', label: 'مخاطبان', color: '#7c3aed' },
        { name: 'tasks', label: 'کارها', color: '#3b82f6' },
        { name: 'ideas', label: 'ایده‌ها', color: '#f59e0b' },
        { name: 'notes', label: 'یادداشت‌ها', color: '#10b981' },
        { name: 'projects', label: 'پروژه‌ها', color: '#ec4899' },
        { name: 'activity_logs', label: 'فعالیت‌ها', color: '#8b5cf6' }
    ];
    g.innerHTML = ents.map(e => {
        const c = currentData[e.name] ? currentData[e.name].length : 0;
        return '<div class="export-card"><div class="export-card-header"><div class="export-card-icon" style="background:' + e.color + '22;color:' + e.color + ';">📄</div><div><div class="export-card-title">' + e.label + '</div><div class="export-card-count">' + c + ' مورد</div></div></div><div class="export-card-actions"><button class="btn btn-secondary" onclick="exportEntity(\'' + e.name + '\')">📥 خروجی</button><button class="btn btn-secondary" onclick="openImportModal(\'' + e.name + '\')">📤 ورودی</button></div></div>';
    }).join('');
}

async function exportEntity(ent) {
    try {
        const r = await api('export/' + ent);
        if (r.success) {
            const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = ent + '_' + new Date().toISOString().split('T')[0] + '.json';
            a.click(); URL.revokeObjectURL(url);
            toast(r.count + ' مورد صادر شد', 'success');
        } else toast('خطا در خروجی', 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

let currentImportEntity = null, currentImportData = null, currentImportMode = 'append';

function openImportModal(ent) {
    currentImportEntity = ent; currentImportData = null; currentImportMode = 'append';
    document.getElementById('modalTitle').textContent = 'ورودی داده به ' + ent;
    document.getElementById('modalBody').innerHTML = '<div class="import-dropzone" id="importDropzone" onclick="document.getElementById(\'importFileInput\').click()"><div class="import-dropzone-icon">📤</div><div class="import-dropzone-text">فایل JSON را رها کنید یا کلیک کنید</div><input type="file" id="importFileInput" accept=".json" style="display:none;" onchange="handleImportFile(event)"/></div><div id="importPreview" style="display:none;"></div><div style="margin-top:12px;"><div class="form-label">حالت ورودی:</div><div class="import-options"><div class="import-option active" onclick="setImportMode(\'append\',this)"><div class="import-option-title">افزودن</div></div><div class="import-option" onclick="setImportMode(\'replace\',this)"><div class="import-option-title">جایگزینی</div></div></div></div>';
    const dz = document.getElementById('importDropzone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer.files[0]) processImportFile(e.dataTransfer.files[0]); });
    document.getElementById('modalSubmit').onclick = submitImport;
    document.getElementById('modalOverlay').classList.add('active');
}

function setImportMode(m, el) {
    currentImportMode = m;
    document.querySelectorAll('.import-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
}

function handleImportFile(e) { if (e.target.files[0]) processImportFile(e.target.files[0]); }

function processImportFile(f) {
    const r = new FileReader();
    r.onload = e => {
        try {
            const d = JSON.parse(e.target.result);
            if (!Array.isArray(d)) { toast('فایل باید آرایه JSON باشد', 'error'); return; }
            currentImportData = d;
            document.getElementById('importDropzone').innerHTML = '<div class="import-dropzone-icon" style="color:var(--success);">✓</div><div class="import-dropzone-text">فایل "' + f.name + '" بارگذاری شد</div><div class="import-dropzone-hint">' + d.length + ' مورد</div>';
            document.getElementById('importPreview').style.display = 'block';
            document.getElementById('importPreview').innerHTML = '<div style="padding:10px;background:var(--bg-surface-2);border-radius:var(--radius-sm);font-size:12px;color:var(--success);">✓ فایل معتبر - ' + d.length + ' آیتم</div>';
        } catch (err) { toast('فایل JSON نامعتبر', 'error'); }
    };
    r.readAsText(f);
}

async function submitImport() {
    if (!currentImportData) { toast('ابتدا یک فایل انتخاب کنید', 'error'); return; }
    try {
        toast('در حال ورودی...', 'info');
        const r = await api('import/' + currentImportEntity, 'POST', { data: currentImportData, mode: currentImportMode });
        if (r.success) { toast(r.imported + ' مورد وارد شد', 'success'); closeModal(); await loadAllData(); loadExportGrid(); }
        else toast('خطا: ' + (r.error || 'نامشخص'), 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

// ===== SETTINGS TABS =====
function setupSettingsTabs() {
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.onclick = () => {
            const tab = item.dataset.tab;
            document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.settings-tab').forEach(t => { t.style.display = t.dataset.tab === tab ? 'block' : 'none'; });
        };
    });
}

// ===== ATTACHMENTS =====
async function renderAttachmentsSection(et, eid, container) {
    if (!container) return;
    try {
        const r = await api('attachments/' + et + '/' + eid);
        const atts = Array.isArray(r) ? r : [];
        const imgs = atts.filter(a => a.mimeType && a.mimeType.startsWith('image/'));
        const files = atts.filter(a => !a.mimeType || !a.mimeType.startsWith('image/'));
        container.innerHTML = '<div class="attachments-section"><div class="attachments-header"><div class="attachments-title">📎 پیوست‌ها (' + atts.length + ')</div></div><div class="attachments-grid">' +
            imgs.map(a => '<div class="attachment-item" onclick="openAttachment(\'' + a.fileName + '\')"><img src="/api/attachment/' + a.fileName + '" alt=""/><button class="attachment-delete" onclick="event.stopPropagation(); deleteAttachment(\'' + a.id + '\',\'' + et + '\',\'' + eid + '\')">×</button></div>').join('') +
            files.map(a => '<div class="attachment-item" onclick="openAttachment(\'' + a.fileName + '\')" title="' + a.originalName + '"><div class="file-icon">📄</div><button class="attachment-delete" onclick="event.stopPropagation(); deleteAttachment(\'' + a.id + '\',\'' + et + '\',\'' + eid + '\')">×</button></div>').join('') +
            '<label class="upload-btn">➕<span>افزودن</span><input type="file" style="display:none;" onchange="uploadAttachment(event,\'' + et + '\',\'' + eid + '\')" multiple/></label></div></div>';
    } catch (e) { container.innerHTML = ''; }
}

function openAttachment(fn) { window.open('/api/attachment/' + fn, '_blank'); }

async function uploadAttachment(e, et, eid) {
    const files = e.target.files;
    if (!files.length) return;
    for (const f of files) {
        const r = new FileReader();
        r.onload = async ev => {
            const b64 = ev.target.result.split(',')[1];
            try {
                toast('در حال آپلود ' + f.name + '...', 'info');
                const res = await api('upload', 'POST', { entityType: et, entityId: eid, fileName: f.name, fileData: b64, mimeType: f.type });
                if (res.id) { toast(f.name + ' آپلود شد', 'success'); const c = document.getElementById('attachmentsContainer'); if (c) renderAttachmentsSection(et, eid, c); }
            } catch (err) { toast('خطا در آپلود', 'error'); }
        };
        r.readAsDataURL(f);
    }
}

async function deleteAttachment(aid, et, eid) {
    if (!confirm('حذف این پیوست؟')) return;
    try {
        const r = await api('attachment/' + aid, 'DELETE');
        if (r.success) { toast('پیوست حذف شد', 'success'); const c = document.getElementById('attachmentsContainer'); if (c) renderAttachmentsSection(et, eid, c); }
    } catch (e) { toast('خطا', 'error'); }
}

console.log('[Backup] Module loaded');

/* === relationships.js === */
// ===== RELATIONSHIPS MODULE (Phase 10) =====
const FREQ_DAYS = { weekly: 7, monthly: 30, quarterly: 90 };
const FREQ_LABELS = { weekly: 'هفتگی', monthly: 'ماهانه', quarterly: 'فصلی', none: 'بدون یادآوری' };

async function loadInteractions() {
    try {
        const r = await api('interactions');
        currentData.interactions = Array.isArray(r) ? r : [];
    } catch (e) { currentData.interactions = []; }
}

function personInteractions(pid) {
    return (currentData.interactions || []).filter(i => i.personId === pid);
}

function lastContactDate(p) {
    const ints = personInteractions(p.id);
    if (!ints.length) return p.createdAtUtc ? new Date(p.createdAtUtc) : null;
    const dates = ints.map(i => new Date(i.date || i.createdAtUtc)).sort((a, b) => b - a);
    return dates[0];
}

function relationshipStats(p) {
    const now = new Date();
    const last = lastContactDate(p);
    const daysSince = last ? Math.floor((now - last) / 86400000) : null;
    const freq = p.contactFrequency || 'none';
    const limit = FREQ_DAYS[freq];
    const overdue = !!limit && daysSince !== null && daysSince > limit;
    const ints90 = personInteractions(p.id).filter(i => (now - new Date(i.date || i.createdAtUtc)) < 90 * 86400000).length;
    let score = Math.min(50, ints90 * 10);
    if (daysSince !== null) {
        if (daysSince <= 7) score += 50;
        else if (daysSince <= 30) score += 30;
        else if (daysSince <= 90) score += 15;
    }
    return { last, daysSince, overdue, score: Math.min(100, score), freq };
}

function scoreClass(s) { return s >= 60 ? 'strong' : s >= 30 ? 'medium' : 'weak'; }

// ===== OCCASIONS (birthdays/anniversaries) =====
function nextOccasionDate(occ) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const todayJ = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    let jy = todayJ.jy;
    const gThis = jalaliToGregorian(jy, occ.jm, occ.jd);
    const dThis = new Date(gThis.gy, gThis.gm - 1, gThis.gd);
    if (dThis < now) jy++;
    const g = jalaliToGregorian(jy, occ.jm, occ.jd);
    return new Date(g.gy, g.gm - 1, g.gd);
}

function getUpcomingOccasions(days) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const out = [];
    currentData.people.forEach(p => {
        (p.occasions || []).forEach(o => {
            const d = nextOccasionDate(o);
            const diff = Math.round((d - now) / 86400000);
            if (diff >= 0 && diff <= days) out.push({ person: p, occ: o, date: d, diff: diff });
        });
    });
    return out.sort((a, b) => a.diff - b.diff);
}

// ===== ENHANCE PERSON PANEL =====
const origOpenPersonPanel = window.openPersonPanel;
window.openPersonPanel = function (id) {
    origOpenPersonPanel(id);
    setTimeout(() => enhancePersonPanel(id), 150);
};

function enhancePersonPanel(id) {
    const p = currentData.people.find(x => x.id === id);
    const body = document.getElementById('panelBody');
    if (!p || !body) return;
    const st = relationshipStats(p);
    const ints = personInteractions(id).slice().sort((a, b) => new Date(b.date || b.createdAtUtc) - new Date(a.date || a.createdAtUtc));

    const statusPill = st.overdue
        ? '<span class="pill danger">⚠️ نیاز به پیگیری</span>'
        : (st.freq !== 'none' ? '<span class="pill success">✅ در ارتباط</span>' : '<span class="pill neutral">بدون یادآوری</span>');

    const lastTxt = st.daysSince !== null ? (st.daysSince === 0 ? 'امروز' : st.daysSince + ' روز پیش') : 'هرگز';

    let html = '';

    // Relationship health
    html += '<div class="panel-section"><div class="panel-section-title">💪 سلامت رابطه</div>' +
        '<div class="rel-status-row"><span>امتیاز رابطه: <strong style="color:var(--text-primary);">' + toPersianDigits(st.score) + '</strong>/۱۰۰</span>' + statusPill + '</div>' +
        '<div class="rel-score-bar"><div class="rel-score-fill ' + scoreClass(st.score) + '" style="width:' + st.score + '%;"></div></div>' +
        '<div class="rel-status-row"><span>آخرین تماس: ' + lastTxt + '</span><span>فرکانس: ' + FREQ_LABELS[st.freq] + '</span></div>' +
        '<select class="form-select rel-freq-select" onchange="setContactFreq(\'' + id + '\', this.value)">' +
        Object.keys(FREQ_LABELS).map(k => '<option value="' + k + '"' + (st.freq === k ? ' selected' : '') + '>یادآوری تماس: ' + FREQ_LABELS[k] + '</option>').join('') +
        '</select>' +
        '<div class="rel-actions">' +
        '<button class="btn btn-primary" onclick="logContact(\'' + id + '\',\'call\')">📞 تماس</button>' +
        '<button class="btn btn-secondary" onclick="logContact(\'' + id + '\',\'meeting\')">🤝 جلسه</button>' +
        '<button class="btn btn-secondary" onclick="logContact(\'' + id + '\',\'message\')">💬 پیام</button>' +
        '</div></div>';

    // Occasions
    html += '<div class="panel-section"><div class="panel-section-title">🎂 مناسبت‌ها</div>';
    (p.occasions || []).forEach((o, idx) => {
        const d = nextOccasionDate(o);
        const diff = Math.round((d - new Date(new Date().toDateString())) / 86400000);
        html += '<div class="occasion-item"><div class="occasion-icon">' + (o.type === 'birthday' ? '🎂' : o.type === 'anniversary' ? '💍' : '⭐') + '</div><div class="occasion-info"><div class="occasion-title">' + o.title + '</div><div class="occasion-date">' + toPersianDigits(o.jd) + ' ' + persianMonths[o.jm - 1] + '</div></div>' + (diff <= 14 ? '<span class="occasion-soon">' + (diff === 0 ? 'امروز!' : toPersianDigits(diff) + ' روز') + '</span>' : '') + '<button class="icon-button" onclick="removeOccasion(\'' + id + '\',' + idx + ')">×</button></div>';
    });
    html += '<div class="mini-form">' +
        '<select id="occType"><option value="birthday">تولد</option><option value="anniversary">سالگرد</option><option value="custom">سفارشی</option></select>' +
        '<input id="occTitle" placeholder="عنوان (مثلاً تولد)"/>' +
        '<select id="occMonth">' + persianMonths.map((m, i) => '<option value="' + (i + 1) + '">' + m + '</option>').join('') + '</select>' +
        '<input id="occDay" type="number" min="1" max="31" placeholder="روز"/>' +
        '<button class="btn btn-secondary full" onclick="addOccasion(\'' + id + '\')">+ افزودن مناسبت</button></div></div>';

    // Timeline
    html += '<div class="panel-section"><div class="panel-section-title">📜 تاریخچه تعاملات (' + toPersianDigits(ints.length) + ')</div>';
    if (!ints.length) html += '<div style="font-size:12px;color:var(--text-tertiary);padding:8px 0;">هنوز تعاملی ثبت نشده. با دکمه‌های بالا اولین تماس را ثبت کن!</div>';
    else html += '<div class="activity-timeline">' + ints.slice(0, 8).map(i => {
        const ic = { call: '📞', meeting: '🤝', email: '📧', message: '💬', note: '📝' }[i.type] || '📌';
        return '<div class="timeline-item"><div class="timeline-dot create"></div><div class="timeline-content"><div class="timeline-text">' + ic + ' ' + (i.subject || i.type) + '</div><div class="timeline-meta">' + new Date(i.date || i.createdAtUtc).toLocaleDateString('fa-IR') + '</div></div></div>';
    }).join('') + '</div>';
    html += '</div>';

    body.insertAdjacentHTML('beforeend', html);
}

async function setContactFreq(pid, freq) {
    try { await api('people/' + pid, 'PUT', { contactFrequency: freq }); toast('فرکانس یادآوری تنظیم شد', 'success'); } catch (e) { toast('خطا', 'error'); }
}

async function logContact(pid, type) {
    try {
        await api('interactions', 'POST', { personId: pid, type: type, subject: ({ call: 'تماس تلفنی', meeting: 'جلسه حضوری', message: 'ارسال پیام' })[type], content: '', date: new Date().toISOString() });
        toast('تعامل ثبت شد! 💪', 'success');
        await loadInteractions();
        openPersonPanel(pid);
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

async function addOccasion(pid) {
    const p = currentData.people.find(x => x.id === pid);
    const type = document.getElementById('occType').value;
    const title = document.getElementById('occTitle').value || ({ birthday: 'تولد', anniversary: 'سالگرد', custom: 'مناسبت' })[type];
    const jm = parseInt(document.getElementById('occMonth').value);
    const jd = parseInt(document.getElementById('occDay').value);
    if (!jd || jd < 1 || jd > 31) { toast('روز معتبر وارد کن', 'error'); return; }
    const occasions = (p.occasions || []).slice();
    occasions.push({ type: type, title: title, jm: jm, jd: jd });
    try { await api('people/' + pid, 'PUT', { occasions: occasions }); toast('مناسبت اضافه شد 🎂', 'success'); openPersonPanel(pid); } catch (e) { toast('خطا', 'error'); }
}

async function removeOccasion(pid, idx) {
    const p = currentData.people.find(x => x.id === pid);
    const occasions = (p.occasions || []).slice();
    occasions.splice(idx, 1);
    try { await api('people/' + pid, 'PUT', { occasions: occasions }); toast('حذف شد', 'success'); openPersonPanel(pid); } catch (e) { toast('خطا', 'error'); }
}

// ===== DASHBOARD WIDGETS =====
function injectRelWidgets() {
    const grid = document.getElementById('insightsGrid');
    if (!grid || document.getElementById('relWidgets')) return;
    const div = document.createElement('div');
    div.id = 'relWidgets';
    div.className = 'charts-grid';
    div.innerHTML = '<div class="card"><div class="card-header"><div class="card-title">⚠️ نیاز به پیگیری</div></div><div id="overdueList"></div></div><div class="card"><div class="card-header"><div class="card-title">🎂 مناسبت‌های پیش رو</div></div><div id="occasionsList"></div></div>';
    grid.parentElement.insertBefore(div, grid.nextSibling);
}

function renderRelWidgets() {
    const ol = document.getElementById('overdueList');
    const ocl = document.getElementById('occasionsList');
    if (!ol || !ocl) return;

    const overdue = currentData.people.map(p => ({ p: p, st: relationshipStats(p) })).filter(x => x.st.overdue).sort((a, b) => b.st.daysSince - a.st.daysSince);
    ol.innerHTML = overdue.length ? overdue.slice(0, 5).map(x => '<div class="rel-widget-item" onclick="openPersonPanel(\'' + x.p.id + '\')"><div class="avatar" style="background:#ef4444;width:32px;height:32px;font-size:12px;">' + x.p.name.split(' ').map(w => w[0]).join('').slice(0, 2) + '</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + x.p.name + '</div><div style="font-size:11px;color:var(--text-tertiary);">' + toPersianDigits(x.st.daysSince) + ' روز بدون تماس</div></div><span class="pill danger">پیگیری</span></div>').join('') : '<div style="padding:24px;text-align:center;color:var(--text-tertiary);font-size:12px;">✅ همه روابط سالم هستند!</div>';

    const occs = getUpcomingOccasions(30);
    ocl.innerHTML = occs.length ? occs.slice(0, 5).map(o => '<div class="rel-widget-item" onclick="openPersonPanel(\'' + o.person.id + '\')"><div class="occasion-icon">' + (o.occ.type === 'birthday' ? '🎂' : '💍') + '</div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + o.occ.title + ' - ' + o.person.name + '</div><div style="font-size:11px;color:var(--text-tertiary);">' + toPersianDigits(o.date.getDate()) + '/' + toPersianDigits(o.date.getMonth() + 1) + ' میلادی</div></div><span class="occasion-soon">' + (o.diff === 0 ? 'امروز!' : toPersianDigits(o.diff) + ' روز') + '</span></div>').join('') : '<div style="padding:24px;text-align:center;color:var(--text-tertiary);font-size:12px;">مناسبتی در ۳۰ روز آینده نیست</div>';
}

// Patch loadAllData to include interactions + widgets
const origLoadAllData = window.loadAllData;
window.loadAllData = async function () {
    await origLoadAllData();
    await loadInteractions();
    injectRelWidgets();
    renderRelWidgets();
};

// Birthday/occasion + overdue toasts on start
setTimeout(async () => {
    await loadInteractions();
    injectRelWidgets();
    renderRelWidgets();
    const today = getUpcomingOccasions(0);
    today.forEach(o => toast('🎂 امروز مناسبت است: ' + o.occ.title + ' - ' + o.person.name, 'info'));
    const od = currentData.people.filter(p => relationshipStats(p).overdue).length;
    if (od > 0) setTimeout(() => toast('⚠️ ' + toPersianDigits(od) + ' نفر نیاز به پیگیری دارند', 'info'), 2500);
}, 1500);

console.log('[Relationships] Module loaded');

/* === smart.js === */
// ===== SMART MODULE (Phase 11) =====

// ---------- Natural Language Parser (Persian) ----------
const NL_DAY_NAMES = { 'شنبه': 6, 'یکشنبه': 0, 'دوشنبه': 1, 'سه‌شنبه': 2, 'چهارشنبه': 3, 'پنج‌شنبه': 4, 'پنجشنبه': 4, 'جمعه': 5 };

function parseNaturalTask(text) {
    const now = new Date();
    let date = null, hour = null, minute = 0;

    // --- Date ---
    if (/پس\s?فردا/.test(text)) { date = new Date(now); date.setDate(date.getDate() + 2); }
    else if (/فردا/.test(text)) { date = new Date(now); date.setDate(date.getDate() + 1); }
    else if (/امروز/.test(text)) { date = new Date(now); }
    else {
        const mIn = text.match(/(\d+)\s*روز\s*(دیگه|دیگر)/);
        if (mIn) { date = new Date(now); date.setDate(date.getDate() + parseInt(mIn[1])); }
        else if (/هفته\s*(بعد|دیگه|دیگر)/.test(text)) { date = new Date(now); date.setDate(date.getDate() + 7); }
        else {
            for (const name in NL_DAY_NAMES) {
                if (text.includes(name)) {
                    date = new Date(now);
                    const diff = (NL_DAY_NAMES[name] - date.getDay() + 7) % 7 || 7;
                    date.setDate(date.getDate() + diff);
                    break;
                }
            }
        }
    }

    // --- Time ---
    const mT = text.match(/ساعت\s*(\d{1,2})(?::(\d{1,2}))?/);
    if (mT) { hour = parseInt(mT[1]); if (mT[2]) minute = parseInt(mT[2]); }

    if (date && hour !== null) { date.setHours(hour, minute, 0, 0); }
    else if (date && hour === null) { date.setHours(9, 0, 0, 0); }
    else if (!date && hour !== null) { date = new Date(now); date.setHours(hour, minute, 0, 0); if (date < now) date.setDate(date.getDate() + 1); }

    // --- Priority ---
    let priority = 'medium';
    if (/فوری|خیلی\s*مهم|بحرانی/.test(text)) priority = 'high';
    else if (/کم\s*اهمیت|عادی/.test(text)) priority = 'low';

    // --- Person ---
    let person = null;
    for (const p of currentData.people) {
        if (p.name && text.includes(p.name)) { person = p; break; }
        const first = (p.name || '').split(' ')[0];
        if (first && first.length >= 3 && text.includes(first)) { person = p; break; }
    }

    // --- Clean title ---
    let title = text
        .replace(/ساعت\s*\d{1,2}(:\d{1,2})?/g, '')
        .replace(/پس\s?فردا|فردا|امروز/g, '')
        .replace(/هفته\s*(بعد|دیگه|دیگر)/g, '')
        .replace(/\d+\s*روز\s*(دیگه|دیگر)/g, '')
        .replace(/فوری|خیلی\s*مهم|بحرانی|کم\s*اهمیت|عادی/g, '');
    for (const name in NL_DAY_NAMES) title = title.replace(name, '');
    if (person) title = title.replace(person.name, '');
    title = title.replace(/\s+/g, ' ').replace(/^\s*(با|و)\s*/, '').replace(/\s*(با|درباره)\s*$/, '').trim();
    if (!title) title = text;

    return { title: title, dueDate: date, priority: priority, person: person };
}

function describeParse(r) {
    const parts = [];
    if (r.dueDate) parts.push('📅 ' + r.dueDate.toLocaleDateString('fa-IR') + ' ساعت ' + toPersianDigits(r.dueDate.getHours()) + ':' + String(r.dueDate.getMinutes()).padStart(2, '0'));
    if (r.priority === 'high') parts.push('🔴 فوری');
    if (r.person) parts.push('👤 ' + r.person.name);
    return parts.join('  •  ');
}

async function smartAddTask() {
    const input = document.getElementById('smartInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) { toast('متنی بنویس! مثلاً: فردا ساعت 3 جلسه با رضا', 'error'); return; }

    const r = parseNaturalTask(text);
    try {
        await api('tasks', 'POST', {
            title: r.title,
            description: '',
            dueDate: r.dueDate ? r.dueDate.toISOString() : '',
            priority: r.priority,
            status: 'pending',
            personId: r.person ? r.person.id : '',
            projectId: '',
            tags: []
        });
        const desc = describeParse(r);
        toast('✅ ایجاد شد' + (desc ? ' — ' + desc : ''), 'success');
        input.value = '';
        await loadAllData();
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

function injectSmartBar() {
    const tv = document.getElementById('view-tasks');
    if (!tv || document.getElementById('smartBar')) return;
    const bar = document.createElement('div');
    bar.id = 'smartBar';
    bar.className = 'smart-bar';
    bar.innerHTML = '<span class="smart-icon">⚡</span><input id="smartInput" placeholder="ورودی هوشمند: «فردا ساعت 3 جلسه با رضا درباره پروژه وب» — Enter بزن"/><button class="btn btn-primary" onclick="smartAddTask()">افزودن</button>';
    const ph = tv.querySelector('.page-header');
    ph.parentElement.insertBefore(bar, ph.nextSibling);
    const hint = document.createElement('div');
    hint.className = 'smart-hint';
    hint.textContent = '💡 می‌فهمد: امروز/فردا/پس‌فردا/جمعه/۳ روز دیگه/هفته بعد + ساعت X + فوری + نام مخاطب';
    bar.parentElement.insertBefore(hint, bar.nextSibling);
    bar.querySelector('#smartInput').addEventListener('keydown', e => { if (e.key === 'Enter') smartAddTask(); });
}

// ---------- Time Blocking ----------
function attachTimeBlockHandlers() {
    document.querySelectorAll('.week-hour-slot').forEach(slot => {
        if (slot.dataset.tbAttached) return;
        slot.dataset.tbAttached = '1';
        slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', async e => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            if (!draggedTask) return;
            const col = slot.closest('.week-day-column');
            if (!col) return;
            const dk = col.dataset.date;
            const hour = Array.from(col.children).indexOf(slot);
            const [jy, jm, jd] = dk.split('-').map(Number);
            const g = jalaliToGregorian(jy, jm, jd);
            const nd = new Date(g.gy, g.gm - 1, g.gd, hour, 0, 0);
            try {
                await api('tasks/' + draggedTask.id, 'PUT', { dueDate: nd.toISOString() });
                toast('⏰ زمان‌بندی شد: ' + (hour < 12 ? 'صبح' : hour < 17 ? 'ظهر' : 'شب') + ' ساعت ' + toPersianDigits(hour) + ':00', 'success');
                draggedTask = null;
                await loadAllData();
            } catch (err) { toast('خطا: ' + err.message, 'error'); }
        });
    });
}

function renderUnscheduledStrip() {
    const wv = document.getElementById('weekView');
    if (!wv) return;
    let strip = document.getElementById('unscheduledStrip');
    if (!strip) {
        strip = document.createElement('div');
        strip.id = 'unscheduledStrip';
        strip.className = 'unscheduled-strip';
        wv.insertBefore(strip, wv.querySelector('.week-view-container'));
    }
    const uns = currentData.tasks.filter(t => !t.dueDate && t.status !== 'done');
    strip.innerHTML = '<div class="unscheduled-title">📥 بدون زمان‌بندی — بکش و روی یک ساعت رها کن (' + toPersianDigits(uns.length) + ')</div><div class="unscheduled-chips">' +
        (uns.length ? uns.map(t => '<div class="unscheduled-chip priority-' + (t.priority || 'medium') + '" draggable="true" ondragstart="startDragTask(event,\'' + t.id + '\')">' + t.title + '</div>').join('') : '<span style="font-size:11px;color:var(--text-tertiary);">همه کارها زمان‌بندی شده‌اند ✅</span>') +
        '</div>';
}

// Wrap renderWeekView to attach handlers after each render
const origRenderWeekView = window.renderWeekView;
window.renderWeekView = function () {
    origRenderWeekView();
    attachTimeBlockHandlers();
    renderUnscheduledStrip();
};

// Init
setTimeout(injectSmartBar, 400);
console.log('[Smart] Module loaded (NLP + Time Blocking)');

/* === graph.js === */
// ===== KNOWLEDGE LINKS - SIMPLE VERSION (Phase 12 v2) =====
// No syntax needed! Just click to connect.

function allKnowledgeItems() {
    const notes = (currentData.notes || []).map(n => ({ id: n.id, ktype: 'note', title: n.title || '', content: n.content || '', raw: n }));
    const ideas = (currentData.ideas || []).map(i => ({ id: i.id, ktype: 'idea', title: i.title || '', content: i.description || '', raw: i }));
    return notes.concat(ideas);
}

function knowledgeItem(id) { return allKnowledgeItems().find(x => x.id === id); }

function getBacklinks(item) {
    return allKnowledgeItems().filter(o => o.id !== item.id && (o.raw.links || []).includes(item.id));
}

// ===== LINK PICKER IN MODAL (click to connect) =====
const origOpenModalL = window.openModal;
window.openModal = function (type) {
    origOpenModalL(type);
    if (type === 'notes' || type === 'ideas') setTimeout(() => injectLinkPicker(null), 120);
};

function injectLinkPicker(currentItem) {
    const mb = document.getElementById('modalBody');
    if (!mb || mb.querySelector('#linkPickerField')) return;
    const others = allKnowledgeItems().filter(x => !currentItem || x.id !== currentItem.id);
    const selected = currentItem ? (currentItem.raw.links || []) : [];
    const field = document.createElement('div');
    field.className = 'form-field';
    field.id = 'linkPickerField';
    field.innerHTML = '<label class="form-label">🔗 اتصال به (اختیاری — روی آیتم کلیک کن)</label><div class="link-picker" id="linkPicker">' +
        (others.length ? others.map(o => '<span class="link-chip' + (selected.includes(o.id) ? ' active' : '') + '" data-id="' + o.id + '" onclick="toggleLinkChip(this)">' + (o.ktype === 'note' ? '📝 ' : '💡 ') + o.title + '</span>').join('') : '<span style="font-size:11px;color:var(--text-tertiary);">آیتم دیگری وجود ندارد</span>') +
        '</div>';
    mb.appendChild(field);
}

function toggleLinkChip(el) { el.classList.toggle('active'); }

function readSelectedLinks() {
    const p = document.getElementById('linkPicker');
    if (!p) return [];
    return Array.from(p.querySelectorAll('.link-chip.active')).map(c => c.dataset.id);
}

// Save links on create
['notes', 'ideas'].forEach(t => {
    const orig = modalForms[t].submit;
    modalForms[t].submit = async d => { d.links = readSelectedLinks(); await orig(d); };
});

// ===== CONNECTION CHIPS ON CARDS =====
function decorateCard(card, item) {
    if (!card || card.dataset.decorated) return;
    card.dataset.decorated = '1';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openKnowledgePanel(item.id));
    const outs = (item.links || []).map(knowledgeItem).filter(Boolean);
    const backs = getBacklinks(item);
    if (outs.length || backs.length) {
        const row = document.createElement('div');
        row.className = 'conn-row';
        row.innerHTML = outs.map(l => '<span class="conn-chip" data-id="' + l.id + '">→ ' + (l.ktype === 'note' ? '📝' : '💡') + ' ' + l.title + '</span>').join('') +
            backs.map(b => '<span class="conn-chip back" data-id="' + b.id + '">← ' + (b.ktype === 'note' ? '📝' : '💡') + ' ' + b.title + '</span>').join('');
        card.appendChild(row);
        row.querySelectorAll('.conn-chip').forEach(ch => ch.addEventListener('click', e => { e.stopPropagation(); openKnowledgePanel(ch.dataset.id); }));
    }
}

function decorateCards() {
    const nc = document.querySelectorAll('#notesGrid .note-card');
    currentData.notes.forEach((n, i) => decorateCard(nc[i], n));
    const ic = document.querySelectorAll('#ideasGrid .note-card');
    currentData.ideas.forEach((it, i) => decorateCard(ic[i], it));
}

const origRenderNotesL = window.renderNotes;
window.renderNotes = function () { origRenderNotesL(); decorateCards(); };
const origRenderIdeasL = window.renderIdeas;
window.renderIdeas = function () { origRenderIdeasL(); decorateCards(); };

// ===== PANEL (simple) =====
function openKnowledgePanel(id) {
    const item = knowledgeItem(id);
    if (!item) return;
    const outs = (item.raw.links || []).map(knowledgeItem).filter(Boolean);
    const backs = getBacklinks(item);
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';

    document.getElementById('panelTitle').textContent = (item.ktype === 'note' ? '📝 ' : '💡 ') + item.title;

    let html = '<div class="panel-section"><div class="panel-section-title">محتوا</div><div class="knowledge-content">' + (item.content || '<span style="color:var(--text-tertiary);">خالی</span>') + '</div></div>';

    html += '<div class="panel-section"><div class="panel-section-title">🔗 متصل به (' + toPersianDigits(outs.length) + ')</div>' +
        (outs.length ? outs.map(o => '<div class="backlink-item" onclick="openKnowledgePanel(\'' + o.id + '\')">' + (o.ktype === 'note' ? '📝' : '💡') + ' ' + o.title + '</div>').join('') : '<div style="font-size:12px;color:var(--text-tertiary);">به چیزی متصل نیست — با دکمه ویرایش اتصال بده</div>') + '</div>';

    html += '<div class="panel-section"><div class="panel-section-title">🔙 اشاره کرده‌اند (' + toPersianDigits(backs.length) + ')</div>' +
        (backs.length ? backs.map(b => '<div class="backlink-item" onclick="openKnowledgePanel(\'' + b.id + '\')">' + (b.ktype === 'note' ? '📝' : '💡') + ' ' + b.title + '</div>').join('') : '<div style="font-size:12px;color:var(--text-tertiary);">هیچ‌کس</div>') + '</div>';

    document.getElementById('panelBody').innerHTML = html;
    document.getElementById('panelActions').innerHTML = '<button class="btn btn-secondary" onclick="openEditKnowledgeModal(\'' + id + '\')">' + mk('edit', 14) + ' ویرایش و اتصال</button><button class="btn btn-ghost" style="color:var(--danger);" onclick="confirmDelete(\'' + item.ktype + '\',\'' + id + '\')">' + mk('trash', 14) + ' حذف</button>';
    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('slidePanel').classList.add('active');
}

function openEditKnowledgeModal(id) {
    const item = knowledgeItem(id);
    if (!item) return;
    document.getElementById('modalTitle').textContent = 'ویرایش ' + (item.ktype === 'note' ? 'یادداشت' : 'ایده');
    const b = document.getElementById('modalBody');
    b.innerHTML = '<div class="form-field"><label class="form-label">عنوان *</label><input class="form-input" name="title" value="' + item.title + '"/></div><div class="form-field"><label class="form-label">محتوا</label><textarea class="form-textarea" name="content" rows="5">' + item.content + '</textarea></div>';
    setTimeout(() => injectLinkPicker(item), 50);
    document.getElementById('modalSubmit').onclick = async () => {
        const data = { title: b.querySelector('[name="title"]').value, links: readSelectedLinks() };
        if (item.ktype === 'note') data.content = b.querySelector('[name="content"]').value;
        else data.description = b.querySelector('[name="content"]').value;
        if (!data.title) { toast('عنوان الزامی است', 'error'); return; }
        try { await api((item.ktype === 'note' ? 'notes/' : 'ideas/') + id, 'PUT', data); toast('ذخیره شد', 'success'); closeModal(); await loadAllData(); openKnowledgePanel(id); } catch (e) { toast('خطا', 'error'); }
    };
    document.getElementById('modalOverlay').classList.add('active');
}

// ===== GRAPH (auto from clicks) =====
let graphAnim = null;

function renderGraphView() {
    const container = document.getElementById('graphContainer');
    if (!container) return;
    if (graphAnim) { cancelAnimationFrame(graphAnim); graphAnim = null; }

    const items = allKnowledgeItems();
    if (!items.length) {
        container.innerHTML = '<div class="empty-state" style="padding:80px 20px;"><div class="empty-title">🕸️ هنوز گرافی نیست</div><div class="empty-desc">یک یادداشت بساز و با «🔗 اتصال به» آن را به بقیه وصل کن!</div></div>';
        return;
    }

    const W = container.clientWidth || 900, H = container.clientHeight || 560;
    const nodes = items.map(it => ({ id: it.id, title: it.title, ktype: it.ktype, x: W / 2 + (Math.random() - 0.5) * 400, y: H / 2 + (Math.random() - 0.5) * 300, vx: 0, vy: 0, fx: null, fy: null }));
    const nodeById = {}; nodes.forEach(n => nodeById[n.id] = n);
    const edges = []; const seen = new Set();
    items.forEach(it => (it.raw.links || []).forEach(t => {
        if (nodeById[t]) { const k = [it.id, t].sort().join('|'); if (!seen.has(k)) { seen.add(k); edges.push([it.id, t]); } }
    }));

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    const edgeEls = edges.map(() => { const l = document.createElementNS(svgNS, 'line'); l.setAttribute('class', 'graph-edge'); svg.appendChild(l); return l; });
    const nodeEls = nodes.map(n => {
        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('class', 'graph-node');
        const c = document.createElementNS(svgNS, 'circle');
        const deg = edges.filter(e => e[0] === n.id || e[1] === n.id).length;
        c.setAttribute('r', 8 + Math.min(10, deg * 2));
        c.setAttribute('fill', n.ktype === 'note' ? '#3b82f6' : '#f59e0b');
        c.setAttribute('stroke', '#0a0a0b');
        c.setAttribute('stroke-width', '2');
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('class', 'graph-label');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dy', -14);
        t.textContent = n.title.length > 18 ? n.title.slice(0, 18) + '…' : n.title;
        g.appendChild(c); g.appendChild(t);
        svg.appendChild(g);

        let downX = 0, downY = 0, moved = false;
        g.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; moved = false; n.fx = n.x; n.fy = n.y; });
        g.addEventListener('pointermove', e => {
            if (n.fx === null) return;
            if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) moved = true;
            const rect = svg.getBoundingClientRect();
            n.fx = e.clientX - rect.left; n.fy = e.clientY - rect.top;
        });
        g.addEventListener('pointerup', () => { n.fx = null; n.fy = null; if (!moved) openKnowledgePanel(n.id); });
        return g;
    });

    container.innerHTML = '';
    container.appendChild(svg);
    const legend = document.createElement('div');
    legend.className = 'graph-legend';
    legend.innerHTML = '<div class="graph-legend-item"><div class="graph-legend-dot" style="background:#3b82f6;"></div>یادداشت</div><div class="graph-legend-item"><div class="graph-legend-dot" style="background:#f59e0b;"></div>ایده</div>';
    container.appendChild(legend);
    const hint = document.createElement('div');
    hint.className = 'graph-hint';
    hint.textContent = '🖱️ بکش • کلیک = باز کردن';
    container.appendChild(hint);

    let alpha = 1;
    function tick() {
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            const d2 = dx * dx + dy * dy || 1;
            const f = 2200 / d2; const d = Math.sqrt(d2);
            dx /= d; dy /= d;
            a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
        }
        edges.forEach(([s, t]) => {
            const a = nodeById[s], b = nodeById[t];
            let dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const f = (d - 120) * 0.02;
            dx /= d; dy /= d;
            a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
        });
        nodes.forEach(n => {
            n.vx += (W / 2 - n.x) * 0.002; n.vy += (H / 2 - n.y) * 0.002;
            n.vx *= 0.85; n.vy *= 0.85;
            if (n.fx !== null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; }
            else { n.x += n.vx * alpha; n.y += n.vy * alpha; }
            n.x = Math.max(30, Math.min(W - 30, n.x));
            n.y = Math.max(30, Math.min(H - 30, n.y));
        });
        edges.forEach(([s, t], i) => {
            edgeEls[i].setAttribute('x1', nodeById[s].x); edgeEls[i].setAttribute('y1', nodeById[s].y);
            edgeEls[i].setAttribute('x2', nodeById[t].x); edgeEls[i].setAttribute('y2', nodeById[t].y);
        });
        nodes.forEach((n, i) => nodeEls[i].setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')'));
        alpha *= 0.995;
        if (alpha > 0.02) graphAnim = requestAnimationFrame(tick);
    }
    tick();
}

const origSwitchViewL = window.switchView;
window.switchView = function (v) { origSwitchViewL(v); if (v === 'graph') setTimeout(renderGraphView, 100); };

setTimeout(() => {
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.view === 'graph') {
            const s = link.querySelector('.nav-icon');
            if (s && typeof icon === 'function') s.innerHTML = icon('sparkle', 16);
        }
    });
}, 400);

console.log('[KnowledgeLinks] SIMPLE version loaded');

/* === gamification.js === */
// ===== GAMIFICATION MODULE (Phase 13) =====

const ACHIEVEMENTS = [
    { id: 'first_task', icon: '🎯', title: 'اولین قدم', desc: 'اولین کار خود را تکمیل کن' },
    { id: 'ten_tasks', icon: '🔟', title: 'ده‌تایی', desc: '۱۰ کار را تکمیل کن' },
    { id: 'fifty_tasks', icon: '💪', title: 'قهرمان', desc: '۵۰ کار را تکمیل کن' },
    { id: 'hundred_tasks', icon: '🏆', title: 'استاد', desc: '۱۰۰ کار را تکمیل کن' },
    { id: 'streak_3', icon: '🔥', title: '۳ روز پشت سر هم', desc: '۳ روز متوالی کار کن' },
    { id: 'streak_7', icon: '⚡', title: 'هفته کامل', desc: '۷ روز متوالی کار کن' },
    { id: 'streak_30', icon: '🌟', title: 'یک ماه', desc: '۳۰ روز متوالی کار کن' },
    { id: 'first_note', icon: '📝', title: 'نویسنده', desc: 'اولین یادداشت را بنویس' },
    { id: 'first_idea', icon: '💡', title: 'خلاق', desc: 'اولین ایده را ثبت کن' },
    { id: 'level_5', icon: '⭐', title: 'سطح ۵', desc: 'به سطح ۵ برس' },
    { id: 'level_10', icon: '💎', title: 'الماس', desc: 'به سطح ۱۰ برس' },
    { id: 'early_bird', icon: '🌅', title: 'سحرخیز', desc: 'یک کار را قبل از ساعت ۷ تکمیل کن' }
];

function getGamStats() {
    const stats = JSON.parse(localStorage.getItem('crm_gam_stats') || '{}');
    return {
        streak: stats.streak || 0,
        lastActiveDate: stats.lastActiveDate || null,
        karma: stats.karma || 0,
        level: stats.level || 1,
        unlockedAchievements: stats.unlockedAchievements || [],
        totalCompleted: stats.totalCompleted || 0
    };
}

function saveGamStats(stats) {
    localStorage.setItem('crm_gam_stats', JSON.stringify(stats));
}

function addKarma(amount) {
    const stats = getGamStats();
    stats.karma += amount;
    const newLevel = Math.floor(stats.karma / 100) + 1;
    if (newLevel > stats.level) {
        stats.level = newLevel;
        checkAchievements();
    }
    saveGamStats(stats);
    renderGamBar();
}

function updateStreak() {
    const stats = getGamStats();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (stats.lastActiveDate === today) return; // Already active today
    
    if (stats.lastActiveDate === yesterday) {
        stats.streak++;
    } else if (stats.lastActiveDate !== today) {
        stats.streak = 1;
    }
    
    stats.lastActiveDate = today;
    saveGamStats(stats);
    checkAchievements();
    renderGamBar();
}

function checkAchievements() {
    const stats = getGamStats();
    const completed = currentData.tasks.filter(t => t.status === 'done').length;
    stats.totalCompleted = completed;
    
    const newUnlocks = [];
    
    // Task achievements
    if (completed >= 1 && !stats.unlockedAchievements.includes('first_task')) {
        stats.unlockedAchievements.push('first_task');
        newUnlocks.push('first_task');
    }
    if (completed >= 10 && !stats.unlockedAchievements.includes('ten_tasks')) {
        stats.unlockedAchievements.push('ten_tasks');
        newUnlocks.push('ten_tasks');
    }
    if (completed >= 50 && !stats.unlockedAchievements.includes('fifty_tasks')) {
        stats.unlockedAchievements.push('fifty_tasks');
        newUnlocks.push('fifty_tasks');
    }
    if (completed >= 100 && !stats.unlockedAchievements.includes('hundred_tasks')) {
        stats.unlockedAchievements.push('hundred_tasks');
        newUnlocks.push('hundred_tasks');
    }
    
    // Streak achievements
    if (stats.streak >= 3 && !stats.unlockedAchievements.includes('streak_3')) {
        stats.unlockedAchievements.push('streak_3');
        newUnlocks.push('streak_3');
    }
    if (stats.streak >= 7 && !stats.unlockedAchievements.includes('streak_7')) {
        stats.unlockedAchievements.push('streak_7');
        newUnlocks.push('streak_7');
    }
    if (stats.streak >= 30 && !stats.unlockedAchievements.includes('streak_30')) {
        stats.unlockedAchievements.push('streak_30');
        newUnlocks.push('streak_30');
    }
    
    // Note/Idea achievements
    if (currentData.notes.length > 0 && !stats.unlockedAchievements.includes('first_note')) {
        stats.unlockedAchievements.push('first_note');
        newUnlocks.push('first_note');
    }
    if (currentData.ideas.length > 0 && !stats.unlockedAchievements.includes('first_idea')) {
        stats.unlockedAchievements.push('first_idea');
        newUnlocks.push('first_idea');
    }
    
    // Level achievements
    if (stats.level >= 5 && !stats.unlockedAchievements.includes('level_5')) {
        stats.unlockedAchievements.push('level_5');
        newUnlocks.push('level_5');
    }
    if (stats.level >= 10 && !stats.unlockedAchievements.includes('level_10')) {
        stats.unlockedAchievements.push('level_10');
        newUnlocks.push('level_10');
    }
    
    saveGamStats(stats);
    
    // Celebrate new unlocks
    newUnlocks.forEach(id => {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) celebrateAchievement(ach);
    });
    
    renderAchievements();
}

function celebrateAchievement(ach) {
    // Confetti
    const colors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    for (let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.top = '-10px';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = Math.random() * 0.5 + 's';
        conf.style.animationDuration = (2 + Math.random() * 2) + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 5000);
    }
    
    // Toast
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = '<div class="achievement-toast-icon">' + ach.icon + '</div><div><div class="achievement-toast-title">🏅 دستاورد جدید!</div><div class="achievement-toast-desc">' + ach.title + '</div></div>';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
    
    toast('🏅 ' + ach.title + ' — ' + ach.desc, 'success');
}

function renderGamBar() {
    const bar = document.getElementById('gamBar');
    if (!bar) return;
    const stats = getGamStats();
    const karmaInLevel = stats.karma % 100;
    const progress = karmaInLevel;
    
    bar.innerHTML = '<div class="gam-stat streak"><span class="gam-stat-icon streak-fire">🔥</span><span class="gam-stat-value">' + toPersianDigits(stats.streak) + '</span> روز</div>' +
        '<div class="gam-stat level"><span class="gam-stat-icon">⭐</span><span class="gam-stat-value">سطح ' + toPersianDigits(stats.level) + '</span></div>' +
        '<div class="gam-stat karma"><span class="gam-stat-icon">💫</span><span class="gam-stat-value">' + toPersianDigits(stats.karma) + '</span> کارما</div>' +
        '<div class="level-progress"><div class="level-label"><span>پیشرفت به سطح ' + toPersianDigits(stats.level + 1) + '</span><span>' + toPersianDigits(progress) + '/100</span></div><div class="level-progress-bar"><div class="level-progress-fill" style="width:' + progress + '%;"></div></div></div>';
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    const stats = getGamStats();
    
    grid.innerHTML = ACHIEVEMENTS.map(ach => {
        const unlocked = stats.unlockedAchievements.includes(ach.id);
        return '<div class="achievement-card ' + (unlocked ? 'unlocked' : 'locked') + '"><span class="achievement-icon">' + ach.icon + '</span><div class="achievement-title">' + ach.title + '</div><div class="achievement-desc">' + ach.desc + '</div>' + (unlocked ? '<div class="achievement-date">✓ باز شده</div>' : '<div class="achievement-date">🔒 قفل</div>') + '</div>';
    }).join('');
}

function injectGamBar() {
    const dash = document.getElementById('view-dashboard');
    if (!dash || document.getElementById('gamBar')) return;
    const bar = document.createElement('div');
    bar.id = 'gamBar';
    bar.className = 'gam-bar';
    const ph = dash.querySelector('.page-header');
    ph.parentElement.insertBefore(bar, ph.nextSibling);
    renderGamBar();
}

function injectAchievementsSection() {
    const dash = document.getElementById('view-dashboard');
    if (!dash || document.getElementById('achievementsSection')) return;
    const section = document.createElement('div');
    section.id = 'achievementsSection';
    section.style.marginTop = '20px';
    section.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div><div style="font-size:14px;font-weight:600;color:var(--text-primary);">🏅 دستاوردها</div><div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">' + toPersianDigits(getGamStats().unlockedAchievements.length) + ' از ' + toPersianDigits(ACHIEVEMENTS.length) + ' باز شده</div></div></div><div class="achievements-grid" id="achievementsGrid"></div>';
    const tl = dash.querySelector('.card');
    tl.parentElement.insertBefore(section, tl.nextSibling);
    renderAchievements();
}

// Hook into task completion to add karma + update streak
const origToggleTaskStatus = window.toggleTaskStatus;
window.toggleTaskStatus = async function(tid) {
    const t = currentData.tasks.find(x => x.id === tid);
    if (!t) return;
    const ns = t.status === 'done' ? 'pending' : 'done';
    try {
        await api('tasks/' + tid, 'PUT', { status: ns });
        if (ns === 'done') {
            addKarma(10);
            updateStreak();
            const hour = new Date().getHours();
            if (hour < 7 && !getGamStats().unlockedAchievements.includes('early_bird')) {
                const stats = getGamStats();
                stats.unlockedAchievements.push('early_bird');
                saveGamStats(stats);
                celebrateAchievement(ACHIEVEMENTS.find(a => a.id === 'early_bird'));
            }
            toast('کار تکمیل شد! +10 کارما 🎉', 'success');
        } else {
            toast('به حالت در انتظار بازگشت', 'success');
        }
        await loadAllData();
        if (typeof renderCalendar === 'function') renderCalendar();
    } catch (e) { toast('خطا', 'error'); }
};

// Hook into task creation
const origSubmitModal = window.submitModal;
window.submitModal = async function() {
    const type = currentModalType;
    await origSubmitModal();
    if (type === 'tasks') addKarma(5);
    if (type === 'notes') { const stats = getGamStats(); if (!stats.unlockedAchievements.includes('first_note')) checkAchievements(); }
    if (type === 'ideas') { const stats = getGamStats(); if (!stats.unlockedAchievements.includes('first_idea')) checkAchievements(); }
};

// Init
setTimeout(() => {
    injectGamBar();
    injectAchievementsSection();
    checkAchievements();
}, 500);

console.log('[Gamification] Module loaded');

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

console.log('[Vault] Module loaded');


/* === wrapped.js === */
// ===== WRAPPED MODULE (Phase 14) =====

let wrappedCurrentSlide = 0;
let wrappedSlides = [];
let wrappedAutoTimer = null;

function openWrapped() {
    const year = new Date().getFullYear();
    const jNow = gregorianToJalali(year, new Date().getMonth() + 1, new Date().getDate());
    const yearLabel = toPersianDigits(jNow.jy);
    
    const data = currentData;
    const tasks = data.tasks || [];
    const people = data.people || [];
    const logs = data.logs || [];
    
    const completed = tasks.filter(t => t.status === 'done').length;
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status === 'done').length;
    
    // Best day of week
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    logs.forEach(l => { dayCounts[new Date(l.createdAtUtc).getDay()]++; });
    const bestDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];
    
    // Top person (most interactions)
    const personCounts = {};
    (data.interactions || []).forEach(i => { personCounts[i.personId] = (personCounts[i.personId] || 0) + 1; });
    const topPersonId = Object.keys(personCounts).sort((a, b) => personCounts[b] - personCounts[a])[0];
    const topPerson = topPersonId ? people.find(p => p.id === topPersonId) : null;
    
    // Total activity
    const totalActions = logs.length;
    
    // Best month (this year)
    const monthCounts = {};
    const monthNames = persianMonths;
    logs.forEach(l => {
        const d = new Date(l.createdAtUtc);
        if (d.getFullYear() === year) {
            const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
            monthCounts[j.jm] = (monthCounts[j.jm] || 0) + 1;
        }
    });
    const bestMonthNum = Object.keys(monthCounts).length > 0 ? parseInt(Object.keys(monthCounts).sort((a, b) => monthCounts[b] - monthCounts[a])[0]) : 1;
    const bestMonth = monthNames[bestMonthNum - 1];
    
    wrappedSlides = [
        { type: 'intro', year: yearLabel, color: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' },
        { type: 'big', icon: '✅', number: toPersianDigits(completed), label: 'کار تکمیل شده', sub: 'امسال شما این همه کار را انجام دادید!', color: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' },
        { type: 'big', icon: '🎯', number: toPersianDigits(tasks.length), label: 'کار ساخته شده', sub: 'در مجموع امسال', color: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
        { type: 'big', icon: '📅', label: 'بهترین روز هفته', sub: 'بیشترین فعالیت شما در این روز بوده', year: bestDay, color: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' },
        { type: 'big', icon: '🗓️', label: 'فعال‌ترین ماه', sub: monthCounts[bestMonthNum] + ' فعالیت', year: bestMonth, color: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
        { type: 'big', icon: '⚡', number: toPersianDigits(totalActions), label: 'اقدام و فعالیت', sub: 'در سیستم ثبت شده', color: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
        { type: 'person', icon: '💎', title: 'مهم‌ترین ارتباط', person: topPerson, color: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)' },
        { type: 'outro', year: yearLabel, color: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)' }
    ];
    
    wrappedCurrentSlide = 0;
    renderWrappedSlide();
}

function renderWrappedSlide() {
    let container = document.getElementById('wrappedContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'wrappedContainer';
        container.className = 'wrapped-container';
        document.body.appendChild(container);
    }
    
    const slide = wrappedSlides[wrappedCurrentSlide];
    container.style.background = slide.color;
    
    let content = '';
    
    // Progress bars
    content += '<div class="wrapped-progress">';
    for (let i = 0; i < wrappedSlides.length; i++) {
        const cls = i < wrappedCurrentSlide ? 'done' : i === wrappedCurrentSlide ? 'current' : '';
        content += '<div class="wrapped-progress-bar ' + cls + '"></div>';
    }
    content += '</div>';
    content += '<button class="wrapped-close" onclick="closeWrapped()">×</button>';
    
    // Slide content
    content += '<div class="wrapped-slide">';
    
    if (slide.type === 'intro') {
        content += '<div class="wrapped-year">' + slide.year + '</div><div class="wrapped-big-number" style="font-size:48px;">🎬</div><div class="wrapped-label">داستان سال شما</div><div class="wrapped-sub">آماده برای دیدن دستاوردهایتان؟</div>';
    } else if (slide.type === 'big') {
        content += '<div class="wrapped-icon">' + slide.icon + '</div>';
        if (slide.number) content += '<div class="wrapped-big-number">' + slide.number + '</div>';
        else content += '<div class="wrapped-big-number" style="font-size:64px;">' + slide.year + '</div>';
        content += '<div class="wrapped-label">' + slide.label + '</div><div class="wrapped-sub">' + slide.sub + '</div>';
    } else if (slide.type === 'person') {
        content += '<div class="wrapped-icon">' + slide.icon + '</div><div class="wrapped-label">' + slide.title + '</div>';
        if (slide.person) {
            content += '<div class="wrapped-card"><div class="wrapped-card-title">👤 مخاطب برتر</div><div class="wrapped-card-value">' + slide.person.name + '</div><div class="wrapped-card-desc">' + (slide.person.company || 'همراه همیشگی شما') + '</div></div>';
        } else {
            content += '<div class="wrapped-sub">هنوز تعاملی ثبت نشده!</div>';
        }
    } else if (slide.type === 'outro') {
        content += '<div class="wrapped-icon">🎊</div><div class="wrapped-label">تبریک!</div><div class="wrapped-big-number" style="font-size:48px;">' + slide.year + '</div><div class="wrapped-sub">سال فوق‌العاده‌ای داشتید.<br>ادامه بده! 💪</div>';
    }
    
    // Navigation
    content += '<div class="wrapped-nav">';
    if (wrappedCurrentSlide > 0) content += '<button class="wrapped-nav-btn" onclick="prevWrappedSlide()">← قبلی</button>';
    if (wrappedCurrentSlide < wrappedSlides.length - 1) content += '<button class="wrapped-nav-btn" onclick="nextWrappedSlide()">بعدی →</button>';
    else content += '<button class="wrapped-nav-btn" onclick="closeWrapped()">پایان ✨</button>';
    content += '</div>';
    
    content += '</div>';
    container.innerHTML = content;
    
    // Auto-advance
    if (wrappedAutoTimer) clearTimeout(wrappedAutoTimer);
    if (wrappedCurrentSlide < wrappedSlides.length - 1) {
        wrappedAutoTimer = setTimeout(nextWrappedSlide, 6000);
    }
}

function nextWrappedSlide() {
    if (wrappedCurrentSlide < wrappedSlides.length - 1) {
        const slide = document.querySelector('.wrapped-slide');
        if (slide) {
            slide.classList.add('exiting');
            setTimeout(() => {
                wrappedCurrentSlide++;
                renderWrappedSlide();
            }, 400);
        } else {
            wrappedCurrentSlide++;
            renderWrappedSlide();
        }
    }
}

function prevWrappedSlide() {
    if (wrappedCurrentTimer) clearTimeout(wrappedAutoTimer);
    if (wrappedCurrentSlide > 0) {
        wrappedCurrentSlide--;
        renderWrappedSlide();
    }
}

function closeWrapped() {
    if (wrappedAutoTimer) clearTimeout(wrappedAutoTimer);
    const container = document.getElementById('wrappedContainer');
    if (container) container.remove();
}

// Add to settings view
function addWrappedSettings() {
    setTimeout(() => {
        const tabs = document.querySelectorAll('.settings-tab');
        const general = Array.from(tabs).find(t => t.dataset.tab === 'general');
        if (!general || general.querySelector('#wrappedSettings')) return;
        
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.id = 'wrappedSettings';
        section.innerHTML = '<div class="settings-section-title">🎬 Wrapped سالانه</div><div class="settings-section-desc">داستان سال شما مثل Spotify Wrapped</div><div class="setting-row"><div class="setting-info"><div class="setting-label">نمایش Wrapped</div><div class="setting-desc">خلاصه عملکرد سال جاری</div></div><button class="btn btn-primary" onclick="openWrapped()">🎬 مشاهده</button></div>';
        const vault = general.querySelector('#vaultSettings');
        if (vault) vault.after(section);
        else general.appendChild(section);
    }, 600);
}

setTimeout(addWrappedSettings, 800);

console.log('[Wrapped] Module loaded');

/* === inbox.js === */
// ===== PROFESSIONAL INBOX MODULE (Phase 15) =====
let inboxItems = [];
let inboxSelectedIndex = -1;

function computeInboxItems() {
    const items = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d = currentData;

    // 1. Overdue tasks (urgent)
    (d.tasks || []).forEach(t => {
        if (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now) {
            const days = Math.floor((now - new Date(t.dueDate)) / 86400000);
            items.push({
                id: 'task-' + t.id, type: 'overdue', urgency: 'urgent',
                icon: '⚠️', title: t.title,
                sub: 'عقب‌افتاده — ' + toPersianDigits(days) + ' روز تأخیر',
                taskId: t.id, personId: t.personId,
                actions: ['done', 'schedule', 'delete']
            });
        }
    });

    // 2. Due today / this week (soon)
    (d.tasks || []).forEach(t => {
        if (t.dueDate && t.status !== 'done') {
            const td = new Date(t.dueDate);
            const diff = Math.floor((td - today) / 86400000);
            if (diff === 0) {
                items.push({ id: 'task-' + t.id, type: 'today', urgency: 'soon', icon: '📅', title: t.title, sub: 'سررسید: امروز', taskId: t.id, actions: ['done', 'schedule', 'delete'] });
            } else if (diff > 0 && diff <= 7) {
                items.push({ id: 'task-' + t.id, type: 'week', urgency: 'soon', icon: '🗓️', title: t.title, sub: 'سررسید: ' + toPersianDigits(diff) + ' روز دیگر', taskId: t.id, actions: ['done', 'schedule', 'delete'] });
            }
        }
    });

    // 3. Unscheduled tasks (normal)
    (d.tasks || []).forEach(t => {
        if (!t.dueDate && t.status !== 'done') {
            items.push({ id: 'task-' + t.id, type: 'unscheduled', urgency: 'normal', icon: '📥', title: t.title, sub: 'بدون تاریخ — نیاز به زمان‌بندی', taskId: t.id, actions: ['schedule', 'done', 'delete'] });
        }
    });

    // 4. Follow-up people (rel)
    if (typeof relationshipStats === 'function') {
        (d.people || []).forEach(p => {
            const st = relationshipStats(p);
            if (st.overdue) {
                items.push({ id: 'person-' + p.id, type: 'followup', urgency: 'soon', icon: '💞', title: p.name, sub: toPersianDigits(st.daysSince) + ' روز بدون تماس — نیاز به پیگیری', personId: p.id, actions: ['contact', 'open'] });
            }
        });
    }

    // 5. Upcoming occasions (rel)
    if (typeof getUpcomingOccasions === 'function') {
        getUpcomingOccasions(7).forEach(o => {
            items.push({ id: 'occ-' + o.person.id + '-' + o.occ.title, type: 'occasion', urgency: o.diff <= 1 ? 'urgent' : 'soon', icon: '🎂', title: o.occ.title + ' — ' + o.person.name, sub: o.diff === 0 ? 'امروز!' : toPersianDigits(o.diff) + ' روز دیگر', personId: o.person.id, actions: ['open'] });
        });
    }

    // 6. Draft ideas (normal)
    (d.ideas || []).forEach(i => {
        if (i.status === 'draft') {
            items.push({ id: 'idea-' + i.id, type: 'draft', urgency: 'normal', icon: '💡', title: i.title, sub: 'ایده پیش‌نویس — نیاز به بررسی', ideaId: i.id, actions: ['open', 'done'] });
        }
    });

    // Sort: urgent first, then soon, then normal
    const order = { urgent: 0, soon: 1, normal: 2 };
    items.sort((a, b) => order[a.urgency] - order[b.urgency]);
    return items;
}

function renderInbox() {
    const container = document.getElementById('inboxList');
    if (!container) return;
    inboxItems = computeInboxItems();
    updateInboxBadge();

    if (!inboxItems.length) {
        container.innerHTML = '<div class="inbox-zero"><div class="inbox-zero-icon">🎉</div><div class="inbox-zero-title">Inbox Zero!</div><div class="inbox-zero-desc">همه چیز تحت کنترل است. هیچ موردی منتظر بررسی نیست. عالی کار می‌کنی!</div><div class="inbox-kbd-hint"><span class="inbox-kbd"><span class="kbd">↑↓</span> حرکت</span><span class="inbox-kbd"><span class="kbd">E</span> انجام شد</span><span class="inbox-kbd"><span class="kbd">S</span> زمان‌بندی</span><span class="inbox-kbd"><span class="kbd">X</span> حذف</span></div></div>';
        return;
    }

    // Group by urgency
    const groups = [
        { key: 'urgent', label: '🔴 فوری — نیاز به اقدام' },
        { key: 'soon', label: '🟡 این هفته' },
        { key: 'normal', label: '🔵 برای برنامه‌ریزی' }
    ];

    let html = '';
    groups.forEach(g => {
        const gi = inboxItems.filter(i => i.urgency === g.key);
        if (!gi.length) return;
        html += '<div class="inbox-section-title">' + g.label + '<span class="inbox-section-count">' + toPersianDigits(gi.length) + '</span></div>';
        html += '<div class="inbox-list">';
        gi.forEach(item => {
            const idx = inboxItems.indexOf(item);
            html += '<div class="inbox-item ' + item.urgency + (idx === inboxSelectedIndex ? ' selected' : '') + '" data-idx="' + idx + '" onclick="selectInboxItem(' + idx + ')">';
            html += '<div class="inbox-item-icon ' + (item.type === 'followup' || item.type === 'occasion' ? 'rel' : item.urgency) + '">' + item.icon + '</div>';
            html += '<div class="inbox-item-content"><div class="inbox-item-title">' + item.title + '</div><div class="inbox-item-sub">' + item.sub + '</div></div>';
            html += '<div class="inbox-item-actions">';
            item.actions.forEach(a => {
                const icons = { done: '✓', schedule: '📅', delete: '🗑', contact: '📞', open: '→' };
                const titles = { done: 'انجام شد (E)', schedule: 'زمان‌بندی (S)', delete: 'حذف (X)', contact: 'ثبت تماس', open: 'باز کردن (O)' };
                html += '<button class="inbox-action-btn ' + a + '" title="' + titles[a] + '" onclick="event.stopPropagation(); inboxAction(' + idx + ',\'' + a + '\', this)">' + icons[a] + '</button>';
            });
            html += '</div></div>';
        });
        html += '</div>';
    });

    container.innerHTML = html;
}

function updateInboxBadge() {
    const badges = document.querySelectorAll('.nav-link[data-view="inbox"] .nav-link-count');
    badges.forEach(b => { b.textContent = inboxItems.length; });
    const urgent = inboxItems.filter(i => i.urgency === 'urgent').length;
    badges.forEach(b => {
        if (urgent > 0) { b.style.background = 'var(--danger)'; b.style.color = 'white'; }
        else { b.style.background = ''; b.style.color = ''; }
    });
}

function selectInboxItem(idx) {
    inboxSelectedIndex = idx;
    document.querySelectorAll('.inbox-item').forEach(el => {
        el.classList.toggle('selected', parseInt(el.dataset.idx) === idx);
    });
}

async function inboxAction(idx, action, btnEl) {
    const item = inboxItems[idx];
    if (!item) return;

    if (action === 'done') {
        if (item.taskId) {
            try { await api('tasks/' + item.taskId, 'PUT', { status: 'done' }); if (typeof addKarma === 'function') addKarma(10); toast('✅ انجام شد!', 'success'); } catch (e) { toast('خطا', 'error'); }
        } else if (item.ideaId) {
            try { await api('ideas/' + item.ideaId, 'PUT', { status: 'active' }); toast('💡 ایده فعال شد', 'success'); } catch (e) { toast('خطا', 'error'); }
        }
        await loadAllData();
    }
    else if (action === 'schedule') {
        showSchedulePopover(btnEl, item);
        return;
    }
    else if (action === 'delete') {
        if (!confirm('حذف «' + item.title + '»؟')) return;
        try { await api('tasks/' + item.taskId, 'DELETE'); toast('حذف شد', 'success'); } catch (e) { toast('خطا', 'error'); }
        await loadAllData();
    }
    else if (action === 'contact') {
        try { await api('interactions', 'POST', { personId: item.personId, type: 'call', subject: 'تماس تلفنی', content: '', date: new Date().toISOString() }); toast('📞 تماس ثبت شد!', 'success'); } catch (e) { toast('خطا', 'error'); }
        await loadAllData();
    }
    else if (action === 'open') {
        if (item.personId && typeof openPersonPanel === 'function') openPersonPanel(item.personId);
        else if (item.ideaId && typeof openKnowledgePanel === 'function') openKnowledgePanel(item.ideaId);
        else if (item.taskId) { switchView('tasks'); }
        return;
    }

    renderInbox();
}

let schedulePopover = null;
function showSchedulePopover(btnEl, item) {
    closeSchedulePopover();
    const rect = btnEl.getBoundingClientRect();
    schedulePopover = document.createElement('div');
    schedulePopover.className = 'schedule-popover';
    schedulePopover.style.top = (rect.bottom + 6) + 'px';
    schedulePopover.style.left = Math.max(10, rect.left - 120) + 'px';
    const opts = [
        { label: 'امروز', days: 0, icon: '📅' },
        { label: 'فردا', days: 1, icon: '🌅' },
        { label: 'این هفته', days: 3, icon: '🗓️' },
        { label: 'هفته بعد', days: 7, icon: '📆' }
    ];
    schedulePopover.innerHTML = opts.map(o => '<div class="schedule-option" onclick="applySchedule(' + o.days + ')">' + o.icon + ' ' + o.label + '</div>').join('');
    document.body.appendChild(schedulePopover);
    schedulePopover._item = item;
    setTimeout(() => document.addEventListener('click', closeSchedulePopoverOnOutside), 50);
}

function closeSchedulePopoverOnOutside(e) {
    if (schedulePopover && !schedulePopover.contains(e.target)) closeSchedulePopover();
}

function closeSchedulePopover() {
    if (schedulePopover) { schedulePopover.remove(); schedulePopover = null; document.removeEventListener('click', closeSchedulePopoverOnOutside); }
}

async function applySchedule(days) {
    if (!schedulePopover) return;
    const item = schedulePopover._item;
    closeSchedulePopover();
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    try {
        await api('tasks/' + item.taskId, 'PUT', { dueDate: d.toISOString() });
        toast('📅 زمان‌بندی شد: ' + d.toLocaleDateString('fa-IR'), 'success');
        await loadAllData();
        renderInbox();
    } catch (e) { toast('خطا', 'error'); }
}

// Quick capture (smart)
async function inboxCapture() {
    const input = document.getElementById('inboxCaptureInput');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    let parsed = { title: text, dueDate: null, priority: 'medium', person: null };
    if (typeof parseNaturalTask === 'function') parsed = parseNaturalTask(text);
    try {
        await api('tasks', 'POST', { title: parsed.title, description: '', dueDate: parsed.dueDate ? parsed.dueDate.toISOString() : '', priority: parsed.priority, status: 'pending', personId: parsed.person ? parsed.person.id : '', projectId: '', tags: [] });
        toast('⚡ به Inbox اضافه شد', 'success');
        input.value = '';
        await loadAllData();
    } catch (e) { toast('خطا', 'error'); }
}

// Keyboard shortcuts in inbox
document.addEventListener('keydown', e => {
    if (currentView !== 'inbox') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowDown') { e.preventDefault(); inboxSelectedIndex = Math.min(inboxSelectedIndex + 1, inboxItems.length - 1); renderInbox(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); inboxSelectedIndex = Math.max(inboxSelectedIndex - 1, 0); renderInbox(); }
    else if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && inboxSelectedIndex >= 0) { e.preventDefault(); inboxAction(inboxSelectedIndex, 'done'); }
    else if ((e.key === 's' || e.key === 'S') && inboxSelectedIndex >= 0) { e.preventDefault(); const btn = document.querySelector('.inbox-item.selected .inbox-action-btn.schedule'); if (btn) btn.click(); }
    else if ((e.key === 'x' || e.key === 'X' || e.key === 'Delete') && inboxSelectedIndex >= 0) { e.preventDefault(); inboxAction(inboxSelectedIndex, 'delete'); }
    else if ((e.key === 'o' || e.key === 'O') && inboxSelectedIndex >= 0) { e.preventDefault(); inboxAction(inboxSelectedIndex, 'open'); }
});

// Hook into view switch + data load
const origSwitchViewI = window.switchView;
window.switchView = function (v) {
    origSwitchViewI(v);
    if (v === 'inbox') { inboxSelectedIndex = -1; setTimeout(renderInbox, 100); }
};

const origLoadAllDataI = window.loadAllData;
window.loadAllData = async function () {
    await origLoadAllDataI();
    if (currentView === 'inbox') renderInbox();
    else updateInboxBadge();
};

// Init
setTimeout(() => { renderInbox(); }, 800);

console.log('[Inbox] Professional module loaded');

/* === inbox-design.js === */
// ===== INBOX DESIGN v2 - Beautiful Rendering =====

window.renderInbox = function () {
    const container = document.getElementById('inboxList');
    if (!container) return;
    inboxItems = computeInboxItems();
    updateInboxBadge();

    const urgentCount = inboxItems.filter(i => i.urgency === 'urgent').length;
    const soonCount = inboxItems.filter(i => i.urgency === 'soon').length;
    const normalCount = inboxItems.filter(i => i.urgency === 'normal').length;
    const total = inboxItems.length;

    // Hero header (always show)
    let html = '';
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'صبح بخیر! ☀️' : hour < 18 ? 'ظهر بخیر! 🌤️' : 'عصر بخیر! 🌙';

    html += '<div class="inbox-hero"><div><div class="inbox-hero-title">' + greet + '</div><div class="inbox-hero-sub">' +
        (total > 0 ? toPersianDigits(total) + ' مورد منتظر توجه شماست' : 'همه چیز تحت کنترل است!') +
        '</div></div><div class="inbox-hero-stats">' +
        '<div class="inbox-stat urgent"><span class="inbox-stat-num">' + toPersianDigits(urgentCount) + '</span> فوری</div>' +
        '<div class="inbox-stat soon"><span class="inbox-stat-num">' + toPersianDigits(soonCount) + '</span> این هفته</div>' +
        '<div class="inbox-stat normal"><span class="inbox-stat-num">' + toPersianDigits(normalCount) + '</span> برنامه‌ریزی</div>' +
        '</div></div>';

    if (total === 0) {
        html += '<div class="inbox-zero"><div class="inbox-zero-icon">🏆</div><div class="inbox-zero-title">Inbox Zero!</div><div class="inbox-zero-desc">فوق‌العاده! هیچ موردی منتظر بررسی نیست. شما استاد مدیریت زمان خود هستید. 🎉</div><div class="inbox-kbd-hint"><span class="inbox-kbd"><span class="kbd">↑↓</span> حرکت</span><span class="inbox-kbd"><span class="kbd">E</span> انجام</span><span class="inbox-kbd"><span class="kbd">S</span> زمان</span><span class="inbox-kbd"><span class="kbd">X</span> حذف</span></div></div>';
        container.innerHTML = html;
        return;
    }

    // Progress bar (processed = done out of a daily goal, just show urgency distribution)
    const processedPct = Math.round(((soonCount + normalCount) / total) * 100);
    html += '<div class="inbox-progress-wrap"><div class="inbox-progress-label"><span>پیشرفت پردازش</span><span>' + toPersianDigits(100 - Math.round((urgentCount / total) * 100)) + '%</span></div><div class="inbox-progress"><div class="inbox-progress-fill" style="width:' + (100 - Math.round((urgentCount / total) * 100)) + '%;"></div></div></div>';

    // Groups
    const groups = [
        { key: 'urgent', label: 'فوری — نیاز به اقدام فوری' },
        { key: 'soon', label: 'این هفته' },
        { key: 'normal', label: 'برای برنامه‌ریزی' }
    ];

    let animDelay = 0;
    groups.forEach(g => {
        const gi = inboxItems.filter(i => i.urgency === g.key);
        if (!gi.length) return;
        html += '<div class="inbox-group"><div class="inbox-group-header"><div class="inbox-group-dot ' + g.key + '"></div><div class="inbox-group-title">' + g.label + '</div><span class="inbox-group-count">' + toPersianDigits(gi.length) + '</span></div>';
        gi.forEach(item => {
            const idx = inboxItems.indexOf(item);
            const icons = { done: '✓', schedule: '📅', delete: '🗑', contact: '📞', open: '→' };
            const titles = { done: 'انجام شد (E)', schedule: 'زمان‌بندی (S)', delete: 'حذف (X)', contact: 'ثبت تماس', open: 'باز کردن (O)' };
            html += '<div class="inbox-item ' + item.urgency + (idx === inboxSelectedIndex ? ' selected' : '') + '" data-idx="' + idx + '" style="animation-delay:' + (animDelay * 0.05) + 's" onclick="selectInboxItem(' + idx + ')">';
            html += '<div class="inbox-item-icon ' + (item.type === 'followup' || item.type === 'occasion' ? 'rel' : item.urgency) + '">' + item.icon + '</div>';
            html += '<div class="inbox-item-content"><div class="inbox-item-title">' + item.title + '</div><div class="inbox-item-sub">' + item.sub + '</div></div>';
            html += '<div class="inbox-item-actions">';
            item.actions.forEach(a => {
                html += '<button class="inbox-action-btn ' + a + '" title="' + titles[a] + '" onclick="event.stopPropagation(); inboxAction(' + idx + ',\'' + a + '\', this)">' + icons[a] + '</button>';
            });
            html += '</div></div>';
            animDelay++;
        });
        html += '</div>';
    });

    container.innerHTML = html;
};

console.log('[InboxDesign] Beautiful rendering loaded');

/* === inbox-pro.js === */
// ===== INBOX GOD MODE (Phase 15.3) =====
let inboxMaster = [];
let inboxFilter = 'all';
let lastInboxCount = -1;
let lastUndo = null;
let audioCtx = null;

// ---------- Sound ----------
function playSound(type) {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const t = audioCtx.currentTime;
        const mk = (freq, start, dur) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = freq;
            o.connect(g); g.connect(audioCtx.destination);
            g.gain.setValueAtTime(0.0001, t + start);
            g.gain.exponentialRampToValueAtTime(0.08, t + start + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
            o.start(t + start); o.stop(t + start + dur + 0.05);
        };
        if (type === 'done') { mk(660, 0, 0.15); mk(880, 0.08, 0.2); }
        else if (type === 'delete') { mk(220, 0, 0.2); }
        else if (type === 'contact') { mk(520, 0, 0.15); mk(700, 0.08, 0.15); }
        else { mk(520, 0, 0.12); }
    } catch (e) {}
}

// ---------- Snooze ----------
function getSnoozed() { try { return JSON.parse(localStorage.getItem('crm_snoozed') || '{}'); } catch (e) { return {}; } }
function isSnoozed(id) { const s = getSnoozed(); return s[id] && s[id] > Date.now(); }
function snoozeItem(id, ms) {
    const s = getSnoozed(); s[id] = Date.now() + ms;
    localStorage.setItem('crm_snoozed', JSON.stringify(s));
}

// Wrap computeInboxItems: filter snoozed + add snooze action
const origComputeP = window.computeInboxItems;
window.computeInboxItems = function () {
    const items = origComputeP().filter(i => !isSnoozed(i.id));
    items.forEach(i => { if (!i.actions.includes('snooze')) i.actions.splice(1, 0, 'snooze'); });
    return items;
};

// ---------- Wrap inboxAction: sound + undo + snooze ----------
const origInboxActionP = window.inboxAction;
window.inboxAction = async function (idx, action, btnEl) {
    const item = inboxItems[idx];
    if (action === 'snooze') { showSnoozePopover(btnEl, item); return; }
    if (action === 'done' && item && item.taskId) lastUndo = { kind: 'done', taskId: item.taskId, title: item.title };
    await origInboxActionP(idx, action, btnEl);
    playSound(action);
    if (action === 'done' && lastUndo) showUndoToast();
};

function showUndoToast() {
    const old = document.querySelector('.undo-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'undo-toast';
    t.innerHTML = '<span>✅ «' + lastUndo.title + '» انجام شد</span><button class="undo-btn" onclick="doUndo()">⏪ برگردان</button>';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 5000);
}

async function doUndo() {
    if (!lastUndo) return;
    try {
        await api('tasks/' + lastUndo.taskId, 'PUT', { status: 'pending' });
        toast('⏪ برگردانده شد', 'info');
        await loadAllData();
    } catch (e) { toast('خطا', 'error'); }
    document.querySelector('.undo-toast')?.remove();
    lastUndo = null;
}

function showSnoozePopover(btnEl, item) {
    closeSchedulePopover();
    const rect = btnEl.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'schedule-popover';
    p.style.top = (rect.bottom + 6) + 'px';
    p.style.left = Math.max(10, rect.left - 100) + 'px';
    const opts = [
        { label: '۱ ساعت', ms: 3600000, icon: '⏰' },
        { label: 'فردا', ms: 86400000, icon: '🌅' },
        { label: 'هفته بعد', ms: 604800000, icon: '📆' }
    ];
    p.innerHTML = '<div style="font-size:11px;color:var(--text-tertiary);padding:4px 8px;">😴 به تعویق بینداز:</div>' +
        opts.map(o => '<div class="schedule-option" onclick="applySnooze(\'' + item.id + '\',' + o.ms + ')">' + o.icon + ' ' + o.label + '</div>').join('');
    document.body.appendChild(p);
    schedulePopover = p;
    setTimeout(() => document.addEventListener('click', closeSnoozeOutside), 50);
}

function closeSnoozeOutside(e) {
    if (schedulePopover && !schedulePopover.contains(e.target)) closeSchedulePopover();
}

function applySnooze(id, ms) {
    closeSchedulePopover();
    snoozeItem(id, ms);
    playSound('schedule');
    toast('😴 به تعویق افتاد', 'info');
    renderInbox();
}

// ---------- Confetti ----------
function fireConfetti() {
    const colors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    for (let i = 0; i < 80; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = Math.random() * 100 + '%';
        c.style.top = '-10px';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDelay = Math.random() * 0.6 + 's';
        c.style.animationDuration = (2 + Math.random() * 2) + 's';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 5000);
    }
}

// ---------- Animated counter ----------
function animateCount(el, target) {
    const dur = 600;
    const start = performance.now();
    function step(now) {
        const p = Math.min(1, (now - start) / dur);
        const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = toPersianDigits(val);
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ---------- Filter ----------
function setInboxFilter(f) { inboxFilter = f; renderInbox(); }

// ---------- GOD renderInbox ----------
window.renderInbox = function () {
    const container = document.getElementById('inboxList');
    if (!container) return;
    inboxMaster = computeInboxItems();
    inboxItems = inboxFilter === 'all' ? inboxMaster.slice() : inboxMaster.filter(i => i.urgency === inboxFilter);
    updateInboxBadge();

    const uC = inboxMaster.filter(i => i.urgency === 'urgent').length;
    const sC = inboxMaster.filter(i => i.urgency === 'soon').length;
    const nC = inboxMaster.filter(i => i.urgency === 'normal').length;
    const total = inboxMaster.length;
    const processedPct = total === 0 ? 100 : Math.round(((sC + nC) / total) * 100);

    const hour = new Date().getHours();
    const greet = hour < 12 ? 'صبح بخیر! ☀️' : hour < 18 ? 'ظهر بخیر! 🌤️' : 'عصر بخیر! 🌙';

    // Hero with ring
    let html = '<div class="inbox-hero"><div style="display:flex;align-items:center;gap:18px;position:relative;"><div class="inbox-ring"><svg width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#ec4899"/></linearGradient></defs><circle class="ring-bg" cx="32" cy="32" r="26"/><circle class="ring-fill" cx="32" cy="32" r="26" stroke-dasharray="' + (2 * Math.PI * 26) + '" stroke-dashoffset="' + (2 * Math.PI * 26 * (1 - processedPct / 100)) + '"/></svg><div class="inbox-ring-num">' + toPersianDigits(processedPct) + '%</div></div><div><div class="inbox-hero-title">' + greet + '</div><div class="inbox-hero-sub">' + (total > 0 ? toPersianDigits(total) + ' مورد منتظر توجه شماست' : 'همه چیز تحت کنترل است!') + '</div></div></div><div class="inbox-hero-stats"><div class="inbox-stat urgent"><span class="inbox-stat-num" data-count="' + uC + '">' + toPersianDigits(uC) + '</span> فوری</div><div class="inbox-stat soon"><span class="inbox-stat-num" data-count="' + sC + '">' + toPersianDigits(sC) + '</span> این هفته</div><div class="inbox-stat normal"><span class="inbox-stat-num" data-count="' + nC + '">' + toPersianDigits(nC) + '</span> برنامه‌ریزی</div></div></div>';

    // Filter tabs
    const tabs = [ { key: 'all', label: 'همه', c: total }, { key: 'urgent', label: 'فوری', c: uC }, { key: 'soon', label: 'این هفته', c: sC }, { key: 'normal', label: 'برنامه‌ریزی', c: nC } ];
    html += '<div class="inbox-tabs">' + tabs.map(t => '<button class="inbox-tab' + (inboxFilter === t.key ? ' active' : '') + '" onclick="setInboxFilter(\'' + t.key + '\')">' + t.label + ' <span class="inbox-tab-count">' + toPersianDigits(t.c) + '</span></button>').join('') + '</div>';

    if (total === 0) {
        html += '<div class="inbox-zero"><div class="inbox-zero-icon">🏆</div><div class="inbox-zero-title">Inbox Zero!</div><div class="inbox-zero-desc">فوق‌العاده! هیچ موردی منتظر بررسی نیست. شما استاد مدیریت زمان خود هستید. 🎉</div><div class="inbox-kbd-hint"><span class="inbox-kbd"><span class="kbd">?</span> راهنما</span><span class="inbox-kbd"><span class="kbd">E</span> انجام</span><span class="inbox-kbd"><span class="kbd">S</span> زمان</span><span class="inbox-kbd"><span class="kbd">X</span> حذف</span></div></div>';
        container.innerHTML = html;
        if (lastInboxCount > 0) fireConfetti();
        lastInboxCount = 0;
        return;
    }

    // Groups
    const groups = [ { key: 'urgent', label: 'فوری — اقدام فوری' }, { key: 'soon', label: 'این هفته' }, { key: 'normal', label: 'برای برنامه‌ریزی' } ];
    let delay = 0;
    groups.forEach(g => {
        const gi = inboxItems.filter(i => i.urgency === g.key);
        if (!gi.length) return;
        html += '<div class="inbox-group"><div class="inbox-group-header"><div class="inbox-group-dot ' + g.key + '"></div><div class="inbox-group-title">' + g.label + '</div><span class="inbox-group-count">' + toPersianDigits(gi.length) + '</span></div>';
        gi.forEach(item => {
            const idx = inboxItems.indexOf(item);
            const icons = { done: '✓', schedule: '📅', snooze: '😴', delete: '🗑', contact: '📞', open: '→' };
            const titles = { done: 'انجام شد (E)', schedule: 'زمان‌بندی (S)', snooze: 'تعویق', delete: 'حذف (X)', contact: 'ثبت تماس', open: 'باز کردن (O)' };
            html += '<div class="inbox-item ' + item.urgency + (idx === inboxSelectedIndex ? ' selected' : '') + '" data-idx="' + idx + '" style="animation-delay:' + (delay * 0.05) + 's" onclick="selectInboxItem(' + idx + ')">';
            html += '<div class="inbox-item-icon ' + (item.type === 'followup' || item.type === 'occasion' ? 'rel' : item.urgency) + '">' + item.icon + '</div>';
            html += '<div class="inbox-item-content"><div class="inbox-item-title">' + item.title + '</div><div class="inbox-item-sub">' + item.sub + '</div></div>';
            html += '<div class="inbox-item-actions">';
            item.actions.forEach(a => { html += '<button class="inbox-action-btn ' + a + '" title="' + titles[a] + '" onclick="event.stopPropagation(); inboxAction(' + idx + ',\'' + a + '\', this)">' + icons[a] + '</button>'; });
            html += '</div></div>';
            delay++;
        });
        html += '</div>';
    });

    container.innerHTML = html;

    // Animate counters
    container.querySelectorAll('.inbox-stat-num').forEach(el => animateCount(el, parseInt(el.dataset.count)));

    // Confetti when reaching zero
    if (lastInboxCount > 0 && total === 0) fireConfetti();
    lastInboxCount = total;
};

// ---------- Shortcut help overlay ----------
document.addEventListener('keydown', e => {
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        showShortcutHelp();
    }
});

function showShortcutHelp() {
    const old = document.querySelector('.shortcut-overlay');
    if (old) { old.remove(); return; }
    const o = document.createElement('div');
    o.className = 'shortcut-overlay';
    o.onclick = e => { if (e.target === o) o.remove(); };
    o.innerHTML = '<div class="shortcut-panel"><h3>⌨️ شورت‌کات‌های Inbox</h3>' +
        '<div class="shortcut-row"><span>حرکت بین آیتم‌ها</span><span><span class="kbd">↑</span> <span class="kbd">↓</span></span></div>' +
        '<div class="shortcut-row"><span>انجام شد</span><span class="kbd">E</span></div>' +
        '<div class="shortcut-row"><span>زمان‌بندی</span><span class="kbd">S</span></div>' +
        '<div class="shortcut-row"><span>حذف</span><span class="kbd">X</span></div>' +
        '<div class="shortcut-row"><span>باز کردن</span><span class="kbd">O</span></div>' +
        '<div class="shortcut-row"><span>این راهنما</span><span class="kbd">?</span></div>' +
        '<div class="shortcut-row"><span>بستن</span><span class="kbd">Esc</span></div></div>';
    document.body.appendChild(o);
}

console.log('[InboxGod] GOD MODE loaded');

/* === inbox-zen.js === */
// ===== ZEN MODE + PARTICLES + WORKLOAD (Phase 15.4) =====

// ---------- Workload estimate ----------
function estimateMinutes(item) {
    if (item.type === 'followup' || item.type === 'occasion') return 10;
    const t = currentData.tasks.find(x => x.id === item.taskId);
    if (t && t.duration) return t.duration * 60;
    return item.urgency === 'urgent' ? 45 : item.urgency === 'soon' ? 30 : 15;
}

function totalWorkload() {
    return inboxMaster.reduce((sum, i) => sum + estimateMinutes(i), 0);
}

function fmtDuration(min) {
    const h = Math.floor(min / 60), m = min % 60;
    if (h > 0 && m > 0) return toPersianDigits(h) + ' ساعت و ' + toPersianDigits(m) + ' دقیقه';
    if (h > 0) return toPersianDigits(h) + ' ساعت';
    return toPersianDigits(m) + ' دقیقه';
}

function injectWorkload() {
    const hero = document.querySelector('.inbox-hero');
    if (!hero || hero.querySelector('.workload-chip')) return;
    const stats = hero.querySelector('.inbox-hero-stats');
    if (!stats) return;
    const wl = totalWorkload();
    if (wl > 0) {
        const chip = document.createElement('div');
        chip.className = 'workload-chip';
        chip.innerHTML = '⏱️ حدود ' + fmtDuration(wl) + ' کار داری';
        stats.appendChild(chip);
    }
    // Zen button
    if (!hero.querySelector('.zen-btn')) {
        const zb = document.createElement('button');
        zb.className = 'zen-btn';
        zb.innerHTML = '🧘 حالت تمرکز';
        zb.onclick = openZen;
        hero.appendChild(zb);
    }
}

// ---------- Particles ----------
let particlesInit = false;
function initParticles() {
    if (particlesInit) return;
    const view = document.getElementById('view-inbox');
    if (!view) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'inbox-particles';
    view.insertBefore(canvas, view.firstChild);
    const ctx = canvas.getContext('2d');
    let W, H, dots = [];

    function resize() {
        W = canvas.width = view.offsetWidth;
        H = canvas.height = view.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
        dots.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: 1 + Math.random() * 2 });
    }

    function draw() {
        if (!document.getElementById('view-inbox').classList.contains('active')) { requestAnimationFrame(draw); return; }
        ctx.clearRect(0, 0, W, H);
        dots.forEach(d => {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > W) d.vx *= -1;
            if (d.y < 0 || d.y > H) d.vy *= -1;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(124,58,237,0.4)';
            ctx.fill();
        });
        for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
                ctx.beginPath();
                ctx.moveTo(dots[i].x, dots[i].y);
                ctx.lineTo(dots[j].x, dots[j].y);
                ctx.strokeStyle = 'rgba(124,58,237,' + (0.15 * (1 - dist / 110)) + ')';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
    particlesInit = true;
}

// Wrap renderInbox to inject extras
const origRenderZ = window.renderInbox;
window.renderInbox = function () {
    origRenderZ();
    injectWorkload();
    initParticles();
};

// ---------- ZEN MODE ----------
let zenQueue = [];
let zenShowSchedule = false;

function openZen() {
    zenQueue = inboxMaster.slice();
    zenShowSchedule = false;
    renderZen();
}

function closeZen() {
    const o = document.querySelector('.zen-overlay');
    if (o) o.remove();
    renderInbox();
}

function renderZen() {
    let o = document.querySelector('.zen-overlay');
    if (!o) {
        o = document.createElement('div');
        o.className = 'zen-overlay';
        document.body.appendChild(o);
    }
    zenShowSchedule = false;

    const processed = inboxMaster.length - zenQueue.length;
    const pct = inboxMaster.length ? Math.round((processed / inboxMaster.length) * 100) : 100;

    if (!zenQueue.length) {
        o.innerHTML = '<button class="zen-close" onclick="closeZen()">×</button><div class="zen-card"><div class="zen-done-icon">🏆</div><div class="zen-done-title">همه تمام شد!</div><div class="zen-sub">شما ' + toPersianDigits(processed) + ' مورد را پردازش کردید.<br>فوق‌العاده بود! 🎉</div><div style="margin-top:24px;"><button class="zen-btn" onclick="closeZen()">بازگشت به Inbox</button></div></div>';
        if (typeof fireConfetti === 'function') fireConfetti();
        return;
    }

    const item = zenQueue[0];
    const icons = { done: '✅', schedule: '📅', snooze: '😴', delete: '🗑', contact: '📞', open: '→' };

    let html = '<div class="zen-top"><div class="zen-progress-track"><div class="zen-progress-fill" style="width:' + pct + '%;"></div></div><div class="zen-count">' + toPersianDigits(processed + 1) + ' از ' + toPersianDigits(inboxMaster.length) + '</div></div>';
    html += '<button class="zen-close" onclick="closeZen()">×</button>';
    html += '<div class="zen-card" id="zenCard"><span class="zen-icon">' + item.icon + '</span><div class="zen-title">' + item.title + '</div><div class="zen-sub">' + item.sub + '</div>';
    html += '<div class="zen-meta"><span class="zen-meta-chip">' + (item.urgency === 'urgent' ? '🔴 فوری' : item.urgency === 'soon' ? '🟡 این هفته' : '🔵 عادی') + '</span><span class="zen-meta-chip">⏱️ ' + fmtDuration(estimateMinutes(item)) + '</span></div>';
    html += '<div class="zen-actions">';
    html += '<button class="zen-action done" onclick="zenDo(\'done\')">' + icons.done + ' انجام شد (E)</button>';
    html += '<button class="zen-action" onclick="zenToggleSchedule()">' + icons.schedule + ' زمان‌بندی (S)</button>';
    if (item.actions.includes('contact')) html += '<button class="zen-action" onclick="zenDo(\'contact\')">' + icons.contact + ' ثبت تماس</button>';
    if (item.actions.includes('open')) html += '<button class="zen-action" onclick="zenDo(\'open\')">' + icons.open + ' باز کردن</button>';
    html += '<button class="zen-action" onclick="zenDo(\'snooze\')">' + icons.snooze + ' تعویق</button>';
    html += '<button class="zen-action delete" onclick="zenDo(\'delete\')">' + icons.delete + ' حذف (X)</button>';
    html += '</div>';
    html += '<div class="zen-schedule-row" id="zenSchedRow" style="display:none;"><span class="zen-sched-opt" onclick="zenSchedule(0)">امروز</span><span class="zen-sched-opt" onclick="zenSchedule(1)">فردا</span><span class="zen-sched-opt" onclick="zenSchedule(3)">این هفته</span><span class="zen-sched-opt" onclick="zenSchedule(7)">هفته بعد</span></div>';
    html += '<div class="zen-hint">E انجام • S زمان • X حذف • Esc خروج</div></div>';
    o.innerHTML = html;
}

function zenToggleSchedule() {
    const r = document.getElementById('zenSchedRow');
    if (r) r.style.display = r.style.display === 'none' ? 'flex' : 'none';
}

function zenNext() {
    const card = document.getElementById('zenCard');
    if (card) {
        card.classList.add('leaving');
        setTimeout(() => { zenQueue.shift(); renderZen(); }, 280);
    } else { zenQueue.shift(); renderZen(); }
}

async function zenDo(action) {
    const item = zenQueue[0];
    if (!item) return;
    if (typeof playSound === 'function') playSound(action);

    try {
        if (action === 'done') {
            if (item.taskId) await api('tasks/' + item.taskId, 'PUT', { status: 'done' });
            else if (item.ideaId) await api('ideas/' + item.ideaId, 'PUT', { status: 'active' });
            if (typeof addKarma === 'function') addKarma(10);
        } else if (action === 'delete') {
            if (item.taskId) await api('tasks/' + item.taskId, 'DELETE');
        } else if (action === 'contact') {
            await api('interactions', 'POST', { personId: item.personId, type: 'call', subject: 'تماس تلفنی', content: '', date: new Date().toISOString() });
        } else if (action === 'snooze') {
            if (typeof snoozeItem === 'function') snoozeItem(item.id, 86400000);
        } else if (action === 'open') {
            closeZen();
            if (item.personId && typeof openPersonPanel === 'function') openPersonPanel(item.personId);
            return;
        }
    } catch (e) { toast('خطا', 'error'); }

    await loadAllData();
    zenNext();
}

async function zenSchedule(days) {
    const item = zenQueue[0];
    if (!item || !item.taskId) return;
    const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0);
    try { await api('tasks/' + item.taskId, 'PUT', { dueDate: d.toISOString() }); if (typeof playSound === 'function') playSound('schedule'); } catch (e) {}
    await loadAllData();
    zenNext();
}

// Zen keyboard
document.addEventListener('keydown', e => {
    if (!document.querySelector('.zen-overlay')) return;
    if (e.key === 'Escape') { closeZen(); }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { e.preventDefault(); zenDo('done'); }
    else if (e.key === 's' || e.key === 'S') { e.preventDefault(); zenToggleSchedule(); }
    else if (e.key === 'x' || e.key === 'X') { e.preventDefault(); zenDo('delete'); }
});

console.log('[InboxZen] Zen + Particles + Workload loaded');

/* === dashboard-pro.js === */
// ===== DASHBOARD GOD MODE (Phase 16) =====

// ---------- 3D Tilt ----------
function attachTilt(el, max) {
    max = max || 6;
    if (!el || el.dataset.tilt) return;
    el.dataset.tilt = '1';
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(800px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) translateY(-2px)';
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
}

// ---------- Animated counter ----------
function animateValue(el) {
    const raw = el.textContent;
    const num = parseInt(raw.replace(/[^\d]/g, ''), 10);
    if (isNaN(num)) return;
    const suffix = raw.replace(/[\d,]/g, '').trim();
    const dur = 800, start = performance.now();
    function step(now) {
        const p = Math.min(1, (now - start) / dur);
        const v = Math.round(num * (1 - Math.pow(1 - p, 3)));
        el.textContent = toPersianDigits(v) + (suffix ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ---------- Live clock ----------
function tickClock() {
    const c = document.getElementById('liveClock');
    const dEl = document.getElementById('liveDate');
    if (!c) return;
    const now = new Date();
    c.textContent = toPersianDigits(String(now.getHours()).padStart(2, '0')) + ':' + toPersianDigits(String(now.getMinutes()).padStart(2, '0')) + ':' + toPersianDigits(String(now.getSeconds()).padStart(2, '0'));
    if (dEl && typeof gregorianToJalali === 'function') {
        const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        dEl.textContent = persianWeekdaysFull[(now.getDay() + 1) % 7] + '، ' + toPersianDigits(j.jd) + ' ' + persianMonths[j.jm - 1] + ' ' + toPersianDigits(j.jy);
    }
}

function enhanceHero() {
    const hero = document.querySelector('.analytics-hero');
    if (!hero || hero.querySelector('.hero-clock')) return;
    const clock = document.createElement('div');
    clock.className = 'hero-clock';
    clock.innerHTML = '<div id="liveClock"></div><div id="liveDate"></div>';
    const content = hero.querySelector('.analytics-hero-content');
    if (content) content.appendChild(clock);
    tickClock();
    setInterval(tickClock, 1000);
}

// ---------- Particles ----------
let dashParticlesInit = false;
function initDashParticles() {
    if (dashParticlesInit) return;
    const view = document.getElementById('view-dashboard');
    if (!view) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'dash-particles';
    view.insertBefore(canvas, view.firstChild);
    const ctx = canvas.getContext('2d');
    let W, H, dots = [];
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 35; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: 1 + Math.random() * 2 });
    function draw() {
        if (document.getElementById('view-dashboard').classList.contains('active')) {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(124,58,237,0.35)'; ctx.fill();
            });
            for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.strokeStyle = 'rgba(124,58,237,' + (0.12 * (1 - dist / 110)) + ')'; ctx.lineWidth = 1; ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
    dashParticlesInit = true;
}

// ---------- Enhance dashboard ----------
function enhanceDashboard() {
    initDashParticles();
    enhanceHero();

    // Tilt on cards
    document.querySelectorAll('#view-dashboard .stat-card-v2, #view-dashboard .chart-card, #view-dashboard .insight-card').forEach(el => attachTilt(el, 5));

    // Animated counters
    document.querySelectorAll('#view-dashboard .stat-card-value, #view-dashboard .hero-stat-value').forEach(animateValue);

    // Staggered entrance
    let i = 0;
    document.querySelectorAll('#view-dashboard .stat-card-v2, #view-dashboard .chart-card, #view-dashboard .insight-card, #view-dashboard .heatmap-section').forEach(el => {
        if (!el.classList.contains('anim-in')) {
            el.classList.add('anim-in');
            el.style.animationDelay = (i * 0.06) + 's';
            i++;
        }
    });
}

// Wrap renderDashboard
const origRenderDash = window.renderDashboard;
window.renderDashboard = function () {
    origRenderDash();
    setTimeout(enhanceDashboard, 60);
};

console.log('[DashboardGod] GOD MODE loaded');

/* === focus-suite.js === */
// ===== FOCUS SUITE MODULE (Phase 17) =====
// Today's Focus + Pomodoro + Time Blocks

let focusSelectedTasks = [];
let pomoState = {
    mode: 'idle', // 'idle' | 'work' | 'break' | 'longBreak'
    remaining: 25 * 60,
    running: false,
    interval: null,
    sessionsToday: 0,
    totalSessions: 0,
    totalMinutes: 0
};

// ---------- Storage ----------
function loadPomoStats() {
    try {
        const s = JSON.parse(localStorage.getItem('crm_pomo_stats') || '{}');
        const today = new Date().toDateString();
        if (s.lastDate !== today) { s.sessionsToday = 0; s.lastDate = today; }
        pomoState.sessionsToday = s.sessionsToday || 0;
        pomoState.totalSessions = s.totalSessions || 0;
        pomoState.totalMinutes = s.totalMinutes || 0;
    } catch (e) {}
}

function savePomoStats() {
    localStorage.setItem('crm_pomo_stats', JSON.stringify({
        sessionsToday: pomoState.sessionsToday,
        totalSessions: pomoState.totalSessions,
        totalMinutes: pomoState.totalMinutes,
        lastDate: new Date().toDateString()
    }));
}

// ---------- Auto-select top 3 tasks ----------
function selectTopTasks() {
    const tasks = (currentData.tasks || []).filter(t => t.status !== 'done');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Priority scoring
    const scored = tasks.map(t => {
        let score = 0;
        // Due today: +1000
        if (t.dueDate) {
            const d = new Date(t.dueDate);
            if (d >= today && d < tomorrow) score += 1000;
            else if (d < today) score += 500; // overdue
            else score += 100; // future
        }
        // Priority
        if (t.priority === 'high') score += 200;
        else if (t.priority === 'medium') score += 100;
        else score += 50;
        // Recent
        const created = new Date(t.createdAtUtc);
        const daysAgo = (now - created) / 86400000;
        score += Math.max(0, 100 - daysAgo * 10);
        return { task: t, score: score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    focusSelectedTasks = scored.slice(0, 3).map(s => s.task);
}

// ---------- Focus Widget Rendering ----------
function renderFocusWidget() {
    const container = document.getElementById('focusTodayWidget');
    if (!container) return;
    
    selectTopTasks();
    
    const total = focusSelectedTasks.length;
    const done = focusSelectedTasks.filter(t => t.status === 'done').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    
    const circumference = 2 * Math.PI * 28;
    const offset = circumference * (1 - pct / 100);
    
    let tasksHtml = '';
    if (!focusSelectedTasks.length) {
        tasksHtml = '<div class="schedule-empty" style="padding:20px;"><div class="schedule-empty-icon">🎉</div><div>همه کارها تمام شده!</div></div>';
    } else {
        tasksHtml = focusSelectedTasks.map(t => `
            <div class="focus-task-item ${t.status === 'done' ? 'done' : ''}" onclick="toggleFocusTask('${t.id}')">
                <div class="focus-task-check">${t.status === 'done' ? '✓' : ''}</div>
                <div class="focus-task-title">${t.title}</div>
                <div class="focus-task-priority ${t.priority || 'low'}"></div>
            </div>
        `).join('');
    }
    
    container.innerHTML = `
        <svg width="0" height="0" style="position:absolute;">
            <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#7c3aed"/>
                    <stop offset="100%" stop-color="#ec4899"/>
                </linearGradient>
            </defs>
        </svg>
        <div class="focus-widget-header">
            <div class="focus-widget-title">🎯 تمرکز امروز</div>
            <span class="focus-widget-badge">${toPersianDigits(done)}/${toPersianDigits(total)}</span>
        </div>
        <div class="focus-progress-header">
            <div class="focus-progress-ring-wrap">
                <svg class="focus-progress-ring" width="72" height="72" viewBox="0 0 72 72">
                    <circle class="ring-bg" cx="36" cy="36" r="28"/>
                    <circle class="ring-fill" cx="36" cy="36" r="28" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
                </svg>
                <div class="focus-progress-num">${toPersianDigits(pct)}%</div>
            </div>
            <div class="focus-progress-info">
                <h3>${done === total && total > 0 ? '🎉 تکمیل شد!' : 'پیشرفت روزانه'}</h3>
                <p>${toPersianDigits(done)} از ${toPersianDigits(total)} کار مهم</p>
            </div>
        </div>
        <div class="focus-tasks">${tasksHtml}</div>
        <button class="focus-cta" ${done === total ? 'disabled' : ''} onclick="startFocusSession()">
            🚀 شروع جلسه تمرکز
        </button>
    `;
}

async function toggleFocusTask(taskId) {
    const task = focusSelectedTasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    try {
        await api('tasks/' + taskId, 'PUT', { status: newStatus });
        if (newStatus === 'done' && typeof addKarma === 'function') addKarma(10);
        if (typeof playSound === 'function') playSound(newStatus === 'done' ? 'done' : 'schedule');
        await loadAllData();
        renderFocusWidget();
    } catch (e) { toast('خطا', 'error'); }
}

// ---------- Focus Session Mode ----------
function startFocusSession() {
    const incomplete = focusSelectedTasks.filter(t => t.status !== 'done');
    if (!incomplete.length) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'focus-mode-overlay';
    overlay.id = 'focusModeOverlay';
    overlay.innerHTML = `
        <div class="focus-mode-card">
            <button class="focus-mode-close" onclick="closeFocusSession()">×</button>
            <div style="font-size:56px; margin-bottom:16px;">🎯</div>
            <h2 style="font-size:22px; font-weight:800; margin-bottom:8px;">حالت تمرکز فعال شد</h2>
            <p style="color:var(--text-secondary); margin-bottom:24px;">روی این کار تمرکز کن و حواس‌پرتی‌ها را حذف کن</p>
            <div style="padding:16px; background:var(--bg-surface-2); border-radius:var(--radius-md); text-align:right; margin-bottom:20px;">
                <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px;">کار فعلی</div>
                <div style="font-size:16px; font-weight:700;">${incomplete[0].title}</div>
                ${incomplete[0].description ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:6px;">${incomplete[0].description}</div>` : ''}
            </div>
            <div class="pomo-controls" style="margin-bottom:16px;">
                <button class="pomo-btn primary" onclick="closeFocusSession(); if(!pomoState.running) pomoToggle();">
                    ▶ شروع پومودورو (25 دقیقه)
                </button>
            </div>
            <button class="focus-cta" style="background:var(--bg-surface-2); color:var(--text-primary); box-shadow:none;" onclick="closeFocusSession()">
                بعداً ادامه می‌دهم
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closeFocusSession() {
    const o = document.getElementById('focusModeOverlay');
    if (o) o.remove();
}

// ---------- Pomodoro ----------
function pomoToggle() {
    if (pomoState.running) {
        clearInterval(pomoState.interval);
        pomoState.running = false;
    } else {
        if (pomoState.mode === 'idle') {
            pomoState.mode = 'work';
            pomoState.remaining = 25 * 60;
        }
        pomoState.running = true;
        pomoState.interval = setInterval(pomoTick, 1000);
    }
    renderPomoWidget();
}

function pomoTick() {
    pomoState.remaining--;
    if (pomoState.remaining <= 0) {
        pomoComplete();
        return;
    }
    renderPomoWidget();
}

function pomoComplete() {
    clearInterval(pomoState.interval);
    pomoState.running = false;
    
    if (typeof playSound === 'function') playSound('done');
    
    if (pomoState.mode === 'work') {
        pomoState.sessionsToday++;
        pomoState.totalSessions++;
        pomoState.totalMinutes += 25;
        savePomoStats();
        
        toast(`🍅 پومودورو تمام شد! ${pomoState.sessionsToday} امروز`, 'success');
        
        // Switch to break
        if (pomoState.sessionsToday % 4 === 0) {
            pomoState.mode = 'longBreak';
            pomoState.remaining = 15 * 60;
            toast('☕ استراحت طولانی ۱۵ دقیقه!', 'info');
        } else {
            pomoState.mode = 'break';
            pomoState.remaining = 5 * 60;
            toast('🌿 استراحت کوتاه ۵ دقیقه', 'info');
        }
    } else {
        pomoState.mode = 'work';
        pomoState.remaining = 25 * 60;
        toast('💪 برگرد به کار!', 'info');
    }
    
    renderPomoWidget();
}

function pomoReset() {
    clearInterval(pomoState.interval);
    pomoState.running = false;
    pomoState.mode = 'idle';
    pomoState.remaining = 25 * 60;
    renderPomoWidget();
}

function pomoSkip() {
    pomoComplete();
}

function renderPomoWidget() {
    const container = document.getElementById('focusPomoWidget');
    if (!container) return;
    
    const mins = Math.floor(pomoState.remaining / 60);
    const secs = pomoState.remaining % 60;
    const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    
    const totalSec = pomoState.mode === 'work' ? 25*60 : pomoState.mode === 'break' ? 5*60 : pomoState.mode === 'longBreak' ? 15*60 : 25*60;
    const pct = (totalSec - pomoState.remaining) / totalSec;
    const circumference = 2 * Math.PI * 76;
    const offset = circumference * (1 - pct);
    
    const phaseLabel = pomoState.mode === 'work' ? 'FOCUS' : pomoState.mode === 'break' ? 'BREAK' : pomoState.mode === 'longBreak' ? 'LONG BREAK' : 'READY';
    const phaseClass = pomoState.mode === 'work' ? 'work' : 'break';
    
    container.className = 'focus-widget focus-pomodoro' + (pomoState.running ? ' running' : '');
    
    container.innerHTML = `
        <svg width="0" height="0" style="position:absolute;">
            <defs>
                <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#f59e0b"/>
                </linearGradient>
            </defs>
        </svg>
        <div class="focus-widget-header">
            <div class="focus-widget-title">🍅 پومودورو</div>
            <span class="focus-widget-badge" style="background:rgba(239,68,68,0.15); color:#ef4444;">${toPersianDigits(pomoState.sessionsToday)} امروز</span>
        </div>
        <div class="pomo-display">
            <svg class="pomo-ring ${pomoState.running ? 'running' : ''}" width="180" height="180" viewBox="0 0 180 180">
                <circle class="ring-bg" cx="90" cy="90" r="76"/>
                <circle class="ring-fill" cx="90" cy="90" r="76" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="pomo-center">
                <div class="pomo-time">${timeStr}</div>
                <div class="pomo-phase ${phaseClass}">${phaseLabel}</div>
            </div>
        </div>
        <div class="pomo-controls">
            <button class="pomo-btn" onclick="pomoReset()" title="Reset">↻</button>
            <button class="pomo-btn primary" onclick="pomoToggle()" title="${pomoState.running ? 'Pause' : 'Start'}">
                ${pomoState.running ? '⏸' : '▶'}
            </button>
            <button class="pomo-btn" onclick="pomoSkip()" title="Skip">⏭</button>
        </div>
        <div class="pomo-stats">
            <div class="pomo-stat">
                <div class="pomo-stat-value">${toPersianDigits(pomoState.sessionsToday)}</div>
                <div class="pomo-stat-label">امروز</div>
            </div>
            <div class="pomo-stat">
                <div class="pomo-stat-value">${toPersianDigits(pomoState.totalSessions)}</div>
                <div class="pomo-stat-label">کل</div>
            </div>
            <div class="pomo-stat">
                <div class="pomo-stat-value">${toPersianDigits(pomoState.totalMinutes)}</div>
                <div class="pomo-stat-label">دقیقه</div>
            </div>
        </div>
    `;
}

// ---------- Time Blocks ----------
function renderTimeBlocks() {
    const container = document.getElementById('focusScheduleWidget');
    if (!container) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's tasks with dueDate
    const todayTasks = (currentData.tasks || []).filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        const d = new Date(t.dueDate);
        return d >= today && d < tomorrow;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    let timelineHtml = '';
    
    if (!todayTasks.length) {
        timelineHtml = `
            <div class="schedule-empty">
                <div class="schedule-empty-icon">📅</div>
                <div>هیچ کار زمان‌بندی شده‌ای برای امروز نیست</div>
                <div style="margin-top:4px; font-size:11px;">از Inbox کارها را زمان‌بندی کن</div>
            </div>
        `;
    } else {
        timelineHtml = todayTasks.map(t => {
            const d = new Date(t.dueDate);
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            const isPast = d < now;
            return `
                <div class="schedule-item ${isPast ? 'past' : ''} priority-${t.priority || 'medium'}" onclick="openScheduleItem('${t.id}')">
                    <div class="schedule-time">${h}:${m}</div>
                    <div class="schedule-item-title">${t.title}</div>
                    ${t.description ? `<div class="schedule-item-sub">${t.description.slice(0, 40)}${t.description.length > 40 ? '...' : ''}</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    container.innerHTML = `
        <div class="focus-widget-header">
            <div class="focus-widget-title">📅 برنامه امروز</div>
            <span class="focus-widget-badge">${toPersianDigits(todayTasks.length)} کار</span>
        </div>
        <div class="schedule-timeline">${timelineHtml}</div>
        <button class="schedule-cta" onclick="switchView('tasks'); setTimeout(()=>{ const t = document.querySelector('[data-view=\"tasks\"]'); }, 100);">
            + افزودن کار زمان‌بندی شده
        </button>
    `;
}

function openScheduleItem(taskId) {
    const task = currentData.tasks.find(t => t.id === taskId);
    if (task && typeof openEditTaskModal === 'function') {
        openEditTaskModal(task);
    }
}

// ---------- Inject the suite into dashboard ----------
function injectFocusSuite() {
    const view = document.getElementById('view-dashboard');
    if (!view || document.getElementById('focusSuiteContainer')) return;
    
    // Insert after hero
    const hero = view.querySelector('.analytics-hero');
    if (!hero) return;
    
    const container = document.createElement('div');
    container.id = 'focusSuiteContainer';
    container.className = 'focus-suite';
    container.innerHTML = `
        <div class="focus-widget focus-today" id="focusTodayWidget"></div>
        <div class="focus-widget focus-pomodoro" id="focusPomoWidget"></div>
        <div class="focus-widget focus-schedule" id="focusScheduleWidget"></div>
    `;
    
    hero.insertAdjacentElement('afterend', container);
    
    // Tilt effect on widgets
    if (typeof attachTilt === 'function') {
        container.querySelectorAll('.focus-widget').forEach(el => attachTilt(el, 4));
    }
}

// ---------- Hook into dashboard rendering ----------
const origRenderDashF = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashF();
    setTimeout(() => {
        injectFocusSuite();
        loadPomoStats();
        renderFocusWidget();
        renderPomoWidget();
        renderTimeBlocks();
    }, 100);
};

// Re-render on data change
const origLoadAllDataF = window.loadAllData;
window.loadAllData = async function() {
    await origLoadAllDataF();
    if (document.getElementById('focusTodayWidget')) {
        renderFocusWidget();
        renderTimeBlocks();
    }
};

console.log('[FocusSuite] Today Focus + Pomodoro + Time Blocks loaded');

/* === command-hub.js === */
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

console.log('[CommandHub] Smart Search + Quick Actions loaded');

/* === vitals.js === */
// ===== VITALS ROW MODULE (Phase 19) =====

function thisWeekStart() {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const off = (d.getDay() + 1) % 7; // Saturday = 0
    d.setDate(d.getDate() - off);
    return d;
}

// ---------- ENERGY ----------
function computeEnergy() {
    const h = new Date().getHours();
    // Baseline circadian curve
    let base;
    if (h >= 5 && h < 9) base = 60;
    else if (h >= 9 && h < 12) base = 90;
    else if (h >= 12 && h < 14) base = 50;
    else if (h >= 14 && h < 17) base = 75;
    else if (h >= 17 && h < 21) base = 60;
    else base = 30;
    
    // Boost if near user's most-active hour
    const best = bestActiveHour();
    if (best !== null && Math.abs(best - h) <= 1) base = Math.min(100, base + 10);
    
    return Math.max(5, Math.min(100, base));
}

function bestActiveHour() {
    const counts = {};
    (currentData.logs || []).forEach(l => {
        const h = new Date(l.createdAtUtc).getHours();
        counts[h] = (counts[h] || 0) + 1;
    });
    let best = null, max = 0;
    Object.keys(counts).forEach(h => { if (counts[h] > max) { max = counts[h]; best = parseInt(h); } });
    return best;
}

function energyLabel(v) {
    if (v >= 80) return '⚡ اوج انرژی — کار عمیق!';
    if (v >= 60) return '✅ انرژی خوب';
    if (v >= 40) return '🌤 متوسط — کارهای سبک';
    return '🌙 کم — استراحت کن';
}

function renderEnergy() {
    const c = document.getElementById('vitalEnergy');
    if (!c) return;
    const v = computeEnergy();
    const halfCirc = Math.PI * 70; // r=70
    const offset = halfCirc * (1 - v / 100);
    const best = bestActiveHour();
    const bestTxt = best !== null ? toPersianDigits(best) + ':00 تا ' + toPersianDigits(best + 2) + ':00' : 'نامشخص';
    
    c.innerHTML = `
        <svg width="0" height="0" style="position:absolute;"><defs>
            <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#10b981"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ef4444"/>
            </linearGradient>
        </defs></svg>
        <div class="vital-header"><div class="vital-title">💪 سطح انرژی</div><span class="vital-badge" style="background:var(--success-subtle);color:var(--success);">زنده</span></div>
        <div class="energy-wrap">
            <div class="energy-gauge">
                <svg viewBox="0 0 170 95">
                    <path class="g-bg" d="M 15 90 A 70 70 0 0 1 155 90"/>
                    <path class="g-fill" d="M 15 90 A 70 70 0 0 1 155 90" stroke-dasharray="${halfCirc}" stroke-dashoffset="${offset}"/>
                </svg>
                <div class="energy-value">${toPersianDigits(v)}%</div>
            </div>
            <div class="energy-label">${energyLabel(v)}</div>
            <div class="energy-tip">🎯 بهترین زمان کار عمیق: <strong>${bestTxt}</strong></div>
        </div>
    `;
}

// ---------- WEEKLY GOALS ----------
function getGoalTargets() {
    try { return Object.assign({ tasks: 10, activity: 30, contacts: 3, capture: 3, days: 5 }, JSON.parse(localStorage.getItem('crm_weekly_goals') || '{}')); }
    catch (e) { return { tasks: 10, activity: 30, contacts: 3, capture: 3, days: 5 }; }
}

function computeGoals() {
    const ws = thisWeekStart();
    const inWeek = (dstr) => dstr && new Date(dstr) >= ws;
    const d = currentData;
    const doneTasks = (d.tasks || []).filter(t => t.status === 'done' && inWeek(t.updatedAtUtc)).length;
    const activity = (d.logs || []).filter(l => inWeek(l.createdAtUtc)).length;
    const contacts = (d.interactions || []).filter(i => inWeek(i.date || i.createdAtUtc)).length;
    const capture = (d.notes || []).filter(n => inWeek(n.createdAtUtc)).length + (d.ideas || []).filter(i => inWeek(i.createdAtUtc)).length;
    const days = new Set((d.logs || []).filter(l => inWeek(l.createdAtUtc)).map(l => new Date(l.createdAtUtc).toDateString())).size;
    return { tasks: doneTasks, activity: activity, contacts: contacts, capture: capture, days: days };
}

function renderGoals() {
    const c = document.getElementById('vitalGoals');
    if (!c) return;
    const targets = getGoalTargets();
    const cur = computeGoals();
    const defs = [
        { id: 'tasks', label: 'کار تکمیل شده', icon: '✅', color: '#10b981' },
        { id: 'activity', label: 'فعالیت ثبت شده', icon: '⚡', color: '#7c3aed' },
        { id: 'contacts', label: 'تماس با مخاطب', icon: '📞', color: '#3b82f6' },
        { id: 'capture', label: 'یادداشت/ایده', icon: '💡', color: '#f59e0b' },
        { id: 'days', label: 'روز فعال', icon: '📅', color: '#ec4899' }
    ];
    
    let html = `<div class="vital-header"><div class="vital-title">📈 اهداف این هفته</div><button class="goal-edit-btn" onclick="editGoals()" title="ویرایش اهداف">✏️</button></div>`;
    defs.forEach(g => {
        const t = targets[g.id] || 1;
        const v = cur[g.id] || 0;
        const pct = Math.min(100, Math.round((v / t) * 100));
        const done = v >= t;
        html += `
            <div class="goal-row">
                <div class="goal-top">
                    <div class="goal-label">${g.icon} ${g.label}</div>
                    <div class="goal-count ${done ? 'done' : ''}">${toPersianDigits(v)}/${toPersianDigits(t)} ${done ? '✓' : ''}</div>
                </div>
                <div class="goal-bar"><div class="goal-fill" style="width:${pct}%; background:${g.color};"></div></div>
            </div>
        `;
    });
    c.innerHTML = html;
}

function editGoals() {
    const t = getGoalTargets();
    const fields = [ ['tasks', 'کار تکمیل شده'], ['activity', 'فعالیت'], ['contacts', 'تماس'], ['capture', 'یادداشت/ایده'], ['days', 'روز فعال'] ];
    let msg = 'اهداف هفتگی را تنظیم کن:\n\n';
    fields.forEach(f => { msg += f[1] + ' (فعلی: ' + t[f[0]] + '): '; });
    // Simple sequential prompts
    fields.forEach(f => {
        const val = prompt('هدف «' + f[1] + '» (فعلی: ' + t[f[0]] + '):', t[f[0]]);
        if (val !== null && !isNaN(parseInt(val))) t[f[0]] = parseInt(val);
    });
    localStorage.setItem('crm_weekly_goals', JSON.stringify(t));
    renderGoals();
    toast('🎯 اهداف به‌روزرسانی شد', 'success');
}

// ---------- RELATIONSHIP HEALTH ----------
function renderRelHealth() {
    const c = document.getElementById('vitalRel');
    if (!c) return;
    const people = currentData.people || [];
    let overdue = [];
    let score = 100;
    
    if (typeof relationshipStats === 'function') {
        overdue = people.map(p => ({ p: p, st: relationshipStats(p) })).filter(x => x.st.overdue).sort((a, b) => b.st.daysSince - a.st.daysSince);
        const ratio = people.length ? overdue.length / people.length : 0;
        score = Math.round(100 - ratio * 100);
    }
    
    const circ = 2 * Math.PI * 26;
    const offset = circ * (1 - score / 100);
    const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    
    let personsHtml = '';
    if (!overdue.length) {
        personsHtml = '<div class="schedule-empty" style="padding:14px;"><div style="font-size:26px;">💚</div><div>همه روابط سالم هستند!</div></div>';
    } else {
        personsHtml = overdue.slice(0, 3).map((x, i) => {
            const initials = x.p.name.split(' ').map(w => w[0]).join('').slice(0, 2);
            return `<div class="rel-person" onclick="openPersonPanel('${x.p.id}')">
                <div class="rel-avatar" style="background:${colors[i % colors.length]};">${initials}</div>
                <div class="rel-person-info"><div class="rel-person-name">${x.p.name}</div><div class="rel-person-days">${toPersianDigits(x.st.daysSince)} روز بدون تماس</div></div>
                <span style="color:var(--text-tertiary);">→</span>
            </div>`;
        }).join('');
    }
    
    c.innerHTML = `
        <svg width="0" height="0" style="position:absolute;"><defs>
            <linearGradient id="relGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#3b82f6"/>
            </linearGradient>
        </defs></svg>
        <div class="vital-header"><div class="vital-title">💞 سلامت روابط</div><span class="vital-badge" style="background:${score >= 70 ? 'var(--success-subtle)' : 'var(--warning-subtle)'};color:${score >= 70 ? 'var(--success)' : 'var(--warning)'};">${score >= 70 ? 'سالم' : 'نیاز به توجه'}</span></div>
        <div class="rel-score-row">
            <div class="rel-ring-wrap">
                <svg class="rel-ring" width="64" height="64" viewBox="0 0 64 64">
                    <circle class="r-bg" cx="32" cy="32" r="26"/>
                    <circle class="r-fill" cx="32" cy="32" r="26" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
                </svg>
                <div class="rel-ring-num">${toPersianDigits(score)}</div>
            </div>
            <div class="rel-score-info"><h3>امتیاز رابطه</h3><p>${toPersianDigits(overdue.length)} مخاطب نیاز به پیگیری</p></div>
        </div>
        ${personsHtml}
    `;
}

// ---------- Inject ----------
function injectVitalsRow() {
    const view = document.getElementById('view-dashboard');
    if (!view || document.getElementById('vitalsRow')) return;
    
    const anchor = document.getElementById('focusSuiteContainer') || document.getElementById('commandHub') || view.querySelector('.analytics-hero');
    if (!anchor) return;
    
    const row = document.createElement('div');
    row.id = 'vitalsRow';
    row.className = 'vitals-row';
    row.innerHTML = `
        <div class="vital-card" id="vitalEnergy" style="--glow:rgba(16,185,129,0.1);"></div>
        <div class="vital-card" id="vitalGoals" style="--glow:rgba(124,58,237,0.1);"></div>
        <div class="vital-card" id="vitalRel" style="--glow:rgba(236,72,153,0.1);"></div>
    `;
    anchor.insertAdjacentElement('afterend', row);
    
    if (typeof attachTilt === 'function') row.querySelectorAll('.vital-card').forEach(el => attachTilt(el, 4));
}

function renderVitals() {
    renderEnergy();
    renderGoals();
    renderRelHealth();
}

const origRenderDashV = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashV();
    setTimeout(() => { injectVitalsRow(); renderVitals(); }, 120);
};

const origLoadAllDataV = window.loadAllData;
window.loadAllData = async function() {
    await origLoadAllDataV();
    if (document.getElementById('vitalsRow')) renderVitals();
};

console.log('[Vitals] Energy + Goals + Relationship loaded');

/* === ambient.js === */
// ===== AMBIENT SUITE MODULE (Phase 20) =====

// ---------- QUOTES ----------
const QUOTES = [
    ['موفقیت مجموع تلاش‌های کوچکی است که هر روز تکرار می‌شوند.', 'رابرت کولیر'],
    ['بهترین زمان برای کاشتن درخت بیست سال پیش بود؛ دومین بهترین زمان، امروز است.', 'ضرب‌المثل چینی'],
    ['تمرکز یعنی نه گفتن به هزاران ایده خوب.', 'استیو جابز'],
    ['سخت‌ترین قدم، همان قدم اول است.', 'ناشناس'],
    ['هر روز صبح که بیدار می‌شوی، فکر کن چه امتیاز ارزشمندی است که زنده‌ای.', 'مارکوس اورلیوس'],
    ['آینده متعلق به کسانی است که به زیبایی رویاهایشان باور دارند.', 'النور روزولت'],
    ['ساده‌ترین راه برای پیش‌بینی آینده، ساختن آن است.', 'آبراهام لینکلن'],
    ['عادت‌های تو سرنوشت تو را می‌سازند.', 'ناشناس'],
    ['کم‌کم بسیار شود.', 'ضرب‌المثل فارسی'],
    ['قطره قطره جمع گردد وانگهی دریا شود.', 'ضرب‌المثل فارسی'],
    ['نظم یعنی انجام کاری که باید، وقتی که باید.', 'ناشناس'],
    ['انسان‌های بزرگ، اهداف دارند؛ دیگران تنها آرزوهایی.', 'واشینگتون اروینگ']
];

function renderQuote() {
    const c = document.getElementById('ambientQuote');
    if (!c) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const q = QUOTES[dayOfYear % QUOTES.length];
    c.innerHTML = `
        <div class="quote-mark">“</div>
        <div class="quote-text">${q[0]}</div>
        <div class="quote-author">— ${q[1]}</div>
    `;
}

// ---------- WEATHER ----------
const COND_MAP = {
    'Sunny': ['☀️', 'آفتابی'], 'Clear': ['🌙', 'صاف'], 'Partly cloudy': ['⛅', 'نیمه‌ابری'],
    'Cloudy': ['☁️', 'ابری'], 'Overcast': ['☁️', 'تمام‌ابری'], 'Mist': ['🌫️', 'مه'],
    'Fog': ['🌫️', 'مه'], 'Rain': ['🌧️', 'بارانی'], 'Light rain': ['🌦️', 'باران سبک'],
    'Drizzle': ['🌦️', 'نم‌نم'], 'Thunderstorm': ['⛈️', 'رعدوبرق'], 'Snow': ['❄️', 'برفی'],
    'Light snow': ['🌨️', 'برف سبک']
};

async function loadWeather() {
    const c = document.getElementById('ambientWeather');
    if (!c) return;
    
    // Cache 30 min
    try {
        const cached = JSON.parse(localStorage.getItem('crm_weather') || 'null');
        if (cached && (Date.now() - cached.t) < 30 * 60 * 1000) { renderWeather(cached.data); return; }
    } catch (e) {}
    
    try {
        const res = await fetch('https://wttr.in/?format=%t|%C|%h|%w', { signal: AbortSignal.timeout(4000) });
        const txt = await res.text();
        const parts = txt.split('|');
        const data = { temp: parts[0], cond: parts[1], hum: parts[2], wind: parts[3] };
        localStorage.setItem('crm_weather', JSON.stringify({ t: Date.now(), data: data }));
        renderWeather(data);
    } catch (e) {
        // Offline fallback
        c.innerHTML = `<div class="weather-main"><div class="weather-icon">🌐</div><div><div class="weather-temp">--</div><div class="weather-cond">آفلاین — داده هواشناسی در دسترس نیست</div></div></div>`;
    }
}

function renderWeather(data) {
    const c = document.getElementById('ambientWeather');
    if (!c) return;
    const m = COND_MAP[data.cond] || ['🌤️', data.cond || ''];
    c.innerHTML = `
        <div class="weather-main">
            <div class="weather-icon">${m[0]}</div>
            <div>
                <div class="weather-temp">${data.temp}</div>
                <div class="weather-cond">${m[1]}</div>
            </div>
        </div>
        <div class="weather-meta">
            <span>💧 رطوبت: ${data.hum}</span>
            <span>💨 باد: ${data.wind}</span>
        </div>
    `;
}

// ---------- AI ASSISTANT ----------
let aiOpen = false;

function injectAmbient() {
    const view = document.getElementById('view-dashboard');
    if (!view || document.getElementById('ambientRow')) return;
    const anchor = document.getElementById('vitalsRow') || document.getElementById('focusSuiteContainer') || view.querySelector('.analytics-hero');
    if (!anchor) return;
    const row = document.createElement('div');
    row.id = 'ambientRow';
    row.className = 'ambient-row';
    row.innerHTML = '<div class="ambient-card" id="ambientWeather"></div><div class="ambient-card quote-card" id="ambientQuote"></div>';
    anchor.insertAdjacentElement('afterend', row);
    renderQuote();
    loadWeather();
}

function injectAIFab() {
    if (document.getElementById('aiFab')) return;
    const fab = document.createElement('button');
    fab.id = 'aiFab';
    fab.className = 'ai-fab';
    fab.title = 'دستیار هوشمند';
    fab.innerHTML = '🤖';
    fab.onclick = toggleAI;
    document.body.appendChild(fab);
}

function toggleAI() {
    const panel = document.getElementById('aiPanel');
    if (panel) { panel.remove(); aiOpen = false; return; }
    aiOpen = true;
    const p = document.createElement('div');
    p.id = 'aiPanel';
    p.className = 'ai-panel';
    p.innerHTML = `
        <div class="ai-header">
            <div class="ai-header-avatar">🤖</div>
            <div><div class="ai-header-title">دستیار هوشمند CRM</div><div class="ai-header-sub">آفلاین • از داده‌های تو جواب می‌دهد</div></div>
            <button class="ai-close" onclick="toggleAI()">×</button>
        </div>
        <div class="ai-messages" id="aiMessages"></div>
        <div class="ai-chips" id="aiChips">
            <span class="ai-chip" onclick="aiAsk('امروز چی کار کنم؟')">امروز چی کار کنم؟</span>
            <span class="ai-chip" onclick="aiAsk('خلاصه هفته')">خلاصه هفته</span>
            <span class="ai-chip" onclick="aiAsk('کی رو پیگیری کنم؟')">کی رو پیگیری کنم؟</span>
            <span class="ai-chip" onclick="aiAsk('آمار کلی')">آمار کلی</span>
            <span class="ai-chip" onclick="aiAsk('سطح انرژی')">سطح انرژی</span>
        </div>
        <div class="ai-input-row">
            <input class="ai-input" id="aiInput" placeholder="سوال خود را بنویس..." onkeydown="if(event.key==='Enter')aiSend()"/>
            <button class="ai-send" onclick="aiSend()">➤</button>
        </div>
    `;
    document.body.appendChild(p);
    aiAddBot('سلام! 👋 من دستیار هوشمند CRM تو هستم. از من بپرس:\n• امروز چی کار کنم؟\n• خلاصه هفته\n• کی رو پیگیری کنم؟\n• آمار کلی');
}

function aiAddUser(t) {
    const m = document.getElementById('aiMessages');
    const d = document.createElement('div');
    d.className = 'ai-msg user';
    d.textContent = t;
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
}

function aiAddBot(t) {
    const m = document.getElementById('aiMessages');
    const typing = document.createElement('div');
    typing.className = 'ai-msg bot ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    m.appendChild(typing);
    m.scrollTop = m.scrollHeight;
    setTimeout(() => {
        typing.remove();
        const d = document.createElement('div');
        d.className = 'ai-msg bot';
        d.textContent = t;
        m.appendChild(d);
        m.scrollTop = m.scrollHeight;
    }, 600);
}

function aiSend() {
    const inp = document.getElementById('aiInput');
    const t = inp.value.trim();
    if (!t) return;
    inp.value = '';
    aiAsk(t);
}

function aiAsk(q) {
    aiAddUser(q);
    setTimeout(() => aiAddBot(aiRespond(q)), 200);
}

function aiRespond(q) {
    const d = currentData;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const ws = thisWeekStart();
    
    // Today tasks
    if (q.includes('امروز') || q.includes('چی کار') || q.includes('انجام بدم')) {
        const t = (d.tasks || []).filter(x => x.status !== 'done' && x.dueDate && new Date(x.dueDate) < tomorrow).sort((a, b) => (a.priority === 'high' ? -1 : 1));
        if (!t.length) return 'امروز کار سررسیدی نداری! 🎉 می‌تونی روی ایده‌ها یا کارهای عقب‌افتاده تمرکز کنی.';
        let s = 'برنامه امروز تو:\n';
        t.slice(0, 3).forEach((x, i) => { s += (i + 1) + '. ' + x.title + (x.priority === 'high' ? ' 🔴' : '') + '\n'; });
        s += '\nپیشنهاد: اول کارهای 🔴 رو انجام بده!';
        return s;
    }
    // Week summary
    if (q.includes('خلاصه') || q.includes('هفته')) {
        const act = (d.logs || []).filter(l => new Date(l.createdAtUtc) >= ws).length;
        const done = (d.tasks || []).filter(x => x.status === 'done' && new Date(x.updatedAtUtc) >= ws).length;
        return '📊 خلاصه هفته:\n• ' + toPersianDigits(act) + ' فعالیت ثبت شده\n• ' + toPersianDigits(done) + ' کار تکمیل شده\n• ' + toPersianDigits((d.interactions || []).filter(i => new Date(i.date || i.createdAtUtc) >= ws).length) + ' تماس با مخاطب\n\nادامه بده! 💪';
    }
    // Follow-up
    if (q.includes('پیگیری') || q.includes('کی رو') || q.includes('تماس')) {
        if (typeof relationshipStats !== 'function') return 'این قابلیت نیاز به ماژول روابط دارد.';
        const od = (d.people || []).map(p => ({ p: p, st: relationshipStats(p) })).filter(x => x.st.overdue).sort((a, b) => b.st.daysSince - a.st.daysSince);
        if (!od.length) return 'همه روابطت سالمه! 💚 کسی منتظر تماس نیست.';
        let s = 'این افراد منتظر تماس تو هستن:\n';
        od.slice(0, 3).forEach(x => { s += '• ' + x.p.name + ' (' + toPersianDigits(x.st.daysSince) + ' روز)\n'; });
        return s;
    }
    // Stats
    if (q.includes('آمار') || q.includes('چند تا')) {
        return '📈 آمار کلی:\n• مخاطبان: ' + toPersianDigits((d.people || []).length) + '\n• کارها: ' + toPersianDigits((d.tasks || []).length) + '\n• ایده‌ها: ' + toPersianDigits((d.ideas || []).length) + '\n• یادداشت‌ها: ' + toPersianDigits((d.notes || []).length) + '\n• پروژه‌ها: ' + toPersianDigits((d.projects || []).length);
    }
    // Energy
    if (q.includes('انرژی')) {
        const v = computeEnergy();
        return '💪 سطح انرژی فعلی: ' + toPersianDigits(v) + '%\n' + energyLabel(v);
    }
    // Help
    return 'می‌تونم این‌ها رو بگم:\n• «امروز چی کار کنم؟»\n• «خلاصه هفته»\n• «کی رو پیگیری کنم؟»\n• «آمار کلی»\n• «سطح انرژی»';
}

// Hook
const origRenderDashA = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashA();
    setTimeout(() => { injectAmbient(); injectAIFab(); }, 150);
};

console.log('[Ambient] AI + Weather + Quote loaded');

/* === customize.js === */
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

/* === layout-pro.js === */
// ===== PRO LAYOUT MODULE (Phase 22) =====
function injectZoneLabels() {
    const view = document.getElementById('view-dashboard');
    if (!view) return;
    
    const zones = [
        { before: 'focusSuiteContainer', label: '⚡ امروز' },
        { before: 'vitalsRow', label: '📈 سلامت و بهره‌وری' },
        { before: 'statsGrid', label: '📊 نمای کلی' },
        { before: 'chartsGrid', label: '📈 روندها' },
        { before: 'relWidgets', label: '💞 روابط و دستاوردها' }
    ];
    
    zones.forEach(z => {
        const target = document.getElementById(z.before);
        if (!target) return;
        // Avoid duplicate
        if (target.previousElementSibling && target.previousElementSibling.classList.contains('zone-label')) return;
        const lbl = document.createElement('div');
        lbl.className = 'zone-label';
        lbl.textContent = z.label;
        target.parentNode.insertBefore(lbl, target);
    });
}

const origRenderDashL = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashL();
    setTimeout(injectZoneLabels, 250);
};

console.log('[ProLayout] Bento + zones loaded');

/* === topbar-pro.js === */
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


/* === dashboard-qa.js === */
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

/* === context.js === */
// ===== CONTEXT ENGINE - Reactive State Management =====
const $context = (() => {
    const state = {
        currentTask: null,
        selectedPerson: null,
        todayDate: new Date(),
        focusRange: 7,
        activeView: 'dashboard',
        theme: localStorage.getItem('crm_theme') || 'dark',
        quickStartDone: localStorage.getItem('crm_qs_done') === '1'
    };
    
    const subscribers = new Map();
    let idCounter = 0;
    
    return {
        get state() { return { ...state }; },
        
        set(key, value) {
            if (state[key] === value) return;
            state[key] = value;
            if (key === 'theme') localStorage.setItem('crm_theme', value);
            if (key === 'quickStartDone' && value) localStorage.setItem('crm_qs_done', '1');
            this._notify(key, value);
        },
        
        watch(keys, callback) {
            const id = ++idCounter;
            subscribers.set(id, { keys, callback });
            callback(state); // Initial call
            return id;
        },
        
        unwatch(id) { subscribers.delete(id); },
        
        _notify(key, value) {
            subscribers.forEach(({ keys, callback }) => {
                if (!keys || keys.includes(key)) {
                    try { callback(state); } catch (e) { console.warn('[Context]', e); }
                }
            });
            document.dispatchEvent(new CustomEvent('ctx:' + key, { detail: value }));
        },
        
        // Widget registry
        widgets: new Map(),
        registerWidget(id, el, opts = {}) {
            this.widgets.set(id, { el, opts });
            el.dataset.ctxWidget = id;
        },
        
        // Actions
        selectTask(task) { this.set('currentTask', task); },
        selectPerson(person) { this.set('selectedPerson', person); },
        setFocusRange(days) { this.set('focusRange', days); },
        toggleTheme() { this.set('theme', state.theme === 'dark' ? 'light' : 'dark'); },
        
        // Export utility
        async exportWidget(id, format = 'png') {
            const widget = this.widgets.get(id);
            if (!widget) return;
            
            if (format === 'json') {
                const data = widget.opts.dataFn ? widget.opts.dataFn() : {};
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadBlob(blob, id + '.json');
            } else if (format === 'png' || format === 'svg') {
                // Use html2canvas-like approach with SVG foreignObject
                await exportAsImage(widget.el, id + '.' + format, format);
            } else if (format === 'copy') {
                const data = widget.opts.dataFn ? widget.opts.dataFn() : {};
                await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                if (typeof toast === 'function') toast('📋 کپی شد', 'success');
            }
        }
    };
})();

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function exportAsImage(el, filename, format) {
    // Simple SVG-based export
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">${clone.outerHTML}</div>
        </foreignObject>
    </svg>`;
    
    document.body.removeChild(clone);
    
    if (format === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        downloadBlob(blob, filename);
    } else {
        // For PNG, we'd need canvas conversion - simplified for now
        if (typeof toast === 'function') toast('📥 Export در حال آماده‌سازی...', 'info');
    }
}

// Theme applier
function applyTheme() {
    const theme = $context.state.theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('light-theme', theme === 'light');
}

$context.watch(['theme'], applyTheme);
setTimeout(applyTheme, 100);

console.log('[Context Engine] Reactive state management loaded');

/* === widget-export.js === */
// ===== WIDGET EXPORT SYSTEM =====
function addWidgetMenu(widgetEl, widgetId, dataFn) {
    if (widgetEl.querySelector('.widget-menu-btn')) return;
    
    const btn = document.createElement('button');
    btn.className = 'widget-menu-btn';
    btn.innerHTML = '⋯';
    btn.title = 'گزینه‌های ویجت';
    btn.onclick = (e) => {
        e.stopPropagation();
        showWidgetMenu(e.target, widgetId, dataFn);
    };
    
    const header = widgetEl.querySelector('.card-header, .chart-header, .focus-widget-header, .vital-header, .focus-widget > div:first-child');
    if (header) header.appendChild(btn);
    
    $context.registerWidget(widgetId, widgetEl, { dataFn });
}

function showWidgetMenu(anchor, widgetId, dataFn) {
    const old = document.querySelector('.widget-menu');
    if (old) old.remove();
    
    const menu = document.createElement('div');
    menu.className = 'widget-menu';
    menu.innerHTML = `
        <div class="widget-menu-item" onclick="$context.exportWidget('${widgetId}', 'json')">📄 Export JSON</div>
        <div class="widget-menu-item" onclick="$context.exportWidget('${widgetId}', 'copy')">📋 Copy Data</div>
        <div class="widget-menu-item" onclick="$context.exportWidget('${widgetId}', 'svg')">🖼️ Export SVG</div>
    `;
    
    const rect = anchor.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function h(e) {
            if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', h); }
        });
    }, 50);
}

// Inject menus into key widgets
function injectWidgetMenus() {
    const widgets = {
        'stats': document.getElementById('statsGrid'),
        'focus-today': document.querySelector('.focus-today'),
        'pomo': document.querySelector('.focus-pomodoro'),
        'schedule': document.querySelector('.focus-schedule'),
        'activity': document.getElementById('activityChartContainer')?.closest('.chart-card'),
        'heatmap': document.getElementById('heatmapContainer')?.closest('.heatmap-section'),
        'timeline': document.getElementById('timeline')?.closest('.card')
    };
    
    Object.entries(widgets).forEach(([id, el]) => {
        if (el) addWidgetMenu(el, id, () => currentData);
    });
}

setTimeout(injectWidgetMenus, 500);
console.log('[Widget Export] Menus injected');

/* === widget-interactions.js === */
// ===== WIDGET INTERACTIONS =====
// Heatmap click → select date → filter Today's Focus
function enableHeatmapInteraction() {
    const hm = document.getElementById('heatmapContainer');
    if (!hm) return;
    
    hm.addEventListener('click', e => {
        const cell = e.target.closest('[data-date]');
        if (!cell) return;
        
        const date = cell.dataset.date;
        $context.set('selectedDate', new Date(date));
        
        // Filter today's focus by that date
        const tasks = currentData.tasks.filter(t => {
            if (!t.dueDate) return false;
            return new Date(t.dueDate).toDateString() === new Date(date).toDateString();
        });
        
        if (tasks.length) {
            focusSelectedTasks = tasks.slice(0, 3);
            renderFocusWidget();
            toast('📅 فیلتر شد: ' + toPersianDigits(tasks.length) + ' کار', 'info');
        }
    });
}

// Timeline click → open task
function enableTimelineInteraction() {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    
    tl.addEventListener('click', e => {
        const item = e.target.closest('.timeline-item');
        if (!item) return;
        
        const text = item.querySelector('.timeline-text')?.textContent;
        if (text && text.includes('کار')) {
            const task = currentData.tasks.find(t => text.includes(t.title));
            if (task) {
                $context.selectTask(task);
                openEditTaskModal(task);
            }
        }
    });
}

// Insights click → navigate
function enableInsightsInteraction() {
    document.querySelectorAll('#insightsGrid .insight-card').forEach((card, i) => {
        if (card.dataset.interactive) return;
        card.dataset.interactive = '1';
        card.style.cursor = 'pointer';
        card.onclick = () => {
            if (i === 0) switchView('tasks'); // Best day → tasks
            else if (i === 1) switchView('people'); // Total items → people
            else switchView('reports'); // Activity → reports
        };
    });
}

setTimeout(() => {
    enableHeatmapInteraction();
    enableTimelineInteraction();
    enableInsightsInteraction();
}, 600);

console.log('[Interactions] Widget interactions enabled');

/* === quick-start.js === */
// ===== QUICK START GUIDE =====
const QS_STEPS = [
    { target: '.analytics-hero', title: '👋 خوش آمدید!', desc: 'اینجا خلاصه‌ی روز شماست. ساعت زنده + آمار کلی.' },
    { target: '.command-search', title: '🔍 جستجوی سریع', desc: 'Ctrl+K برای جستجوی همه‌چیز: کارها، مخاطبان، یادداشت‌ها.' },
    { target: '.focus-today', title: '🎯 تمرکز امروز', desc: '۳ کار مهم امروز. تیک بزنید تا پیشرفت را ببینید.' },
    { target: '.focus-pomodoro', title: '🍅 پومودورو', desc: '۲۵ دقیقه کار عمیق + ۵ دقیقه استراحت.' },
    { target: '.stats-grid-v2', title: '📊 آمار زنده', desc: 'آمار کلیدی + تغییرات نسبت به هفته قبل.' }
];

let qsCurrent = 0;

function startQuickStart() {
    qsCurrent = 0;
    showQsStep();
}

function showQsStep() {
    const old = document.getElementById('qsOverlay');
    if (old) old.remove();
    
    if (qsCurrent >= QS_STEPS.length) {
        $context.set('quickStartDone', true);
        toast('🎉 راهنما تمام شد! لذت ببرید', 'success');
        return;
    }
    
    const step = QS_STEPS[qsCurrent];
    const target = document.querySelector(step.target);
    if (!target) { qsCurrent++; showQsStep(); return; }
    
    // Highlight target
    const rect = target.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.id = 'qsOverlay';
    overlay.innerHTML = `
        <div class="qs-backdrop" onclick="skipQuickStart()"></div>
        <div class="qs-highlight" style="top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;"></div>
        <div class="qs-card" style="top:${rect.bottom + 16}px;left:${rect.left}px;">
            <div class="qs-card-title">${step.title}</div>
            <div class="qs-card-desc">${step.desc}</div>
            <div class="qs-card-actions">
                <button class="btn btn-ghost" onclick="skipQuickStart()">رد کردن</button>
                <button class="btn btn-primary" onclick="nextQsStep()">${qsCurrent === QS_STEPS.length - 1 ? 'پایان' : 'بعدی →'}</button>
            </div>
            <div class="qs-card-progress">${toPersianDigits(qsCurrent + 1)} از ${toPersianDigits(QS_STEPS.length)}</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function nextQsStep() {
    qsCurrent++;
    showQsStep();
}

function skipQuickStart() {
    const old = document.getElementById('qsOverlay');
    if (old) old.remove();
    $context.set('quickStartDone', true);
}

// Auto-start on first visit
setTimeout(() => {
    if (!$context.state.quickStartDone) startQuickStart();
}, 1000);

console.log('[QuickStart] Guide loaded');

/* === ai-insights.js === */
// ===== AI INSIGHTS ENGINE (Phase 26) - Offline, rule-based =====

function aiDismissed() {
    try { return JSON.parse(localStorage.getItem('crm_ai_dismissed') || '{}'); } catch (e) { return {}; }
}

function aiDismiss(id) {
    const d = aiDismissed();
    d[id] = Date.now();
    localStorage.setItem('crm_ai_dismissed', JSON.stringify(d));
    renderAiBar();
}

function aiIsDismissed(id) {
    const d = aiDismissed();
    // Hide for 24h
    return d[id] && (Date.now() - d[id]) < 24 * 3600 * 1000;
}

function generateSuggestions() {
    const s = [];
    const d = currentData;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 1. Overdue tasks (high)
    const overdue = (d.tasks || []).filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < today);
    if (overdue.length) {
        s.push({ id: 'overdue', icon: '⚠️', priority: 'high',
            text: toPersianDigits(overdue.length) + ' کار عقب‌افتاده داری. اولویت با: «' + overdue[0].title + '»',
            actionLabel: 'مشاهده و انجام',
            action: () => { switchView('tasks'); } });
    }
    
    // 2. Due today (high)
    const dueToday = (d.tasks || []).filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) >= today && new Date(t.dueDate) < tomorrow);
    if (dueToday.length) {
        s.push({ id: 'duetoday', icon: '🎯', priority: 'high',
            text: 'امروز ' + toPersianDigits(dueToday.length) + ' کار سررسید داری. شروع کن!',
            actionLabel: 'شروع فوکوس',
            action: () => { if (typeof startFocusSession === 'function') startFocusSession(); } });
    }
    
    // 3. Occasion today/soon (high)
    if (typeof getUpcomingOccasions === 'function') {
        const occ = getUpcomingOccasions(3);
        if (occ.length) {
            const o = occ[0];
            s.push({ id: 'occ-' + o.person.id, icon: '🎂', priority: 'high',
                text: (o.diff === 0 ? 'امروز' : toPersianDigits(o.diff) + ' روز دیگه') + ': ' + o.occ.title + ' ' + o.person.name,
                actionLabel: 'مشاهده مخاطب',
                action: () => openPersonPanel(o.person.id) });
        }
    }
    
    // 4. Relationship overdue (medium)
    if (typeof relationshipStats === 'function') {
        const od = (d.people || []).map(p => ({ p, st: relationshipStats(p) })).filter(x => x.st.overdue).sort((a, b) => b.st.daysSince - a.st.daysSince);
        if (od.length) {
            s.push({ id: 'rel-' + od[0].p.id, icon: '💞', priority: 'medium',
                text: toPersianDigits(od[0].st.daysSince) + ' روزه با «' + od[0].p.name + '» تماس نگرفتی',
                actionLabel: 'ثبت تماس',
                action: () => openPersonPanel(od[0].p.id) });
        }
    }
    
    // 5. Best hour = now → deep work (medium)
    if (typeof bestActiveHour === 'function') {
        const best = bestActiveHour();
        if (best !== null && Math.abs(best - now.getHours()) <= 1) {
            s.push({ id: 'deepwork', icon: '⚡', priority: 'medium',
                text: 'الان ساعت طلایی توئه! بهترین زمان برای کار عمیق',
                actionLabel: 'شروع پومودورو',
                action: () => { if (typeof pomoToggle === 'function' && !pomoState.running) pomoToggle(); } });
        }
    }
    
    // 6. Unscheduled tasks → time block (medium)
    const unsched = (d.tasks || []).filter(t => !t.dueDate && t.status !== 'done');
    if (unsched.length >= 3) {
        s.push({ id: 'unsched', icon: '📥', priority: 'medium',
            text: toPersianDigits(unsched.length) + ' کار بدون تاریخ داری. زمان‌بندی‌شون کن',
            actionLabel: 'باز کردن Inbox',
            action: () => switchView('inbox') });
    }
    
    // 7. Streak at risk (medium)
    if (typeof getGamStats === 'function') {
        const g = getGamStats();
        if (g.streak > 0 && g.lastActiveDate !== today.toDateString()) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (g.lastActiveDate === yesterday) {
                s.push({ id: 'streak', icon: '🔥', priority: 'medium',
                    text: 'Streak ' + toPersianDigits(g.streak) + ' روزه‌ت در خطره! امروز یه کار انجام بده',
                    actionLabel: 'انجام یه کار',
                    action: () => switchView('tasks') });
            }
        }
    }
    
    // 8. Low week completion (low)
    const weekDone = (d.tasks || []).filter(t => t.status === 'done' && t.updatedAtUtc && new Date(t.updatedAtUtc) >= thisWeekStart()).length;
    if (weekDone === 0 && now.getDay() > 2) {
        s.push({ id: 'weekzero', icon: '📉', priority: 'low',
            text: 'این هفته هنوز کاری تکمیل نکردی. با یه کار کوچیک شروع کن',
            actionLabel: 'کوچیک‌ترین کار',
            action: () => switchView('tasks') });
    }
    
    // Sort by priority
    const order = { high: 0, medium: 1, low: 2 };
    s.sort((a, b) => order[a.priority] - order[b.priority]);
    return s.filter(x => !aiIsDismissed(x.id));
}

let aiCurrentSuggestions = [];

function renderAiBar() {
    let bar = document.getElementById('aiBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'aiBar';
        bar.className = 'ai-bar';
        const anchor = document.getElementById('commandHub') || document.getElementById('focusSuiteContainer') || document.querySelector('.analytics-hero');
        if (anchor) anchor.insertAdjacentElement('afterend', bar);
        else return;
    }
    
    aiCurrentSuggestions = generateSuggestions();
    
    let html = '<div class="ai-bar-badge"><div class="ai-bar-icon">✨</div><div class="ai-bar-label">AI</div></div>';
    
    if (!aiCurrentSuggestions.length) {
        html += '<div class="ai-bar-empty">✨ همه‌چیز تحت کنترله! پیشنهاد جدیدی نیست.</div>';
    } else {
        html += '<div class="ai-suggestions">';
        aiCurrentSuggestions.forEach((sug, i) => {
            html += `<div class="ai-suggestion priority-${sug.priority}" onclick="aiExec(${i})">
                <button class="ai-sug-dismiss" onclick="event.stopPropagation(); aiDismiss('${sug.id}')">×</button>
                <div class="ai-sug-icon">${sug.icon}</div>
                <div>
                    <div class="ai-sug-text">${sug.text}</div>
                    <div class="ai-sug-action">${sug.actionLabel} ←</div>
                </div>
            </div>`;
        });
        html += '</div>';
    }
    
    bar.innerHTML = html;
}

function aiExec(i) {
    const sug = aiCurrentSuggestions[i];
    if (sug && sug.action) sug.action();
}

// Hook
const origRenderDashAI = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashAI();
    setTimeout(renderAiBar, 350);
};

setTimeout(renderAiBar, 600);
console.log('[AI Insights] Engine loaded');

/* === mobile.js === */
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

/* === pipeline.js === */
// ===== PIPELINE MODULE (Phase 28) =====
const DEAL_STAGES = [
    { key: 'lead', label: 'سرنخ', color: '#8b5cf6' },
    { key: 'qualified', label: 'واجد شرایط', color: '#3b82f6' },
    { key: 'proposal', label: 'پیشنهاد', color: '#f59e0b' },
    { key: 'won', label: 'برد ✅', color: '#10b981' },
    { key: 'lost', label: 'باخت ❌', color: '#ef4444' }
];

function fmtMoney(v) {
    v = +v || 0;
    if (v >= 1e9) return toPersianDigits((v / 1e9).toFixed(1)) + ' میلیارد';
    if (v >= 1e6) return toPersianDigits((v / 1e6).toFixed(1)) + ' میلیون';
    if (v >= 1e3) return toPersianDigits((v / 1e3).toFixed(0)) + ' هزار';
    return toPersianDigits(v);
}

function renderPipeline() {
    const board = document.getElementById('pipelineBoard');
    const stats = document.getElementById('pipelineStats');
    if (!board) return;
    const deals = currentData.deals || [];
    
    const open = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
    const totalOpen = open.reduce((s, d) => s + (+d.value || 0), 0);
    const weighted = open.reduce((s, d) => s + (+d.value || 0) * ((+d.probability || 0) / 100), 0);
    const won = deals.filter(d => d.stage === 'won').reduce((s, d) => s + (+d.value || 0), 0);
    
    stats.innerHTML = `
        <div class="pipe-stat"><div class="pipe-stat-label">ارزش باز Pipeline</div><div class="pipe-stat-value money">${fmtMoney(totalOpen)}</div></div>
        <div class="pipe-stat"><div class="pipe-stat-label">پیش‌بینی وزن‌دار</div><div class="pipe-stat-value">${fmtMoney(weighted)}</div></div>
        <div class="pipe-stat"><div class="pipe-stat-label">معاملات باز</div><div class="pipe-stat-value">${toPersianDigits(open.length)}</div></div>
        <div class="pipe-stat"><div class="pipe-stat-label">برد شده</div><div class="pipe-stat-value money">${fmtMoney(won)}</div></div>
    `;
    
    board.innerHTML = DEAL_STAGES.map(st => {
        const col = deals.filter(d => (d.stage || 'lead') === st.key);
        const sum = col.reduce((s, d) => s + (+d.value || 0), 0);
        return `<div class="pipe-col" style="--col-color:${st.color}" data-stage="${st.key}"
                    ondragover="event.preventDefault(); this.classList.add('drag-over')"
                    ondragleave="this.classList.remove('drag-over')"
                    ondrop="dropDeal(event, '${st.key}'); this.classList.remove('drag-over')">
            <div class="pipe-col-header">
                <div class="pipe-col-title"><span class="pipe-col-dot"></span>${st.label}</div>
                <div class="pipe-col-sum">${fmtMoney(sum)}</div>
            </div>
            ${col.map(d => dealCard(d)).join('') || '<div style="text-align:center;color:var(--text-disabled);font-size:11px;padding:20px 0;">خالی</div>'}
        </div>`;
    }).join('');
}

function dealCard(d) {
    const person = (currentData.people || []).find(p => p.id === d.personId);
    const initials = person ? person.name.split(' ').map(w => w[0]).join('').slice(0, 2) : '';
    return `<div class="deal-card" draggable="true" ondragstart="dragDeal(event,'${d.id}')" onclick="openDealModal('${d.id}')">
        <div class="deal-title">${d.title}</div>
        <div class="deal-value">${fmtMoney(d.value)}</div>
        <div class="deal-meta">
            <span class="deal-prob">${toPersianDigits(d.probability || 0)}%</span>
            <span>${d.closeDate ? new Date(d.closeDate).toLocaleDateString('fa-IR') : ''}</span>
        </div>
        ${person ? `<div class="deal-person"><span class="deal-person-avatar">${initials}</span>${person.name}</div>` : ''}
    </div>`;
}

let dragDealId = null;
function dragDeal(e, id) { dragDealId = id; e.dataTransfer.effectAllowed = 'move'; }

async function dropDeal(e, stage) {
    e.preventDefault();
    if (!dragDealId) return;
    try {
        await api('deals/' + dragDealId, 'PUT', { stage: stage });
        if (typeof addActivity === 'function') {} 
        toast('💰 معامله به «' + DEAL_STAGES.find(s => s.key === stage).label + '» منتقل شد', 'success');
        dragDealId = null;
        await loadAllData();
    } catch (err) { toast('خطا', 'error'); }
}

function openDealModal(id) {
    const deal = id ? (currentData.deals || []).find(d => d.id === id) : null;
    currentModalType = 'deals';
    document.getElementById('modalTitle').textContent = deal ? 'ویرایش معامله' : 'معامله جدید';
    const b = document.getElementById('modalBody');
    const peopleOpts = (currentData.people || []).map(p => `<option value="${p.id}" ${deal && deal.personId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
    const stageOpts = DEAL_STAGES.map(s => `<option value="${s.key}" ${deal && deal.stage === s.key ? 'selected' : ''}>${s.label}</option>`).join('');
    b.innerHTML = `
        <div class="form-field"><label class="form-label">عنوان *</label><input class="form-input" name="title" value="${deal ? deal.title : ''}"/></div>
        <div class="form-field"><label class="form-label">ارزش (تومان)</label><input class="form-input" type="number" name="value" value="${deal ? deal.value : ''}"/></div>
        <div class="form-field"><label class="form-label">مرحله</label><select class="form-select" name="stage">${stageOpts}</select></div>
        <div class="form-field"><label class="form-label">احتمال برد (%)</label><input class="form-input" type="number" min="0" max="100" name="probability" value="${deal ? deal.probability : 50}"/></div>
        <div class="form-field"><label class="form-label">مخاطب</label><select class="form-select" name="personId"><option value="">—</option>${peopleOpts}</select></div>
        <div class="form-field"><label class="form-label">تاریخ بسته‌شدن</label><input class="form-input" type="date" name="closeDate" value="${deal && deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : ''}"/></div>
        <div class="form-field"><label class="form-label">یادداشت</label><textarea class="form-textarea" name="notes">${deal ? (deal.notes || '') : ''}</textarea></div>
    `;
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {};
        b.querySelectorAll('[name]').forEach(i => data[i.name] = i.value);
        if (!data.title) { toast('عنوان الزامی است', 'error'); return; }
        data.value = +data.value || 0; data.probability = +data.probability || 0;
        if (data.closeDate) data.closeDate = new Date(data.closeDate).toISOString();
        try {
            if (deal) await api('deals/' + deal.id, 'PUT', data);
            else await api('deals', 'POST', data);
            toast('💰 ذخیره شد', 'success');
            closeModal();
            await loadAllData();
        } catch (e) { toast('خطا: ' + e.message, 'error'); }
    };
    document.getElementById('modalOverlay').classList.add('active');
}

// Load deals into currentData
const origLoadP = window.loadAllData;
window.loadAllData = async function() {
    await origLoadP();
    try { const r = await api('deals'); currentData.deals = Array.isArray(r) ? r : []; } catch (e) { currentData.deals = []; }
    if (currentView === 'pipeline') renderPipeline();
};

// Hook render + nav icon
const origSwitchP = window.switchView;
window.switchView = function(v) {
    origSwitchP(v);
    if (v === 'pipeline') setTimeout(renderPipeline, 100);
};

setTimeout(() => {
    document.querySelectorAll('.nav-link').forEach(l => {
        if (l.dataset.view === 'pipeline') {
            const s = l.querySelector('.nav-icon');
            if (s && typeof icon === 'function') s.innerHTML = icon('rocket', 16);
        }
    });
}, 400);

console.log('[Pipeline] Sales pipeline loaded');

/* === companies.js === */
// ===== COMPANIES MODULE (Phase 29) =====
function companyMembers(cid) { return (currentData.people || []).filter(p => p.companyId === cid); }
function companyDeals(cid) {
    const mids = companyMembers(cid).map(p => p.id);
    return (currentData.deals || []).filter(d => mids.includes(d.personId));
}

function renderCompanies() {
    const g = document.getElementById('companiesGrid');
    if (!g) return;
    const comps = currentData.companies || [];
    if (!comps.length) { g.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-title">شرکتی ثبت نشده</div></div>'; return; }
    g.innerHTML = comps.map(c => {
        const m = companyMembers(c.id), dl = companyDeals(c.id);
        const val = dl.reduce((s, d) => s + (+d.value || 0), 0);
        return `<div class="company-card" onclick="openCompanyPanel('${c.id}')">
            <div class="company-logo">${(c.name || '?')[0]}</div>
            <div class="company-name">${c.name}</div>
            <div class="company-industry">${c.industry || '—'}</div>
            <div class="company-stats">
                <span>👥 <b>${toPersianDigits(m.length)}</b> عضو</span>
                <span>💰 <b>${fmtMoney ? fmtMoney(val) : val}</b></span>
            </div>
        </div>`;
    }).join('');
}

function openCompanyModal(id) {
    const c = id ? (currentData.companies || []).find(x => x.id === id) : null;
    document.getElementById('modalTitle').textContent = c ? 'ویرایش شرکت' : 'شرکت جدید';
    const b = document.getElementById('modalBody');
    b.innerHTML = `
        <div class="form-field"><label class="form-label">نام *</label><input class="form-input" name="name" value="${c ? c.name : ''}"/></div>
        <div class="form-field"><label class="form-label">صنعت</label><input class="form-input" name="industry" value="${c ? c.industry : ''}"/></div>
        <div class="form-field"><label class="form-label">وب‌سایت</label><input class="form-input" name="website" value="${c ? c.website : ''}"/></div>
        <div class="form-field"><label class="form-label">تلفن</label><input class="form-input" name="phone" value="${c ? c.phone : ''}"/></div>
    `;
    currentModalType = 'companies';
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {}; b.querySelectorAll('[name]').forEach(i => data[i.name] = i.value);
        if (!data.name) { toast('نام الزامی است', 'error'); return; }
        try {
            if (c) await api('companies/' + c.id, 'PUT', data); else await api('companies', 'POST', data);
            toast('🏢 ذخیره شد', 'success'); closeModal(); await loadAllData();
        } catch (e) { toast('خطا', 'error'); }
    };
    document.getElementById('modalOverlay').classList.add('active');
}

function openCompanyPanel(cid) {
    const c = (currentData.companies || []).find(x => x.id === cid);
    if (!c) return;
    const m = companyMembers(cid), dl = companyDeals(cid);
    document.getElementById('panelTitle').textContent = '🏢 ' + c.name;
    let html = `<div class="panel-section"><div class="panel-section-title">اطلاعات</div>
        <div class="panel-field"><div class="panel-field-content"><div class="panel-field-label">صنعت</div><div class="panel-field-value">${c.industry || '-'}</div></div></div>
        <div class="panel-field"><div class="panel-field-content"><div class="panel-field-label">وب‌سایت</div><div class="panel-field-value">${c.website || '-'}</div></div></div></div>`;
    html += `<div class="panel-section"><div class="panel-section-title">اعضا (${toPersianDigits(m.length)})</div>` +
        (m.length ? m.map(p => `<div class="backlink-item" onclick="closePanel(); openPersonPanel('${p.id}')">👤 ${p.name}</div>`).join('') : '<div style="font-size:12px;color:var(--text-tertiary);">عضویی نیست</div>') + '</div>';
    html += `<div class="panel-section"><div class="panel-section-title">معاملات (${toPersianDigits(dl.length)})</div>` +
        (dl.length ? dl.map(d => `<div class="backlink-item">💰 ${d.title} — ${fmtMoney(d.value)}</div>`).join('') : '<div style="font-size:12px;color:var(--text-tertiary);">معامله‌ای نیست</div>') + '</div>';
    document.getElementById('panelBody').innerHTML = html;
    document.getElementById('panelActions').innerHTML = `<button class="btn btn-secondary" onclick="openCompanyModal('${cid}')">ویرایش</button>`;
    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('slidePanel').classList.add('active');
}

// Load companies + link person->company in modal
const origLoadC = window.loadAllData;
window.loadAllData = async function() {
    await origLoadC();
    try { const r = await api('companies'); currentData.companies = Array.isArray(r) ? r : []; } catch (e) { currentData.companies = []; }
    if (currentView === 'companies') renderCompanies();
};
const origSwitchC = window.switchView;
window.switchView = function(v) { origSwitchC(v); if (v === 'companies') setTimeout(renderCompanies, 100); };

// Inject company select into people modal
const origOpenModalC = window.openModal;
window.openModal = function(type) {
    origOpenModalC(type);
    if (type === 'people') {
        setTimeout(() => {
            const b = document.getElementById('modalBody');
            if (!b || b.querySelector('[name="companyId"]')) return;
            const opts = (currentData.companies || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            b.insertAdjacentHTML('beforeend', `<div class="form-field"><label class="form-label">شرکت</label><select class="form-select" name="companyId"><option value="">—</option>${opts}</select></div>`);
        }, 100);
    }
};
const origPeopleSubmit = modalForms.people.submit;
modalForms.people.submit = async function(d) {
    const sel = document.querySelector('[name="companyId"]');
    if (sel) { d.companyId = sel.value; const c = (currentData.companies || []).find(x => x.id === sel.value); if (c) d.company = c.name; }
    await origPeopleSubmit(d);
};

// ===== TAGS / SEGMENTS =====
let activeSegmentTag = null;

function allTags() {
    const set = new Set();
    ['people', 'tasks', 'notes', 'ideas'].forEach(e => (currentData[e] || []).forEach(x => (x.tags || []).forEach(t => set.add(t))));
    return Array.from(set);
}

function injectSegmentBar() {
    const pv = document.getElementById('view-people');
    if (!pv || document.getElementById('segmentBar')) return;
    const bar = document.createElement('div');
    bar.id = 'segmentBar';
    bar.className = 'segment-bar';
    bar.innerHTML = '<span style="font-size:12px;color:var(--text-tertiary);">🏷️ سگمنت:</span><select class="form-select segment-select" onchange="setSegment(this.value)"><option value="">همه</option>' + allTags().map(t => `<option ${activeSegmentTag === t ? 'selected' : ''}>${t}</option>`).join('') + '</select>';
    const ph = pv.querySelector('.page-header');
    ph.insertAdjacentElement('afterend', bar);
}

function setSegment(tag) { activeSegmentTag = tag || null; renderPeople(); }

const origRenderPeopleT = window.renderPeople;
window.renderPeople = function() {
    const origList = currentData.people;
    if (activeSegmentTag) currentData.people = origList.filter(p => (p.tags || []).includes(activeSegmentTag));
    origRenderPeopleT();
    currentData.people = origList;
    injectSegmentBar();
};

// Tag editor in person panel
const origOpenPersonT = window.openPersonPanel;
window.openPersonPanel = function(id) {
    origOpenPersonT(id);
    setTimeout(() => {
        const p = (currentData.people || []).find(x => x.id === id);
        const body = document.getElementById('panelBody');
        if (!p || !body || body.querySelector('#tagEditor')) return;
        const sec = document.createElement('div');
        sec.className = 'panel-section';
        sec.id = 'tagEditor';
        sec.innerHTML = '<div class="panel-section-title">🏷️ تگ‌ها</div><div class="tags-row" id="personTags"></div><div style="display:flex;gap:6px;margin-top:8px;"><input class="form-input" id="newTagInput" placeholder="تگ جدید..." style="flex:1;"/><button class="btn btn-secondary" onclick="addPersonTag(\'' + id + '\')">+</button></div>';
        body.appendChild(sec);
        renderPersonTags(id);
    }, 150);
};

function renderPersonTags(id) {
    const p = (currentData.people || []).find(x => x.id === id);
    const el = document.getElementById('personTags');
    if (!p || !el) return;
    el.innerHTML = (p.tags || []).map(t => `<span class="tag-chip" onclick="removePersonTag('${id}','${t}')">${t} <span class="tag-x">×</span></span>`).join('') || '<span style="font-size:11px;color:var(--text-tertiary);">تگی نیست</span>';
}

async function addPersonTag(id) {
    const inp = document.getElementById('newTagInput');
    const tag = inp.value.trim();
    if (!tag) return;
    const p = (currentData.people || []).find(x => x.id === id);
    const tags = (p.tags || []).slice(); if (!tags.includes(tag)) tags.push(tag);
    await api('people/' + id, 'PUT', { tags: tags });
    inp.value = '';
    await loadAllData(); openPersonPanel(id);
}

async function removePersonTag(id, tag) {
    const p = (currentData.people || []).find(x => x.id === id);
    await api('people/' + id, 'PUT', { tags: (p.tags || []).filter(t => t !== tag) });
    await loadAllData(); openPersonPanel(id);
}

setTimeout(() => { document.querySelectorAll('.nav-link').forEach(l => { if (l.dataset.view === 'companies') { const s = l.querySelector('.nav-icon'); if (s && typeof icon === 'function') s.innerHTML = icon('building', 16); } }); }, 400);
console.log('[Companies+Tags] loaded');

/* === projects-pro.js === */
// ===== PROJECTS PRO MODULE (Phase 30) =====

function projectTasks(pid) { return (currentData.tasks || []).filter(t => t.projectId === pid); }

function projectProgress(pid) {
    const t = projectTasks(pid);
    if (!t.length) return 0;
    return Math.round((t.filter(x => x.status === 'done').length / t.length) * 100);
}

// Make project cards clickable + show progress
const origRenderProjects = window.renderProjects;
window.renderProjects = function() {
    origRenderProjects();
    const cards = document.querySelectorAll('#projectsGrid .note-card');
    (currentData.projects || []).forEach((p, i) => {
        const card = cards[i];
        if (!card) return;
        card.classList.add('project-card');
        card.onclick = () => openProjectPanel(p.id);
        const prog = projectProgress(p.id);
        if (!card.querySelector('.proj-progress-wrap')) {
            card.insertAdjacentHTML('beforeend', `<div class="proj-progress-wrap"><div class="proj-progress-bar"><div class="proj-progress-fill" style="width:${prog}%"></div></div><div class="proj-progress-label"><span>پیشرفت</span><span>${toPersianDigits(prog)}%</span></div></div>`);
        }
    });
};

function openProjectPanel(pid) {
    const p = (currentData.projects || []).find(x => x.id === pid);
    if (!p) return;
    const tasks = projectTasks(pid);
    const prog = projectProgress(pid);
    
    document.getElementById('panelTitle').textContent = '🚀 ' + p.name;
    let html = `<div class="panel-section"><div class="panel-section-title">پیشرفت</div>
        <div class="proj-progress-wrap"><div class="proj-progress-bar"><div class="proj-progress-fill" style="width:${prog}%"></div></div>
        <div class="proj-progress-label"><span>${toPersianDigits(tasks.filter(t=>t.status==='done').length)} از ${toPersianDigits(tasks.length)} کار</span><span>${toPersianDigits(prog)}%</span></div></div></div>`;
    
    html += `<div class="panel-section"><div class="panel-section-title">کارها (${toPersianDigits(tasks.length)})</div>`;
    html += tasks.length ? tasks.map(t => `
        <div class="proj-task-item ${t.status==='done'?'done':''}" onclick="toggleProjectTask('${t.id}')">
            <div class="proj-task-check">${t.status==='done'?'✓':''}</div>
            <div class="proj-task-title">${t.title}</div>
        </div>`).join('') : '<div style="font-size:12px;color:var(--text-tertiary);">کاری نیست</div>';
    html += `<button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:8px;" onclick="addTaskToProject('${pid}')">+ افزودن کار به پروژه</button></div>`;
    
    if (p.description) html += `<div class="panel-section"><div class="panel-section-title">توضیحات</div><div style="font-size:13px;color:var(--text-secondary);">${p.description}</div></div>`;
    
    document.getElementById('panelBody').innerHTML = html;
    document.getElementById('panelActions').innerHTML = `<button class="btn btn-secondary" onclick="editProject('${pid}')">ویرایش</button>`;
    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('slidePanel').classList.add('active');
}

async function toggleProjectTask(tid) {
    const t = (currentData.tasks || []).find(x => x.id === tid);
    if (!t) return;
    const ns = t.status === 'done' ? 'pending' : 'done';
    await api('tasks/' + tid, 'PUT', { status: ns });
    if (typeof addKarma === 'function' && ns === 'done') addKarma(10);
    await loadAllData();
    openProjectPanel(t.projectId);
}

let pendingProjectId = null;
function addTaskToProject(pid) {
    pendingProjectId = pid;
    closePanel();
    openModal('tasks');
}

function editProject(pid) {
    const p = (currentData.projects || []).find(x => x.id === pid);
    document.getElementById('modalTitle').textContent = 'ویرایش پروژه';
    const b = document.getElementById('modalBody');
    b.innerHTML = `<div class="form-field"><label class="form-label">نام *</label><input class="form-input" name="name" value="${p.name}"/></div><div class="form-field"><label class="form-label">توضیحات</label><textarea class="form-textarea" name="description">${p.description || ''}</textarea></div>`;
    currentModalType = 'projects';
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {}; b.querySelectorAll('[name]').forEach(i => data[i.name] = i.value);
        await api('projects/' + pid, 'PUT', data);
        toast('ذخیره شد', 'success'); closeModal(); await loadAllData();
    };
    document.getElementById('modalOverlay').classList.add('active');
}

// Add project select to task modal (create + edit)
const origOpenModalP = window.openModal;
window.openModal = function(type) {
    origOpenModalP(type);
    if (type === 'tasks') {
        setTimeout(() => {
            const b = document.getElementById('modalBody');
            if (!b || b.querySelector('[name="projectId"]')) return;
            const opts = (currentData.projects || []).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            b.insertAdjacentHTML('beforeend', `<div class="form-field"><label class="form-label">پروژه</label><select class="form-select" name="projectId"><option value="">—</option>${opts}</select></div>`);
            if (pendingProjectId) { b.querySelector('[name="projectId"]').value = pendingProjectId; pendingProjectId = null; }
        }, 100);
    }
};
const origTaskSubmitP = modalForms.tasks.submit;
modalForms.tasks.submit = async function(d) {
    const sel = document.querySelector('[name="projectId"]');
    if (sel) d.projectId = sel.value;
    await origTaskSubmitP(d);
};

// ===== SUBTASKS (in edit modal) =====
const origEditTask = window.openEditTaskModal;
window.openEditTaskModal = function(task) {
    origEditTask(task);
    setTimeout(() => renderSubtasks(task.id), 120);
};

function renderSubtasks(taskId) {
    const b = document.getElementById('modalBody');
    if (!b) return;
    let sec = b.querySelector('#subtaskSection');
    if (!sec) {
        sec = document.createElement('div');
        sec.id = 'subtaskSection';
        sec.className = 'form-field';
        b.appendChild(sec);
    }
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    const subs = (t && t.subtasks) || [];
    const done = subs.filter(s => s.done).length;
    sec.innerHTML = `<label class="form-label">✅ زیرکارها (${toPersianDigits(done)}/${toPersianDigits(subs.length)})</label>
        <div id="subtaskList">` + subs.map(s => `
            <div class="subtask-item ${s.done?'done':''}">
                <div class="subtask-check" onclick="toggleSubtask('${taskId}','${s.id}')">${s.done?'✓':''}</div>
                <span>${s.title}</span>
                <span class="subtask-del" onclick="delSubtask('${taskId}','${s.id}')">×</span>
            </div>`).join('') + `</div>
        <div style="display:flex;gap:6px;margin-top:8px;"><input class="form-input" id="newSubtask" placeholder="زیرکار جدید..." style="flex:1;"/><button class="btn btn-secondary" onclick="addSubtask('${taskId}')">+</button></div>`;
}

async function addSubtask(taskId) {
    const inp = document.getElementById('newSubtask');
    const title = inp.value.trim();
    if (!title) return;
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    const subs = (t.subtasks || []).slice();
    subs.push({ id: 's' + Date.now(), title: title, done: false });
    await api('tasks/' + taskId, 'PUT', { subtasks: subs });
    await loadAllData();
    renderSubtasks(taskId);
}

async function toggleSubtask(taskId, subId) {
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    const subs = (t.subtasks || []).slice();
    const s = subs.find(x => x.id === subId);
    s.done = !s.done;
    await api('tasks/' + taskId, 'PUT', { subtasks: subs });
    await loadAllData();
    renderSubtasks(taskId);
}

async function delSubtask(taskId, subId) {
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    await api('tasks/' + taskId, 'PUT', { subtasks: (t.subtasks || []).filter(x => x.id !== subId) });
    await loadAllData();
    renderSubtasks(taskId);
}

console.log('[ProjectsPro] Details + subtasks loaded');

/* === automation.js === */
// ===== AUTOMATION RULES ENGINE (Phase 31) =====
function getRulesState() { try { return JSON.parse(localStorage.getItem('crm_rules') || '{}'); } catch (e) { return {}; } }
function setRuleEnabled(id, on) { const s = getRulesState(); s[id] = on; localStorage.setItem('crm_rules', JSON.stringify(s)); }
function ruleEnabled(id) { const s = getRulesState(); return s[id] !== false; } // default on

function firedMap() { try { return JSON.parse(localStorage.getItem('crm_rules_fired') || '{}'); } catch (e) { return {}; } }
function markFired(key, cooldownMs) {
    const f = firedMap(); f[key] = Date.now();
    localStorage.setItem('crm_rules_fired', JSON.stringify(f));
}
function canFire(key, cooldownMs) {
    const f = firedMap();
    return !f[key] || (Date.now() - f[key]) > cooldownMs;
}

const AUTOMATION_RULES = [
    {
        id: 'overdue-notify', name: '⚠️ کار عقب افتاد → اعلان',
        desc: 'وقتی کاری از سررسید گذشت، یادآوری می‌شود',
        run() {
            const now = new Date();
            (currentData.tasks || []).forEach(t => {
                if (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now) {
                    const key = 'ov-' + t.id;
                    if (canFire(key, 24 * 3600 * 1000)) {
                        markFired(key);
                        if (typeof toast === 'function') toast('⚠️ «' + t.title + '» عقب افتاده!', 'error');
                    }
                }
            });
        }
    },
    {
        id: 'deal-won', name: '💰 Deal برد شد → کار تشکر',
        desc: 'به‌طور خودکار یک کار «تشکر» برای مخاطب می‌سازد',
        run() {
            (currentData.deals || []).forEach(d => {
                if (d.stage === 'won') {
                    const key = 'dw-' + d.id;
                    if (canFire(key, 999 * 24 * 3600 * 1000)) {
                        markFired(key);
                        const person = (currentData.people || []).find(p => p.id === d.personId);
                        api('tasks', 'POST', { title: '🙏 تشکر از ' + (person ? person.name : 'مخاطب') + ' — ' + d.title, description: '', dueDate: '', priority: 'medium', status: 'pending', personId: d.personId || '', projectId: '', tags: [] })
                            .then(() => { if (typeof toast === 'function') toast('🤖 اتوماسیون: کار تشکر ساخته شد', 'success'); loadAllData(); });
                    }
                }
            });
        }
    },
    {
        id: 'vip-call', name: '💎 مخاطب VIP → یادآوری هفتگی',
        desc: 'مخاطبان با تگ VIP هر هفته یادآوری تماس',
        run() {
            if (typeof relationshipStats !== 'function') return;
            (currentData.people || []).forEach(p => {
                if ((p.tags || []).includes('VIP')) {
                    const st = relationshipStats(p);
                    if (st.daysSince !== null && st.daysSince >= 7) {
                        const key = 'vip-' + p.id;
                        if (canFire(key, 7 * 24 * 3600 * 1000)) {
                            markFired(key);
                            if (typeof toast === 'function') toast('💎 یادآوری: با «' + p.name + '» (VIP) تماس بگیر', 'info');
                        }
                    }
                }
            });
        }
    }
];

function runAutomations() {
    AUTOMATION_RULES.forEach(r => { if (ruleEnabled(r.id)) { try { r.run(); } catch (e) {} } });
}

// Rules UI in settings
function injectRulesUI() {
    setTimeout(() => {
        const general = Array.from(document.querySelectorAll('.settings-tab')).find(t => t.dataset.tab === 'general');
        if (!general || general.querySelector('#rulesSection')) return;
        const sec = document.createElement('div');
        sec.className = 'settings-section';
        sec.id = 'rulesSection';
        let html = '<div class="settings-section-title">⚙️ اتوماسیون</div><div class="settings-section-desc">قوانین خودکار برای صرفه‌جویی در زمان</div>';
        AUTOMATION_RULES.forEach(r => {
            html += `<div class="rule-row"><div class="rule-info"><div class="rule-name">${r.name}</div><div class="rule-desc">${r.desc}</div></div>
                <label class="toggle-switch"><input type="checkbox" ${ruleEnabled(r.id) ? 'checked' : ''} onchange="setRuleEnabled('${r.id}', this.checked)"/><span class="toggle-slider"></span></label></div>`;
        });
        html += '<button class="btn btn-secondary" style="margin-top:8px;" onclick="runAutomations(); toast(\'🤖 قوانین اجرا شدند\',\'success\');">▶ اجرای دستی</button>';
        const last = general.querySelector('.settings-section:last-child');
        if (last) last.after(sec); else general.appendChild(sec);
    }, 700);
}

// Run on load + every 60s
setTimeout(() => { runAutomations(); injectRulesUI(); }, 1500);
setInterval(runAutomations, 60000);
console.log('[Automation] Rules engine loaded');

/* === okr.js === */
// ===== OKR MODULE (Phase 31) =====
function getOkrs() { try { return JSON.parse(localStorage.getItem('crm_okrs') || '[]'); } catch (e) { return []; } }
function saveOkrs(o) { localStorage.setItem('crm_okrs', JSON.stringify(o)); }

function okrProgress(o) {
    if (!o.krs || !o.krs.length) return 0;
    return Math.round(o.krs.reduce((s, k) => s + (+k.progress || 0), 0) / o.krs.length);
}

function renderOkrs() {
    const g = document.getElementById('okrList');
    if (!g) return;
    const okrs = getOkrs();
    if (!okrs.length) { g.innerHTML = '<div class="empty-state"><div class="empty-title">هدفی تعریف نشده</div><div class="empty-desc">اولین هدف فصلی خود را بسازید</div></div>'; return; }
    g.innerHTML = okrs.map(o => `
        <div class="okr-card">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div class="okr-title">🎯 ${o.title}</div>
                <button class="icon-button" onclick="delOkr('${o.id}')">×</button>
            </div>
            <div class="okr-progress-label">${toPersianDigits(okrProgress(o))}% تکمیل</div>
            ${(o.krs || []).map(k => `
                <div class="kr-row">
                    <div class="kr-title">${k.title}</div>
                    <div class="kr-bar"><div class="kr-fill" style="width:${k.progress}%"></div></div>
                    <div class="kr-pct">${toPersianDigits(k.progress)}%</div>
                    <input type="range" class="kr-range" min="0" max="100" step="10" value="${k.progress}" onchange="setKrProgress('${o.id}','${k.id}', this.value)"/>
                    <span class="subtask-del" style="opacity:1;" onclick="delKr('${o.id}','${k.id}')">×</span>
                </div>`).join('')}
            <div style="display:flex;gap:6px;margin-top:10px;">
                <input class="form-input" id="kr-input-${o.id}" placeholder="Key Result جدید..." style="flex:1;"/>
                <button class="btn btn-secondary" onclick="addKr('${o.id}')">+</button>
            </div>
        </div>
    `).join('');
}

function addOkr() {
    const title = prompt('عنوان هدف (Objective):');
    if (!title) return;
    const okrs = getOkrs();
    okrs.push({ id: 'o' + Date.now(), title: title, krs: [] });
    saveOkrs(okrs); renderOkrs();
}

function delOkr(id) {
    if (!confirm('حذف هدف؟')) return;
    saveOkrs(getOkrs().filter(o => o.id !== id)); renderOkrs();
}

function addKr(oid) {
    const inp = document.getElementById('kr-input-' + oid);
    const title = inp.value.trim();
    if (!title) return;
    const okrs = getOkrs();
    const o = okrs.find(x => x.id === oid);
    o.krs = o.krs || [];
    o.krs.push({ id: 'k' + Date.now(), title: title, progress: 0 });
    saveOkrs(okrs); renderOkrs();
}

function delKr(oid, kid) {
    const okrs = getOkrs();
    const o = okrs.find(x => x.id === oid);
    o.krs = o.krs.filter(k => k.id !== kid);
    saveOkrs(okrs); renderOkrs();
}

function setKrProgress(oid, kid, val) {
    const okrs = getOkrs();
    const o = okrs.find(x => x.id === oid);
    const k = o.krs.find(x => x.id === kid);
    k.progress = +val;
    saveOkrs(okrs); renderOkrs();
}

// Hook render
const origSwitchO = window.switchView;
window.switchView = function(v) { origSwitchO(v); if (v === 'okr') setTimeout(renderOkrs, 100); };

setTimeout(() => { document.querySelectorAll('.nav-link').forEach(l => { if (l.dataset.view === 'okr') { const s = l.querySelector('.nav-icon'); if (s && typeof icon === 'function') s.innerHTML = icon('sparkle', 16); } }); }, 400);
console.log('[OKR] loaded');

/* === global-search.js === */
// ===== GLOBAL SEARCH (Phase 32) - index all entities =====
const _origSearchCommand = window.searchCommand;
window.searchCommand = async function(q) {
    await _origSearchCommand(q);
    addClientResults(q);
};

function addClientResults(q) {
    q = (q || '').toLowerCase().trim();
    if (!q) return;
    const push = (group, title, sub, icon, action) => {
        cmdSearchResults.push({ group, id: 'g-' + group + '-' + title, title, sub, icon, action });
    };
    const has = s => (s || '').toLowerCase().includes(q);
    
    (currentData.deals || []).forEach(d => { if (has(d.title)) push('معاملات', d.title, fmtMoney ? fmtMoney(d.value) : '', 'rocket', () => { closeCommandPalette(); switchView('pipeline'); }); });
    (currentData.companies || []).forEach(c => { if (has(c.name)) push('شرکت‌ها', c.name, c.industry || '', 'building', () => { closeCommandPalette(); switchView('companies'); }); });
    (currentData.notes || []).forEach(n => { if (has(n.title) || has(n.content)) push('یادداشت‌ها', n.title, '', 'file', () => { closeCommandPalette(); if (typeof openKnowledgePanel === 'function') openKnowledgePanel(n.id); }); });
    (currentData.ideas || []).forEach(i => { if (has(i.title)) push('ایده‌ها', i.title, '', 'lightbulb', () => { closeCommandPalette(); if (typeof openKnowledgePanel === 'function') openKnowledgePanel(i.id); }); });
    (currentData.projects || []).forEach(p => { if (has(p.name)) push('پروژه‌ها', p.name, '', 'check', () => { closeCommandPalette(); if (typeof openProjectPanel === 'function') openProjectPanel(p.id); }); });
    
    renderCommandResults();
}
console.log('[GlobalSearch] all-entity search loaded');
