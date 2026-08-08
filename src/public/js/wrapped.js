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

console.log('[Wrapped] Module loaded');