// ===== PROJECTS PRO MODULE (Phase 30) =====

function projectTasks(pid) { return (currentData.tasks || []).filter(t => t.projectId === pid); }

function projectProgress(pid) {
    const t = projectTasks(pid);
    if (!t.length) return 0;
    return Math.round((t.filter(x => x.status === 'done').length / t.length) * 100);
}

// Make project cards clickable + show progress
const origRenderProjects = window.renderProjects;
window.renderProjects = function() {
    origRenderProjects();
    const cards = document.querySelectorAll('#projectsGrid .note-card');
    (currentData.projects || []).forEach((p, i) => {
        const card = cards[i];
        if (!card) return;
        card.classList.add('project-card');
        card.onclick = () => openProjectPanel(p.id);
        const prog = projectProgress(p.id);
        if (!card.querySelector('.proj-progress-wrap')) {
            card.insertAdjacentHTML('beforeend', `<div class="proj-progress-wrap"><div class="proj-progress-bar"><div class="proj-progress-fill" style="width:${prog}%"></div></div><div class="proj-progress-label"><span>پیشرفت</span><span>${toPersianDigits(prog)}%</span></div></div>`);
        }
    });
};

function openProjectPanel(pid) {
    const p = (currentData.projects || []).find(x => x.id === pid);
    if (!p) return;
    const tasks = projectTasks(pid);
    const prog = projectProgress(pid);
    
    document.getElementById('panelTitle').textContent = '🚀 ' + p.name;
    let html = `<div class="panel-section"><div class="panel-section-title">پیشرفت</div>
        <div class="proj-progress-wrap"><div class="proj-progress-bar"><div class="proj-progress-fill" style="width:${prog}%"></div></div>
        <div class="proj-progress-label"><span>${toPersianDigits(tasks.filter(t=>t.status==='done').length)} از ${toPersianDigits(tasks.length)} کار</span><span>${toPersianDigits(prog)}%</span></div></div></div>`;
    
    html += `<div class="panel-section"><div class="panel-section-title">کارها (${toPersianDigits(tasks.length)})</div>`;
    html += tasks.length ? tasks.map(t => `
        <div class="proj-task-item ${t.status==='done'?'done':''}" onclick="toggleProjectTask('${t.id}')">
            <div class="proj-task-check">${t.status==='done'?'✓':''}</div>
            <div class="proj-task-title">${t.title}</div>
        </div>`).join('') : '<div style="font-size:12px;color:var(--text-tertiary);">کاری نیست</div>';
    html += `<button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:8px;" onclick="addTaskToProject('${pid}')">+ افزودن کار به پروژه</button></div>`;
    
    if (p.description) html += `<div class="panel-section"><div class="panel-section-title">توضیحات</div><div style="font-size:13px;color:var(--text-secondary);">${p.description}</div></div>`;
    
    document.getElementById('panelBody').innerHTML = html;
    document.getElementById('panelActions').innerHTML = `<button class="btn btn-secondary" onclick="editProject('${pid}')">ویرایش</button>`;
    document.getElementById('panelOverlay').classList.add('active');
    document.getElementById('slidePanel').classList.add('active');
}

async function toggleProjectTask(tid) {
    const t = (currentData.tasks || []).find(x => x.id === tid);
    if (!t) return;
    const ns = t.status === 'done' ? 'pending' : 'done';
    await api('tasks/' + tid, 'PUT', { status: ns });
    if (typeof addKarma === 'function' && ns === 'done') addKarma(10);
    await loadAllData();
    openProjectPanel(t.projectId);
}

let pendingProjectId = null;
function addTaskToProject(pid) {
    pendingProjectId = pid;
    closePanel();
    openModal('tasks');
}

function editProject(pid) {
    const p = (currentData.projects || []).find(x => x.id === pid);
    document.getElementById('modalTitle').textContent = 'ویرایش پروژه';
    const b = document.getElementById('modalBody');
    b.innerHTML = `<div class="form-field"><label class="form-label">نام *</label><input class="form-input" name="name" value="${p.name}"/></div><div class="form-field"><label class="form-label">توضیحات</label><textarea class="form-textarea" name="description">${p.description || ''}</textarea></div>`;
    currentModalType = 'projects';
    document.getElementById('modalSubmit').onclick = async () => {
        const data = {}; b.querySelectorAll('[name]').forEach(i => data[i.name] = i.value);
        await api('projects/' + pid, 'PUT', data);
        toast('ذخیره شد', 'success'); closeModal(); await loadAllData();
    };
    document.getElementById('modalOverlay').classList.add('active');
}

// Add project select to task modal (create + edit)
const origOpenModalP = window.openModal;
window.openModal = function(type) {
    origOpenModalP(type);
    if (type === 'tasks') {
        setTimeout(() => {
            const b = document.getElementById('modalBody');
            if (!b || b.querySelector('[name="projectId"]')) return;
            const opts = (currentData.projects || []).map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            b.insertAdjacentHTML('beforeend', `<div class="form-field"><label class="form-label">پروژه</label><select class="form-select" name="projectId"><option value="">—</option>${opts}</select></div>`);
            if (pendingProjectId) { b.querySelector('[name="projectId"]').value = pendingProjectId; pendingProjectId = null; }
        }, 100);
    }
};
const origTaskSubmitP = modalForms.tasks.submit;
modalForms.tasks.submit = async function(d) {
    const sel = document.querySelector('[name="projectId"]');
    if (sel) d.projectId = sel.value;
    await origTaskSubmitP(d);
};

// ===== SUBTASKS (in edit modal) =====
const origEditTask = window.openEditTaskModal;
window.openEditTaskModal = function(task) {
    origEditTask(task);
    setTimeout(() => renderSubtasks(task.id), 120);
};

function renderSubtasks(taskId) {
    const b = document.getElementById('modalBody');
    if (!b) return;
    let sec = b.querySelector('#subtaskSection');
    if (!sec) {
        sec = document.createElement('div');
        sec.id = 'subtaskSection';
        sec.className = 'form-field';
        b.appendChild(sec);
    }
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    const subs = (t && t.subtasks) || [];
    const done = subs.filter(s => s.done).length;
    sec.innerHTML = `<label class="form-label">✅ زیرکارها (${toPersianDigits(done)}/${toPersianDigits(subs.length)})</label>
        <div id="subtaskList">` + subs.map(s => `
            <div class="subtask-item ${s.done?'done':''}">
                <div class="subtask-check" onclick="toggleSubtask('${taskId}','${s.id}')">${s.done?'✓':''}</div>
                <span>${s.title}</span>
                <span class="subtask-del" onclick="delSubtask('${taskId}','${s.id}')">×</span>
            </div>`).join('') + `</div>
        <div style="display:flex;gap:6px;margin-top:8px;"><input class="form-input" id="newSubtask" placeholder="زیرکار جدید..." style="flex:1;"/><button class="btn btn-secondary" onclick="addSubtask('${taskId}')">+</button></div>`;
}

async function addSubtask(taskId) {
    const inp = document.getElementById('newSubtask');
    const title = inp.value.trim();
    if (!title) return;
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    const subs = (t.subtasks || []).slice();
    subs.push({ id: 's' + Date.now(), title: title, done: false });
    await api('tasks/' + taskId, 'PUT', { subtasks: subs });
    await loadAllData();
    renderSubtasks(taskId);
}

async function toggleSubtask(taskId, subId) {
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    const subs = (t.subtasks || []).slice();
    const s = subs.find(x => x.id === subId);
    s.done = !s.done;
    await api('tasks/' + taskId, 'PUT', { subtasks: subs });
    await loadAllData();
    renderSubtasks(taskId);
}

async function delSubtask(taskId, subId) {
    const t = (currentData.tasks || []).find(x => x.id === taskId);
    await api('tasks/' + taskId, 'PUT', { subtasks: (t.subtasks || []).filter(x => x.id !== subId) });
    await loadAllData();
    renderSubtasks(taskId);
}

console.log('[ProjectsPro] Details + subtasks loaded');