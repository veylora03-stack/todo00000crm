// ===== AUTOMATION RULES ENGINE (Phase 31) =====
function getRulesState() { try { return JSON.parse(localStorage.getItem('crm_rules') || '{}'); } catch (e) { return {}; } }
function setRuleEnabled(id, on) { const s = getRulesState(); s[id] = on; localStorage.setItem('crm_rules', JSON.stringify(s)); }
function ruleEnabled(id) { const s = getRulesState(); return s[id] !== false; } // default on

function firedMap() { try { return JSON.parse(localStorage.getItem('crm_rules_fired') || '{}'); } catch (e) { return {}; } }
function markFired(key, cooldownMs) {
    const f = firedMap(); f[key] = Date.now();
    localStorage.setItem('crm_rules_fired', JSON.stringify(f));
}
function canFire(key, cooldownMs) {
    const f = firedMap();
    return !f[key] || (Date.now() - f[key]) > cooldownMs;
}

const AUTOMATION_RULES = [
    {
        id: 'overdue-notify', name: '⚠️ کار عقب افتاد → اعلان',
        desc: 'وقتی کاری از سررسید گذشت، یادآوری می‌شود',
        run() {
            const now = new Date();
            (currentData.tasks || []).forEach(t => {
                if (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now) {
                    const key = 'ov-' + t.id;
                    if (canFire(key, 24 * 3600 * 1000)) {
                        markFired(key);
                        if (typeof toast === 'function') toast('⚠️ «' + t.title + '» عقب افتاده!', 'error');
                    }
                }
            });
        }
    },
    {
        id: 'deal-won', name: '💰 Deal برد شد → کار تشکر',
        desc: 'به‌طور خودکار یک کار «تشکر» برای مخاطب می‌سازد',
        run() {
            (currentData.deals || []).forEach(d => {
                if (d.stage === 'won') {
                    const key = 'dw-' + d.id;
                    if (canFire(key, 999 * 24 * 3600 * 1000)) {
                        markFired(key);
                        const person = (currentData.people || []).find(p => p.id === d.personId);
                        api('tasks', 'POST', { title: '🙏 تشکر از ' + (person ? person.name : 'مخاطب') + ' — ' + d.title, description: '', dueDate: '', priority: 'medium', status: 'pending', personId: d.personId || '', projectId: '', tags: [] })
                            .then(() => { if (typeof toast === 'function') toast('🤖 اتوماسیون: کار تشکر ساخته شد', 'success'); loadAllData(); });
                    }
                }
            });
        }
    },
    {
        id: 'vip-call', name: '💎 مخاطب VIP → یادآوری هفتگی',
        desc: 'مخاطبان با تگ VIP هر هفته یادآوری تماس',
        run() {
            if (typeof relationshipStats !== 'function') return;
            (currentData.people || []).forEach(p => {
                if ((p.tags || []).includes('VIP')) {
                    const st = relationshipStats(p);
                    if (st.daysSince !== null && st.daysSince >= 7) {
                        const key = 'vip-' + p.id;
                        if (canFire(key, 7 * 24 * 3600 * 1000)) {
                            markFired(key);
                            if (typeof toast === 'function') toast('💎 یادآوری: با «' + p.name + '» (VIP) تماس بگیر', 'info');
                        }
                    }
                }
            });
        }
    }
];

function runAutomations() {
    AUTOMATION_RULES.forEach(r => { if (ruleEnabled(r.id)) { try { r.run(); } catch (e) {} } });
}

// Rules UI in settings
function injectRulesUI() {
    setTimeout(() => {
        const general = Array.from(document.querySelectorAll('.settings-tab')).find(t => t.dataset.tab === 'general');
        if (!general || general.querySelector('#rulesSection')) return;
        const sec = document.createElement('div');
        sec.className = 'settings-section';
        sec.id = 'rulesSection';
        let html = '<div class="settings-section-title">⚙️ اتوماسیون</div><div class="settings-section-desc">قوانین خودکار برای صرفه‌جویی در زمان</div>';
        AUTOMATION_RULES.forEach(r => {
            html += `<div class="rule-row"><div class="rule-info"><div class="rule-name">${r.name}</div><div class="rule-desc">${r.desc}</div></div>
                <label class="toggle-switch"><input type="checkbox" ${ruleEnabled(r.id) ? 'checked' : ''} onchange="setRuleEnabled('${r.id}', this.checked)"/><span class="toggle-slider"></span></label></div>`;
        });
        html += '<button class="btn btn-secondary" style="margin-top:8px;" onclick="runAutomations(); toast(\'🤖 قوانین اجرا شدند\',\'success\');">▶ اجرای دستی</button>';
        const last = general.querySelector('.settings-section:last-child');
        if (last) last.after(sec); else general.appendChild(sec);
    }, 700);
}

// Run on load + every 60s
setTimeout(() => { runAutomations(); injectRulesUI(); }, 1500);
setInterval(runAutomations, 60000);
console.log('[Automation] Rules engine loaded');