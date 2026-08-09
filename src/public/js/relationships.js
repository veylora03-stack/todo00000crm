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