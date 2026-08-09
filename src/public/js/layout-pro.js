// ===== PRO LAYOUT MODULE (Phase 22) =====
function injectZoneLabels() {
    const view = document.getElementById('view-dashboard');
    if (!view) return;
    
    const zones = [
        { before: 'focusSuiteContainer', label: '⚡ امروز' },
        { before: 'vitalsRow', label: '📈 سلامت و بهره‌وری' },
        { before: 'statsGrid', label: '📊 نمای کلی' },
        { before: 'chartsGrid', label: '📈 روندها' },
        { before: 'relWidgets', label: '💞 روابط و دستاوردها' }
    ];
    
    zones.forEach(z => {
        const target = document.getElementById(z.before);
        if (!target) return;
        // Avoid duplicate
        if (target.previousElementSibling && target.previousElementSibling.classList.contains('zone-label')) return;
        const lbl = document.createElement('div');
        lbl.className = 'zone-label';
        lbl.textContent = z.label;
        target.parentNode.insertBefore(lbl, target);
    });
}

const origRenderDashL = window.renderDashboard;
window.renderDashboard = function() {
    origRenderDashL();
    setTimeout(injectZoneLabels, 250);
};