# CRM Pro - Start Server
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$server = Join-Path $root "src\server\server.ps1"
Write-Host "Starting CRM Pro on http://localhost:8088 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-File","`"$server`""
Start-Sleep -Seconds 3
Start-Process "http://localhost:8088/"