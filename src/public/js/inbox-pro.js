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