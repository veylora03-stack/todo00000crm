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