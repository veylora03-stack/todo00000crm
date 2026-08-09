// ===== LAZY LOADER (Phase 39 - Performance) =====
// Loads JS modules only when needed

const lazyLoader = (() => {
    const loaded = new Set(['icons.js', 'charts.js', 'holidays.js', 'core.js', 'bus.js', 'store.js', 'vault.js', 'router.js']);
    
    // Map view names to their JS files
    const viewModules = {
        'dashboard': ['dashboard-pro.js', 'focus-suite.js', 'vitals.js', 'dashboard-qa.js', 'context.js', 'widget-export.js', 'widget-interactions.js'],
        'people': ['relationships.js'],
        'tasks': ['calendar.js', 'smart.js'],
        'ideas': ['graph.js'],
        'notes': ['graph.js'],
        'projects': ['projects-pro.js'],
        'pipeline': ['pipeline.js'],
        'companies': ['companies.js'],
        'okr': ['okr.js'],
        'inbox': ['inbox.js', 'inbox-design.js', 'inbox-pro.js', 'inbox-zen.js', 'gamification.js'],
        'backups': ['backup.js', 'notifications.js'],
        'reports': ['reports.js'],
        'settings': ['customize.js', 'automation.js'],
        'graph': ['graph.js'],
        'mobile': ['mobile.js'],
        'ambient': ['ambient.js', 'ai-insights.js'],
    };
    
    // Load a single script
    function loadScript(src) {
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
    
    // Load all modules for a view
    async function loadView(viewName) {
        const modules = viewModules[viewName];
        if (!modules) return;
        
        const toLoad = modules.filter(m => !loaded.has(m));
        if (toLoad.length === 0) return;
        
        console.log('[Lazy] Loading view:', viewName, toLoad);
        
        // Load all modules in parallel for speed
        await Promise.all(toLoad.map(loadScript));
        
        console.log('[Lazy] View ready:', viewName);
    }
    
    return { loadView, loadScript, loaded };
})();

console.log('[Lazy] Router initialized');