// ===== GLOBAL SEARCH (Phase 32) - index all entities =====
const _origSearchCommand = window.searchCommand;
window.searchCommand = async function(q) {
    await _origSearchCommand(q);
    addClientResults(q);
};

function addClientResults(q) {
    q = (q || '').toLowerCase().trim();
    if (!q) return;
    const push = (group, title, sub, icon, action) => {
        cmdSearchResults.push({ group, id: 'g-' + group + '-' + title, title, sub, icon, action });
    };
    const has = s => (s || '').toLowerCase().includes(q);
    
    (currentData.deals || []).forEach(d => { if (has(d.title)) push('معاملات', d.title, fmtMoney ? fmtMoney(d.value) : '', 'rocket', () => { closeCommandPalette(); switchView('pipeline'); }); });
    (currentData.companies || []).forEach(c => { if (has(c.name)) push('شرکت‌ها', c.name, c.industry || '', 'building', () => { closeCommandPalette(); switchView('companies'); }); });
    (currentData.notes || []).forEach(n => { if (has(n.title) || has(n.content)) push('یادداشت‌ها', n.title, '', 'file', () => { closeCommandPalette(); if (typeof openKnowledgePanel === 'function') openKnowledgePanel(n.id); }); });
    (currentData.ideas || []).forEach(i => { if (has(i.title)) push('ایده‌ها', i.title, '', 'lightbulb', () => { closeCommandPalette(); if (typeof openKnowledgePanel === 'function') openKnowledgePanel(i.id); }); });
    (currentData.projects || []).forEach(p => { if (has(p.name)) push('پروژه‌ها', p.name, '', 'check', () => { closeCommandPalette(); if (typeof openProjectPanel === 'function') openProjectPanel(p.id); }); });
    
    renderCommandResults();
}
console.log('[GlobalSearch] all-entity search loaded');