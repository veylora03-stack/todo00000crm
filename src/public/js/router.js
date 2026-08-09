// ===== LAZY LOADER (Phase 40 - Chunked Loading) =====
// Loads JS chunks only when needed

const lazyLoader = (() => {
    const loaded = new Set(['bundle-core.js']);
    
    // Map view names to their required chunks
    const viewChunks = {
        'dashboard': ['bundle-charts.js'],
        'people': ['bundle-crm.js'],
        'tasks': ['bundle-productivity.js'],
        'ideas': ['bundle-knowledge.js'],
        'notes': ['bundle-knowledge.js'],
        'projects': ['bundle-crm.js'],
        'pipeline': ['bundle-crm.js'],
        'companies': ['bundle-crm.js'],
        'okr': ['bundle-productivity.js'],
        'inbox': ['bundle-charts.js', 'bundle-productivity.js'],
        'backups': ['bundle-system.js'],
        'reports': ['bundle-charts.js', 'bundle-system.js'],
        'settings': ['bundle-system.js'],
        'graph': ['bundle-knowledge.js'],
    };
    
    // Load a single chunk
    function loadChunk(src) {
        if (loaded.has(src)) return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            // Check if already in DOM (loaded by index.html)
            const existing = document.querySelector(`script[src="/js/${src}"]`);
            if (existing) {
                if (existing.hasAttribute('data-loaded')) {
                    loaded.add(src);
                    resolve();
                    return;
                }
                // Wait for it to load
                existing.addEventListener('load', () => {
                    existing.setAttribute('data-loaded', 'true');
                    loaded.add(src);
                    resolve();
                });
                existing.addEventListener('error', () => reject(new Error('Failed: ' + src)));
                return;
            }
            
            const script = document.createElement('script');
            script.src = '/js/' + src;
            script.onload = () => {
                script.setAttribute('data-loaded', 'true');
                loaded.add(src);
                console.log('[Lazy] Loaded chunk:', src);
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(script);
        });
    }
    
    // Load all chunks for a view
    async function loadView(viewName) {
        const chunks = viewChunks[viewName];
        if (!chunks) return;
        
        const toLoad = chunks.filter(c => !loaded.has(c));
        if (toLoad.length === 0) return;
        
        console.log('[Lazy] Loading view:', viewName, toLoad);
        
        // Load all chunks in parallel
        await Promise.all(toLoad.map(loadChunk));
        
        console.log('[Lazy] View ready:', viewName);
    }
    
    return { loadView, loadChunk, loaded };
})();

console.log('[Lazy] Router initialized (chunked)');