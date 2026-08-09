// ===== VAULT MODULE (Phase 14) =====

const VAULT_HASH_KEY = 'crm_vault_hash';
const VAULT_UNLOCK_KEY = 'crm_vault_unlocked';
const AUTO_LOCK_MINUTES = 5;

async function hashPassword(pwd){const s=localStorage.getItem('crm_vault_salt')||(()=>{const a=new Uint8Array(16);crypto.getRandomValues(a);const x=Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem('crm_vault_salt',x);return x})();const d=new TextEncoder().encode(s+':'+pwd);const b=await crypto.subtle.digest('SHA-256',d);return 'v2_'+Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}

function isVaultEnabled() { return !!localStorage.getItem(VAULT_HASH_KEY); }
function isVaultUnlocked() { return sessionStorage.getItem(VAULT_UNLOCK_KEY) === '1'; }

function showVaultLock() {
    const existing = document.getElementById('vaultLock');
    if (existing) existing.remove();
    const hasPw = isVaultEnabled();
    const lock = document.createElement('div');
    lock.id = 'vaultLock';
    lock.className = 'vault-lock';
    lock.innerHTML = '<div class="vault-logo">🔒</div><div class="vault-title">CRM Pro</div><div class="vault-subtitle">' + (hasPw ? 'برای دسترسی به داده‌های خود، رمز عبور را وارد کنید' : 'Vault امنیتی — یک رمز عبور برای محافظت از داده‌های خود تنظیم کنید') + '</div><div class="vault-form" id="vaultForm">' +
        '<input type="password" id="vaultPwd" class="vault-input" placeholder="رمز عبور" autocomplete="off"/>' +
        (hasPw ? '' : '<input type="password" id="vaultPwd2" class="vault-input" placeholder="تایید رمز عبور"/>') +
        '<button class="vault-btn" onclick="submitVault()">' + (hasPw ? '🔓 باز کردن' : '🔐 تنظیم رمز') + '</button>' +
        (hasPw ? '<div class="vault-hint"><a href="#" onclick="resetVault(); return false;" style="color:#a1a1aa;">فراموشی رمز (پاک کردن داده‌ها)</a></div>' : '<div class="vault-hint">رمز خود را در جای امنی ذخیره کنید!</div>') +
        '</div>';
    document.body.appendChild(lock);
    setTimeout(() => document.getElementById('vaultPwd').focus(), 100);
    document.getElementById('vaultPwd').addEventListener('keydown', e => { if (e.key === 'Enter') submitVault(); });
    const p2 = document.getElementById('vaultPwd2');
    if (p2) p2.addEventListener('keydown', e => { if (e.key === 'Enter') submitVault(); });
}

async function submitVault() {
    const pwd = document.getElementById('vaultPwd').value;
    const pwd2 = document.getElementById('vaultPwd2');
    const hasPw = isVaultEnabled();
    const form = document.getElementById('vaultForm');
    
    if (!pwd) { showVaultError('لطفاً رمز عبور را وارد کنید'); return; }
    
    if (!hasPw) {
        if (!pwd2 || pwd !== pwd2.value) { showVaultError('رمزها مطابقت ندارند'); return; }
        if (pwd.length < 4) { showVaultError('رمز حداقل ۴ کاراکتر'); return; }
        localStorage.setItem(VAULT_HASH_KEY, hashPassword(pwd));
        sessionStorage.setItem(VAULT_UNLOCK_KEY, '1');
        toast('🔐 Vault فعال شد', 'success');
        closeVaultLock();
    } else {
        if (hashPassword(pwd) !== localStorage.getItem(VAULT_HASH_KEY)) {
            showVaultError('❌ رمز اشتباه است');
            return;
        }
        sessionStorage.setItem(VAULT_UNLOCK_KEY, '1');
        toast('🔓 خوش آمدید!', 'success');
        closeVaultLock();
    }
}

function showVaultError(msg) {
    const form = document.getElementById('vaultForm');
    let err = form.querySelector('.vault-error');
    if (!err) { err = document.createElement('div'); err.className = 'vault-error'; form.appendChild(err); }
    err.textContent = msg;
}

function closeVaultLock() {
    const lock = document.getElementById('vaultLock');
    if (lock) lock.remove();
    lastActivity = Date.now();
}

function lockVault() {
    sessionStorage.removeItem(VAULT_UNLOCK_KEY);
    showVaultLock();
}

function resetVault() {
    if (!confirm('آیا مطمئن هستید؟ این کار تمام داده‌ها و رمز عبور را پاک می‌کند!')) return;
    localStorage.removeItem(VAULT_HASH_KEY);
    sessionStorage.removeItem(VAULT_UNLOCK_KEY);
    toast('داده‌ها پاک شدند. صفحه ریفرش می‌شود...', 'info');
    setTimeout(() => location.reload(), 1500);
}

// Auto-lock after inactivity
let lastActivity = Date.now();
['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => {
    document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true });
});

setInterval(() => {
    if (isVaultEnabled() && isVaultUnlocked() && (Date.now() - lastActivity) > AUTO_LOCK_MINUTES * 60 * 1000) {
        lockVault();
    }
}, 30000);

// Settings UI
function addVaultSettings() {
    setTimeout(() => {
        const tabs = document.querySelectorAll('.settings-tab');
        const general = Array.from(tabs).find(t => t.dataset.tab === 'general');
        if (!general || general.querySelector('#vaultSettings')) return;
        
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.id = 'vaultSettings';
        section.innerHTML = '<div class="settings-section-title">🔒 Vault امنیتی</div><div class="settings-section-desc">محافظت از داده‌ها با رمز عبور</div><div class="setting-row"><div class="setting-info"><div class="setting-label">وضعیت</div><div class="setting-desc" id="vaultStatusText">' + (isVaultEnabled() ? '✅ فعال' : '❌ غیرفعال') + '</div></div><button class="btn ' + (isVaultEnabled() ? 'btn-ghost' : 'btn-primary') + '" onclick="toggleVaultSettings()" id="vaultToggleBtn">' + (isVaultEnabled() ? 'غیرفعال کردن' : 'فعال کردن') + '</button></div><div class="setting-row"><div class="setting-info"><div class="setting-label">قفل خودکار</div><div class="setting-desc">بعد از ۵ دقیقه عدم فعالیت</div></div><span class="vault-status unlocked">فعال</span></div>';
        const lastSection = general.querySelector('.settings-section:last-child');
        if (lastSection) lastSection.after(section);
        else general.appendChild(section);
    }, 600);
}

async function toggleVaultSettings() {
    if (isVaultEnabled()) {
        const pwd = prompt('برای غیرفعال کردن Vault، رمز فعلی را وارد کنید:');
        if (!pwd) return;
        if (hashPassword(pwd) !== localStorage.getItem(VAULT_HASH_KEY)) { toast('رمز اشتباه', 'error'); return; }
        localStorage.removeItem(VAULT_HASH_KEY);
        toast('Vault غیرفعال شد', 'success');
    } else {
        showVaultLock();
        return;
    }
    addVaultSettings();
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    addVaultSettings();
    if (isVaultEnabled() && !isVaultUnlocked()) {
        setTimeout(showVaultLock, 300);
    }
});
