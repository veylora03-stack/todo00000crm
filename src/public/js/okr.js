// ===== OKR MODULE (Phase 31) =====
function getOkrs() { try { return JSON.parse(localStorage.getItem('crm_okrs') || '[]'); } catch (e) { return []; } }
function saveOkrs(o) { localStorage.setItem('crm_okrs', JSON.stringify(o)); }

function okrProgress(o) {
    if (!o.krs || !o.krs.length) return 0;
    return Math.round(o.krs.reduce((s, k) => s + (+k.progress || 0), 0) / o.krs.length);
}

function renderOkrs() {
    const g = document.getElementById('okrList');
    if (!g) return;
    const okrs = getOkrs();
    if (!okrs.length) { g.innerHTML = '<div class="empty-state"><div class="empty-title">هدفی تعریف نشده</div><div class="empty-desc">اولین هدف فصلی خود را بسازید</div></div>'; return; }
    g.innerHTML = okrs.map(o => `
        <div class="okr-card">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div class="okr-title">🎯 ${o.title}</div>
                <button class="icon-button" onclick="delOkr('${o.id}')">×</button>
            </div>
            <div class="okr-progress-label">${toPersianDigits(okrProgress(o))}% تکمیل</div>
            ${(o.krs || []).map(k => `
                <div class="kr-row">
                    <div class="kr-title">${k.title}</div>
                    <div class="kr-bar"><div class="kr-fill" style="width:${k.progress}%"></div></div>
                    <div class="kr-pct">${toPersianDigits(k.progress)}%</div>
                    <input type="range" class="kr-range" min="0" max="100" step="10" value="${k.progress}" onchange="setKrProgress('${o.id}','${k.id}', this.value)"/>
                    <span class="subtask-del" style="opacity:1;" onclick="delKr('${o.id}','${k.id}')">×</span>
                </div>`).join('')}
            <div style="display:flex;gap:6px;margin-top:10px;">
                <input class="form-input" id="kr-input-${o.id}" placeholder="Key Result جدید..." style="flex:1;"/>
                <button class="btn btn-secondary" onclick="addKr('${o.id}')">+</button>
            </div>
        </div>
    `).join('');
}

function addOkr() {
    const title = prompt('عنوان هدف (Objective):');
    if (!title) return;
    const okrs = getOkrs();
    okrs.push({ id: 'o' + Date.now(), title: title, krs: [] });
    saveOkrs(okrs); renderOkrs();
}

function delOkr(id) {
    if (!confirm('حذف هدف؟')) return;
    saveOkrs(getOkrs().filter(o => o.id !== id)); renderOkrs();
}

function addKr(oid) {
    const inp = document.getElementById('kr-input-' + oid);
    const title = inp.value.trim();
    if (!title) return;
    const okrs = getOkrs();
    const o = okrs.find(x => x.id === oid);
    o.krs = o.krs || [];
    o.krs.push({ id: 'k' + Date.now(), title: title, progress: 0 });
    saveOkrs(okrs); renderOkrs();
}

function delKr(oid, kid) {
    const okrs = getOkrs();
    const o = okrs.find(x => x.id === oid);
    o.krs = o.krs.filter(k => k.id !== kid);
    saveOkrs(okrs); renderOkrs();
}

function setKrProgress(oid, kid, val) {
    const okrs = getOkrs();
    const o = okrs.find(x => x.id === oid);
    const k = o.krs.find(x => x.id === kid);
    k.progress = +val;
    saveOkrs(okrs); renderOkrs();
}

// Hook render
const origSwitchO = window.switchView;
window.switchView = function(v) { origSwitchO(v); if (v === 'okr') setTimeout(renderOkrs, 100); };

setTimeout(() => { document.querySelectorAll('.nav-link').forEach(l => { if (l.dataset.view === 'okr') { const s = l.querySelector('.nav-icon'); if (s && typeof icon === 'function') s.innerHTML = icon('sparkle', 16); } }); }, 400);