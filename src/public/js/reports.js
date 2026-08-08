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