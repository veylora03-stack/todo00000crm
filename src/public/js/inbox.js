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

console.log('[Inbox] Professional module loaded');