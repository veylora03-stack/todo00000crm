// ===== COMPANIES MODULE (Phase 29) =====
function companyMembers(cid) { return (currentData.people || []).filter(p => p.companyId === cid); }
function companyDeals(cid) {
    const mids = companyMembers(cid).map(p => p.id);
    return (currentData.deals || []).filter(d => mids.includes(d.personId));
}

function renderCompanies() {
    const g = document.getElementById('companiesGrid');
    if (!g) return;
    const comps = currentData.companies || [];
    if (!comps.length) { g.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-title">شرکتی ثبت نشده</div></div>'; return; }
    g.innerHTML = comps.map(c => {
        const m = companyMembers(c.id), dl = companyDeals(c.id);
        const val = dl.reduce((s, d) => s + (+d.value || 0), 0);
        return `<div class="company-card" onclick="openCompanyPanel('${c.id}')">
            <div class="company-logo">${(c.name || '?')[0]}</div>
            <div class="company-name">${c.name}</div>
            <div class="company-industry">${c.industry || '—'}</div>
            <div class="company-stats">
                <span>👥 <b>${toPersianDigits(m.length)}</b> عضو</span>
                <span>💰 <b>${fmtMoney ? fmtMoney(val) : val}</b></span>
            </div>
        </div>`;
    }).join('');
}

function openCompanyModal(id) {
    const c = id ? (currentData.companies || []).find(x => x.id === id) : null;
    document.getElementById('modalTitle').textContent = c ? 'ویرایش شرکت' : 'شرکت جدید';
    const b = document.getElementById('modalBody');
    b.innerHTML = `
        <div class="form-field"><label class="form-label">نام *</label><input class="form-input" name="name" value="${c ? c.name : ''}"/></div>
        <div class="form-field"><label class="form-label">صنعت</label><input class="form-input" name="industry" value="${c ? c.industry : ''}"/></div>
        <div class="form-field"><label class="form-label">وب‌سایت</label><input class="form-input" name="website" value="${c ? c.website : ''}"/></div>
        <div class="form-field"><label class="form-label">تلفن</label><input class="form-input" name="phone" value="${c ? c.phone : ''}"/></div>
    `;
    currentModalType = 'companies';
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {}; b.querySelectorAll('[name]').forEach(i => data[i.name] = i.value);
        if (!data.name) { toast('نام الزامی است', 'error'); return; }
        try {
            if (c) await api('companies/' + c.id, 'PUT', data); else await api('companies', 'POST', data);
            toast('🏢 ذخیره شد', 'success'); closeModal(); await loadAllData();
        } catch (e) { toast('خطا', 'error'); }
    };
    document.getElementById('modalOverlay').classList.add('active');
}

function openCompanyPanel(cid) {
    const c = (currentData.companies || []).find(x => x.id === cid);
    if (!c) return;
    const m = companyMembers(cid), dl = companyDeals(cid);
    document.getElementById('panelTitle').textContent = '🏢 ' + c.name;
    let html = `<div class="panel-section"><div class="panel-section-title">اطلاعات</div>
        <div class="panel-field"><div class="panel-field-content"><div class="panel-field-label">صنعت</div><div class="panel-field-value">${c.industry || '-'}</div></div></div>
        <div class="panel-field"><div class="panel-field-content"><div class="panel-field-label">وب‌سایت</div><div class="panel-field-value">${c.website || '-'}</div></div></div></div>`;
    html += `<div class="panel-section"><div class="panel-section-title">اعضا (${toPersianDigits(m.length)})</div>` +
        (m.length ? m.map(p => `<div class="backlink-item" onclick="closePanel(); openPersonPanel('${p.id}')">👤 ${p.name}</div>`).join('') : '<div style="font-size:12px;color:var(--text-tertiary);">عضویی نیست</div>') + '</div>';
    html += `<div class="panel-section"><div class="panel-section-title">معاملات (${toPersianDigits(dl.length)})</div>` +
        (dl.length ? dl.map(d => `<div class="backlink-item">💰 ${d.title} — ${fmtMoney(d.value)}</div>`).join('') : '<div style="font-size:12px;color:var(--text-tertiary);">معامله‌ای نیست</div>') + '</div>';
    document.getElementById('panelBody').innerHTML = html;
    document.getElementById('panelActions').innerHTML = `<button class="btn btn-secondary" onclick="openCompanyModal('${cid}')">ویرایش</button>`;
    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('slidePanel').classList.add('active');
}

// Load companies + link person->company in modal
const origLoadC = window.loadAllData;
window.loadAllData = async function() {
    await origLoadC();
    try { const r = await api('companies'); currentData.companies = Array.isArray(r) ? r : []; } catch (e) { currentData.companies = []; }
    if (currentView === 'companies') renderCompanies();
};
const origSwitchC = window.switchView;
window.switchView = function(v) { origSwitchC(v); if (v === 'companies') setTimeout(renderCompanies, 100); };

// Inject company select into people modal
const origOpenModalC = window.openModal;
window.openModal = function(type) {
    origOpenModalC(type);
    if (type === 'people') {
        setTimeout(() => {
            const b = document.getElementById('modalBody');
            if (!b || b.querySelector('[name="companyId"]')) return;
            const opts = (currentData.companies || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            b.insertAdjacentHTML('beforeend', `<div class="form-field"><label class="form-label">شرکت</label><select class="form-select" name="companyId"><option value="">—</option>${opts}</select></div>`);
        }, 100);
    }
};
const origPeopleSubmit = modalForms.people.submit;
modalForms.people.submit = async function(d) {
    const sel = document.querySelector('[name="companyId"]');
    if (sel) { d.companyId = sel.value; const c = (currentData.companies || []).find(x => x.id === sel.value); if (c) d.company = c.name; }
    await origPeopleSubmit(d);
};

// ===== TAGS / SEGMENTS =====
let activeSegmentTag = null;

function allTags() {
    const set = new Set();
    ['people', 'tasks', 'notes', 'ideas'].forEach(e => (currentData[e] || []).forEach(x => (x.tags || []).forEach(t => set.add(t))));
    return Array.from(set);
}

function injectSegmentBar() {
    const pv = document.getElementById('view-people');
    if (!pv || document.getElementById('segmentBar')) return;
    const bar = document.createElement('div');
    bar.id = 'segmentBar';
    bar.className = 'segment-bar';
    bar.innerHTML = '<span style="font-size:12px;color:var(--text-tertiary);">🏷️ سگمنت:</span><select class="form-select segment-select" onchange="setSegment(this.value)"><option value="">همه</option>' + allTags().map(t => `<option ${activeSegmentTag === t ? 'selected' : ''}>${t}</option>`).join('') + '</select>';
    const ph = pv.querySelector('.page-header');
    ph.insertAdjacentElement('afterend', bar);
}

function setSegment(tag) { activeSegmentTag = tag || null; renderPeople(); }

const origRenderPeopleT = window.renderPeople;
window.renderPeople = function() {
    const origList = currentData.people;
    if (activeSegmentTag) currentData.people = origList.filter(p => (p.tags || []).includes(activeSegmentTag));
    origRenderPeopleT();
    currentData.people = origList;
    injectSegmentBar();
};

// Tag editor in person panel
const origOpenPersonT = window.openPersonPanel;
window.openPersonPanel = function(id) {
    origOpenPersonT(id);
    setTimeout(() => {
        const p = (currentData.people || []).find(x => x.id === id);
        const body = document.getElementById('panelBody');
        if (!p || !body || body.querySelector('#tagEditor')) return;
        const sec = document.createElement('div');
        sec.className = 'panel-section';
        sec.id = 'tagEditor';
        sec.innerHTML = '<div class="panel-section-title">🏷️ تگ‌ها</div><div class="tags-row" id="personTags"></div><div style="display:flex;gap:6px;margin-top:8px;"><input class="form-input" id="newTagInput" placeholder="تگ جدید..." style="flex:1;"/><button class="btn btn-secondary" onclick="addPersonTag(\'' + id + '\')">+</button></div>';
        body.appendChild(sec);
        renderPersonTags(id);
    }, 150);
};

function renderPersonTags(id) {
    const p = (currentData.people || []).find(x => x.id === id);
    const el = document.getElementById('personTags');
    if (!p || !el) return;
    el.innerHTML = (p.tags || []).map(t => `<span class="tag-chip" onclick="removePersonTag('${id}','${t}')">${t} <span class="tag-x">×</span></span>`).join('') || '<span style="font-size:11px;color:var(--text-tertiary);">تگی نیست</span>';
}

async function addPersonTag(id) {
    const inp = document.getElementById('newTagInput');
    const tag = inp.value.trim();
    if (!tag) return;
    const p = (currentData.people || []).find(x => x.id === id);
    const tags = (p.tags || []).slice(); if (!tags.includes(tag)) tags.push(tag);
    await api('people/' + id, 'PUT', { tags: tags });
    inp.value = '';
    await loadAllData(); openPersonPanel(id);
}

async function removePersonTag(id, tag) {
    const p = (currentData.people || []).find(x => x.id === id);
    await api('people/' + id, 'PUT', { tags: (p.tags || []).filter(t => t !== tag) });
    await loadAllData(); openPersonPanel(id);
}

setTimeout(() => { document.querySelectorAll('.nav-link').forEach(l => { if (l.dataset.view === 'companies') { const s = l.querySelector('.nav-icon'); if (s && typeof icon === 'function') s.innerHTML = icon('building', 16); } }); }, 400);
console.log('[Companies+Tags] loaded');