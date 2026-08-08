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

console.log('[DashboardGod] GOD MODE loaded');