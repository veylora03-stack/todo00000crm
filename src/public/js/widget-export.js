// ===== WIDGET EXPORT SYSTEM =====
function addWidgetMenu(widgetEl, widgetId, dataFn) {
    if (widgetEl.querySelector('.widget-menu-btn')) return;
    
    const btn = document.createElement('button');
    btn.className = 'widget-menu-btn';
    btn.innerHTML = '⋯';
    btn.title = 'گزینه‌های ویجت';
    btn.onclick = (e) => {
        e.stopPropagation();
        showWidgetMenu(e.target, widgetId, dataFn);
    };
    
    const header = widgetEl.querySelector('.card-header, .chart-header, .focus-widget-header, .vital-header, .focus-widget > div:first-child');
    if (header) header.appendChild(btn);
    
    $context.registerWidget(widgetId, widgetEl, { dataFn });
}

function showWidgetMenu(anchor, widgetId, dataFn) {
    const old = document.querySelector('.widget-menu');
    if (old) old.remove();
    
    const menu = document.createElement('div');
    menu.className = 'widget-menu';
    menu.innerHTML = `
        <div class="widget-menu-item" onclick="$context.exportWidget('${widgetId}', 'json')">📄 Export JSON</div>
        <div class="widget-menu-item" onclick="$context.exportWidget('${widgetId}', 'copy')">📋 Copy Data</div>
        <div class="widget-menu-item" onclick="$context.exportWidget('${widgetId}', 'svg')">🖼️ Export SVG</div>
    `;
    
    const rect = anchor.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function h(e) {
            if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', h); }
        });
    }, 50);
}

// Inject menus into key widgets
function injectWidgetMenus() {
    const widgets = {
        'stats': document.getElementById('statsGrid'),
        'focus-today': document.querySelector('.focus-today'),
        'pomo': document.querySelector('.focus-pomodoro'),
        'schedule': document.querySelector('.focus-schedule'),
        'activity': document.getElementById('activityChartContainer')?.closest('.chart-card'),
        'heatmap': document.getElementById('heatmapContainer')?.closest('.heatmap-section'),
        'timeline': document.getElementById('timeline')?.closest('.card')
    };
    
    Object.entries(widgets).forEach(([id, el]) => {
        if (el) addWidgetMenu(el, id, () => currentData);
    });
}

setTimeout(injectWidgetMenus, 500);