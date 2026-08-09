# ===== CRM Pro Build System (v4 - Chunked Bundles) =====
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pub = Join-Path $root "src\public"
$devPath = Join-Path $pub "index.dev.html"
$indexPath = Join-Path $pub "index.html"

if (-not (Test-Path $devPath)) { Write-Host "index.dev.html missing!"; exit 1 }
$dev = Get-Content $devPath -Raw -Encoding UTF8

# 1) Extract module order from DEV file
$m = [regex]::Matches($dev, '<script src="js/([^"]+\.js)"[^>]*>\s*</script>')
$order = @()
foreach ($x in $m) { $f = $x.Groups[1].Value; if ($f -ne "bundle.js" -and $f -ne "bundle-core.js" -and $f -ne "bundle-modules.js") { $order += $f } }
Write-Host ("Modules: {0}" -f $order.Count) -ForegroundColor Cyan

# 2) Split into chunks (Phase 40 - Advanced Chunking)
$chunks = @{
    'core' = @{
        files = @('icons.js', 'charts.js', 'holidays.js', 'core.js', 'bus.js', 'store.js', 'vault.js', 'router.js', 'performance-monitor.js')
        content = "// CRM PRO CORE BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"
    }
    'charts' = @{
        files = @('dashboard-pro.js', 'focus-suite.js', 'vitals.js', 'dashboard-qa.js', 'gamification.js', 'wrapped.js')
        content = "// CRM PRO CHARTS BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"
    }
    'crm' = @{
        files = @('relationships.js', 'companies.js', 'pipeline.js', 'projects-pro.js', 'automation.js')
        content = "// CRM PRO CRM BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"
    }
    'productivity' = @{
        files = @('inbox.js', 'inbox-design.js', 'inbox-pro.js', 'inbox-zen.js', 'calendar.js', 'smart.js', 'okr.js')
        content = "// CRM PRO PRODUCTIVITY BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"
    }
    'knowledge' = @{
        files = @('graph.js')
        content = "// CRM PRO KNOWLEDGE BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"
    }
    'system' = @{
        files = @('backup.js', 'notifications.js', 'reports.js', 'customize.js', 'context.js', 'widget-export.js', 'widget-interactions.js', 'quick-start.js', 'ai-insights.js', 'mobile.js', 'command-hub.js', 'ambient.js', 'layout-pro.js', 'topbar-pro.js', 'global-search.js')
        content = "// CRM PRO SYSTEM BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"
    }
}

# Distribute modules into chunks
foreach ($f in $order) {
    $p = Join-Path $pub ("js\" + $f)
    if (Test-Path $p) {
        $content = "`n/* === " + $f + " === */`n" + (Get-Content $p -Raw -Encoding UTF8) + "`n"
        $found = $false
        foreach ($chunkName in $chunks.Keys) {
            if ($chunks[$chunkName].files -contains $f) {
                $chunks[$chunkName].content += $content
                $found = $true
                break
            }
        }
        if (-not $found) {
            # Fallback: add to system chunk
            $chunks['system'].content += $content
            Write-Host ("  ! " + $f + " -> system (not mapped)" ) -ForegroundColor Yellow
        }
    } else {
        Write-Host ("  ! missing " + $f) -ForegroundColor Yellow
    }
}

# 3) Write chunks
foreach ($chunkName in $chunks.Keys) {
    $chunkPath = Join-Path $pub ("js\bundle-" + $chunkName + ".js")
    [System.IO.File]::WriteAllText($chunkPath, $chunks[$chunkName].content, [System.Text.UTF8Encoding]::new($false))
    $kb = [math]::Round((Get-Item $chunkPath).Length/1KB)
    Write-Host ("bundle-{0}.js: {1} KB" -f $chunkName, $kb) -ForegroundColor Green
}

# 4) Generate index.html from dev
$newIndex = $dev
foreach ($x in $m) { $newIndex = $newIndex.Replace($x.Value, "") }
$newIndex = $newIndex -replace '</body>', "    <script src=`"js/bundle-core.js`"></script>`n    <script src=`"js/bundle-charts.js`" defer></script>`n    <script src=`"js/bundle-crm.js`" defer></script>`n    <script src=`"js/bundle-productivity.js`" defer></script>`n    <script src=`"js/bundle-knowledge.js`" defer></script>`n    <script src=`"js/bundle-system.js`" defer></script>`n</body>"
[System.IO.File]::WriteAllText($indexPath, $newIndex, [System.Text.UTF8Encoding]::new($false))
Write-Host "index.html regenerated (chunked bundles)" -ForegroundColor Green
Write-Host "Build OK" -ForegroundColor Cyan