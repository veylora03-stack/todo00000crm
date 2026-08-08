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