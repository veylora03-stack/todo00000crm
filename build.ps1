# ===== CRM Pro Build System =====
# ماژول‌های JS را با همان ترتیب فعلی index.html به یک bundle.js تبدیل می‌کند.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pub = Join-Path $root "src\public"
$indexPath = Join-Path $pub "index.html"
$index = Get-Content $indexPath -Raw -Encoding UTF8

# 1) Extract current js order
$m = [regex]::Matches($index, '<script src="js/([^"]+\.js)"[^>]*>\s*</script>')
$order = @()
foreach ($x in $m) { $f = $x.Groups[1].Value; if ($f -ne "bundle.js") { $order += $f } }

Write-Host ("Found {0} modules" -f $order.Count) -ForegroundColor Cyan

# 2) Concatenate
$bundle = "// ===== CRM PRO BUNDLE (auto-generated) =====`n// Build: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "`n// Modules: " + ($order -join ", ") + "`n`n"
foreach ($f in $order) {
    $p = Join-Path $pub ("js\" + $f)
    if (Test-Path $p) {
        $bundle += "`n/* ========== " + $f + " ========== */`n"
        $bundle += (Get-Content $p -Raw -Encoding UTF8) + "`n"
    } else {
        Write-Host ("  ! missing: " + $f) -ForegroundColor Yellow
    }
}
$bundlePath = Join-Path $pub "js\bundle.js"
[System.IO.File]::WriteAllText($bundlePath, $bundle, [System.Text.UTF8Encoding]::new($false))
Write-Host ("bundle.js written: {0} KB" -f [math]::Round((Get-Item $bundlePath).Length/1KB)) -ForegroundColor Green

# 3) Backup dev index
$devPath = Join-Path $pub "index.dev.html"
[System.IO.File]::WriteAllText($devPath, $index, [System.Text.UTF8Encoding]::new($false))
Write-Host "index.dev.html backup saved" -ForegroundColor Green

# 4) Replace script tags with single bundle
$newIndex = $index
foreach ($x in $m) { $newIndex = $newIndex.Replace($x.Value, "") }
# insert bundle before </body>
$newIndex = $newIndex -replace '</body>', "    <script src=`"js/bundle.js`"></script>`n</body>"
[System.IO.File]::WriteAllText($indexPath, $newIndex, [System.Text.UTF8Encoding]::new($false))
Write-Host "index.html now loads single bundle.js" -ForegroundColor Green

Write-Host ""
Write-Host "Build complete!" -ForegroundColor Cyan
Write-Host "  Revert if needed: copy src\public\index.dev.html src\public\index.html" -ForegroundColor Yellow