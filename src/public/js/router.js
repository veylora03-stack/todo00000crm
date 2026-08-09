// ===== LAZY LOADER (Phase 39 - Performance) =====
// Loads JS modules only when needed

const lazyLoader = (() => {
    const loaded = new Set(['icons.js', 'charts.js', 'holidays.js', 'core.js', 'bus.js', 'store.js', 'vault.js']);
    
    // Map view names to their JS files
    const viewModules = {
        'dashboard': ['dashboard-pro.js', 'focus-suite.js', 'vitals.js', 'dashboard-qa.js'],
        'people': ['relationships.js'],
        'tasks': ['calendar.js'],
        'ideas': ['graph.js'],
        'notes': ['graph.js'],
        'projects': ['projects-pro.js'],
        'pipeline': ['pipeline.js'],
        'companies': ['companies.js'],
        'okr': ['okr.js'],
        'inbox': ['inbox.js', 'inbox-design.js', 'inbox-pro.js', 'inbox-zen.js'],
        'backups': ['backup.js'],
        'reports': ['reports.js'],
        'settings': ['customize.js', 'context.js'],
        'graph': ['graph.js'],
    };
    
    async function loadScript(src) {
        if (loaded.has(src)) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/js/' + src;
            script.onload = () => {
                loaded.add(src);
                console.log('[Lazy] Loaded:', src);
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(script);
        });
    }
    
    async function loadView(viewName) {
        const modules = viewModules[viewName];
        if (!modules) return;
        
        const toLoad = modules.filter(m => !loaded.has(m));
        if (toLoad.length === 0) return;
        
        console.log('[Lazy] Loading view:', viewName, toLoad);
        
        // Load all modules in parallel
        await Promise.all(toLoad.map(loadScript));
    }
    
    return { loadView, loadScript };
})();

console.log('[Lazy] Router initialized');