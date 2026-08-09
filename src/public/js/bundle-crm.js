// CRM PRO CRM BUNDLE (auto) 2026-08-10 02:03

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
