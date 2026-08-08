# Quick start script for the server
Write-Host "Starting Local CRM Todo Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$PSScriptRoot\server.ps1`""
Write-Host "Server window opened. Access at: http://localhost:8080/" -ForegroundColor Green
Write-Host "To test API, run: Invoke-RestMethod http://localhost:8080/api/people" -ForegroundColor Yellow