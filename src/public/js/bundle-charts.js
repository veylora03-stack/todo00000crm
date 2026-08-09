// CRM PRO CHARTS BUNDLE (auto) 2026-08-10 01:14

/* === gamification.js === */
// ===== GAMIFICATION MODULE (Phase 13) =====

const ACHIEVEMENTS = [
    { id: 'first_task', icon: '🎯', title: 'اولین قدم', desc: 'اولین کار خود را تکمیل کن' },
    { id: 'ten_tasks', icon: '🔟', title: 'ده‌تایی', desc: '۱۰ کار را تکمیل کن' },
    { id: 'fifty_tasks', icon: '💪', title: 'قهرمان', desc: '۵۰ کار را تکمیل کن' },
    { id: 'hundred_tasks', icon: '🏆', title: 'استاد', desc: '۱۰۰ کار را تکمیل کن' },
    { id: 'streak_3', icon: '🔥', title: '۳ روز پشت سر هم', desc: '۳ روز متوالی کار کن' },
    { id: 'streak_7', icon: '⚡', title: 'هفته کامل', desc: '۷ روز متوالی کار کن' },
    { id: 'streak_30', icon: '🌟', title: 'یک ماه', desc: '۳۰ روز متوالی کار کن' },
    { id: 'first_note', icon: '📝', title: 'نویسنده', desc: 'اولین یادداشت را بنویس' },
    { id: 'first_idea', icon: '💡', title: 'خلاق', desc: 'اولین ایده را ثبت کن' },
    { id: 'level_5', icon: '⭐', title: 'سطح ۵', desc: 'به سطح ۵ برس' },
    { id: 'level_10', icon: '💎', title: 'الماس', desc: 'به سطح ۱۰ برس' },
    { id: 'early_bird', icon: '🌅', title: 'سحرخیز', desc: 'یک کار را قبل از ساعت ۷ تکمیل کن' }
];

function getGamStats() {
    const stats = JSON.parse(localStorage.getItem('crm_gam_stats') || '{}');
    return {
        streak: stats.streak || 0,
        lastActiveDate: stats.lastActiveDate || null,
        karma: stats.karma || 0,
        level: stats.level || 1,
        unlockedAchievements: stats.unlockedAchievements || [],
        totalCompleted: stats.totalCompleted || 0
    };
}

function saveGamStats(stats) {
    localStorage.setItem('crm_gam_stats', JSON.stringify(stats));
}

function addKarma(amount) {
    const stats = getGamStats();
    stats.karma += amount;
    const newLevel = Math.floor(stats.karma / 100) + 1;
    if (newLevel > stats.level) {
        stats.level = newLevel;
        checkAchievements();
    }
    saveGamStats(stats);
    renderGamBar();
}

function updateStreak() {
    const stats = getGamStats();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (stats.lastActiveDate === today) return; // Already active today
    
    if (stats.lastActiveDate === yesterday) {
        stats.streak++;
    } else if (stats.lastActiveDate !== today) {
        stats.streak = 1;
    }
    
    stats.lastActiveDate = today;
    saveGamStats(stats);
    checkAchievements();
    renderGamBar();
}

function checkAchievements() {
    const stats = getGamStats();
    const completed = currentData.tasks.filter(t => t.status === 'done').length;
    stats.totalCompleted = completed;
    
    const newUnlocks = [];
    
    // Task achievements
    if (completed >= 1 && !stats.unlockedAchievements.includes('first_task')) {
        stats.unlockedAchievements.push('first_task');
        newUnlocks.push('first_task');
    }
    if (completed >= 10 && !stats.unlockedAchievements.includes('ten_tasks')) {
        stats.unlockedAchievements.push('ten_tasks');
        newUnlocks.push('ten_tasks');
    }
    if (completed >= 50 && !stats.unlockedAchievements.includes('fifty_tasks')) {
        stats.unlockedAchievements.push('fifty_tasks');
        newUnlocks.push('fifty_tasks');
    }
    if (completed >= 100 && !stats.unlockedAchievements.includes('hundred_tasks')) {
        stats.unlockedAchievements.push('hundred_tasks');
        newUnlocks.push('hundred_tasks');
    }
    
    // Streak achievements
    if (stats.streak >= 3 && !stats.unlockedAchievements.includes('streak_3')) {
        stats.unlockedAchievements.push('streak_3');
        newUnlocks.push('streak_3');
    }
    if (stats.streak >= 7 && !stats.unlockedAchievements.includes('streak_7')) {
        stats.unlockedAchievements.push('streak_7');
        newUnlocks.push('streak_7');
    }
    if (stats.streak >= 30 && !stats.unlockedAchievements.includes('streak_30')) {
        stats.unlockedAchievements.push('streak_30');
        newUnlocks.push('streak_30');
    }
    
    // Note/Idea achievements
    if (currentData.notes.length > 0 && !stats.unlockedAchievements.includes('first_note')) {
        stats.unlockedAchievements.push('first_note');
        newUnlocks.push('first_note');
    }
    if (currentData.ideas.length > 0 && !stats.unlockedAchievements.includes('first_idea')) {
        stats.unlockedAchievements.push('first_idea');
        newUnlocks.push('first_idea');
    }
    
    // Level achievements
    if (stats.level >= 5 && !stats.unlockedAchievements.includes('level_5')) {
        stats.unlockedAchievements.push('level_5');
        newUnlocks.push('level_5');
    }
    if (stats.level >= 10 && !stats.unlockedAchievements.includes('level_10')) {
        stats.unlockedAchievements.push('level_10');
        newUnlocks.push('level_10');
    }
    
    saveGamStats(stats);
    
    // Celebrate new unlocks
    newUnlocks.forEach(id => {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) celebrateAchievement(ach);
    });
    
    renderAchievements();
}

function celebrateAchievement(ach) {
    // Confetti
    const colors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    for (let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.top = '-10px';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = Math.random() * 0.5 + 's';
        conf.style.animationDuration = (2 + Math.random() * 2) + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 5000);
    }
    
    // Toast
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = '<div class="achievement-toast-icon">' + ach.icon + '</div><div><div class="achievement-toast-title">🏅 دستاورد جدید!</div><div class="achievement-toast-desc">' + ach.title + '</div></div>';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
    
    toast('🏅 ' + ach.title + ' — ' + ach.desc, 'success');
}

function renderGamBar() {
    const bar = document.getElementById('gamBar');
    if (!bar) return;
    const stats = getGamStats();
    const karmaInLevel = stats.karma % 100;
    const progress = karmaInLevel;
    
    bar.innerHTML = '<div class="gam-stat streak"><span class="gam-stat-icon streak-fire">🔥</span><span class="gam-stat-value">' + toPersianDigits(stats.streak) + '</span> روز</div>' +
        '<div class="gam-stat level"><span class="gam-stat-icon">⭐</span><span class="gam-stat-value">سطح ' + toPersianDigits(stats.level) + '</span></div>' +
        '<div class="gam-stat karma"><span class="gam-stat-icon">💫</span><span class="gam-stat-value">' + toPersianDigits(stats.karma) + '</span> کارما</div>' +
        '<div class="level-progress"><div class="level-label"><span>پیشرفت به سطح ' + toPersianDigits(stats.level + 1) + '</span><span>' + toPersianDigits(progress) + '/100</span></div><div class="level-progress-bar"><div class="level-progress-fill" style="width:' + progress + '%;"></div></div></div>';
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    const stats = getGamStats();
    
    grid.innerHTML = ACHIEVEMENTS.map(ach => {
        const unlocked = stats.unlockedAchievements.includes(ach.id);
        return '<div class="achievement-card ' + (unlocked ? 'unlocked' : 'locked') + '"><span class="achievement-icon">' + ach.icon + '</span><div class="achievement-title">' + ach.title + '</div><div class="achievement-desc">' + ach.desc + '</div>' + (unlocked ? '<div class="achievement-date">✓ باز شده</div>' : '<div class="achievement-date">🔒 قفل</div>') + '</div>';
    }).join('');
}

function injectGamBar() {
    const dash = document.getElementById('view-dashboard');
    if (!dash || document.getElementById('gamBar')) return;
    const bar = document.createElement('div');
    bar.id = 'gamBar';
    bar.className = 'gam-bar';
    const ph = dash.querySelector('.page-header');
    ph.parentElement.insertBefore(bar, ph.nextSibling);
    renderGamBar();
}

function injectAchievementsSection() {
    const dash = document.getElementById('view-dashboard');
    if (!dash || document.getElementById('achievementsSection')) return;
    const section = document.createElement('div');
    section.id = 'achievementsSection';
    section.style.marginTop = '20px';
    section.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div><div style="font-size:14px;font-weight:600;color:var(--text-primary);">🏅 دستاوردها</div><div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">' + toPersianDigits(getGamStats().unlockedAchievements.length) + ' از ' + toPersianDigits(ACHIEVEMENTS.length) + ' باز شده</div></div></div><div class="achievements-grid" id="achievementsGrid"></div>';
    const tl = dash.querySelector('.card');
    tl.parentElement.insertBefore(section, tl.nextSibling);
    renderAchievements();
}

// Hook into task completion to add karma + update streak
const origToggleTaskStatus = window.toggleTaskStatus;
window.toggleTaskStatus = async function(tid) {
    const t = currentData.tasks.find(x => x.id === tid);
    if (!t) return;
    const ns = t.status === 'done' ? 'pending' : 'done';
    try {
        await api('tasks/' + tid, 'PUT', { status: ns });
        if (ns === 'done') {
            addKarma(10);
            updateStreak();
            const hour = new Date().getHours();
            if (hour < 7 && !getGamStats().unlockedAchievements.includes('early_bird')) {
                const stats = getGamStats();
                stats.unlockedAchievements.push('early_bird');
                saveGamStats(stats);
                celebrateAchievement(ACHIEVEMENTS.find(a => a.id === 'early_bird'));
            }
            toast('کار تکمیل شد! +10 کارما 🎉', 'success');
        } else {
            toast('به حالت در انتظار بازگشت', 'success');
        }
        await loadAllData();
        if (typeof renderCalendar === 'function') renderCalendar();
    } catch (e) { toast('خطا', 'error'); }
};

// Hook into task creation
const origSubmitModal = window.submitModal;
window.submitModal = async function() {
    const type = currentModalType;
    await origSubmitModal();
    if (type === 'tasks') addKarma(5);
    if (type === 'notes') { const stats = getGamStats(); if (!stats.unlockedAchievements.includes('first_note')) checkAchievements(); }
    if (type === 'ideas') { const stats = getGamStats(); if (!stats.unlockedAchievements.includes('first_idea')) checkAchievements(); }
};

// Init
setTimeout(() => {
    injectGamBar();
    injectAchievementsSection();
    checkAchievements();
}, 500);

/* === wrapped.js === */
// ===== WRAPPED MODULE (Phase 14) =====

let wrappedCurrentSlide = 0;
let wrappedSlides = [];
let wrappedAutoTimer = null;

function openWrapped() {
    const year = new Date().getFullYear();
    const jNow = gregorianToJalali(year, new Date().getMonth() + 1, new Date().getDate());
    const yearLabel = toPersianDigits(jNow.jy);
    
    const data = currentData;
    const tasks = data.tasks || [];
    const people = data.people || [];
    const logs = data.logs || [];
    
    const completed = tasks.filter(t => t.status === 'done').length;
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status === 'done').length;
    
    // Best day of week
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    logs.forEach(l => { dayCounts[new Date(l.createdAtUtc).getDay()]++; });
    const bestDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];
    
    // Top person (most interactions)
    const personCounts = {};
    (data.interactions || []).forEach(i => { personCounts[i.personId] = (personCounts[i.personId] || 0) + 1; });
    const topPersonId = Object.keys(personCounts).sort((a, b) => personCounts[b] - personCounts[a])[0];
    const topPerson = topPersonId ? people.find(p => p.id === topPersonId) : null;
    
    // Total activity
    const totalActions = logs.length;
    
    // Best month (this year)
    const monthCounts = {};
    const monthNames = persianMonths;
    logs.forEach(l => {
        const d = new Date(l.createdAtUtc);
        if (d.getFullYear() === year) {
            const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
            monthCounts[j.jm] = (monthCounts[j.jm] || 0) + 1;
        }
    });
    const bestMonthNum = Object.keys(monthCounts).length > 0 ? parseInt(Object.keys(monthCounts).sort((a, b) => monthCounts[b] - monthCounts[a])[0]) : 1;
    const bestMonth = monthNames[bestMonthNum - 1];
    
    wrappedSlides = [
        { type: 'intro', year: yearLabel, color: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' },
        { type: 'big', icon: '✅', number: toPersianDigits(completed), label: 'کار تکمیل شده', sub: 'امسال شما این همه کار را انجام دادید!', color: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' },
        { type: 'big', icon: '🎯', number: toPersianDigits(tasks.length), label: 'کار ساخته شده', sub: 'در مجموع امسال', color: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
        { type: 'big', icon: '📅', label: 'بهترین روز هفته', sub: 'بیشترین فعالیت شما در این روز بوده', year: bestDay, color: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' },
        { type: 'big', icon: '🗓️', label: 'فعال‌ترین ماه', sub: monthCounts[bestMonthNum] + ' فعالیت', year: bestMonth, color: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
        { type: 'big', icon: '⚡', number: toPersianDigits(totalActions), label: 'اقدام و فعالیت', sub: 'در سیستم ثبت شده', color: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
        { type: 'person', icon: '💎', title: 'مهم‌ترین ارتباط', person: topPerson, color: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)' },
        { type: 'outro', year: yearLabel, color: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)' }
    ];
    
    wrappedCurrentSlide = 0;
    renderWrappedSlide();
}

function renderWrappedSlide() {
    let container = document.getElementById('wrappedContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'wrappedContainer';
        container.className = 'wrapped-container';
        document.body.appendChild(container);
    }
    
    const slide = wrappedSlides[wrappedCurrentSlide];
    container.style.background = slide.color;
    
    let content = '';
    
    // Progress bars
    content += '<div class="wrapped-progress">';
    for (let i = 0; i < wrappedSlides.length; i++) {
        const cls = i < wrappedCurrentSlide ? 'done' : i === wrappedCurrentSlide ? 'current' : '';
        content += '<div class="wrapped-progress-bar ' + cls + '"></div>';
    }
    content += '</div>';
    content += '<button class="wrapped-close" onclick="closeWrapped()">×</button>';
    
    // Slide content
    content += '<div class="wrapped-slide">';
    
    if (slide.type === 'intro') {
        content += '<div class="wrapped-year">' + slide.year + '</div><div class="wrapped-big-number" style="font-size:48px;">🎬</div><div class="wrapped-label">داستان سال شما</div><div class="wrapped-sub">آماده برای دیدن دستاوردهایتان؟</div>';
    } else if (slide.type === 'big') {
        content += '<div class="wrapped-icon">' + slide.icon + '</div>';
        if (slide.number) content += '<div class="wrapped-big-number">' + slide.number + '</div>';
        else content += '<div class="wrapped-big-number" style="font-size:64px;">' + slide.year + '</div>';
        content += '<div class="wrapped-label">' + slide.label + '</div><div class="wrapped-sub">' + slide.sub + '</div>';
    } else if (slide.type === 'person') {
        content += '<div class="wrapped-icon">' + slide.icon + '</div><div class="wrapped-label">' + slide.title + '</div>';
        if (slide.person) {
            content += '<div class="wrapped-card"><div class="wrapped-card-title">👤 مخاطب برتر</div><div class="wrapped-card-value">' + slide.person.name + '</div><div class="wrapped-card-desc">' + (slide.person.company || 'همراه همیشگی شما') + '</div></div>';
        } else {
            content += '<div class="wrapped-sub">هنوز تعاملی ثبت نشده!</div>';
        }
    } else if (slide.type === 'outro') {
        content += '<div class="wrapped-icon">🎊</div><div class="wrapped-label">تبریک!</div><div class="wrapped-big-number" style="font-size:48px;">' + slide.year + '</div><div class="wrapped-sub">سال فوق‌العاده‌ای داشتید.<br>ادامه بده! 💪</div>';
    }
    
    // Navigation
    content += '<div class="wrapped-nav">';
    if (wrappedCurrentSlide > 0) content += '<button class="wrapped-nav-btn" onclick="prevWrappedSlide()">← قبلی</button>';
    if (wrappedCurrentSlide < wrappedSlides.length - 1) content += '<button class="wrapped-nav-btn" onclick="nextWrappedSlide()">بعدی →</button>';
    else content += '<button class="wrapped-nav-btn" onclick="closeWrapped()">پایان ✨</button>';
    content += '</div>';
    
    content += '</div>';
    container.innerHTML = content;
    
    // Auto-advance
    if (wrappedAutoTimer) clearTimeout(wrappedAutoTimer);
    if (wrappedCurrentSlide < wrappedSlides.length - 1) {
        wrappedAutoTimer = setTimeout(nextWrappedSlide, 6000);
    }
}

function nextWrappedSlide() {
    if (wrappedCurrentSlide < wrappedSlides.length - 1) {
        const slide = document.querySelector('.wrapped-slide');
        if (slide) {
            slide.classList.add('exiting');
            setTimeout(() => {
                wrappedCurrentSlide++;
                renderWrappedSlide();
            }, 400);
        } else {
            wrappedCurrentSlide++;
            renderWrappedSlide();
        }
    }
}

function prevWrappedSlide() {
    if (wrappedCurrentTimer) clearTimeout(wrappedAutoTimer);
    if (wrappedCurrentSlide > 0) {
        wrappedCurrentSlide--;
        renderWrappedSlide();
    }
}

function closeWrapped() {
    if (wrappedAutoTimer) clearTimeout(wrappedAutoTimer);
    const container = document.getElementById('wrappedContainer');
    if (container) container.remove();
}

// Add to settings view
function addWrappedSettings() {
    setTimeout(() => {
        const tabs = document.querySelectorAll('.settings-tab');
        const general = Array.from(tabs).find(t => t.dataset.tab === 'general');
        if (!general || general.querySelector('#wrappedSettings')) return;
        
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.id = 'wrappedSettings';
        section.innerHTML = '<div class="settings-section-title">🎬 Wrapped سالانه</div><div class="settings-section-desc">داستان سال شما مثل Spotify Wrapped</div><div class="setting-row"><div class="setting-info"><div class="setting-label">نمایش Wrapped</div><div class="setting-desc">خلاصه عملکرد سال جاری</div></div><button class="btn btn-primary" onclick="openWrapped()">🎬 مشاهده</button></div>';
        const vault = general.querySelector('#vaultSettings');
        if (vault) vault.after(section);
        else general.appendChild(section);
    }, 600);
}

setTimeout(addWrappedSettings, 800);

/* === dashboard-pro.js === */
// ===== DASHBOARD GOD MODE (Phase 16) =====

// ---------- 3D Tilt ----------
function attachTilt(el, max) {
    max = max || 6;
    if (!el || el.dataset.tilt) return;
    el.dataset.tilt = '1';
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(800px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) translateY(-2px)';
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
}

// ---------- Animated counter ----------
function animateValue(el) {
    const raw = el.textContent;
    const num = parseInt(raw.replace(/[^\d]/g, ''), 10);
    if (isNaN(num)) return;
    const suffix = raw.replace(/[\d,]/g, '').trim();
    const dur = 800, start = performance.now();
    function step(now) {
        const p = Math.min(1, (now - start) / dur);
        const v = Math.round(num * (1 - Math.pow(1 - p, 3)));
        el.textContent = toPersianDigits(v) + (suffix ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ---------- Live clock ----------
function tickClock() {
    const c = document.getElementById('liveClock');
    const dEl = document.getElementById('liveDate');
    if (!c) return;
    const now = new Date();
    c.textContent = toPersianDigits(String(now.getHours()).padStart(2, '0')) + ':' + toPersianDigits(String(now.getMinutes()).padStart(2, '0')) + ':' + toPersianDigits(String(now.getSeconds()).padStart(2, '0'));
    if (dEl && typeof gregorianToJalali === 'function') {
        const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        dEl.textContent = persianWeekdaysFull[(now.getDay() + 1) % 7] + '، ' + toPersianDigits(j.jd) + ' ' + persianMonths[j.jm - 1] + ' ' + toPersianDigits(j.jy);
    }
}

function enhanceHero() {
    const hero = document.querySelector('.analytics-hero');
    if (!hero || hero.querySelector('.hero-clock')) return;
    const clock = document.createElement('div');
    clock.className = 'hero-clock';
    clock.innerHTML = '<div id="liveClock"></div><div id="liveDate"></div>';
    const content = hero.querySelector('.analytics-hero-content');
    if (content) content.appendChild(clock);
    tickClock();
    setInterval(tickClock, 1000);
}

// ---------- Particles ----------
let dashParticlesInit = false;
function initDashParticles() {
    if (dashParticlesInit) return;
    const view = document.getElementById('view-dashboard');
    if (!view) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'dash-particles';
    view.insertBefore(canvas, view.firstChild);
    const ctx = canvas.getContext('2d');
    let W, H, dots = [];
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 35; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: 1 + Math.random() * 2 });
    function draw() {
        if (document.getElementById('view-dashboard').classList.contains('active')) {
            ctx.clearRect(0, 0, W, H);
            dots.forEach(d => {
                d.x += d.vx; d.y += d.vy;
                if (d.x < 0 || d.x > W) d.vx *= -1;
                if (d.y < 0 || d.y > H) d.vy *= -1;
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(124,58,237,0.35)'; ctx.fill();
            });
            for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.strokeStyle = 'rgba(124,58,237,' + (0.12 * (1 - dist / 110)) + ')'; ctx.lineWidth = 1; ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }
    draw();
    dashParticlesInit = true;
}

// ---------- Enhance dashboard ----------
function enhanceDashboard() {
    initDashParticles();
    enhanceHero();

    // Tilt on cards
    document.querySelectorAll('#view-dashboard .stat-card-v2, #view-dashboard .chart-card, #view-dashboard .insight-card').forEach(el => attachTilt(el, 5));

    // Animated counters
    document.querySelectorAll('#view-dashboard .stat-card-value, #view-dashboard .hero-stat-value').forEach(animateValue);

    // Staggered entrance
    let i = 0;
    document.querySelectorAll('#view-dashboard .stat-card-v2, #view-dashboard .chart-card, #view-dashboard .insight-card, #view-dashboard .heatmap-section').forEach(el => {
        if (!el.classList.contains('anim-in')) {
            el.classList.add('anim-in');
            el.style.animationDelay = (i * 0.06) + 's';
            i++;
        }
    });
}

// Wrap renderDashboard
const origRenderDash = window.renderDashboard;
window.renderDashboard = function () {
    origRenderDash();
    setTimeout(enhanceDashboard, 60);
};

/* === focus-suite.js === */
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

/* === vitals.js === */
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

/* === dashboard-qa.js === */
// ===== DASHBOARD QA MODULE (Phase 24) =====

// ---------- 1) Reorder: KPI right after commandHub ----------
const QA_ORDER = ['commandHub','statsGrid','focusSuite','chartsGrid','vitalsRow','heatmap','relWidgets','ambientRow','insights','achievements','timeline'];
function qaApplyOrder() {
    if (!localStorage.getItem('crm_dash_order')) {
        localStorage.setItem('crm_dash_order', JSON.stringify(QA_ORDER));
        if (typeof cwApply === 'function') cwApply();
    }
}

// ---------- 6) Zone labels move with widgets ----------
const QA_ZONES = [
    { id: 'focusSuiteContainer', label: '⚡ امروز' },
    { id: 'statsGrid', label: '📊 نمای کلی' },
    { id: 'chartsGrid', label: '📈 روندها' },
    { id: 'vitalsRow', label: '💪 سلامت و بهره‌وری' },
    { id: 'relWidgets', label: '💞 روابط و دستاوردها' }
];
function syncZoneLabels() {
    document.querySelectorAll('.zone-label').forEach(l => l.remove());
    QA_ZONES.forEach(z => {
        const el = document.getElementById(z.id);
        if (!el) return;
        const lbl = document.createElement('div');
        lbl.className = 'zone-label';
        lbl.textContent = z.label;
        el.parentNode.insertBefore(lbl, el);
    });
}
const origCwApply = window.cwApply;
window.cwApply = function() { if (origCwApply) origCwApply(); syncZoneLabels(); };

// ---------- 2) KPI delta ----------
function qaDelta(entity) {
    const now = Date.now();
    const arr = currentData[entity] || [];
    const a = arr.filter(x => x.createdAtUtc && (now - new Date(x.createdAtUtc)) < 7 * 86400000).length;
    const b = arr.filter(x => x.createdAtUtc && (now - new Date(x.createdAtUtc)) >= 7 * 86400000 && (now - new Date(x.createdAtUtc)) < 14 * 86400000).length;
    return a - b;
}
const origRenderStats = window.renderStats;
window.renderStats = function() {
    origRenderStats();
    const map = { people: 'people', tasks: 'tasks', ideas: 'ideas', projects: 'projects' };
    document.querySelectorAll('#statsGrid .stat-card-v2').forEach((card, i) => {
        const key = Object.keys(map)[i];
        if (!key || card.querySelector('.stat-delta')) return;
        const d = qaDelta(key);
        const labelEl = card.querySelector('.stat-card-label');
        if (!labelEl) return;
        const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
        const txt = d > 0 ? '+' + toPersianDigits(d) + ' ↑' : d < 0 ? toPersianDigits(d) + ' ↓' : '—';
        labelEl.insertAdjacentHTML('beforeend', ' <span class="stat-delta ' + cls + '">' + txt + '</span>');
    });
}

// ---------- 3) Pin to Focus ----------
function getFocusPins() { try { return JSON.parse(localStorage.getItem('crm_focus_pins') || '[]'); } catch (e) { return []; } }
function setFocusPins(p) { localStorage.setItem('crm_focus_pins', JSON.stringify(p)); }

const origSelectTop = window.selectTopTasks;
window.selectTopTasks = function() {
    origSelectTop();
    const pins = getFocusPins().map(id => currentData.tasks.find(t => t.id === id)).filter(t => t && t.status !== 'done');
    const auto = focusSelectedTasks.filter(t => !pins.some(p => p.id === t.id));
    focusSelectedTasks = pins.concat(auto).slice(0, 3);
};

function openFocusPicker(btn) {
    const old = document.querySelector('.focus-picker'); if (old) { old.remove(); return; }
    const rect = btn.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'focus-picker';
    p.style.top = (rect.bottom + 6) + 'px';
    p.style.left = Math.max(10, rect.left - 200) + 'px';
    const pins = getFocusPins();
    const cands = (currentData.tasks || []).filter(t => t.status !== 'done').slice(0, 8);
    p.innerHTML = '<div style="font-size:11px;color:var(--text-tertiary);padding:4px 8px;">📌 انتخاب کارهای فوکوس (حداکثر ۳):</div>' +
        cands.map(t => '<div class="focus-picker-item ' + (pins.includes(t.id) ? 'pinned' : '') + '" onclick="toggleFocusPin(\'' + t.id + '\')">' + (pins.includes(t.id) ? '📌' : '○') + ' ' + t.title + '</div>').join('');
    document.body.appendChild(p);
    setTimeout(() => document.addEventListener('click', function h(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('click', h); } }), 50);
}

function toggleFocusPin(id) {
    let pins = getFocusPins();
    if (pins.includes(id)) pins = pins.filter(x => x !== id);
    else { pins.push(id); if (pins.length > 3) pins.shift(); }
    setFocusPins(pins);
    document.querySelector('.focus-picker')?.remove();
    renderFocusWidget();
}

// Add pin button to focus header
const origRenderFocus = window.renderFocusWidget;
window.renderFocusWidget = function() {
    origRenderFocus();
    const hdr = document.querySelector('#focusTodayWidget .focus-widget-header');
    if (hdr && !hdr.querySelector('.focus-pin-btn')) {
        hdr.insertAdjacentHTML('beforeend', '<button class="focus-pin-btn" title="انتخاب کارهای فوکوس" onclick="openFocusPicker(this)">📌</button>');
    }
}

// ---------- 4) Pomodoro linked task ----------
const origStartFocus = window.startFocusSession;
window.startFocusSession = function() {
    const inc = focusSelectedTasks.filter(t => t.status !== 'done');
    if (inc.length) localStorage.setItem('crm_pomo_task', inc[0].id);
    origStartFocus();
};
const origRenderPomo = window.renderPomoWidget;
window.renderPomoWidget = function() {
    origRenderPomo();
    const tid = localStorage.getItem('crm_pomo_task');
    const t = tid ? currentData.tasks.find(x => x.id === tid) : null;
    const wrap = document.querySelector('#focusPomoWidget .pomo-stats');
    if (wrap && t && !document.getElementById('pomoLinked')) {
        wrap.insertAdjacentHTML('afterend', '<div id="pomoLinked" style="margin-top:10px;font-size:11px;color:var(--text-secondary);background:var(--bg-surface-2);padding:6px 10px;border-radius:6px;">🎯 ' + t.title + '</div>');
    }
}

// ---------- 5) View-all + clickable insights ----------
function qaWireLinks() {
    const link = document.querySelector('#view-dashboard .card-link');
    if (link && !link.dataset.wired) {
        link.dataset.wired = '1';
        link.onclick = () => {
            const tl = document.getElementById('timeline');
            if (!tl) return;
            const expanded = tl.dataset.expanded === '1';
            renderTimelineFull(!expanded);
            tl.dataset.expanded = expanded ? '0' : '1';
            link.textContent = expanded ? 'View all' : 'نمایش کمتر';
        };
    }
    // insights clickable
    const cards = document.querySelectorAll('#insightsGrid .insight-card');
    const targets = ['tasks', 'dashboard', 'dashboard'];
    cards.forEach((c, i) => {
        if (c.dataset.wired) return;
        c.dataset.wired = '1';
        c.onclick = () => switchView(i === 0 ? 'tasks' : 'reports');
    });
}
function renderTimelineFull(all) {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    const logs = (all ? currentData.logs : currentData.logs.slice(-8)).slice().reverse();
    if (!logs.length) return;
    tl.innerHTML = logs.map(log => {
        const cls = log.action === 'create' ? 'create' : log.action === 'update' ? 'update' : 'delete';
        return '<div class="timeline-item"><div class="timeline-dot ' + cls + '"></div><div class="timeline-content"><div class="timeline-text">' + log.details + '</div><div class="timeline-meta">' + getTimeAgo(new Date(log.createdAtUtc)) + '</div></div></div>';
    }).join('');
}

// ---------- 8) Activity range toggle ----------
let actRange = 7;
function qaAddRangeToggle() {
    const header = document.querySelector('#activityChartContainer')?.closest('.chart-card')?.querySelector('.chart-header');
    if (!header || header.querySelector('.range-toggle')) return;
    header.insertAdjacentHTML('beforeend', '<div class="range-toggle"><button class="range-btn active" data-r="7" onclick="setActRange(7)">7روز</button><button class="range-btn" data-r="30" onclick="setActRange(30)">30روز</button><button class="range-btn" data-r="90" onclick="setActRange(90)">90روز</button></div>');
}
function setActRange(r) {
    actRange = r;
    document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', +b.dataset.r === r));
    renderActivityRange();
}
function renderActivityRange() {
    const c = document.getElementById('activityChartContainer');
    if (!c || typeof Charts === 'undefined') return;
    const now = new Date();
    const buckets = 6;
    const span = actRange / buckets;
    const data = [];
    for (let i = buckets - 1; i >= 0; i--) {
        const end = new Date(now); end.setDate(end.getDate() - i * span);
        const start = new Date(end); start.setDate(start.getDate() - span);
        const count = currentData.logs.filter(l => { const t = new Date(l.createdAtUtc); return t > start && t <= end; }).length;
        data.push({ label: '-' + toPersianDigits(Math.round(i * span)) + 'روز', value: count });
    }
    Charts.bar('activityChartContainer', data, { width: 600, height: 260, color: '#7c3aed' });
}

// ---------- Hook ----------
const origRenderDashQ = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashQ();
    setTimeout(() => { qaApplyOrder(); syncZoneLabels(); qaWireLinks(); qaAddRangeToggle(); }, 300);
};

setTimeout(() => { qaApplyOrder(); syncZoneLabels(); }, 400);
