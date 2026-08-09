// ===== CENTRAL STORE (Phase 34 - State Management) =====
const store = (() => {
    function save(entity) {
        if (typeof saveEntity === 'function') saveEntity(entity);
    }
    function emit(entity) {
        if (typeof bus !== 'undefined') bus.emit(entity + ':changed', currentData[entity]);
    }
    function notify(entity) {
        save(entity);
        emit(entity);
    }
    return {
        get(entity) { return currentData[entity] || []; },
        set(entity, arr) {
            currentData[entity] = arr;
            notify(entity);
            return arr;
        },
        add(entity, item) {
            if (!item.id) item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
            if (!item.createdAtUtc) item.createdAtUtc = new Date().toISOString();
            currentData[entity] = currentData[entity] || [];
            currentData[entity].push(item);
            notify(entity);
            return item;
        },
        update(entity, id, changes) {
            const arr = currentData[entity] || [];
            const idx = arr.findIndex(x => x.id === id);
            if (idx === -1) return null;
            arr[idx] = { ...arr[idx], ...changes, updatedAtUtc: new Date().toISOString() };
            notify(entity);
            return arr[idx];
        },
        remove(entity, id) {
            const arr = currentData[entity] || [];
            const idx = arr.findIndex(x => x.id === id);
            if (idx === -1) return false;
            arr.splice(idx, 1);
            notify(entity);
            return true;
        },
        find(entity, id) {
            return (currentData[entity] || []).find(x => x.id === id);
        }
    };
})();
console.log('[Store] Central store initialized');