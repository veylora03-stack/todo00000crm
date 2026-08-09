// CRM PRO KNOWLEDGE BUNDLE (auto) 2026-08-10 02:09

/* === graph.js === */
// ===== KNOWLEDGE LINKS - SIMPLE VERSION (Phase 12 v2) =====
// No syntax needed! Just click to connect.

function allKnowledgeItems() {
    const notes = (currentData.notes || []).map(n => ({ id: n.id, ktype: 'note', title: n.title || '', content: n.content || '', raw: n }));
    const ideas = (currentData.ideas || []).map(i => ({ id: i.id, ktype: 'idea', title: i.title || '', content: i.description || '', raw: i }));
    return notes.concat(ideas);
}

function knowledgeItem(id) { return allKnowledgeItems().find(x => x.id === id); }

function getBacklinks(item) {
    return allKnowledgeItems().filter(o => o.id !== item.id && (o.raw.links || []).includes(item.id));
}

// ===== LINK PICKER IN MODAL (click to connect) =====
const origOpenModalL = window.openModal;
window.openModal = function (type) {
    origOpenModalL(type);
    if (type === 'notes' || type === 'ideas') setTimeout(() => injectLinkPicker(null), 120);
};

function injectLinkPicker(currentItem) {
    const mb = document.getElementById('modalBody');
    if (!mb || mb.querySelector('#linkPickerField')) return;
    const others = allKnowledgeItems().filter(x => !currentItem || x.id !== currentItem.id);
    const selected = currentItem ? (currentItem.raw.links || []) : [];
    const field = document.createElement('div');
    field.className = 'form-field';
    field.id = 'linkPickerField';
    field.innerHTML = '<label class="form-label">🔗 اتصال به (اختیاری — روی آیتم کلیک کن)</label><div class="link-picker" id="linkPicker">' +
        (others.length ? others.map(o => '<span class="link-chip' + (selected.includes(o.id) ? ' active' : '') + '" data-id="' + o.id + '" onclick="toggleLinkChip(this)">' + (o.ktype === 'note' ? '📝 ' : '💡 ') + o.title + '</span>').join('') : '<span style="font-size:11px;color:var(--text-tertiary);">آیتم دیگری وجود ندارد</span>') +
        '</div>';
    mb.appendChild(field);
}

function toggleLinkChip(el) { el.classList.toggle('active'); }

function readSelectedLinks() {
    const p = document.getElementById('linkPicker');
    if (!p) return [];
    return Array.from(p.querySelectorAll('.link-chip.active')).map(c => c.dataset.id);
}

// Save links on create
['notes', 'ideas'].forEach(t => {
    const orig = modalForms[t].submit;
    modalForms[t].submit = async d => { d.links = readSelectedLinks(); await orig(d); };
});

// ===== CONNECTION CHIPS ON CARDS =====
function decorateCard(card, item) {
    if (!card || card.dataset.decorated) return;
    card.dataset.decorated = '1';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openKnowledgePanel(item.id));
    const outs = (item.links || []).map(knowledgeItem).filter(Boolean);
    const backs = getBacklinks(item);
    if (outs.length || backs.length) {
        const row = document.createElement('div');
        row.className = 'conn-row';
        row.innerHTML = outs.map(l => '<span class="conn-chip" data-id="' + l.id + '">→ ' + (l.ktype === 'note' ? '📝' : '💡') + ' ' + l.title + '</span>').join('') +
            backs.map(b => '<span class="conn-chip back" data-id="' + b.id + '">← ' + (b.ktype === 'note' ? '📝' : '💡') + ' ' + b.title + '</span>').join('');
        card.appendChild(row);
        row.querySelectorAll('.conn-chip').forEach(ch => ch.addEventListener('click', e => { e.stopPropagation(); openKnowledgePanel(ch.dataset.id); }));
    }
}

function decorateCards() {
    const nc = document.querySelectorAll('#notesGrid .note-card');
    currentData.notes.forEach((n, i) => decorateCard(nc[i], n));
    const ic = document.querySelectorAll('#ideasGrid .note-card');
    currentData.ideas.forEach((it, i) => decorateCard(ic[i], it));
}

const origRenderNotesL = window.renderNotes;
window.renderNotes = function () { origRenderNotesL(); decorateCards(); };
const origRenderIdeasL = window.renderIdeas;
window.renderIdeas = function () { origRenderIdeasL(); decorateCards(); };

// ===== PANEL (simple) =====
function openKnowledgePanel(id) {
    const item = knowledgeItem(id);
    if (!item) return;
    const outs = (item.raw.links || []).map(knowledgeItem).filter(Boolean);
    const backs = getBacklinks(item);
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';

    document.getElementById('panelTitle').textContent = (item.ktype === 'note' ? '📝 ' : '💡 ') + item.title;

    let html = '<div class="panel-section"><div class="panel-section-title">محتوا</div><div class="knowledge-content">' + (item.content || '<span style="color:var(--text-tertiary);">خالی</span>') + '</div></div>';

    html += '<div class="panel-section"><div class="panel-section-title">🔗 متصل به (' + toPersianDigits(outs.length) + ')</div>' +
        (outs.length ? outs.map(o => '<div class="backlink-item" onclick="openKnowledgePanel(\'' + o.id + '\')">' + (o.ktype === 'note' ? '📝' : '💡') + ' ' + o.title + '</div>').join('') : '<div style="font-size:12px;color:var(--text-tertiary);">به چیزی متصل نیست — با دکمه ویرایش اتصال بده</div>') + '</div>';

    html += '<div class="panel-section"><div class="panel-section-title">🔙 اشاره کرده‌اند (' + toPersianDigits(backs.length) + ')</div>' +
        (backs.length ? backs.map(b => '<div class="backlink-item" onclick="openKnowledgePanel(\'' + b.id + '\')">' + (b.ktype === 'note' ? '📝' : '💡') + ' ' + b.title + '</div>').join('') : '<div style="font-size:12px;color:var(--text-tertiary);">هیچ‌کس</div>') + '</div>';

    document.getElementById('panelBody').innerHTML = html;
    document.getElementById('panelActions').innerHTML = '<button class="btn btn-secondary" onclick="openEditKnowledgeModal(\'' + id + '\')">' + mk('edit', 14) + ' ویرایش و اتصال</button><button class="btn btn-ghost" style="color:var(--danger);" onclick="confirmDelete(\'' + item.ktype + '\',\'' + id + '\')">' + mk('trash', 14) + ' حذف</button>';
    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('slidePanel').classList.add('active');
}

function openEditKnowledgeModal(id) {
    const item = knowledgeItem(id);
    if (!item) return;
    document.getElementById('modalTitle').textContent = 'ویرایش ' + (item.ktype === 'note' ? 'یادداشت' : 'ایده');
    const b = document.getElementById('modalBody');
    b.innerHTML = '<div class="form-field"><label class="form-label">عنوان *</label><input class="form-input" name="title" value="' + item.title + '"/></div><div class="form-field"><label class="form-label">محتوا</label><textarea class="form-textarea" name="content" rows="5">' + item.content + '</textarea></div>';
    setTimeout(() => injectLinkPicker(item), 50);
    document.getElementById('modalSubmit').onclick = async () => {
        const data = { title: b.querySelector('[name="title"]').value, links: readSelectedLinks() };
        if (item.ktype === 'note') data.content = b.querySelector('[name="content"]').value;
        else data.description = b.querySelector('[name="content"]').value;
        if (!data.title) { toast('عنوان الزامی است', 'error'); return; }
        try { await api((item.ktype === 'note' ? 'notes/' : 'ideas/') + id, 'PUT', data); toast('ذخیره شد', 'success'); closeModal(); await loadAllData(); openKnowledgePanel(id); } catch (e) { toast('خطا', 'error'); }
    };
    document.getElementById('modalOverlay').classList.add('active');
}

// ===== GRAPH (auto from clicks) =====
let graphAnim = null;

function renderGraphView() {
    const container = document.getElementById('graphContainer');
    if (!container) return;
    if (graphAnim) { cancelAnimationFrame(graphAnim); graphAnim = null; }

    const items = allKnowledgeItems();
    if (!items.length) {
        container.innerHTML = '<div class="empty-state" style="padding:80px 20px;"><div class="empty-title">🕸️ هنوز گرافی نیست</div><div class="empty-desc">یک یادداشت بساز و با «🔗 اتصال به» آن را به بقیه وصل کن!</div></div>';
        return;
    }

    const W = container.clientWidth || 900, H = container.clientHeight || 560;
    const nodes = items.map(it => ({ id: it.id, title: it.title, ktype: it.ktype, x: W / 2 + (Math.random() - 0.5) * 400, y: H / 2 + (Math.random() - 0.5) * 300, vx: 0, vy: 0, fx: null, fy: null }));
    const nodeById = {}; nodes.forEach(n => nodeById[n.id] = n);
    const edges = []; const seen = new Set();
    items.forEach(it => (it.raw.links || []).forEach(t => {
        if (nodeById[t]) { const k = [it.id, t].sort().join('|'); if (!seen.has(k)) { seen.add(k); edges.push([it.id, t]); } }
    }));

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    const edgeEls = edges.map(() => { const l = document.createElementNS(svgNS, 'line'); l.setAttribute('class', 'graph-edge'); svg.appendChild(l); return l; });
    const nodeEls = nodes.map(n => {
        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('class', 'graph-node');
        const c = document.createElementNS(svgNS, 'circle');
        const deg = edges.filter(e => e[0] === n.id || e[1] === n.id).length;
        c.setAttribute('r', 8 + Math.min(10, deg * 2));
        c.setAttribute('fill', n.ktype === 'note' ? '#3b82f6' : '#f59e0b');
        c.setAttribute('stroke', '#0a0a0b');
        c.setAttribute('stroke-width', '2');
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('class', 'graph-label');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dy', -14);
        t.textContent = n.title.length > 18 ? n.title.slice(0, 18) + '…' : n.title;
        g.appendChild(c); g.appendChild(t);
        svg.appendChild(g);

        let downX = 0, downY = 0, moved = false;
        g.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; moved = false; n.fx = n.x; n.fy = n.y; });
        g.addEventListener('pointermove', e => {
            if (n.fx === null) return;
            if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) moved = true;
            const rect = svg.getBoundingClientRect();
            n.fx = e.clientX - rect.left; n.fy = e.clientY - rect.top;
        });
        g.addEventListener('pointerup', () => { n.fx = null; n.fy = null; if (!moved) openKnowledgePanel(n.id); });
        return g;
    });

    container.innerHTML = '';
    container.appendChild(svg);
    const legend = document.createElement('div');
    legend.className = 'graph-legend';
    legend.innerHTML = '<div class="graph-legend-item"><div class="graph-legend-dot" style="background:#3b82f6;"></div>یادداشت</div><div class="graph-legend-item"><div class="graph-legend-dot" style="background:#f59e0b;"></div>ایده</div>';
    container.appendChild(legend);
    const hint = document.createElement('div');
    hint.className = 'graph-hint';
    hint.textContent = '🖱️ بکش • کلیک = باز کردن';
    container.appendChild(hint);

    let alpha = 1;
    function tick() {
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            const d2 = dx * dx + dy * dy || 1;
            const f = 2200 / d2; const d = Math.sqrt(d2);
            dx /= d; dy /= d;
            a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
        }
        edges.forEach(([s, t]) => {
            const a = nodeById[s], b = nodeById[t];
            let dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const f = (d - 120) * 0.02;
            dx /= d; dy /= d;
            a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
        });
        nodes.forEach(n => {
            n.vx += (W / 2 - n.x) * 0.002; n.vy += (H / 2 - n.y) * 0.002;
            n.vx *= 0.85; n.vy *= 0.85;
            if (n.fx !== null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; }
            else { n.x += n.vx * alpha; n.y += n.vy * alpha; }
            n.x = Math.max(30, Math.min(W - 30, n.x));
            n.y = Math.max(30, Math.min(H - 30, n.y));
        });
        edges.forEach(([s, t], i) => {
            edgeEls[i].setAttribute('x1', nodeById[s].x); edgeEls[i].setAttribute('y1', nodeById[s].y);
            edgeEls[i].setAttribute('x2', nodeById[t].x); edgeEls[i].setAttribute('y2', nodeById[t].y);
        });
        nodes.forEach((n, i) => nodeEls[i].setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')'));
        alpha *= 0.995;
        if (alpha > 0.02) graphAnim = requestAnimationFrame(tick);
    }
    tick();
}

const origSwitchViewL = window.switchView;
window.switchView = function (v) { origSwitchViewL(v); if (v === 'graph') setTimeout(renderGraphView, 100); };

setTimeout(() => {
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.view === 'graph') {
            const s = link.querySelector('.nav-icon');
            if (s && typeof icon === 'function') s.innerHTML = icon('sparkle', 16);
        }
    });
}, 400);
