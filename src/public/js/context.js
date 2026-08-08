// ===== CONTEXT ENGINE CORE (Phase 25) =====
const $context = {
    currentTask: null,
    selectedPerson: null,
    todayDate: new Date(),
    focusRange: { start: null, end: null },
    activeView: \'dashboard\',
    notifications: [],
    set(key, value) {
        this[key] = value;
        this.notify();
    },
    notify() {
        // Broadcast to all widgets
        document.dispatchEvent(new CustomEvent(\'context-change\', { detail: this }));
    }
};

// Subscribe to context changes
function onContextChange(cb) {
    document.addEventListener(\'context-change\', e => cb(e.detail));
}