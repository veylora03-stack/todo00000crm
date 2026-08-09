Write-Host "
========================================" -ForegroundColor Cyan
Write-Host "  PWA ENHANCEMENTS TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================
" -ForegroundColor Cyan

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

# ===== 1. manifest.json =====
Write-Host "[1] manifest.json" -ForegroundColor Yellow
if (Test-Path "src\public\manifest.json") {
    try {
        $manifest = Get-Content "src\public\manifest.json" -Raw | ConvertFrom-Json
        Test-Check "manifest.json exists" $true
        Test-Check "Has 'name'" ($null -ne $manifest.name)
        Test-Check "Has 'display=standalone'" ($manifest.display -eq 'standalone')
        Test-Check "Has 'lang=fa'" ($manifest.lang -eq 'fa')
        Test-Check "Has 'dir=rtl'" ($manifest.dir -eq 'rtl')
        Test-Check "Has icons" ($null -ne $manifest.icons)
        if ($null -ne $manifest.icons) {
            # Use @() to force array + Measure-Object for reliable count
            $icon192 = @($manifest.icons | Where-Object { $_.sizes -eq '192x192' } | Measure-Object).Count
            $icon512 = @($manifest.icons | Where-Object { $_.sizes -eq '512x512' } | Measure-Object).Count
            $iconPurpose = @($manifest.icons | Where-Object { $_.purpose } | Measure-Object).Count
            $iconMaskable = @($manifest.icons | Where-Object { $_.purpose -match 'maskable' } | Measure-Object).Count
            
            Test-Check "Has 192x192 icon" ($icon192 -gt 0)
            Test-Check "Has 512x512 icon" ($icon512 -gt 0)
            Test-Check "Icons have 'purpose'" ($iconPurpose -gt 0)
            Test-Check "Icons have 'maskable'" ($iconMaskable -gt 0)
        }
        if ($null -ne $manifest.shortcuts) {
            Test-Check "Has shortcuts" $true
            # Use array of URLs and -contains/-match on array
            $shortcutUrls = @($manifest.shortcuts | ForEach-Object { $_.url })
            Test-Check "Has tasks shortcut" (($shortcutUrls | Where-Object { $_ -match 'tasks' } | Measure-Object).Count -gt 0)
            Test-Check "Has people shortcut" (($shortcutUrls | Where-Object { $_ -match 'people' } | Measure-Object).Count -gt 0)
            Test-Check "Has dashboard shortcut" (($shortcutUrls | Where-Object { $_ -match 'dashboard' } | Measure-Object).Count -gt 0)
        } else {
            Test-Check "Has shortcuts" $false
        }
    } catch {
        Write-Host "  [FAIL] Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
    }
}

# ===== 2. sw.js =====
Write-Host "
[2] Service Worker" -ForegroundColor Yellow
if (Test-Path "src\public\sw.js") {
    $sw = Get-Content "src\public\sw.js" -Raw
    Test-Check "sw.js exists" $true
    Test-Check "Has install event" ($sw -match 'addEventListener.*install')
    Test-Check "Has activate event" ($sw -match 'addEventListener.*activate')
    Test-Check "Has fetch event" ($sw -match 'addEventListener.*fetch')
    Test-Check "Has CACHE_VERSION" ($sw -match 'CACHE_VERSION')
    Test-Check "Has cacheFirst function" ($sw -match 'cacheFirst')
    Test-Check "Has networkFirst function" ($sw -match 'networkFirst')
    Test-Check "Has offline fallback" ($sw -match 'آفلاین|offline')
}

# ===== 3. index.html =====
Write-Host "
[3] index.html" -ForegroundColor Yellow
if (Test-Path "src\public\index.html") {
    $html = Get-Content "src\public\index.html" -Raw
    Test-Check "index.html exists" $true
    Test-Check "Has manifest link" ($html -match 'rel=.manifest.')
    Test-Check "Has theme-color" ($html -match 'theme-color')
    Test-Check "Has SW registration" ($html -match 'serviceWorker.register')
}

# ===== Summary =====
Write-Host "
========================================" -ForegroundColor Cyan
Write-Host "  Passed: $script:passed" -ForegroundColor Green
Write-Host "  Failed: $script:failed" -ForegroundColor $(if ($script:failed -eq 0) { "Green" } else { "Red" })
Write-Host "  Total:  $($script:passed + $script:failed)" -ForegroundColor Cyan
if ($script:failed -eq 0) {
    Write-Host "
  ✓ ALL PWA TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "
  ✗ Some tests failed" -ForegroundColor Red
}
Write-Host ""
