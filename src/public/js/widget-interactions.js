// ===== WIDGET INTERACTIONS =====
// Heatmap click → select date → filter Today's Focus
function enableHeatmapInteraction() {
    const hm = document.getElementById('heatmapContainer');
    if (!hm) return;
    
    hm.addEventListener('click', e => {
        const cell = e.target.closest('[data-date]');
        if (!cell) return;
        
        const date = cell.dataset.date;
        $context.set('selectedDate', new Date(date));
        
        // Filter today's focus by that date
        const tasks = currentData.tasks.filter(t => {
            if (!t.dueDate) return false;
            return new Date(t.dueDate).toDateString() === new Date(date).toDateString();
        });
        
        if (tasks.length) {
            focusSelectedTasks = tasks.slice(0, 3);
            renderFocusWidget();
            toast('📅 فیلتر شد: ' + toPersianDigits(tasks.length) + ' کار', 'info');
        }
    });
}

// Timeline click → open task
function enableTimelineInteraction() {
    const tl = document.getElementById('timeline');
    if (!tl) return;
    
    tl.addEventListener('click', e => {
        const item = e.target.closest('.timeline-item');
        if (!item) return;
        
        const text = item.querySelector('.timeline-text')?.textContent;
        if (text && text.includes('کار')) {
            const task = currentData.tasks.find(t => text.includes(t.title));
            if (task) {
                $context.selectTask(task);
                openEditTaskModal(task);
            }
        }
    });
}

// Insights click → navigate
function enableInsightsInteraction() {
    document.querySelectorAll('#insightsGrid .insight-card').forEach((card, i) => {
        if (card.dataset.interactive) return;
        card.dataset.interactive = '1';
        card.style.cursor = 'pointer';
        card.onclick = () => {
            if (i === 0) switchView('tasks'); // Best day → tasks
            else if (i === 1) switchView('people'); // Total items → people
            else switchView('reports'); // Activity → reports
        };
    });
}

setTimeout(() => {
    enableHeatmapInteraction();
    enableTimelineInteraction();
    enableInsightsInteraction();
}, 600);