// ===== PRO TOPBAR MODULE (Phase 23) =====
function enhanceTopbar() {
    const tb = document.querySelector('.topbar');
    if (!tb || tb.dataset.tbPro) return;
    tb.dataset.tbPro = '1';
    
    const mk = (n, s) => typeof icon === 'function' ? icon(n, s) : '';
    
    // Brand: ensure logo + name + version
    let brand = tb.querySelector('.brand') || tb.querySelector('.topbar-brand');
    if (!brand) {
        brand = document.createElement('div');
        brand.className = 'brand';
        tb.prepend(brand);
    }
    if (!brand.querySelector('.brand-logo')) {
        brand.insertAdjacentHTML('afterbegin', '<div class="brand-logo">C</div>');
    }
    if (!brand.querySelector('.brand-name')) {
        brand.insertAdjacentHTML('beforeend', '<div class="brand-name">CRM Pro</div><span class="brand-ver">v2.0</span>');
    }
    
    // Search: ensure icon + text + kbd
    const search = tb.querySelector('.topbar-search-btn');
    if (search) {
        if (!search.querySelector('.search-icon')) search.insertAdjacentHTML('afterbegin', '<span class="search-icon">' + mk('search', 15) + '</span>');
        if (!search.querySelector('.search-text')) search.insertAdjacentHTML('beforeend', '<span class="search-text">جستجو...</span>');
        if (!search.querySelector('.kbd')) search.insertAdjacentHTML('beforeend', '<span class="kbd">Ctrl</span><span class="kbd">K</span>');
        search.onclick = () => { if (typeof openCommandPalette === 'function') openCommandPalette(); };
    }
    
    // Actions: tooltips
    const actions = tb.querySelectorAll('.topbar-actions .icon-button');
    const tips = ['اعلان‌ها', 'تنظیمات', 'پشتیبان‌گیری'];
    actions.forEach((b, i) => { if (!b.title) b.title = tips[i] || ''; });
    
    // Ensure bell icon
    const bell = tb.querySelector('#notificationBtn span');
    if (bell && !bell.innerHTML) bell.innerHTML = mk('bell', 16);
}

setTimeout(enhanceTopbar, 300);
console.log('[ProTopbar] loaded');