// ===== PERFORMANCE MONITOR (Phase 41) =====
// Tracks real load times and user experience metrics

const perfMonitor = (() => {
    const STORAGE_KEY = 'crm_perf_metrics';
    const metrics = {
        pageLoad: null,
        firstPaint: null,
        firstContentfulPaint: null,
        chunkLoads: {},
        viewLoads: {},
        totalBlockingTime: 0,
    };
    
    // Initialize timing
    function init() {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
            metrics.pageLoad = Math.round(nav.loadEventEnd - nav.startTime);
            metrics.domReady = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
        }
        
        // First Paint & First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
                metrics.firstPaint = Math.round(entry.startTime);
            }
            if (entry.name === 'first-contentful-paint') {
                metrics.firstContentfulPaint = Math.round(entry.startTime);
            }
        });
        
        // Resource timing for chunks
        const resources = performance.getEntriesByType('resource');
        resources.forEach(r => {
            if (r.name.includes('bundle-')) {
                const name = r.name.split('/').pop();
                metrics.chunkLoads[name] = {
                    duration: Math.round(r.duration),
                    size: r.transferSize || 0,
                    init: Math.round(r.startTime),
                };
            }
        });
    }
    
    // Track view load time (called by lazyLoader)
    function trackViewLoad(viewName, chunks, startTime) {
        const duration = Math.round(performance.now() - startTime);
        metrics.viewLoads[viewName] = {
            duration,
            chunks,
            timestamp: Date.now(),
        };
        console.log(`[Perf] View "${viewName}" loaded in ${duration}ms`);
    }
    
    // Save to localStorage
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                metrics,
                savedAt: new Date().toISOString(),
            }));
        } catch (e) {
            console.warn('[Perf] Failed to save metrics:', e);
        }
    }
    
    // Load from localStorage
    function load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn('[Perf] Failed to load metrics:', e);
        }
        return null;
    }
    
    // Get current metrics
    function getMetrics() {
        return { ...metrics };
    }
    
    // Print report to console
    function report() {
        console.log('%c=== CRM Performance Report ===', 'color: #7c3aed; font-weight: bold; font-size: 14px');
        console.log('%cPage Load:', 'color: #22c55e', metrics.pageLoad ? `${metrics.pageLoad}ms` : 'N/A');
        console.log('%cDOM Ready:', 'color: #22c55e', metrics.domReady ? `${metrics.domReady}ms` : 'N/A');
        console.log('%cFirst Paint:', 'color: #22c55e', metrics.firstPaint ? `${metrics.firstPaint}ms` : 'N/A');
        console.log('%cFirst Contentful Paint:', 'color: #22c55e', metrics.firstContentfulPaint ? `${metrics.firstContentfulPaint}ms` : 'N/A');
        
        console.log('%c\nChunk Loads:', 'color: #3b82f6; font-weight: bold');
        Object.entries(metrics.chunkLoads).forEach(([name, data]) => {
            const sizeKB = Math.round(data.size / 1024);
            console.log(`  ${name}: ${data.duration}ms (${sizeKB} KB)`);
        });
        
        console.log('%c\nView Loads:', 'color: #3b82f6; font-weight: bold');
        Object.entries(metrics.viewLoads).forEach(([name, data]) => {
            console.log(`  ${name}: ${data.duration}ms (${data.chunks.join(', ')})`);
        });
        
        console.log('%c================================', 'color: #7c3aed');
    }
    
    // Get performance grade
    function grade() {
        let score = 100;
        if (metrics.firstContentfulPaint > 1000) score -= 20;
        if (metrics.firstContentfulPaint > 2500) score -= 20;
        if (metrics.pageLoad > 3000) score -= 20;
        if (metrics.pageLoad > 5000) score -= 20;
        
        const totalChunkTime = Object.values(metrics.chunkLoads)
            .reduce((sum, c) => sum + c.duration, 0);
        if (totalChunkTime > 2000) score -= 10;
        
        score = Math.max(0, score);
        
        let grade;
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';
        else grade = 'F';
        
        return { score, grade };
    }
    
    return {
        init,
        trackViewLoad,
        save,
        load,
        getMetrics,
        report,
        grade,
    };
})();

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    perfMonitor.init();
    
    // Save after a short delay to ensure all resources are tracked
    setTimeout(() => {
        perfMonitor.save();
    }, 2000);
});

// Expose for debugging
window.perfMonitor = perfMonitor;

console.log('[Perf] Performance monitor initialized');