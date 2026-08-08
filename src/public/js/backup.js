// ===== BACKUP MODULE =====
async function loadBackups() {
    const l = document.getElementById('backupList');
    if (!l) return;
    l.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
    try {
        const r = await api('backups');
        const backups = Array.isArray(r) ? r : [];
        if (!backups.length) { l.innerHTML = '<div class="empty-state"><div class="empty-title">نسخه پشتیبانی وجود ندارد</div><div class="empty-desc">اولین نسخه پشتیبان خود را ایجاد کنید</div></div>'; return; }
        l.innerHTML = backups.map(b => {
            const kb = (b.size / 1024).toFixed(1);
            const dt = new Date(b.createdAt).toLocaleString('fa-IR');
            return '<div class="backup-item"><div class="backup-icon">📦</div><div class="backup-info"><div class="backup-name">' + b.name.replace('.zip', '') + '</div><div class="backup-meta"><span>📅 ' + dt + '</span><span>💾 ' + kb + ' KB</span></div></div><div class="backup-actions"><button class="btn btn-secondary" onclick="restoreBackup(\'' + b.name + '\')">بازیابی</button><button class="btn btn-ghost" style="color:var(--danger);" onclick="deleteBackup(\'' + b.name + '\')">حذف</button></div></div>';
        }).join('');
    } catch (e) { l.innerHTML = '<div class="empty-state"><div class="empty-title">خطا در بارگذاری</div></div>'; }
}

async function createBackup() {
    const name = prompt('نام پشتیبان (اختیاری):', '');
    if (name === null) return;
    try {
        toast('در حال ایجاد پشتیبان...', 'info');
        const r = await api('backups', 'POST', { name: name || '' });
        if (r.success) { toast('پشتیبان ایجاد شد', 'success'); loadBackups(); }
        else toast('خطا: ' + (r.error || 'نامشخص'), 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

async function restoreBackup(name) {
    if (!confirm('آیا از بازیابی "' + name + '" مطمئن هستید؟\nداده‌های فعلی جایگزین می‌شوند.')) return;
    try {
        toast('در حال بازیابی...', 'info');
        const r = await api('backups/' + encodeURIComponent(name) + '/restore', 'POST');
        if (r.success) { toast('بازیابی شد! در حال بارگذاری...', 'success'); setTimeout(() => loadAllData(), 1000); setTimeout(() => loadBackups(), 1500); }
        else toast('خطا: ' + (r.error || 'نامشخص'), 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

async function deleteBackup(name) {
    if (!confirm('آیا از حذف "' + name + '" مطمئن هستید؟')) return;
    try {
        const r = await api('backups/' + encodeURIComponent(name), 'DELETE');
        if (r.success) { toast('حذف شد', 'success'); loadBackups(); }
        else toast('خطا در حذف', 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

async function loadExportGrid() {
    const g = document.getElementById('exportGrid');
    if (!g) return;
    const ents = [
        { name: 'people', label: 'مخاطبان', color: '#7c3aed' },
        { name: 'tasks', label: 'کارها', color: '#3b82f6' },
        { name: 'ideas', label: 'ایده‌ها', color: '#f59e0b' },
        { name: 'notes', label: 'یادداشت‌ها', color: '#10b981' },
        { name: 'projects', label: 'پروژه‌ها', color: '#ec4899' },
        { name: 'activity_logs', label: 'فعالیت‌ها', color: '#8b5cf6' }
    ];
    g.innerHTML = ents.map(e => {
        const c = currentData[e.name] ? currentData[e.name].length : 0;
        return '<div class="export-card"><div class="export-card-header"><div class="export-card-icon" style="background:' + e.color + '22;color:' + e.color + ';">📄</div><div><div class="export-card-title">' + e.label + '</div><div class="export-card-count">' + c + ' مورد</div></div></div><div class="export-card-actions"><button class="btn btn-secondary" onclick="exportEntity(\'' + e.name + '\')">📥 خروجی</button><button class="btn btn-secondary" onclick="openImportModal(\'' + e.name + '\')">📤 ورودی</button></div></div>';
    }).join('');
}

async function exportEntity(ent) {
    try {
        const r = await api('export/' + ent);
        if (r.success) {
            const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = ent + '_' + new Date().toISOString().split('T')[0] + '.json';
            a.click(); URL.revokeObjectURL(url);
            toast(r.count + ' مورد صادر شد', 'success');
        } else toast('خطا در خروجی', 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

let currentImportEntity = null, currentImportData = null, currentImportMode = 'append';

function openImportModal(ent) {
    currentImportEntity = ent; currentImportData = null; currentImportMode = 'append';
    document.getElementById('modalTitle').textContent = 'ورودی داده به ' + ent;
    document.getElementById('modalBody').innerHTML = '<div class="import-dropzone" id="importDropzone" onclick="document.getElementById(\'importFileInput\').click()"><div class="import-dropzone-icon">📤</div><div class="import-dropzone-text">فایل JSON را رها کنید یا کلیک کنید</div><input type="file" id="importFileInput" accept=".json" style="display:none;" onchange="handleImportFile(event)"/></div><div id="importPreview" style="display:none;"></div><div style="margin-top:12px;"><div class="form-label">حالت ورودی:</div><div class="import-options"><div class="import-option active" onclick="setImportMode(\'append\',this)"><div class="import-option-title">افزودن</div></div><div class="import-option" onclick="setImportMode(\'replace\',this)"><div class="import-option-title">جایگزینی</div></div></div></div>';
    const dz = document.getElementById('importDropzone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); if (e.dataTransfer.files[0]) processImportFile(e.dataTransfer.files[0]); });
    document.getElementById('modalSubmit').onclick = submitImport;
    document.getElementById('modalOverlay').classList.add('active');
}

function setImportMode(m, el) {
    currentImportMode = m;
    document.querySelectorAll('.import-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
}

function handleImportFile(e) { if (e.target.files[0]) processImportFile(e.target.files[0]); }

function processImportFile(f) {
    const r = new FileReader();
    r.onload = e => {
        try {
            const d = JSON.parse(e.target.result);
            if (!Array.isArray(d)) { toast('فایل باید آرایه JSON باشد', 'error'); return; }
            currentImportData = d;
            document.getElementById('importDropzone').innerHTML = '<div class="import-dropzone-icon" style="color:var(--success);">✓</div><div class="import-dropzone-text">فایل "' + f.name + '" بارگذاری شد</div><div class="import-dropzone-hint">' + d.length + ' مورد</div>';
            document.getElementById('importPreview').style.display = 'block';
            document.getElementById('importPreview').innerHTML = '<div style="padding:10px;background:var(--bg-surface-2);border-radius:var(--radius-sm);font-size:12px;color:var(--success);">✓ فایل معتبر - ' + d.length + ' آیتم</div>';
        } catch (err) { toast('فایل JSON نامعتبر', 'error'); }
    };
    r.readAsText(f);
}

async function submitImport() {
    if (!currentImportData) { toast('ابتدا یک فایل انتخاب کنید', 'error'); return; }
    try {
        toast('در حال ورودی...', 'info');
        const r = await api('import/' + currentImportEntity, 'POST', { data: currentImportData, mode: currentImportMode });
        if (r.success) { toast(r.imported + ' مورد وارد شد', 'success'); closeModal(); await loadAllData(); loadExportGrid(); }
        else toast('خطا: ' + (r.error || 'نامشخص'), 'error');
    } catch (e) { toast('خطا: ' + e.message, 'error'); }
}

// ===== SETTINGS TABS =====
function setupSettingsTabs() {
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.onclick = () => {
            const tab = item.dataset.tab;
            document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.settings-tab').forEach(t => { t.style.display = t.dataset.tab === tab ? 'block' : 'none'; });
        };
    });
}

// ===== ATTACHMENTS =====
async function renderAttachmentsSection(et, eid, container) {
    if (!container) return;
    try {
        const r = await api('attachments/' + et + '/' + eid);
        const atts = Array.isArray(r) ? r : [];
        const imgs = atts.filter(a => a.mimeType && a.mimeType.startsWith('image/'));
        const files = atts.filter(a => !a.mimeType || !a.mimeType.startsWith('image/'));
        container.innerHTML = '<div class="attachments-section"><div class="attachments-header"><div class="attachments-title">📎 پیوست‌ها (' + atts.length + ')</div></div><div class="attachments-grid">' +
            imgs.map(a => '<div class="attachment-item" onclick="openAttachment(\'' + a.fileName + '\')"><img src="/api/attachment/' + a.fileName + '" alt=""/><button class="attachment-delete" onclick="event.stopPropagation(); deleteAttachment(\'' + a.id + '\',\'' + et + '\',\'' + eid + '\')">×</button></div>').join('') +
            files.map(a => '<div class="attachment-item" onclick="openAttachment(\'' + a.fileName + '\')" title="' + a.originalName + '"><div class="file-icon">📄</div><button class="attachment-delete" onclick="event.stopPropagation(); deleteAttachment(\'' + a.id + '\',\'' + et + '\',\'' + eid + '\')">×</button></div>').join('') +
            '<label class="upload-btn">➕<span>افزودن</span><input type="file" style="display:none;" onchange="uploadAttachment(event,\'' + et + '\',\'' + eid + '\')" multiple/></label></div></div>';
    } catch (e) { container.innerHTML = ''; }
}

function openAttachment(fn) { window.open('/api/attachment/' + fn, '_blank'); }

async function uploadAttachment(e, et, eid) {
    const files = e.target.files;
    if (!files.length) return;
    for (const f of files) {
        const r = new FileReader();
        r.onload = async ev => {
            const b64 = ev.target.result.split(',')[1];
            try {
                toast('در حال آپلود ' + f.name + '...', 'info');
                const res = await api('upload', 'POST', { entityType: et, entityId: eid, fileName: f.name, fileData: b64, mimeType: f.type });
                if (res.id) { toast(f.name + ' آپلود شد', 'success'); const c = document.getElementById('attachmentsContainer'); if (c) renderAttachmentsSection(et, eid, c); }
            } catch (err) { toast('خطا در آپلود', 'error'); }
        };
        r.readAsDataURL(f);
    }
}

async function deleteAttachment(aid, et, eid) {
    if (!confirm('حذف این پیوست؟')) return;
    try {
        const r = await api('attachment/' + aid, 'DELETE');
        if (r.success) { toast('پیوست حذف شد', 'success'); const c = document.getElementById('attachmentsContainer'); if (c) renderAttachmentsSection(et, eid, c); }
    } catch (e) { toast('خطا', 'error'); }
}

console.log('[Backup] Module loaded');