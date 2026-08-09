// ===== CONTEXT ENGINE - Reactive State Management =====
const $context = (() => {
    const state = {
        currentTask: null,
        selectedPerson: null,
        todayDate: new Date(),
        focusRange: 7,
        activeView: 'dashboard',
        theme: localStorage.getItem('crm_theme') || 'dark',
        quickStartDone: localStorage.getItem('crm_qs_done') === '1'
    };
    
    const subscribers = new Map();
    let idCounter = 0;
    
    return {
        get state() { return { ...state }; },
        
        set(key, value) {
            if (state[key] === value) return;
            state[key] = value;
            if (key === 'theme') localStorage.setItem('crm_theme', value);
            if (key === 'quickStartDone' && value) localStorage.setItem('crm_qs_done', '1');
            this._notify(key, value);
        },
        
        watch(keys, callback) {
            const id = ++idCounter;
            subscribers.set(id, { keys, callback });
            callback(state); // Initial call
            return id;
        },
        
        unwatch(id) { subscribers.delete(id); },
        
        _notify(key, value) {
            subscribers.forEach(({ keys, callback }) => {
                if (!keys || keys.includes(key)) {
                    try { callback(state); } catch (e) { }
                }
            });
            document.dispatchEvent(new CustomEvent('ctx:' + key, { detail: value }));
        },
        
        // Widget registry
        widgets: new Map(),
        registerWidget(id, el, opts = {}) {
            this.widgets.set(id, { el, opts });
            el.dataset.ctxWidget = id;
        },
        
        // Actions
        selectTask(task) { this.set('currentTask', task); },
        selectPerson(person) { this.set('selectedPerson', person); },
        setFocusRange(days) { this.set('focusRange', days); },
        toggleTheme() { this.set('theme', state.theme === 'dark' ? 'light' : 'dark'); },
        
        // Export utility
        async exportWidget(id, format = 'png') {
            const widget = this.widgets.get(id);
            if (!widget) return;
            
            if (format === 'json') {
                const data = widget.opts.dataFn ? widget.opts.dataFn() : {};
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadBlob(blob, id + '.json');
            } else if (format === 'png' || format === 'svg') {
                // Use html2canvas-like approach with SVG foreignObject
                await exportAsImage(widget.el, id + '.' + format, format);
            } else if (format === 'copy') {
                const data = widget.opts.dataFn ? widget.opts.dataFn() : {};
                await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                if (typeof toast === 'function') toast('📋 کپی شد', 'success');
            }
        }
    };
})();

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function exportAsImage(el, filename, format) {
    // Simple SVG-based export
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">${clone.outerHTML}</div>
        </foreignObject>
    </svg>`;
    
    document.body.removeChild(clone);
    
    if (format === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        downloadBlob(blob, filename);
    } else {
        // For PNG, we'd need canvas conversion - simplified for now
        if (typeof toast === 'function') toast('📥 Export در حال آماده‌سازی...', 'info');
    }
}

// Theme applier
function applyTheme() {
    const theme = $context.state.theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('light-theme', theme === 'light');
}

$context.watch(['theme'], applyTheme);
setTimeout(applyTheme, 100);