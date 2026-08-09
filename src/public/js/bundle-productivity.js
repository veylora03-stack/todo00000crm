// CRM PRO PRODUCTIVITY BUNDLE (auto) 2026-08-10 02:09

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
