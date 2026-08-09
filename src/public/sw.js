// ===== SERVICE WORKER (Phase 42 - Advanced PWA) =====
// Cache-first for static, Network-first for API, Offline fallback

const CACHE_VERSION = 'crm-v42';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to pre-cache on install
const PRE_CACHE_ASSETS = [
    '/',
    '/index.html',
    '/css/app.css',
    '/js/bundle-core.js',
    '/js/bundle-charts.js',
    '/manifest.json',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/api/people',
    '/api/tasks',
    '/api/notes',
    '/api/ideas',
    '/api/projects',
    '/api/companies',
    '/api/deals',
    '/api/settings',
];

// ===== INSTALL: Pre-cache critical assets =====
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...', CACHE_VERSION);
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Pre-caching assets');
                return cache.addAll(PRE_CACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ===== ACTIVATE: Clean up old caches =====
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...', CACHE_VERSION);
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => !name.startsWith(CACHE_VERSION))
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ===== FETCH: Smart caching strategy =====
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension and other non-http(s)
    if (!url.protocol.startsWith('http')) return;
    
    // API calls: Network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(event.request, API_CACHE));
        return;
    }
    
    // Images: Cache-first
    if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
        event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
        return;
    }
    
    // Static assets (JS, CSS): Cache-first
    if (url.pathname.match(/\.(js|css|woff2?)$/)) {
        event.respondWith(cacheFirst(event.request, STATIC_CACHE));
        return;
    }
    
    // HTML: Network-first with offline fallback
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstWithFallback(event.request));
        return;
    }
    
    // Default: Network with cache fallback
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
});

// ===== CACHE STRATEGIES =====

// Cache-first: Try cache, fallback to network
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) {
        console.log('[SW] Cache hit:', request.url);
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('[SW] Fetch failed:', request.url);
        return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}

// Network-first: Try network, fallback to cache
async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cached = await caches.match(request);
        if (cached) return cached;
        
        // Return offline response for API
        if (request.url.includes('/api/')) {
            return new Response(JSON.stringify({ offline: true, data: [] }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}

// Network-first with HTML fallback
async function networkFirstWithFallback(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, showing offline page');
        const cached = await caches.match(request);
        if (cached) return cached;
        
        // Return offline fallback page
        return new Response(`
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>آفلاین - CRM Pro</title>
                <style>
                    body { 
                        font-family: Tahoma, Arial, sans-serif; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        min-height: 100vh; 
                        margin: 0;
                        background: linear-gradient(135deg, #7c3aed, #ec4899);
                        color: white;
                    }
                    .offline-card {
                        text-align: center;
                        padding: 40px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                    }
                    .offline-icon { font-size: 64px; margin-bottom: 20px; }
                    h1 { margin: 0 0 10px; font-size: 24px; }
                    p { margin: 0; opacity: 0.8; }
                    button {
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: white;
                        color: #7c3aed;
                        border: none;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="offline-card">
                    <div class="offline-icon">📡</div>
                    <h1>شما آفلاین هستید</h1>
                    <p>اتصال اینترنت خود را بررسی کنید</p>
                    <button onclick="window.location.reload()">تلاش مجدد</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

// ===== BACKGROUND SYNC (Future) =====
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
});

// ===== PUSH NOTIFICATIONS (Future) =====
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event.data?.text());
});

console.log('[SW] Service Worker loaded:', CACHE_VERSION);