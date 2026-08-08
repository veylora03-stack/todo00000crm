// Native SVG Charts Library - Fully Offline, Linear-style
// No external dependencies, pure SVG

const Charts = {
    // ===== Bar Chart =====
    bar: function(container, data, options = {}) {
        const el = document.getElementById(container);
        if (!el) return;
        
        const {
            width = 400,
            height = 200,
            padding = { top: 20, right: 20, bottom: 40, left: 40 },
            color = '#7c3aed',
            gridColor = 'var(--border-default)',
            labelColor = 'var(--text-tertiary)',
            valueColor = 'var(--text-primary)'
        } = options;
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...data.map(d => d.value), 1);
        const barWidth = chartWidth / data.length * 0.7;
        const barGap = chartWidth / data.length * 0.3;
        
        // Grid lines
        const gridLines = [];
        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padding.top + (chartHeight / gridSteps) * i;
            const val = Math.round(maxValue - (maxValue / gridSteps) * i);
            gridLines.push(`
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
                    stroke="${gridColor}" stroke-width="1" stroke-dasharray="2,2" opacity="0.5"/>
                <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" 
                    font-size="10" fill="${labelColor}" font-family="Vazirmatn, sans-serif">${val}</text>
            `);
        }
        
        // Bars with animation
        const bars = data.map((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight;
            const x = padding.left + (chartWidth / data.length) * i + barGap / 2;
            const y = padding.top + chartHeight - barHeight;
            
            return `
                <g class="chart-bar" data-index="${i}">
                    <rect x="${x}" y="${padding.top + chartHeight}" width="${barWidth}" height="0" 
                        rx="4" fill="${color}" opacity="0.85"
                        style="transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); transition-delay: ${i * 50}ms;">
                        <animate attributeName="y" from="${padding.top + chartHeight}" to="${y}" dur="0.6s" begin="${i * 50}ms" fill="freeze"/>
                        <animate attributeName="height" from="0" to="${barHeight}" dur="0.6s" begin="${i * 50}ms" fill="freeze"/>
                    </rect>
                    <text x="${x + barWidth / 2}" y="${padding.top + chartHeight + 20}" text-anchor="middle"
                        font-size="11" fill="${labelColor}" font-family="Vazirmatn, sans-serif" font-weight="500">${d.label}</text>
                    ${d.value > 0 ? `
                    <text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle"
                        font-size="10" fill="${valueColor}" font-family="Vazirmatn, sans-serif" font-weight="600">${d.value}</text>
                    ` : ''}
                </g>
            `;
        }).join('');
        
        el.innerHTML = `
            <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                ${gridLines.join('')}
                ${bars}
            </svg>
        `;
    },
    
    // ===== Doughnut Chart =====
    doughnut: function(container, data, options = {}) {
        const el = document.getElementById(container);
        if (!el) return;
        
        const {
            width = 200,
            height = 200,
            innerRadius = 0.6,
            colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444'],
            labelColor = 'var(--text-primary)',
            subLabelColor = 'var(--text-tertiary)'
        } = options;
        
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) {
            el.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:${height}px; color:var(--text-tertiary); font-size:13px;">داده‌ای وجود ندارد</div>`;
            return;
        }
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;
        const innerR = radius * innerRadius;
        
        let currentAngle = -Math.PI / 2; // Start from top
        const slices = [];
        const labels = [];
        
        data.forEach((d, i) => {
            if (d.value === 0) return;
            
            const sliceAngle = (d.value / total) * Math.PI * 2;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const ix1 = centerX + innerR * Math.cos(startAngle);
            const iy1 = centerY + innerR * Math.sin(startAngle);
            const ix2 = centerX + innerR * Math.cos(endAngle);
            const iy2 = centerY + innerR * Math.sin(endAngle);
            
            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            
            const path = `
                M ${ix1} ${iy1}
                L ${x1} ${y1}
                A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                L ${ix2} ${iy2}
                A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}
                Z
            `;
            
            const color = colors[i % colors.length];
            
            slices.push(`
                <path d="${path}" fill="${color}" opacity="0.9"
                    style="transition: opacity 0.2s; cursor: pointer;"
                    onmouseover="this.style.opacity='1'; this.style.transform='scale(1.02)'; this.style.transformOrigin='center';"
                    onmouseout="this.style.opacity='0.9'; this.style.transform='scale(1)';">
                    <title>${d.label}: ${d.value} (${Math.round((d.value/total)*100)}%)</title>
                </path>
            `);
            
            currentAngle = endAngle;
        });
        
        // Legend
        const legendHtml = data.map((d, i) => {
            const color = colors[i % colors.length];
            const pct = Math.round((d.value / total) * 100);
            return `
                <div style="display:flex; align-items:center; gap:8px; padding:6px 0;">
                    <div style="width:10px; height:10px; border-radius:2px; background:${color}; flex-shrink:0;"></div>
                    <div style="flex:1; font-size:12px; color:var(--text-secondary);">${d.label}</div>
                    <div style="font-size:12px; color:var(--text-primary); font-weight:600;">${d.value}</div>
                    <div style="font-size:11px; color:var(--text-tertiary); width:40px; text-align:left;">${pct}%</div>
                </div>
            `;
        }).join('');
        
        el.innerHTML = `
            <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="flex-shrink:0;">
                    ${slices.join('')}
                    <text x="${centerX}" y="${centerY - 6}" text-anchor="middle" 
                        font-size="22" font-weight="700" fill="${labelColor}" font-family="Vazirmatn, sans-serif">${total}</text>
                    <text x="${centerX}" y="${centerY + 14}" text-anchor="middle" 
                        font-size="11" fill="${subLabelColor}" font-family="Vazirmatn, sans-serif">مجموع</text>
                </svg>
                <div style="flex:1; min-width:140px;">
                    ${legendHtml}
                </div>
            </div>
        `;
    },
    
    // ===== Heatmap (GitHub-style) =====
    heatmap: function(container, data, options = {}) {
        const el = document.getElementById(container);
        if (!el) return;
        
        const {
            cellSize = 12,
            cellGap = 3,
            colors = ['#1c1c1f', '#3d1f5c', '#5b2c9a', '#7c3aed', '#a855f7'],
            labelColor = 'var(--text-tertiary)',
            dayLabels = ['شنبه', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه']
        } = options;
        
        // Create data map
        const dateMap = {};
        data.forEach(d => {
            const dateStr = new Date(d.date).toISOString().split('T')[0];
            dateMap[dateStr] = (dateMap[dateStr] || 0) + d.count;
        });
        
        // Generate last 120 days
        const days = [];
        for (let i = 119; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date: date,
                dateStr: dateStr,
                count: dateMap[dateStr] || 0
            });
        }
        
        const maxCount = Math.max(...days.map(d => d.count), 1);
        
        // Group by week
        const weeks = [];
        let currentWeek = [];
        
        // Pad first week
        const firstDay = days[0].date.getDay(); // 0=Sunday
        // Adjust for Persian week (Saturday = 0)
        const persianFirstDay = (firstDay + 1) % 7;
        
        for (let i = 0; i < persianFirstDay; i++) {
            currentWeek.push(null);
        }
        
        days.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });
        
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
        
        // Build cells
        const cells = [];
        weeks.forEach((week, wi) => {
            week.forEach((day, di) => {
                if (!day) return;
                
                const x = wi * (cellSize + cellGap);
                const y = di * (cellSize + cellGap);
                
                let colorIdx = 0;
                if (day.count > 0) {
                    const ratio = day.count / maxCount;
                    colorIdx = Math.ceil(ratio * (colors.length - 1));
                }
                
                const color = colors[colorIdx];
                const tooltip = `${day.dateStr}: ${day.count} فعالیت`;
                
                cells.push(`
                    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" 
                        fill="${color}" style="cursor:pointer; transition: all 0.15s;"
                        onmouseover="this.setAttribute('stroke','white'); this.setAttribute('stroke-width','1');"
                        onmouseout="this.removeAttribute('stroke'); this.removeAttribute('stroke-width');">
                        <title>${tooltip}</title>
                    </rect>
                `);
            });
        });
        
        const totalWidth = weeks.length * (cellSize + cellGap);
        const totalHeight = 7 * (cellSize + cellGap);
        
        // Day labels (right side for RTL)
        const dayLabelsHtml = [1, 3, 5].map(i => `
            <text x="${totalWidth + 10}" y="${i * (cellSize + cellGap) + cellSize/2 + 4}" 
                font-size="10" fill="${labelColor}" font-family="Vazirmatn, sans-serif">${dayLabels[i]}</text>
        `).join('');
        
        el.innerHTML = `
            <div style="overflow-x:auto; padding:8px 0;">
                <svg width="${totalWidth + 60}" height="${totalHeight + 20}" viewBox="0 0 ${totalWidth + 60} ${totalHeight + 20}">
                    ${cells.join('')}
                    ${dayLabelsHtml}
                </svg>
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:12px; font-size:11px; color:var(--text-tertiary);">
                <span>کم</span>
                ${colors.map(c => `<div style="width:10px; height:10px; border-radius:2px; background:${c};"></div>`).join('')}
                <span>زیاد</span>
            </div>
        `;
    },
    
    // ===== Sparkline =====
    sparkline: function(container, data, options = {}) {
        const el = document.getElementById(container);
        if (!el) return;
        
        const {
            width = 80,
            height = 30,
            color = '#7c3aed',
            fill = true
        } = options;
        
        if (!data.length) return;
        
        const maxValue = Math.max(...data, 1);
        const minValue = Math.min(...data, 0);
        const range = maxValue - minValue || 1;
        
        const step = width / (data.length - 1 || 1);
        const points = data.map((val, i) => {
            const x = i * step;
            const y = height - ((val - minValue) / range) * (height - 4) - 2;
            return `${x},${y}`;
        });
        
        const pathLine = `M ${points.join(' L ')}`;
        const pathFill = `${pathLine} L ${width},${height} L 0,${height} Z`;
        
        el.innerHTML = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                ${fill ? `<path d="${pathFill}" fill="${color}" opacity="0.15"/>` : ''}
                <path d="${pathLine}" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                ${data.length > 0 ? `
                    <circle cx="${(data.length - 1) * step}" cy="${height - ((data[data.length - 1] - minValue) / range) * (height - 4) - 2}" 
                        r="2" fill="${color}"/>
                ` : ''}
            </svg>
        `;
    },
    
    // ===== Line Chart (Trend) =====
    line: function(container, data, options = {}) {
        const el = document.getElementById(container);
        if (!el) return;
        
        const {
            width = 400,
            height = 200,
            padding = { top: 20, right: 20, bottom: 40, left: 40 },
            color = '#7c3aed',
            gridColor = 'var(--border-default)',
            labelColor = 'var(--text-tertiary)'
        } = options;
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        const maxValue = Math.max(...data.map(d => d.value), 1);
        const minValue = 0;
        const range = maxValue - minValue || 1;
        
        const points = data.map((d, i) => {
            const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i;
            const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
            return { x, y, ...d };
        });
        
        // Grid
        const gridLines = [];
        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padding.top + (chartHeight / gridSteps) * i;
            const val = Math.round(maxValue - (maxValue / gridSteps) * i);
            gridLines.push(`
                <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
                    stroke="${gridColor}" stroke-width="1" stroke-dasharray="2,2" opacity="0.5"/>
                <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" 
                    font-size="10" fill="${labelColor}" font-family="Vazirmatn, sans-serif">${val}</text>
            `);
        }
        
        // Area fill
        const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaPath = `${linePath} L ${points[points.length-1].x},${padding.top + chartHeight} L ${points[0].x},${padding.top + chartHeight} Z`;
        
        // Labels
        const labels = points.filter((p, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1)
            .map(p => `
                <text x="${p.x}" y="${padding.top + chartHeight + 20}" text-anchor="middle"
                    font-size="10" fill="${labelColor}" font-family="Vazirmatn, sans-serif">${p.label}</text>
            `).join('');
        
        // Dots
        const dots = points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" stroke="white" stroke-width="1.5"
                style="cursor:pointer;">
                <title>${p.label}: ${p.value}</title>
            </circle>
        `).join('');
        
        el.innerHTML = `
            <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="lineGrad_${container}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                ${gridLines.join('')}
                <path d="${areaPath}" fill="url(#lineGrad_${container})"/>
                <path d="${linePath}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                ${dots}
                ${labels}
            </svg>
        `;
    }
};

// Export
window.Charts = Charts;