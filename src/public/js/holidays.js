// Iranian Official Holidays 1404-1405 (2025-2026)
// Format: { month: 1-12, day: 1-31, title: string, type: 'official' | 'religious' }
const IranianHolidays = {
    1404: [
        // Farvardin
        { month: 1, day: 1, title: "عید نوروز", type: "official" },
        { month: 1, day: 2, title: "عید نوروز", type: "official" },
        { month: 1, day: 3, title: "عید نوروز", type: "official" },
        { month: 1, day: 4, title: "عید نوروز", type: "official" },
        { month: 1, day: 12, title: "روز جمهوری اسلامی", type: "official" },
        { month: 1, day: 13, title: "سیزده‌بدر", type: "official" },
        { month: 1, day: 22, title: "عید فطر", type: "religious" },
        { month: 1, day: 23, title: "عید فطر", type: "religious" },
        
        // Ordibehesht
        { month: 2, day: 12, title: "شهادت امام علی (ع)", type: "religious" },
        { month: 2, day: 29, title: "مبعث پیامبر (ص)", type: "religious" },
        
        // Khordad
        { month: 3, day: 14, title: "رحلت امام خمینی (ره)", type: "official" },
        { month: 3, day: 15, title: "قیام 15 خرداد", type: "official" },
        { month: 3, day: 20, title: "ولادت امام علی (ع)", type: "religious" },
        { month: 3, day: 30, title: "عید قربان", type: "religious" },
        
        // Tir
        { month: 4, day: 8, title: "عید غدیر خم", type: "religious" },
        
        // Mordad
        { month: 5, day: 7, title: "تاسوعای حسینی", type: "religious" },
        { month: 5, day: 8, title: "عاشورای حسینی", type: "religious" },
        
        // Shahrivar
        { month: 6, day: 17, title: "اربعین حسینی", type: "religious" },
        { month: 6, day: 25, title: "رحلت پیامبر (ص) و شهادت امام حسن (ع)", type: "religious" },
        { month: 6, day: 27, title: "شهادت امام رضا (ع)", type: "religious" },
        
        // Mehr
        { month: 7, day: 5, title: "میلاد پیامبر (ص) و امام صادق (ع)", type: "religious" },
        
        // Aban - No holidays
        
        // Azar - No holidays
        
        // Dey
        { month: 10, day: 13, title: "شهادت امام علی (ع)", type: "religious" },
        
        // Bahman
        { month: 11, day: 22, title: "پیروزی انقلاب اسلامی", type: "official" },
        { month: 11, day: 24, title: "عید مبعث", type: "religious" },
        
        // Esfand
        { month: 12, day: 5, title: "ولادت امام علی (ع)", type: "religious" },
        { month: 12, day: 29, title: "ملی شدن صنعت نفت", type: "official" }
    ],
    1405: [
        // Farvardin
        { month: 1, day: 1, title: "عید نوروز", type: "official" },
        { month: 1, day: 2, title: "عید نوروز", type: "official" },
        { month: 1, day: 3, title: "عید نوروز", type: "official" },
        { month: 1, day: 4, title: "عید نوروز", type: "official" },
        { month: 1, day: 11, title: "عید فطر", type: "religious" },
        { month: 1, day: 12, title: "عید فطر", type: "religious" },
        { month: 1, day: 12, title: "روز جمهوری اسلامی", type: "official" },
        { month: 1, day: 13, title: "سیزده‌بدر", type: "official" },
        
        // Ordibehesht
        { month: 2, day: 2, title: "شهادت امام علی (ع)", type: "religious" },
        { month: 2, day: 18, title: "مبعث پیامبر (ص)", type: "religious" },
        
        // Khordad
        { month: 3, day: 9, title: "عید قربان", type: "religious" },
        { month: 3, day: 14, title: "رحلت امام خمینی (ره)", type: "official" },
        { month: 3, day: 15, title: "قیام 15 خرداد", type: "official" },
        { month: 3, day: 17, title: "عید غدیر خم", type: "religious" },
        
        // Tir
        { month: 4, day: 26, title: "تاسوعای حسینی", type: "religious" },
        { month: 4, day: 27, title: "عاشورای حسینی", type: "religious" },
        
        // Mordad
        { month: 5, day: 5, title: "اربعین حسینی", type: "religious" },
        { month: 5, day: 13, title: "رحلت پیامبر (ص) و شهادت امام حسن (ع)", type: "religious" },
        { month: 5, day: 15, title: "شهادت امام رضا (ع)", type: "religious" },
        
        // Shahrivar
        { month: 6, day: 23, title: "میلاد پیامبر (ص) و امام صادق (ع)", type: "religious" },
        
        // Dey
        { month: 10, day: 2, title: "شهادت امام علی (ع)", type: "religious" },
        
        // Bahman
        { month: 11, day: 13, title: "عید مبعث", type: "religious" },
        { month: 11, day: 22, title: "پیروزی انقلاب اسلامی", type: "official" },
        
        // Esfand
        { month: 12, day: 23, title: "ولادت امام علی (ع)", type: "religious" },
        { month: 12, day: 29, title: "ملی شدن صنعت نفت", type: "official" }
    ]
};

// Helper function to check if a Jalali date is a holiday
function isHoliday(jy, jm, jd) {
    const yearHolidays = IranianHolidays[jy];
    if (!yearHolidays) return null;
    
    return yearHolidays.find(h => h.month === jm && h.day === jd);
}

// Get all holidays for a specific Jalali month
function getHolidaysForMonth(jy, jm) {
    const yearHolidays = IranianHolidays[jy];
    if (!yearHolidays) return [];
    
    return yearHolidays.filter(h => h.month === jm);
}

window.IranianHolidays = IranianHolidays;
window.isHoliday = isHoliday;
window.getHolidaysForMonth = getHolidaysForMonth;