# ===== CRM Pro Performance Test Suite =====
# Run this after every major change

Write-Host "`n=== CRM PRO PERFORMANCE TEST ===" -ForegroundColor Cyan
Write-Host ""

$script:passed = 0
$script:failed = 0

function Test-Check($name, $condition) {
    if ($condition) {
        Write-Host "  [PASS] $name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $name" -ForegroundColor Red
        $script:failed++
    }
}

# ===== 1. File existence =====
Write-Host "`n[1] File Existence" -ForegroundColor Yellow
Test-Check "bundle-core.js exists" (Test-Path "src\public\js\bundle-core.js")
Test-Check "bundle-modules.js exists" (Test-Path "src\public\js\bundle-modules.js")
Test-Check "app.css exists" (Test-Path "src\public\css\app.css")
Test-Check "index.html exists" (Test-Path "src\public\index.html")
Test-Check "store.js exists" (Test-Path "src\public\js\store.js")
Test-Check "bus.js exists" (Test-Path "src\public\js\bus.js")

# ===== 2. Bundle sizes =====
Write-Host "`n[2] Bundle Sizes" -ForegroundColor Yellow
$core = Get-Item "src\public\js\bundle-core.js" -ErrorAction SilentlyContinue
$modules = Get-Item "src\public\js\bundle-modules.js" -ErrorAction SilentlyContinue
if ($core) {
    $coreKB = [math]::Round($core.Length / 1KB, 2)
    Test-Check "bundle-core.js < 150 KB ($coreKB KB)" ($coreKB -lt 150)
}
if ($modules) {
    $modulesKB = [math]::Round($modules.Length / 1KB, 2)
    Test-Check "bundle-modules.js < 300 KB ($modulesKB KB)" ($modulesKB -lt 300)
}

# ===== 3. HTML structure =====
Write-Host "`n[3] HTML Structure" -ForegroundColor Yellow
$html = Get-Content "src\public\index.html" -Raw
Test-Check "index.html has bundle-core.js" ($html -match 'bundle-core\.js')
Test-Check "index.html has bundle-modules.js" ($html -match 'bundle-modules\.js')
Test-Check "index.html has preload hints" ($html -match 'rel="preload"')
Test-Check "No CSP blocking" (-not ($html -match 'Content-Security-Policy'))

# ===== 4. Console.log cleanup =====
Write-Host "`n[4] Console.log Cleanup" -ForegroundColor Yellow
$jsFiles = Get-ChildItem src\public\js\*.js -File | Where-Object { $_.Name -notmatch 'bundle' }
$consoleCount = 0
foreach ($f in $jsFiles) {
    $content = Get-Content $f.FullName -Raw
    $consoleCount += ([regex]::Matches($content, 'console\.(log|warn|error|info)')).Count
}
Test-Check "Console.log count < 10 ($consoleCount found)" ($consoleCount -lt 10)

# ===== 5. Server check =====
Write-Host "`n[5] Server Check" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "http://localhost:8088" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Test-Check "Server responding" ($r.StatusCode -eq 200)
} catch {
    Write-Host "  [SKIP] Server not running" -ForegroundColor Yellow
}

# ===== Summary =====
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passed: $script:passed" -ForegroundColor Green
Write-Host "  Failed: $script:failed" -ForegroundColor $(if ($script:failed -eq 0) { "Green" } else { "Red" })
Write-Host "  Total:  $($script:passed + $script:failed)" -ForegroundColor Cyan

if ($script:failed -eq 0) {
    Write-Host "`n  ✓ ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "`n  ✗ Some tests failed!" -ForegroundColor Red
}
Write-Host ""
