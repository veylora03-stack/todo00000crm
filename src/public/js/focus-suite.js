// ===== FOCUS SUITE MODULE (Phase 17) =====
// Today's Focus + Pomodoro + Time Blocks

let focusSelectedTasks = [];
let pomoState = {
    mode: 'idle', // 'idle' | 'work' | 'break' | 'longBreak'
    remaining: 25 * 60,
    running: false,
    interval: null,
    sessionsToday: 0,
    totalSessions: 0,
    totalMinutes: 0
};

// ---------- Storage ----------
function loadPomoStats() {
    try {
        const s = JSON.parse(localStorage.getItem('crm_pomo_stats') || '{}');
        const today = new Date().toDateString();
        if (s.lastDate !== today) { s.sessionsToday = 0; s.lastDate = today; }
        pomoState.sessionsToday = s.sessionsToday || 0;
        pomoState.totalSessions = s.totalSessions || 0;
        pomoState.totalMinutes = s.totalMinutes || 0;
    } catch (e) {}
}

function savePomoStats() {
    localStorage.setItem('crm_pomo_stats', JSON.stringify({
        sessionsToday: pomoState.sessionsToday,
        totalSessions: pomoState.totalSessions,
        totalMinutes: pomoState.totalMinutes,
        lastDate: new Date().toDateString()
    }));
}

// ---------- Auto-select top 3 tasks ----------
function selectTopTasks() {
    const tasks = (currentData.tasks || []).filter(t => t.status !== 'done');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Priority scoring
    const scored = tasks.map(t => {
        let score = 0;
        // Due today: +1000
        if (t.dueDate) {
            const d = new Date(t.dueDate);
            if (d >= today && d < tomorrow) score += 1000;
            else if (d < today) score += 500; // overdue
            else score += 100; // future
        }
        // Priority
        if (t.priority === 'high') score += 200;
        else if (t.priority === 'medium') score += 100;
        else score += 50;
        // Recent
        const created = new Date(t.createdAtUtc);
        const daysAgo = (now - created) / 86400000;
        score += Math.max(0, 100 - daysAgo * 10);
        return { task: t, score: score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    focusSelectedTasks = scored.slice(0, 3).map(s => s.task);
}

// ---------- Focus Widget Rendering ----------
function renderFocusWidget() {
    const container = document.getElementById('focusTodayWidget');
    if (!container) return;
    
    selectTopTasks();
    
    const total = focusSelectedTasks.length;
    const done = focusSelectedTasks.filter(t => t.status === 'done').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    
    const circumference = 2 * Math.PI * 28;
    const offset = circumference * (1 - pct / 100);
    
    let tasksHtml = '';
    if (!focusSelectedTasks.length) {
        tasksHtml = '<div class="schedule-empty" style="padding:20px;"><div class="schedule-empty-icon">🎉</div><div>همه کارها تمام شده!</div></div>';
    } else {
        tasksHtml = focusSelectedTasks.map(t => `
            <div class="focus-task-item ${t.status === 'done' ? 'done' : ''}" onclick="toggleFocusTask('${t.id}')">
                <div class="focus-task-check">${t.status === 'done' ? '✓' : ''}</div>
                <div class="focus-task-title">${t.title}</div>
                <div class="focus-task-priority ${t.priority || 'low'}"></div>
            </div>
        `).join('');
    }
    
    container.innerHTML = `
        <svg width="0" height="0" style="position:absolute;">
            <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#7c3aed"/>
                    <stop offset="100%" stop-color="#ec4899"/>
                </linearGradient>
            </defs>
        </svg>
        <div class="focus-widget-header">
            <div class="focus-widget-title">🎯 تمرکز امروز</div>
            <span class="focus-widget-badge">${toPersianDigits(done)}/${toPersianDigits(total)}</span>
        </div>
        <div class="focus-progress-header">
            <div class="focus-progress-ring-wrap">
                <svg class="focus-progress-ring" width="72" height="72" viewBox="0 0 72 72">
                    <circle class="ring-bg" cx="36" cy="36" r="28"/>
                    <circle class="ring-fill" cx="36" cy="36" r="28" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
                </svg>
                <div class="focus-progress-num">${toPersianDigits(pct)}%</div>
            </div>
            <div class="focus-progress-info">
                <h3>${done === total && total > 0 ? '🎉 تکمیل شد!' : 'پیشرفت روزانه'}</h3>
                <p>${toPersianDigits(done)} از ${toPersianDigits(total)} کار مهم</p>
            </div>
        </div>
        <div class="focus-tasks">${tasksHtml}</div>
        <button class="focus-cta" ${done === total ? 'disabled' : ''} onclick="startFocusSession()">
            🚀 شروع جلسه تمرکز
        </button>
    `;
}

async function toggleFocusTask(taskId) {
    const task = focusSelectedTasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    try {
        await api('tasks/' + taskId, 'PUT', { status: newStatus });
        if (newStatus === 'done' && typeof addKarma === 'function') addKarma(10);
        if (typeof playSound === 'function') playSound(newStatus === 'done' ? 'done' : 'schedule');
        await loadAllData();
        renderFocusWidget();
    } catch (e) { toast('خطا', 'error'); }
}

// ---------- Focus Session Mode ----------
function startFocusSession() {
    const incomplete = focusSelectedTasks.filter(t => t.status !== 'done');
    if (!incomplete.length) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'focus-mode-overlay';
    overlay.id = 'focusModeOverlay';
    overlay.innerHTML = `
        <div class="focus-mode-card">
            <button class="focus-mode-close" onclick="closeFocusSession()">×</button>
            <div style="font-size:56px; margin-bottom:16px;">🎯</div>
            <h2 style="font-size:22px; font-weight:800; margin-bottom:8px;">حالت تمرکز فعال شد</h2>
            <p style="color:var(--text-secondary); margin-bottom:24px;">روی این کار تمرکز کن و حواس‌پرتی‌ها را حذف کن</p>
            <div style="padding:16px; background:var(--bg-surface-2); border-radius:var(--radius-md); text-align:right; margin-bottom:20px;">
                <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:4px;">کار فعلی</div>
                <div style="font-size:16px; font-weight:700;">${incomplete[0].title}</div>
                ${incomplete[0].description ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:6px;">${incomplete[0].description}</div>` : ''}
            </div>
            <div class="pomo-controls" style="margin-bottom:16px;">
                <button class="pomo-btn primary" onclick="closeFocusSession(); if(!pomoState.running) pomoToggle();">
                    ▶ شروع پومودورو (25 دقیقه)
                </button>
            </div>
            <button class="focus-cta" style="background:var(--bg-surface-2); color:var(--text-primary); box-shadow:none;" onclick="closeFocusSession()">
                بعداً ادامه می‌دهم
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closeFocusSession() {
    const o = document.getElementById('focusModeOverlay');
    if (o) o.remove();
}

// ---------- Pomodoro ----------
function pomoToggle() {
    if (pomoState.running) {
        clearInterval(pomoState.interval);
        pomoState.running = false;
    } else {
        if (pomoState.mode === 'idle') {
            pomoState.mode = 'work';
            pomoState.remaining = 25 * 60;
        }
        pomoState.running = true;
        pomoState.interval = setInterval(pomoTick, 1000);
    }
    renderPomoWidget();
}

function pomoTick() {
    pomoState.remaining--;
    if (pomoState.remaining <= 0) {
        pomoComplete();
        return;
    }
    renderPomoWidget();
}

function pomoComplete() {
    clearInterval(pomoState.interval);
    pomoState.running = false;
    
    if (typeof playSound === 'function') playSound('done');
    
    if (pomoState.mode === 'work') {
        pomoState.sessionsToday++;
        pomoState.totalSessions++;
        pomoState.totalMinutes += 25;
        savePomoStats();
        
        toast(`🍅 پومودورو تمام شد! ${pomoState.sessionsToday} امروز`, 'success');
        
        // Switch to break
        if (pomoState.sessionsToday % 4 === 0) {
            pomoState.mode = 'longBreak';
            pomoState.remaining = 15 * 60;
            toast('☕ استراحت طولانی ۱۵ دقیقه!', 'info');
        } else {
            pomoState.mode = 'break';
            pomoState.remaining = 5 * 60;
            toast('🌿 استراحت کوتاه ۵ دقیقه', 'info');
        }
    } else {
        pomoState.mode = 'work';
        pomoState.remaining = 25 * 60;
        toast('💪 برگرد به کار!', 'info');
    }
    
    renderPomoWidget();
}

function pomoReset() {
    clearInterval(pomoState.interval);
    pomoState.running = false;
    pomoState.mode = 'idle';
    pomoState.remaining = 25 * 60;
    renderPomoWidget();
}

function pomoSkip() {
    pomoComplete();
}

function renderPomoWidget() {
    const container = document.getElementById('focusPomoWidget');
    if (!container) return;
    
    const mins = Math.floor(pomoState.remaining / 60);
    const secs = pomoState.remaining % 60;
    const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    
    const totalSec = pomoState.mode === 'work' ? 25*60 : pomoState.mode === 'break' ? 5*60 : pomoState.mode === 'longBreak' ? 15*60 : 25*60;
    const pct = (totalSec - pomoState.remaining) / totalSec;
    const circumference = 2 * Math.PI * 76;
    const offset = circumference * (1 - pct);
    
    const phaseLabel = pomoState.mode === 'work' ? 'FOCUS' : pomoState.mode === 'break' ? 'BREAK' : pomoState.mode === 'longBreak' ? 'LONG BREAK' : 'READY';
    const phaseClass = pomoState.mode === 'work' ? 'work' : 'break';
    
    container.className = 'focus-widget focus-pomodoro' + (pomoState.running ? ' running' : '');
    
    container.innerHTML = `
        <svg width="0" height="0" style="position:absolute;">
            <defs>
                <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ef4444"/>
                    <stop offset="100%" stop-color="#f59e0b"/>
                </linearGradient>
            </defs>
        </svg>
        <div class="focus-widget-header">
            <div class="focus-widget-title">🍅 پومودورو</div>
            <span class="focus-widget-badge" style="background:rgba(239,68,68,0.15); color:#ef4444;">${toPersianDigits(pomoState.sessionsToday)} امروز</span>
        </div>
        <div class="pomo-display">
            <svg class="pomo-ring ${pomoState.running ? 'running' : ''}" width="180" height="180" viewBox="0 0 180 180">
                <circle class="ring-bg" cx="90" cy="90" r="76"/>
                <circle class="ring-fill" cx="90" cy="90" r="76" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="pomo-center">
                <div class="pomo-time">${timeStr}</div>
                <div class="pomo-phase ${phaseClass}">${phaseLabel}</div>
            </div>
        </div>
        <div class="pomo-controls">
            <button class="pomo-btn" onclick="pomoReset()" title="Reset">↻</button>
            <button class="pomo-btn primary" onclick="pomoToggle()" title="${pomoState.running ? 'Pause' : 'Start'}">
                ${pomoState.running ? '⏸' : '▶'}
            </button>
            <button class="pomo-btn" onclick="pomoSkip()" title="Skip">⏭</button>
        </div>
        <div class="pomo-stats">
            <div class="pomo-stat">
                <div class="pomo-stat-value">${toPersianDigits(pomoState.sessionsToday)}</div>
                <div class="pomo-stat-label">امروز</div>
            </div>
            <div class="pomo-stat">
                <div class="pomo-stat-value">${toPersianDigits(pomoState.totalSessions)}</div>
                <div class="pomo-stat-label">کل</div>
            </div>
            <div class="pomo-stat">
                <div class="pomo-stat-value">${toPersianDigits(pomoState.totalMinutes)}</div>
                <div class="pomo-stat-label">دقیقه</div>
            </div>
        </div>
    `;
}

// ---------- Time Blocks ----------
function renderTimeBlocks() {
    const container = document.getElementById('focusScheduleWidget');
    if (!container) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's tasks with dueDate
    const todayTasks = (currentData.tasks || []).filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        const d = new Date(t.dueDate);
        return d >= today && d < tomorrow;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    let timelineHtml = '';
    
    if (!todayTasks.length) {
        timelineHtml = `
            <div class="schedule-empty">
                <div class="schedule-empty-icon">📅</div>
                <div>هیچ کار زمان‌بندی شده‌ای برای امروز نیست</div>
                <div style="margin-top:4px; font-size:11px;">از Inbox کارها را زمان‌بندی کن</div>
            </div>
        `;
    } else {
        timelineHtml = todayTasks.map(t => {
            const d = new Date(t.dueDate);
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            const isPast = d < now;
            return `
                <div class="schedule-item ${isPast ? 'past' : ''} priority-${t.priority || 'medium'}" onclick="openScheduleItem('${t.id}')">
                    <div class="schedule-time">${h}:${m}</div>
                    <div class="schedule-item-title">${t.title}</div>
                    ${t.description ? `<div class="schedule-item-sub">${t.description.slice(0, 40)}${t.description.length > 40 ? '...' : ''}</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    container.innerHTML = `
        <div class="focus-widget-header">
            <div class="focus-widget-title">📅 برنامه امروز</div>
            <span class="focus-widget-badge">${toPersianDigits(todayTasks.length)} کار</span>
        </div>
        <div class="schedule-timeline">${timelineHtml}</div>
        <button class="schedule-cta" onclick="switchView('tasks'); setTimeout(()=>{ const t = document.querySelector('[data-view=\"tasks\"]'); }, 100);">
            + افزودن کار زمان‌بندی شده
        </button>
    `;
}

function openScheduleItem(taskId) {
    const task = currentData.tasks.find(t => t.id === taskId);
    if (task && typeof openEditTaskModal === 'function') {
        openEditTaskModal(task);
    }
}

// ---------- Inject the suite into dashboard ----------
function injectFocusSuite() {
    const view = document.getElementById('view-dashboard');
    if (!view || document.getElementById('focusSuiteContainer')) return;
    
    // Insert after hero
    const hero = view.querySelector('.analytics-hero');
    if (!hero) return;
    
    const container = document.createElement('div');
    container.id = 'focusSuiteContainer';
    container.className = 'focus-suite';
    container.innerHTML = `
        <div class="focus-widget focus-today" id="focusTodayWidget"></div>
        <div class="focus-widget focus-pomodoro" id="focusPomoWidget"></div>
        <div class="focus-widget focus-schedule" id="focusScheduleWidget"></div>
    `;
    
    hero.insertAdjacentElement('afterend', container);
    
    // Tilt effect on widgets
    if (typeof attachTilt === 'function') {
        container.querySelectorAll('.focus-widget').forEach(el => attachTilt(el, 4));
    }
}

// ---------- Hook into dashboard rendering ----------
const origRenderDashF = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashF();
    setTimeout(() => {
        injectFocusSuite();
        loadPomoStats();
        renderFocusWidget();
        renderPomoWidget();
        renderTimeBlocks();
    }, 100);
};

// Re-render on data change
const origLoadAllDataF = window.loadAllData;
window.loadAllData = async function() {
    await origLoadAllDataF();
    if (document.getElementById('focusTodayWidget')) {
        renderFocusWidget();
        renderTimeBlocks();
    }
};

console.log('[FocusSuite] Today Focus + Pomodoro + Time Blocks loaded');