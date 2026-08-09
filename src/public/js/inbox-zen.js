// ===== ZEN MODE + PARTICLES + WORKLOAD (Phase 15.4) =====

// ---------- Workload estimate ----------
function estimateMinutes(item) {
    if (item.type === 'followup' || item.type === 'occasion') return 10;
    const t = currentData.tasks.find(x => x.id === item.taskId);
    if (t && t.duration) return t.duration * 60;
    return item.urgency === 'urgent' ? 45 : item.urgency === 'soon' ? 30 : 15;
}

function totalWorkload() {
    return inboxMaster.reduce((sum, i) => sum + estimateMinutes(i), 0);
}

function fmtDuration(min) {
    const h = Math.floor(min / 60), m = min % 60;
    if (h > 0 && m > 0) return toPersianDigits(h) + ' ساعت و ' + toPersianDigits(m) + ' دقیقه';
    if (h > 0) return toPersianDigits(h) + ' ساعت';
    return toPersianDigits(m) + ' دقیقه';
}

function injectWorkload() {
    const hero = document.querySelector('.inbox-hero');
    if (!hero || hero.querySelector('.workload-chip')) return;
    const stats = hero.querySelector('.inbox-hero-stats');
    if (!stats) return;
    const wl = totalWorkload();
    if (wl > 0) {
        const chip = document.createElement('div');
        chip.className = 'workload-chip';
        chip.innerHTML = '⏱️ حدود ' + fmtDuration(wl) + ' کار داری';
        stats.appendChild(chip);
    }
    // Zen button
    if (!hero.querySelector('.zen-btn')) {
        const zb = document.createElement('button');
        zb.className = 'zen-btn';
        zb.innerHTML = '🧘 حالت تمرکز';
        zb.onclick = openZen;
        hero.appendChild(zb);
    }
}

// ---------- Particles ----------
let particlesInit = false;
function initParticles() {
    if (particlesInit) return;
    const view = document.getElementById('view-inbox');
    if (!view) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'inbox-particles';
    view.insertBefore(canvas, view.firstChild);
    const ctx = canvas.getContext('2d');
    let W, H, dots = [];

    function resize() {
        W = canvas.width = view.offsetWidth;
        H = canvas.height = view.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
        dots.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: 1 + Math.random() * 2 });
    }

    function draw() {
        if (!document.getElementById('view-inbox').classList.contains('active')) { requestAnimationFrame(draw); return; }
        ctx.clearRect(0, 0, W, H);
        dots.forEach(d => {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > W) d.vx *= -1;
            if (d.y < 0 || d.y > H) d.vy *= -1;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(124,58,237,0.4)';
            ctx.fill();
        });
        for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
                ctx.beginPath();
                ctx.moveTo(dots[i].x, dots[i].y);
                ctx.lineTo(dots[j].x, dots[j].y);
                ctx.strokeStyle = 'rgba(124,58,237,' + (0.15 * (1 - dist / 110)) + ')';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
    particlesInit = true;
}

// Wrap renderInbox to inject extras
const origRenderZ = window.renderInbox;
window.renderInbox = function () {
    origRenderZ();
    injectWorkload();
    initParticles();
};

// ---------- ZEN MODE ----------
let zenQueue = [];
let zenShowSchedule = false;

function openZen() {
    zenQueue = inboxMaster.slice();
    zenShowSchedule = false;
    renderZen();
}

function closeZen() {
    const o = document.querySelector('.zen-overlay');
    if (o) o.remove();
    renderInbox();
}

function renderZen() {
    let o = document.querySelector('.zen-overlay');
    if (!o) {
        o = document.createElement('div');
        o.className = 'zen-overlay';
        document.body.appendChild(o);
    }
    zenShowSchedule = false;

    const processed = inboxMaster.length - zenQueue.length;
    const pct = inboxMaster.length ? Math.round((processed / inboxMaster.length) * 100) : 100;

    if (!zenQueue.length) {
        o.innerHTML = '<button class="zen-close" onclick="closeZen()">×</button><div class="zen-card"><div class="zen-done-icon">🏆</div><div class="zen-done-title">همه تمام شد!</div><div class="zen-sub">شما ' + toPersianDigits(processed) + ' مورد را پردازش کردید.<br>فوق‌العاده بود! 🎉</div><div style="margin-top:24px;"><button class="zen-btn" onclick="closeZen()">بازگشت به Inbox</button></div></div>';
        if (typeof fireConfetti === 'function') fireConfetti();
        return;
    }

    const item = zenQueue[0];
    const icons = { done: '✅', schedule: '📅', snooze: '😴', delete: '🗑', contact: '📞', open: '→' };

    let html = '<div class="zen-top"><div class="zen-progress-track"><div class="zen-progress-fill" style="width:' + pct + '%;"></div></div><div class="zen-count">' + toPersianDigits(processed + 1) + ' از ' + toPersianDigits(inboxMaster.length) + '</div></div>';
    html += '<button class="zen-close" onclick="closeZen()">×</button>';
    html += '<div class="zen-card" id="zenCard"><span class="zen-icon">' + item.icon + '</span><div class="zen-title">' + item.title + '</div><div class="zen-sub">' + item.sub + '</div>';
    html += '<div class="zen-meta"><span class="zen-meta-chip">' + (item.urgency === 'urgent' ? '🔴 فوری' : item.urgency === 'soon' ? '🟡 این هفته' : '🔵 عادی') + '</span><span class="zen-meta-chip">⏱️ ' + fmtDuration(estimateMinutes(item)) + '</span></div>';
    html += '<div class="zen-actions">';
    html += '<button class="zen-action done" onclick="zenDo(\'done\')">' + icons.done + ' انجام شد (E)</button>';
    html += '<button class="zen-action" onclick="zenToggleSchedule()">' + icons.schedule + ' زمان‌بندی (S)</button>';
    if (item.actions.includes('contact')) html += '<button class="zen-action" onclick="zenDo(\'contact\')">' + icons.contact + ' ثبت تماس</button>';
    if (item.actions.includes('open')) html += '<button class="zen-action" onclick="zenDo(\'open\')">' + icons.open + ' باز کردن</button>';
    html += '<button class="zen-action" onclick="zenDo(\'snooze\')">' + icons.snooze + ' تعویق</button>';
    html += '<button class="zen-action delete" onclick="zenDo(\'delete\')">' + icons.delete + ' حذف (X)</button>';
    html += '</div>';
    html += '<div class="zen-schedule-row" id="zenSchedRow" style="display:none;"><span class="zen-sched-opt" onclick="zenSchedule(0)">امروز</span><span class="zen-sched-opt" onclick="zenSchedule(1)">فردا</span><span class="zen-sched-opt" onclick="zenSchedule(3)">این هفته</span><span class="zen-sched-opt" onclick="zenSchedule(7)">هفته بعد</span></div>';
    html += '<div class="zen-hint">E انجام • S زمان • X حذف • Esc خروج</div></div>';
    o.innerHTML = html;
}

function zenToggleSchedule() {
    const r = document.getElementById('zenSchedRow');
    if (r) r.style.display = r.style.display === 'none' ? 'flex' : 'none';
}

function zenNext() {
    const card = document.getElementById('zenCard');
    if (card) {
        card.classList.add('leaving');
        setTimeout(() => { zenQueue.shift(); renderZen(); }, 280);
    } else { zenQueue.shift(); renderZen(); }
}

async function zenDo(action) {
    const item = zenQueue[0];
    if (!item) return;
    if (typeof playSound === 'function') playSound(action);

    try {
        if (action === 'done') {
            if (item.taskId) await api('tasks/' + item.taskId, 'PUT', { status: 'done' });
            else if (item.ideaId) await api('ideas/' + item.ideaId, 'PUT', { status: 'active' });
            if (typeof addKarma === 'function') addKarma(10);
        } else if (action === 'delete') {
            if (item.taskId) await api('tasks/' + item.taskId, 'DELETE');
        } else if (action === 'contact') {
            await api('interactions', 'POST', { personId: item.personId, type: 'call', subject: 'تماس تلفنی', content: '', date: new Date().toISOString() });
        } else if (action === 'snooze') {
            if (typeof snoozeItem === 'function') snoozeItem(item.id, 86400000);
        } else if (action === 'open') {
            closeZen();
            if (item.personId && typeof openPersonPanel === 'function') openPersonPanel(item.personId);
            return;
        }
    } catch (e) { toast('خطا', 'error'); }

    await loadAllData();
    zenNext();
}

async function zenSchedule(days) {
    const item = zenQueue[0];
    if (!item || !item.taskId) return;
    const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0);
    try { await api('tasks/' + item.taskId, 'PUT', { dueDate: d.toISOString() }); if (typeof playSound === 'function') playSound('schedule'); } catch (e) {}
    await loadAllData();
    zenNext();
}

// Zen keyboard
document.addEventListener('keydown', e => {
    if (!document.querySelector('.zen-overlay')) return;
    if (e.key === 'Escape') { closeZen(); }
    else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { e.preventDefault(); zenDo('done'); }
    else if (e.key === 's' || e.key === 'S') { e.preventDefault(); zenToggleSchedule(); }
    else if (e.key === 'x' || e.key === 'X') { e.preventDefault(); zenDo('delete'); }
});