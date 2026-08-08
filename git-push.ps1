param([string]$Message = "update")
Set-Location "C:\Users\Lenovo\Desktop\crm-todo"
git add .
git commit -m $Message
git push origin main
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green }
else { Write-Host "❌ Push failed" -ForegroundColor Red }