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