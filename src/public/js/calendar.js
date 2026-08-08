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