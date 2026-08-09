// ===== AMBIENT SUITE MODULE (Phase 20) =====

// ---------- QUOTES ----------
const QUOTES = [
    ['موفقیت مجموع تلاش‌های کوچکی است که هر روز تکرار می‌شوند.', 'رابرت کولیر'],
    ['بهترین زمان برای کاشتن درخت بیست سال پیش بود؛ دومین بهترین زمان، امروز است.', 'ضرب‌المثل چینی'],
    ['تمرکز یعنی نه گفتن به هزاران ایده خوب.', 'استیو جابز'],
    ['سخت‌ترین قدم، همان قدم اول است.', 'ناشناس'],
    ['هر روز صبح که بیدار می‌شوی، فکر کن چه امتیاز ارزشمندی است که زنده‌ای.', 'مارکوس اورلیوس'],
    ['آینده متعلق به کسانی است که به زیبایی رویاهایشان باور دارند.', 'النور روزولت'],
    ['ساده‌ترین راه برای پیش‌بینی آینده، ساختن آن است.', 'آبراهام لینکلن'],
    ['عادت‌های تو سرنوشت تو را می‌سازند.', 'ناشناس'],
    ['کم‌کم بسیار شود.', 'ضرب‌المثل فارسی'],
    ['قطره قطره جمع گردد وانگهی دریا شود.', 'ضرب‌المثل فارسی'],
    ['نظم یعنی انجام کاری که باید، وقتی که باید.', 'ناشناس'],
    ['انسان‌های بزرگ، اهداف دارند؛ دیگران تنها آرزوهایی.', 'واشینگتون اروینگ']
];

function renderQuote() {
    const c = document.getElementById('ambientQuote');
    if (!c) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const q = QUOTES[dayOfYear % QUOTES.length];
    c.innerHTML = `
        <div class="quote-mark">“</div>
        <div class="quote-text">${q[0]}</div>
        <div class="quote-author">— ${q[1]}</div>
    `;
}

// ---------- WEATHER ----------
const COND_MAP = {
    'Sunny': ['☀️', 'آفتابی'], 'Clear': ['🌙', 'صاف'], 'Partly cloudy': ['⛅', 'نیمه‌ابری'],
    'Cloudy': ['☁️', 'ابری'], 'Overcast': ['☁️', 'تمام‌ابری'], 'Mist': ['🌫️', 'مه'],
    'Fog': ['🌫️', 'مه'], 'Rain': ['🌧️', 'بارانی'], 'Light rain': ['🌦️', 'باران سبک'],
    'Drizzle': ['🌦️', 'نم‌نم'], 'Thunderstorm': ['⛈️', 'رعدوبرق'], 'Snow': ['❄️', 'برفی'],
    'Light snow': ['🌨️', 'برف سبک']
};

async function loadWeather() {
    const c = document.getElementById('ambientWeather');
    if (!c) return;
    
    // Cache 30 min
    try {
        const cached = JSON.parse(localStorage.getItem('crm_weather') || 'null');
        if (cached && (Date.now() - cached.t) < 30 * 60 * 1000) { renderWeather(cached.data); return; }
    } catch (e) {}
    
    try {
        const res = await fetch('https://wttr.in/?format=%t|%C|%h|%w', { signal: AbortSignal.timeout(4000) });
        const txt = await res.text();
        const parts = txt.split('|');
        const data = { temp: parts[0], cond: parts[1], hum: parts[2], wind: parts[3] };
        localStorage.setItem('crm_weather', JSON.stringify({ t: Date.now(), data: data }));
        renderWeather(data);
    } catch (e) {
        // Offline fallback
        c.innerHTML = `<div class="weather-main"><div class="weather-icon">🌐</div><div><div class="weather-temp">--</div><div class="weather-cond">آفلاین — داده هواشناسی در دسترس نیست</div></div></div>`;
    }
}

function renderWeather(data) {
    const c = document.getElementById('ambientWeather');
    if (!c) return;
    const m = COND_MAP[data.cond] || ['🌤️', data.cond || ''];
    c.innerHTML = `
        <div class="weather-main">
            <div class="weather-icon">${m[0]}</div>
            <div>
                <div class="weather-temp">${data.temp}</div>
                <div class="weather-cond">${m[1]}</div>
            </div>
        </div>
        <div class="weather-meta">
            <span>💧 رطوبت: ${data.hum}</span>
            <span>💨 باد: ${data.wind}</span>
        </div>
    `;
}

// ---------- AI ASSISTANT ----------
let aiOpen = false;

function injectAmbient() {
    const view = document.getElementById('view-dashboard');
    if (!view || document.getElementById('ambientRow')) return;
    const anchor = document.getElementById('vitalsRow') || document.getElementById('focusSuiteContainer') || view.querySelector('.analytics-hero');
    if (!anchor) return;
    const row = document.createElement('div');
    row.id = 'ambientRow';
    row.className = 'ambient-row';
    row.innerHTML = '<div class="ambient-card" id="ambientWeather"></div><div class="ambient-card quote-card" id="ambientQuote"></div>';
    anchor.insertAdjacentElement('afterend', row);
    renderQuote();
    loadWeather();
}

function injectAIFab() {
    if (document.getElementById('aiFab')) return;
    const fab = document.createElement('button');
    fab.id = 'aiFab';
    fab.className = 'ai-fab';
    fab.title = 'دستیار هوشمند';
    fab.innerHTML = '🤖';
    fab.onclick = toggleAI;
    document.body.appendChild(fab);
}

function toggleAI() {
    const panel = document.getElementById('aiPanel');
    if (panel) { panel.remove(); aiOpen = false; return; }
    aiOpen = true;
    const p = document.createElement('div');
    p.id = 'aiPanel';
    p.className = 'ai-panel';
    p.innerHTML = `
        <div class="ai-header">
            <div class="ai-header-avatar">🤖</div>
            <div><div class="ai-header-title">دستیار هوشمند CRM</div><div class="ai-header-sub">آفلاین • از داده‌های تو جواب می‌دهد</div></div>
            <button class="ai-close" onclick="toggleAI()">×</button>
        </div>
        <div class="ai-messages" id="aiMessages"></div>
        <div class="ai-chips" id="aiChips">
            <span class="ai-chip" onclick="aiAsk('امروز چی کار کنم؟')">امروز چی کار کنم؟</span>
            <span class="ai-chip" onclick="aiAsk('خلاصه هفته')">خلاصه هفته</span>
            <span class="ai-chip" onclick="aiAsk('کی رو پیگیری کنم؟')">کی رو پیگیری کنم؟</span>
            <span class="ai-chip" onclick="aiAsk('آمار کلی')">آمار کلی</span>
            <span class="ai-chip" onclick="aiAsk('سطح انرژی')">سطح انرژی</span>
        </div>
        <div class="ai-input-row">
            <input class="ai-input" id="aiInput" placeholder="سوال خود را بنویس..." onkeydown="if(event.key==='Enter')aiSend()"/>
            <button class="ai-send" onclick="aiSend()">➤</button>
        </div>
    `;
    document.body.appendChild(p);
    aiAddBot('سلام! 👋 من دستیار هوشمند CRM تو هستم. از من بپرس:\n• امروز چی کار کنم؟\n• خلاصه هفته\n• کی رو پیگیری کنم؟\n• آمار کلی');
}

function aiAddUser(t) {
    const m = document.getElementById('aiMessages');
    const d = document.createElement('div');
    d.className = 'ai-msg user';
    d.textContent = t;
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
}

function aiAddBot(t) {
    const m = document.getElementById('aiMessages');
    const typing = document.createElement('div');
    typing.className = 'ai-msg bot ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    m.appendChild(typing);
    m.scrollTop = m.scrollHeight;
    setTimeout(() => {
        typing.remove();
        const d = document.createElement('div');
        d.className = 'ai-msg bot';
        d.textContent = t;
        m.appendChild(d);
        m.scrollTop = m.scrollHeight;
    }, 600);
}

function aiSend() {
    const inp = document.getElementById('aiInput');
    const t = inp.value.trim();
    if (!t) return;
    inp.value = '';
    aiAsk(t);
}

function aiAsk(q) {
    aiAddUser(q);
    setTimeout(() => aiAddBot(aiRespond(q)), 200);
}

function aiRespond(q) {
    const d = currentData;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const ws = thisWeekStart();
    
    // Today tasks
    if (q.includes('امروز') || q.includes('چی کار') || q.includes('انجام بدم')) {
        const t = (d.tasks || []).filter(x => x.status !== 'done' && x.dueDate && new Date(x.dueDate) < tomorrow).sort((a, b) => (a.priority === 'high' ? -1 : 1));
        if (!t.length) return 'امروز کار سررسیدی نداری! 🎉 می‌تونی روی ایده‌ها یا کارهای عقب‌افتاده تمرکز کنی.';
        let s = 'برنامه امروز تو:\n';
        t.slice(0, 3).forEach((x, i) => { s += (i + 1) + '. ' + x.title + (x.priority === 'high' ? ' 🔴' : '') + '\n'; });
        s += '\nپیشنهاد: اول کارهای 🔴 رو انجام بده!';
        return s;
    }
    // Week summary
    if (q.includes('خلاصه') || q.includes('هفته')) {
        const act = (d.logs || []).filter(l => new Date(l.createdAtUtc) >= ws).length;
        const done = (d.tasks || []).filter(x => x.status === 'done' && new Date(x.updatedAtUtc) >= ws).length;
        return '📊 خلاصه هفته:\n• ' + toPersianDigits(act) + ' فعالیت ثبت شده\n• ' + toPersianDigits(done) + ' کار تکمیل شده\n• ' + toPersianDigits((d.interactions || []).filter(i => new Date(i.date || i.createdAtUtc) >= ws).length) + ' تماس با مخاطب\n\nادامه بده! 💪';
    }
    // Follow-up
    if (q.includes('پیگیری') || q.includes('کی رو') || q.includes('تماس')) {
        if (typeof relationshipStats !== 'function') return 'این قابلیت نیاز به ماژول روابط دارد.';
        const od = (d.people || []).map(p => ({ p: p, st: relationshipStats(p) })).filter(x => x.st.overdue).sort((a, b) => b.st.daysSince - a.st.daysSince);
        if (!od.length) return 'همه روابطت سالمه! 💚 کسی منتظر تماس نیست.';
        let s = 'این افراد منتظر تماس تو هستن:\n';
        od.slice(0, 3).forEach(x => { s += '• ' + x.p.name + ' (' + toPersianDigits(x.st.daysSince) + ' روز)\n'; });
        return s;
    }
    // Stats
    if (q.includes('آمار') || q.includes('چند تا')) {
        return '📈 آمار کلی:\n• مخاطبان: ' + toPersianDigits((d.people || []).length) + '\n• کارها: ' + toPersianDigits((d.tasks || []).length) + '\n• ایده‌ها: ' + toPersianDigits((d.ideas || []).length) + '\n• یادداشت‌ها: ' + toPersianDigits((d.notes || []).length) + '\n• پروژه‌ها: ' + toPersianDigits((d.projects || []).length);
    }
    // Energy
    if (q.includes('انرژی')) {
        const v = computeEnergy();
        return '💪 سطح انرژی فعلی: ' + toPersianDigits(v) + '%\n' + energyLabel(v);
    }
    // Help
    return 'می‌تونم این‌ها رو بگم:\n• «امروز چی کار کنم؟»\n• «خلاصه هفته»\n• «کی رو پیگیری کنم؟»\n• «آمار کلی»\n• «سطح انرژی»';
}

// Hook
const origRenderDashA = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashA();
    setTimeout(() => { injectAmbient(); injectAIFab(); }, 150);
};