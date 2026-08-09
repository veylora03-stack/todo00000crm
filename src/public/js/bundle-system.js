// CRM PRO SYSTEM BUNDLE (auto) 2026-08-10 01:55

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
    } catch (e) { }
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

/* === topbar-pro.js === */
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
// Theme toggle button in topbar
setTimeout(() => {
    const tb = document.querySelector('.topbar-actions');
    if (!tb || tb.querySelector('#themeToggle')) return;
    
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'icon-button';
    btn.title = 'تغییر تم';
    btn.innerHTML = $context.state.theme === 'dark' ? TB_SVG.sun : TB_SVG.moon;
    btn.onclick = () => {
        $context.toggleTheme();
        btn.innerHTML = $context.state.theme === 'dark' ? TB_SVG.sun : TB_SVG.moon;
    };
    
    tb.insertBefore(btn, tb.firstChild);
}, 300);


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
                    try { callback(state); } catch (e) { }
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
