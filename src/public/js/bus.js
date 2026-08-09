// ===== EVENT BUS (Phase 32) - central pub/sub =====
// هدف: حذف زنجیره window.wrap ها؛ ماژول‌ها به جای wrap، subscribe می‌کنند.
const bus = (() => {
    const map = new Map();
    return {
        on(event, cb) {
            if (!map.has(event)) map.set(event, []);
            map.get(event).push(cb);
            return () => map.set(event, map.get(event).filter(f => f !== cb));
        },
        once(event, cb) {
            const off = this.on(event, d => { off(); cb(d); });
        },
        emit(event, data) {
            (map.get(event) || []).forEach(cb => {
                try { cb(data); } catch (e) { console.warn('[bus]', event, e); }
            });
        }
    };
})();

// Central tick scheduler (یک تایمر مرکزی به جای چند setInterval)
setInterval(() => bus.emit('tick:1s'), 1000);
setInterval(() => bus.emit('tick:30s'), 30000);
setInterval(() => bus.emit('tick:60s'), 60000);

// شروع مهاجرت: انتشار رویدادهای اصلی (بدون حذف wrap های فعلی)
const _origLoadAllDataBus = window.loadAllData;
window.loadAllData = async function() {
    const r = await _origLoadAllDataBus();
    bus.emit('data:loaded', currentData);
    return r;
};
const _origSwitchViewBus = window.switchView;
window.switchView = function(v) {
    _origSwitchViewBus(v);
    bus.emit('view:changed', v);
};

console.log('[Bus] Event bus + central tick loaded');