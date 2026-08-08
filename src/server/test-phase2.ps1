# Test Script for Phase 2

. "$PSScriptRoot\models.ps1"

Write-Host ""
Write-Host "=== Phase 2 Test ===" -ForegroundColor Cyan
Write-Host ""

# Test Person
Write-Host "Creating test person..." -ForegroundColor Yellow
$person = Add-Person -Name "علی احمدی" -Email "ali@example.com" -Phone "09123456789" -Company "شرکت تست" -Notes "مشتری قدیمی" -Tags @("مشتری", "VIP")
Write-Host "Created person: $($person.name) (ID: $($person.id))" -ForegroundColor Green

# Test Task
Write-Host "Creating test task..." -ForegroundColor Yellow
$task = Add-Task -Title "ارسال پیشنهاد پروژه" -Description "ارسال پیشنهاد برای پروژه جدید" -DueDate "2026-08-15T00:00:00Z" -Priority "high" -Status "pending" -PersonId $person.id -Tags @("کار", "فوری")
Write-Host "Created task: $($task.title) (ID: $($task.id))" -ForegroundColor Green

# Test Idea
Write-Host "Creating test idea..." -ForegroundColor Yellow
$idea = Add-Idea -Title "اپلیکیشن مدیریت زمان" -Description "ایده ساخت اپلیکیشن برای مدیریت زمان شخصی" -Status "draft" -Tags @("ایده", "موبایل")
Write-Host "Created idea: $($idea.title) (ID: $($idea.id))" -ForegroundColor Green

# Test Note
Write-Host "Creating test note..." -ForegroundColor Yellow
$note = Add-Note -Title "جلسه با علی" -Content "در مورد پروژه جدید صحبت کردیم. قرار شد پیشنهاد را تا هفته آینده بفرستیم." -PersonId $person.id -Tags @("جلسه", "یادداشت")
Write-Host "Created note: $($note.title) (ID: $($note.id))" -ForegroundColor Green

# Test Project
Write-Host "Creating test project..." -ForegroundColor Yellow
$project = Add-Project -Name "پروژه CRM" -Description "ساخت سیستم CRM شخصی" -Status "active" -StartDate "2026-08-01T00:00:00Z" -EndDate "2026-12-31T00:00:00Z" -Tags @("پروژه", "نرم‌افزار")
Write-Host "Created project: $($project.name) (ID: $($project.id))" -ForegroundColor Green

# Test Interaction
Write-Host "Creating test interaction..." -ForegroundColor Yellow
$interaction = Add-Interaction -PersonId $person.id -Type "meeting" -Subject "جلسه اولیه" -Content "اولین جلسه برای بررسی نیازمندی‌ها" -Date "2026-08-08T10:00:00Z"
Write-Host "Created interaction: $($interaction.type) (ID: $($interaction.id))" -ForegroundColor Green

Write-Host ""
Write-Host "=== Data Summary ===" -ForegroundColor Cyan

$peopleCount = (Get-People).Count
$tasksCount = (Get-Tasks).Count
$ideasCount = (Get-Ideas).Count
$notesCount = (Get-Notes).Count
$projectsCount = (Get-Projects).Count
$interactionsCount = (Get-Interactions).Count

Write-Host "People: $peopleCount"
Write-Host "Tasks: $tasksCount"
Write-Host "Ideas: $ideasCount"
Write-Host "Notes: $notesCount"
Write-Host "Projects: $projectsCount"
Write-Host "Interactions: $interactionsCount"

Write-Host ""
Write-Host "=== Activity Logs ===" -ForegroundColor Cyan
$logPath = Join-Path $PSScriptRoot "..\..\data\activity_logs.json"
$logs = Read-JsonData $logPath
$logs | Select-Object entityType, action, details, createdAtUtc | Format-Table -AutoSize

Write-Host ""
Write-Host "=== Sample Person ===" -ForegroundColor Cyan
Get-People | Select-Object -First 1 | Format-List

Write-Host ""
Write-Host "Phase 2 test completed successfully!" -ForegroundColor Green