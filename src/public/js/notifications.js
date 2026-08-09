// ===== NOTIFICATIONS MODULE =====
let notificationInterval = null;
let currentNotifications = [];

function initNotifications() {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(checkNotifications, 30000);
    setTimeout(checkNotifications, 2000);
}

async function checkNotifications() {
    try {
        const r = await api('notifications?minutes=5');
        currentNotifications = Array.isArray(r) ? r : [];
        const badge = document.getElementById('notifBadge');
        if (badge) {
            if (currentNotifications.length > 0) { badge.textContent = currentNotifications.length; badge.style.display = 'flex'; }
            else badge.style.display = 'none';
        }
        currentNotifications.forEach(async n => {
            if (!n._shown) {
                showBrowserNotification(n);
                n._shown = true;
                await api('notifications', 'POST', { taskId: n.id });
            }
        });
        const dd = document.getElementById('notifDropdown');
        if (dd && dd.classList.contains('active')) renderNotificationDropdown();
    } catch (e) { }
}

function showBrowserNotification(n) {
    showInAppToast(n);
    if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(n.title, { body: n.message || '', icon: '/icons/icon-192.svg', tag: n.id });
        notif.onclick = () => { window.focus(); switchView('tasks'); notif.close(); };
        setTimeout(() => notif.close(), 8000);
    }
}

function showInAppToast(n) {
    const t = document.createElement('div');
    t.className = 'browser-toast ' + n.type;
    t.innerHTML = '<div class="browser-toast-icon">' + (n.type === 'overdue' ? '⚠️' : '⏰') + '</div><div class="browser-toast-content"><div class="browser-toast-title">' + n.title + '</div><div class="browser-toast-message">' + (n.message || '') + '</div></div><button class="browser-toast-close" onclick="this.parentElement.remove()">×</button>';
    document.body.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 6000);
}

function toggleNotificationDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    dd.classList.toggle('active');
    if (dd.classList.contains('active')) {
        renderNotificationDropdown();
        setTimeout(() => {
            const ch = e => { if (!e.target.closest('#notifDropdown') && !e.target.closest('#notificationBtn')) { dd.classList.remove('active'); document.removeEventListener('click', ch); } };
            document.addEventListener('click', ch);
        }, 100);
    }
}

function renderNotificationDropdown() {
    const l = document.getElementById('notifList');
    if (!l) return;
    if (!currentNotifications.length) { l.innerHTML = '<div class="notification-empty"><div class="notification-empty-icon">🔔</div><div>اعلانی وجود ندارد</div></div>'; return; }
    l.innerHTML = currentNotifications.map(n => {
        const ic = n.type === 'overdue' ? '⚠️' : '⏰';
        return '<div class="notification-item" onclick="handleNotificationClick(\'' + n.id + '\')"><div class="notification-item-icon ' + n.type + '">' + ic + '</div><div class="notification-item-content"><div class="notification-item-title">' + n.title + '</div><div class="notification-item-message">' + (n.message || '') + '</div></div></div>';
    }).join('');
}

function handleNotificationClick(tid) {
    const dd = document.getElementById('notifDropdown');
    if (dd) dd.classList.remove('active');
    switchView('tasks');
    const t = currentData.tasks.find(x => x.id === tid);
    if (t && typeof openEditTaskModal === 'function') setTimeout(() => openEditTaskModal(t), 300);
}

function clearAllNotifications() {
    currentNotifications = [];
    renderNotificationDropdown();
    const b = document.getElementById('notifBadge');
    if (b) b.style.display = 'none';
}

// Enhance tasks modal with reminder + recurring
if (typeof modalForms !== 'undefined' && modalForms.tasks) {
    const origTaskSubmit = modalForms.tasks.submit;
    modalForms.tasks.submit = async (d) => {
        const body = document.getElementById('modalBody');
        const rm = body ? body.querySelector('[name="reminderMinutes"]') : null;
        const rc = body ? body.querySelector('[name="recurring"]') : null;
        if (rm && rm.value && d.dueDate) {
            const due = new Date(d.dueDate);
            d.reminderAt = new Date(due.getTime() - parseInt(rm.value) * 60000).toISOString();
        } else d.reminderAt = '';
        d.recurring = rc ? rc.value : 'none';
        await origTaskSubmit(d);
        try { await api('recurring/process', 'POST'); } catch (e) {}
    };
}

// Add reminder UI when tasks modal opens
const origOpenModal = window.openModal;
window.openModal = function(type) {
    origOpenModal(type);
    if (type === 'tasks') {
        setTimeout(() => {
            const mb = document.getElementById('modalBody');
            if (!mb || mb.querySelector('.reminder-section')) return;
            const rs = document.createElement('div');
            rs.className = 'reminder-section';
            rs.innerHTML = '<div class="reminder-section-title">⏰ یادآوری</div><div class="form-field"><div class="reminder-options"><div class="reminder-option" onclick="setReminder(this,\'5\')">5 دقیقه</div><div class="reminder-option" onclick="setReminder(this,\'15\')">15 دقیقه</div><div class="reminder-option" onclick="setReminder(this,\'30\')">30 دقیقه</div><div class="reminder-option" onclick="setReminder(this,\'60\')">1 ساعت</div><div class="reminder-option" onclick="setReminder(this,\'1440\')">1 روز</div><div class="reminder-option" onclick="setReminder(this,\'\')">بدون</div></div><input type="hidden" name="reminderMinutes" value=""/></div><div class="reminder-section-title" style="margin-top:12px;">🔁 تکرار</div><div class="form-field"><select class="form-select" name="recurring"><option value="none">بدون تکرار</option><option value="daily">روزانه</option><option value="weekly">هفتگی</option><option value="monthly">ماهانه</option><option value="yearly">سالانه</option></select></div>';
            mb.appendChild(rs);
        }, 100);
    }
};

function setReminder(el, minutes) {
    document.querySelectorAll('.reminder-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    const i = document.querySelector('[name="reminderMinutes"]');
    if (i) i.value = minutes;
}

setTimeout(initNotifications, 500);