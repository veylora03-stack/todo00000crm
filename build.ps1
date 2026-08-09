# ===== CRM Pro Build System (v3 - Split Bundle) =====
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

# 2) Split into core and modules
$coreModules = @('icons.js', 'charts.js', 'holidays.js', 'core.js', 'bus.js', 'store.js', 'vault.js', 'router.js')
$coreBundle = "// CRM PRO CORE BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"
$modulesBundle = "// CRM PRO MODULES BUNDLE (auto) " + (Get-Date -Format "yyyy-MM-dd HH:mm") + "`n"

foreach ($f in $order) {
    $p = Join-Path $pub ("js\" + $f)
    if (Test-Path $p) {
        $content = "`n/* === " + $f + " === */`n" + (Get-Content $p -Raw -Encoding UTF8) + "`n"
        if ($coreModules -contains $f) {
            $coreBundle += $content
        } else {
            $modulesBundle += $content
        }
    } else {
        Write-Host ("  ! missing " + $f) -ForegroundColor Yellow
    }
}

# 3) Write bundles
$corePath = Join-Path $pub "js\bundle-core.js"
$modulesPath = Join-Path $pub "js\bundle-modules.js"
[System.IO.File]::WriteAllText($corePath, $coreBundle, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllText($modulesPath, $modulesBundle, [System.Text.UTF8Encoding]::new($false))

$coreKB = [math]::Round((Get-Item $corePath).Length/1KB)
$modulesKB = [math]::Round((Get-Item $modulesPath).Length/1KB)
Write-Host ("bundle-core.js: {0} KB" -f $coreKB) -ForegroundColor Green
Write-Host ("bundle-modules.js: {0} KB" -f $modulesKB) -ForegroundColor Green

# 4) Generate index.html from dev
$newIndex = $dev
foreach ($x in $m) { $newIndex = $newIndex.Replace($x.Value, "") }
$newIndex = $newIndex -replace '</body>', "    <script src=`"js/bundle-core.js`"></script>`n    <script src=`"js/bundle-modules.js`" defer></script>`n</body>"
[System.IO.File]::WriteAllText($indexPath, $newIndex, [System.Text.UTF8Encoding]::new($false))
Write-Host "index.html regenerated (split bundles)" -ForegroundColor Green
Write-Host "Build OK" -ForegroundColor Cyan