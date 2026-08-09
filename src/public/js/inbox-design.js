// ===== INBOX DESIGN v2 - Beautiful Rendering =====

window.renderInbox = function () {
    const container = document.getElementById('inboxList');
    if (!container) return;
    inboxItems = computeInboxItems();
    updateInboxBadge();

    const urgentCount = inboxItems.filter(i => i.urgency === 'urgent').length;
    const soonCount = inboxItems.filter(i => i.urgency === 'soon').length;
    const normalCount = inboxItems.filter(i => i.urgency === 'normal').length;
    const total = inboxItems.length;

    // Hero header (always show)
    let html = '';
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'صبح بخیر! ☀️' : hour < 18 ? 'ظهر بخیر! 🌤️' : 'عصر بخیر! 🌙';

    html += '<div class="inbox-hero"><div><div class="inbox-hero-title">' + greet + '</div><div class="inbox-hero-sub">' +
        (total > 0 ? toPersianDigits(total) + ' مورد منتظر توجه شماست' : 'همه چیز تحت کنترل است!') +
        '</div></div><div class="inbox-hero-stats">' +
        '<div class="inbox-stat urgent"><span class="inbox-stat-num">' + toPersianDigits(urgentCount) + '</span> فوری</div>' +
        '<div class="inbox-stat soon"><span class="inbox-stat-num">' + toPersianDigits(soonCount) + '</span> این هفته</div>' +
        '<div class="inbox-stat normal"><span class="inbox-stat-num">' + toPersianDigits(normalCount) + '</span> برنامه‌ریزی</div>' +
        '</div></div>';

    if (total === 0) {
        html += '<div class="inbox-zero"><div class="inbox-zero-icon">🏆</div><div class="inbox-zero-title">Inbox Zero!</div><div class="inbox-zero-desc">فوق‌العاده! هیچ موردی منتظر بررسی نیست. شما استاد مدیریت زمان خود هستید. 🎉</div><div class="inbox-kbd-hint"><span class="inbox-kbd"><span class="kbd">↑↓</span> حرکت</span><span class="inbox-kbd"><span class="kbd">E</span> انجام</span><span class="inbox-kbd"><span class="kbd">S</span> زمان</span><span class="inbox-kbd"><span class="kbd">X</span> حذف</span></div></div>';
        container.innerHTML = html;
        return;
    }

    // Progress bar (processed = done out of a daily goal, just show urgency distribution)
    const processedPct = Math.round(((soonCount + normalCount) / total) * 100);
    html += '<div class="inbox-progress-wrap"><div class="inbox-progress-label"><span>پیشرفت پردازش</span><span>' + toPersianDigits(100 - Math.round((urgentCount / total) * 100)) + '%</span></div><div class="inbox-progress"><div class="inbox-progress-fill" style="width:' + (100 - Math.round((urgentCount / total) * 100)) + '%;"></div></div></div>';

    // Groups
    const groups = [
        { key: 'urgent', label: 'فوری — نیاز به اقدام فوری' },
        { key: 'soon', label: 'این هفته' },
        { key: 'normal', label: 'برای برنامه‌ریزی' }
    ];

    let animDelay = 0;
    groups.forEach(g => {
        const gi = inboxItems.filter(i => i.urgency === g.key);
        if (!gi.length) return;
        html += '<div class="inbox-group"><div class="inbox-group-header"><div class="inbox-group-dot ' + g.key + '"></div><div class="inbox-group-title">' + g.label + '</div><span class="inbox-group-count">' + toPersianDigits(gi.length) + '</span></div>';
        gi.forEach(item => {
            const idx = inboxItems.indexOf(item);
            const icons = { done: '✓', schedule: '📅', delete: '🗑', contact: '📞', open: '→' };
            const titles = { done: 'انجام شد (E)', schedule: 'زمان‌بندی (S)', delete: 'حذف (X)', contact: 'ثبت تماس', open: 'باز کردن (O)' };
            html += '<div class="inbox-item ' + item.urgency + (idx === inboxSelectedIndex ? ' selected' : '') + '" data-idx="' + idx + '" style="animation-delay:' + (animDelay * 0.05) + 's" onclick="selectInboxItem(' + idx + ')">';
            html += '<div class="inbox-item-icon ' + (item.type === 'followup' || item.type === 'occasion' ? 'rel' : item.urgency) + '">' + item.icon + '</div>';
            html += '<div class="inbox-item-content"><div class="inbox-item-title">' + item.title + '</div><div class="inbox-item-sub">' + item.sub + '</div></div>';
            html += '<div class="inbox-item-actions">';
            item.actions.forEach(a => {
                html += '<button class="inbox-action-btn ' + a + '" title="' + titles[a] + '" onclick="event.stopPropagation(); inboxAction(' + idx + ',\'' + a + '\', this)">' + icons[a] + '</button>';
            });
            html += '</div></div>';
            animDelay++;
        });
        html += '</div>';
    });

    container.innerHTML = html;
};