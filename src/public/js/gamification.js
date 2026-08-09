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