// ===== TOPBAR ICON ENHANCER (Phase 45) =====
// Assigns distinct SVG icons to topbar buttons
document.addEventListener('DOMContentLoaded', () => {
    const tryEnhance = () => {
        if (typeof IconsPro === 'undefined') {
            setTimeout(tryEnhance, 100);
            return;
        }
        
        // Map button identifiers to icons
        const topbarIconMap = [
            // Install button (PWA)
            { selector: '#installBtn', icon: 'download', title: 'نصب اپلیکیشن' },
            // Backup button
            { selector: '[title*="Backup"], [title*="پشتیبان"], [id*="backup"], [class*="backup"]', icon: 'database', title: 'پشتیبان‌گیری' },
            // Notification button
            { selector: '[title*="Notification"], [title*="اعلان"], [id*="notif"], [class*="notif"]', icon: 'bell', title: 'اعلان‌ها' },
            // Export/Report button
            { selector: '[title*="Export"], [title*="خروجی"], [id*="export"]', icon: 'fileText', title: 'خروجی گزارش' },
            // Settings button
            { selector: '[title*="Settings"], [title*="تنظیمات"], [id*="settings"]', icon: 'settings', title: 'تنظیمات' },
        ];
        
        const topbar = document.querySelector('.topbar-actions') || document.querySelector('.topbar');
        if (!topbar) return;
        
        const buttons = topbar.querySelectorAll('button');
        let updated = 0;
        
        buttons.forEach(btn => {
            const title = (btn.getAttribute('title') || '') + ' ' + (btn.id || '') + ' ' + (btn.className || '');
            
            // Determine which icon this button should have
            let iconName = null;
            if (btn.id === 'installBtn' || title.includes('install') || title.includes('نصب')) {
                iconName = 'download';
            } else if (title.includes('backup') || title.includes('پشتیبان') || title.includes('Backup')) {
                iconName = 'database';
            } else if (title.includes('notif') || title.includes('اعلان') || title.includes('Notification')) {
                iconName = 'bell';
            } else if (title.includes('export') || title.includes('خروجی') || title.includes('Export') || title.includes('report')) {
                iconName = 'fileText';
            } else if (title.includes('settings') || title.includes('تنظیمات') || title.includes('Settings')) {
                iconName = 'settings';
            } else if (title.includes('theme') || title.includes('تم')) {
                iconName = themeSwitcher && themeSwitcher.getCurrentTheme() === 'dark' ? 'moon' : 'sun';
            }
            
            if (iconName && IconsPro[iconName]) {
                // Only replace if button contains an SVG or emoji (not text)
                const hasSvg = btn.querySelector('svg');
                const hasEmoji = /[^\x00-\x7F]/.test(btn.textContent);
                
                if (hasSvg || hasEmoji || btn.textContent.trim() === '') {
                    btn.innerHTML = IconsPro[iconName](20);
                    btn.style.display = 'inline-flex';
                    btn.style.alignItems = 'center';
                    btn.style.justifyContent = 'center';
                    updated++;
                }
            }
        });
        
        if (updated > 0) {
            console.log(`[TopbarEnhancer] Updated ${updated} topbar icons`);
        }
    };
    
    tryEnhance();
});