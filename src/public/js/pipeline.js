// ===== PIPELINE MODULE (Phase 28) =====
const DEAL_STAGES = [
    { key: 'lead', label: 'سرنخ', color: '#8b5cf6' },
    { key: 'qualified', label: 'واجد شرایط', color: '#3b82f6' },
    { key: 'proposal', label: 'پیشنهاد', color: '#f59e0b' },
    { key: 'won', label: 'برد ✅', color: '#10b981' },
    { key: 'lost', label: 'باخت ❌', color: '#ef4444' }
];

function fmtMoney(v) {
    v = +v || 0;
    if (v >= 1e9) return toPersianDigits((v / 1e9).toFixed(1)) + ' میلیارد';
    if (v >= 1e6) return toPersianDigits((v / 1e6).toFixed(1)) + ' میلیون';
    if (v >= 1e3) return toPersianDigits((v / 1e3).toFixed(0)) + ' هزار';
    return toPersianDigits(v);
}

function renderPipeline() {
    const board = document.getElementById('pipelineBoard');
    const stats = document.getElementById('pipelineStats');
    if (!board) return;
    const deals = currentData.deals || [];
    
    const open = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
    const totalOpen = open.reduce((s, d) => s + (+d.value || 0), 0);
    const weighted = open.reduce((s, d) => s + (+d.value || 0) * ((+d.probability || 0) / 100), 0);
    const won = deals.filter(d => d.stage === 'won').reduce((s, d) => s + (+d.value || 0), 0);
    
    stats.innerHTML = `
        <div class="pipe-stat"><div class="pipe-stat-label">ارزش باز Pipeline</div><div class="pipe-stat-value money">${fmtMoney(totalOpen)}</div></div>
        <div class="pipe-stat"><div class="pipe-stat-label">پیش‌بینی وزن‌دار</div><div class="pipe-stat-value">${fmtMoney(weighted)}</div></div>
        <div class="pipe-stat"><div class="pipe-stat-label">معاملات باز</div><div class="pipe-stat-value">${toPersianDigits(open.length)}</div></div>
        <div class="pipe-stat"><div class="pipe-stat-label">برد شده</div><div class="pipe-stat-value money">${fmtMoney(won)}</div></div>
    `;
    
    board.innerHTML = DEAL_STAGES.map(st => {
        const col = deals.filter(d => (d.stage || 'lead') === st.key);
        const sum = col.reduce((s, d) => s + (+d.value || 0), 0);
        return `<div class="pipe-col" style="--col-color:${st.color}" data-stage="${st.key}"
                    ondragover="event.preventDefault(); this.classList.add('drag-over')"
                    ondragleave="this.classList.remove('drag-over')"
                    ondrop="dropDeal(event, '${st.key}'); this.classList.remove('drag-over')">
            <div class="pipe-col-header">
                <div class="pipe-col-title"><span class="pipe-col-dot"></span>${st.label}</div>
                <div class="pipe-col-sum">${fmtMoney(sum)}</div>
            </div>
            ${col.map(d => dealCard(d)).join('') || '<div style="text-align:center;color:var(--text-disabled);font-size:11px;padding:20px 0;">خالی</div>'}
        </div>`;
    }).join('');
}

function dealCard(d) {
    const person = (currentData.people || []).find(p => p.id === d.personId);
    const initials = person ? person.name.split(' ').map(w => w[0]).join('').slice(0, 2) : '';
    return `<div class="deal-card" draggable="true" ondragstart="dragDeal(event,'${d.id}')" onclick="openDealModal('${d.id}')">
        <div class="deal-title">${d.title}</div>
        <div class="deal-value">${fmtMoney(d.value)}</div>
        <div class="deal-meta">
            <span class="deal-prob">${toPersianDigits(d.probability || 0)}%</span>
            <span>${d.closeDate ? new Date(d.closeDate).toLocaleDateString('fa-IR') : ''}</span>
        </div>
        ${person ? `<div class="deal-person"><span class="deal-person-avatar">${initials}</span>${person.name}</div>` : ''}
    </div>`;
}

let dragDealId = null;
function dragDeal(e, id) { dragDealId = id; e.dataTransfer.effectAllowed = 'move'; }

async function dropDeal(e, stage) {
    e.preventDefault();
    if (!dragDealId) return;
    try {
        await api('deals/' + dragDealId, 'PUT', { stage: stage });
        if (typeof addActivity === 'function') {} 
        toast('💰 معامله به «' + DEAL_STAGES.find(s => s.key === stage).label + '» منتقل شد', 'success');
        dragDealId = null;
        await loadAllData();
    } catch (err) { toast('خطا', 'error'); }
}

function openDealModal(id) {
    const deal = id ? (currentData.deals || []).find(d => d.id === id) : null;
    currentModalType = 'deals';
    document.getElementById('modalTitle').textContent = deal ? 'ویرایش معامله' : 'معامله جدید';
    const b = document.getElementById('modalBody');
    const peopleOpts = (currentData.people || []).map(p => `<option value="${p.id}" ${deal && deal.personId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
    const stageOpts = DEAL_STAGES.map(s => `<option value="${s.key}" ${deal && deal.stage === s.key ? 'selected' : ''}>${s.label}</option>`).join('');
    b.innerHTML = `
        <div class="form-field"><label class="form-label">عنوان *</label><input class="form-input" name="title" value="${deal ? deal.title : ''}"/></div>
        <div class="form-field"><label class="form-label">ارزش (تومان)</label><input class="form-input" type="number" name="value" value="${deal ? deal.value : ''}"/></div>
        <div class="form-field"><label class="form-label">مرحله</label><select class="form-select" name="stage">${stageOpts}</select></div>
        <div class="form-field"><label class="form-label">احتمال برد (%)</label><input class="form-input" type="number" min="0" max="100" name="probability" value="${deal ? deal.probability : 50}"/></div>
        <div class="form-field"><label class="form-label">مخاطب</label><select class="form-select" name="personId"><option value="">—</option>${peopleOpts}</select></div>
        <div class="form-field"><label class="form-label">تاریخ بسته‌شدن</label><input class="form-input" type="date" name="closeDate" value="${deal && deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : ''}"/></div>
        <div class="form-field"><label class="form-label">یادداشت</label><textarea class="form-textarea" name="notes">${deal ? (deal.notes || '') : ''}</textarea></div>
    `;
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {};
        b.querySelectorAll('[name]').forEach(i => data[i.name] = i.value);
        if (!data.title) { toast('عنوان الزامی است', 'error'); return; }
        data.value = +data.value || 0; data.probability = +data.probability || 0;
        if (data.closeDate) data.closeDate = new Date(data.closeDate).toISOString();
        try {
            if (deal) await api('deals/' + deal.id, 'PUT', data);
            else await api('deals', 'POST', data);
            toast('💰 ذخیره شد', 'success');
            closeModal();
            await loadAllData();
        } catch (e) { toast('خطا: ' + e.message, 'error'); }
    };
    document.getElementById('modalOverlay').classList.add('active');
}

// Load deals into currentData
const origLoadP = window.loadAllData;
window.loadAllData = async function() {
    await origLoadP();
    try { const r = await api('deals'); currentData.deals = Array.isArray(r) ? r : []; } catch (e) { currentData.deals = []; }
    if (currentView === 'pipeline') renderPipeline();
};

// Hook render + nav icon
const origSwitchP = window.switchView;
window.switchView = function(v) {
    origSwitchP(v);
    if (v === 'pipeline') setTimeout(renderPipeline, 100);
};

setTimeout(() => {
    document.querySelectorAll('.nav-link').forEach(l => {
        if (l.dataset.view === 'pipeline') {
            const s = l.querySelector('.nav-icon');
            if (s && typeof icon === 'function') s.innerHTML = icon('rocket', 16);
        }
    });
}, 400);

console.log('[Pipeline] Sales pipeline loaded');