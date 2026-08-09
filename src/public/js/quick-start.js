// ===== QUICK START GUIDE =====
const QS_STEPS = [
    { target: '.analytics-hero', title: '👋 خوش آمدید!', desc: 'اینجا خلاصه‌ی روز شماست. ساعت زنده + آمار کلی.' },
    { target: '.command-search', title: '🔍 جستجوی سریع', desc: 'Ctrl+K برای جستجوی همه‌چیز: کارها، مخاطبان، یادداشت‌ها.' },
    { target: '.focus-today', title: '🎯 تمرکز امروز', desc: '۳ کار مهم امروز. تیک بزنید تا پیشرفت را ببینید.' },
    { target: '.focus-pomodoro', title: '🍅 پومودورو', desc: '۲۵ دقیقه کار عمیق + ۵ دقیقه استراحت.' },
    { target: '.stats-grid-v2', title: '📊 آمار زنده', desc: 'آمار کلیدی + تغییرات نسبت به هفته قبل.' }
];

let qsCurrent = 0;

function startQuickStart() {
    qsCurrent = 0;
    showQsStep();
}

function showQsStep() {
    const old = document.getElementById('qsOverlay');
    if (old) old.remove();
    
    if (qsCurrent >= QS_STEPS.length) {
        $context.set('quickStartDone', true);
        toast('🎉 راهنما تمام شد! لذت ببرید', 'success');
        return;
    }
    
    const step = QS_STEPS[qsCurrent];
    const target = document.querySelector(step.target);
    if (!target) { qsCurrent++; showQsStep(); return; }
    
    // Highlight target
    const rect = target.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.id = 'qsOverlay';
    overlay.innerHTML = `
        <div class="qs-backdrop" onclick="skipQuickStart()"></div>
        <div class="qs-highlight" style="top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;"></div>
        <div class="qs-card" style="top:${rect.bottom + 16}px;left:${rect.left}px;">
            <div class="qs-card-title">${step.title}</div>
            <div class="qs-card-desc">${step.desc}</div>
            <div class="qs-card-actions">
                <button class="btn btn-ghost" onclick="skipQuickStart()">رد کردن</button>
                <button class="btn btn-primary" onclick="nextQsStep()">${qsCurrent === QS_STEPS.length - 1 ? 'پایان' : 'بعدی →'}</button>
            </div>
            <div class="qs-card-progress">${toPersianDigits(qsCurrent + 1)} از ${toPersianDigits(QS_STEPS.length)}</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function nextQsStep() {
    qsCurrent++;
    showQsStep();
}

function skipQuickStart() {
    const old = document.getElementById('qsOverlay');
    if (old) old.remove();
    $context.set('quickStartDone', true);
}

// Auto-start on first visit
setTimeout(() => {
    if (!$context.state.quickStartDone) startQuickStart();
}, 1000);