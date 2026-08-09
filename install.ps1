# CRM Pro - Installer
param([switch]$SkipData)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "=== CRM Pro Installer ===" -ForegroundColor Cyan

# Ensure folders
foreach ($d in @("data","backups")) {
    $p = Join-Path $root $d
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null; Write-Host "Created $d/" -ForegroundColor Green }
}

# Seed empty data files if missing
if (-not $SkipData) {
    $entities = @("people","tasks","ideas","notes","projects","interactions","deals","companies","activity_logs")
    foreach ($e in $entities) {
        $f = Join-Path $root "data\$e.json"
        if (-not (Test-Path $f)) { Set-Content $f "[]" -Encoding UTF8; Write-Host "Seeded $e.json" -ForegroundColor Green }
    }
}

Write-Host ""
Write-Host "Install complete! Run: .\start.ps1" -ForegroundColor Yellow