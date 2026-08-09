# Local CRM Pro Server - Complete Clean Version
# All routes: CRUD + Search + Backup + Export/Import + Attachments + PWA

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\storage.ps1"
. "$PSScriptRoot\models.ps1"
. "$PSScriptRoot\backup.ps1"
. "$PSScriptRoot\notifications.ps1"

$port = 8088
$baseUrl = "http://localhost:$port/"
$publicPath = Join-Path $PSScriptRoot "..\public"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CRM Pro Server v4 (Complete Clean Build)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " URL: $baseUrl" -ForegroundColor Green
Write-Host " Public path: $publicPath" -ForegroundColor Gray
Write-Host " Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ===== Helper Functions =====
function Send-Response {
    param($Context, [int]$StatusCode = 200, [string]$ContentType = "text/plain", [string]$Content = "", [byte[]]$Bytes = $null)
    try {
        $response = $Context.Response
        $response.StatusCode = $StatusCode
        $response.ContentType = "$ContentType; charset=utf-8"
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        # Cache-Control for static files
        if ($relativePath -match "\.(js|css|html)$") {
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Pragma", "no-cache")
            $response.Headers.Add("Expires", "0")
        }
        
        if ($Bytes) { 
            $buffer = $Bytes 
        } else { 
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($Content) 
        }
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    } catch {
        Write-Host "Send-Response error: $_" -ForegroundColor Red
    }
}

function Get-MimeType {
    param([string]$Extension)
    switch ($Extension.ToLower()) {
        ".html" { return "text/html" }
        ".css" { return "text/css" }
        ".js" { return "application/javascript" }
        ".json" { return "application/json" }
        ".webmanifest" { return "application/manifest+json" }
        ".manifest" { return "application/manifest+json" }
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif" { return "image/gif" }
        ".svg" { return "image/svg+xml" }
        ".ico" { return "image/x-icon" }
        default { return "application/octet-stream" }
    }
}

function Get-RequestBody {
    param($Context)
    try {
        $reader = New-Object System.IO.StreamReader($Context.Request.InputStream, $Context.Request.ContentEncoding)
        $body = $reader.ReadToEnd()
        $reader.Close()
        return $body
    } catch {
        return ""
    }
}

# ===== Start Server =====
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($baseUrl)

try {
    $listener.Start()
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $url = $request.Url.AbsolutePath
        $method = $request.HttpMethod
        $timestamp = (Get-Date).ToString("HH:mm:ss")
        
        # Don't log static file requests to reduce noise
        if ($url -notmatch '\.(css|js|svg|png|jpg|jpeg|gif|ico)$' -and $url -ne '/sw.js' -and $url -ne '/manifest.json') {
            Write-Host "[$timestamp] $method $url" -ForegroundColor Gray
        }
        
        try {
            # Handle CORS preflight
            if ($method -eq "OPTIONS") {
                Send-Response -Context $context -StatusCode 200 -Content ""
                continue
            }
            
            
            # ===== COMPANIES ROUTES (Phase 29) =====
            if ($url -eq "/api/companies" -or $url -match "^/api/companies/.+") {
                $path = Get-DataPath "companies"
                $comps = @(Read-JsonData $path)
                if ($method -eq "GET") {
                    Send-Response -Context $context -ContentType "application/json" -Content ($comps | ConvertTo-Json -Depth 10)
                    continue
                }
                if ($method -eq "POST") {
                    $data = (Get-RequestBody -Context $context) | ConvertFrom-Json
                    $new = [PSCustomObject]@{ id = New-UniqueId; name = $data.name; industry = $data.industry; website = $data.website; phone = $data.phone; notes = $data.notes; createdAtUtc = (Get-Date).ToUniversalTime().ToString('o') }
                    $comps += $new
                    Write-JsonData $path $comps
                    Send-Response -Context $context -ContentType "application/json" -Content ($new | ConvertTo-Json -Depth 10)
                    continue
                }
                if ($method -eq "PUT" -or $method -eq "DELETE") {
                    $id = ($url -split "/")[-1]
                    if ($method -eq "DELETE") {
                        $comps = $comps | Where-Object { # Local CRM Pro Server - Complete Clean Version
# All routes: CRUD + Search + Backup + Export/Import + Attachments + PWA

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\storage.ps1"
. "$PSScriptRoot\models.ps1"
. "$PSScriptRoot\backup.ps1"
. "$PSScriptRoot\notifications.ps1"

$port = 8088
$baseUrl = "http://localhost:$port/"
$publicPath = Join-Path $PSScriptRoot "..\public"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CRM Pro Server v4 (Complete Clean Build)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " URL: $baseUrl" -ForegroundColor Green
Write-Host " Public path: $publicPath" -ForegroundColor Gray
Write-Host " Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ===== Helper Functions =====
function Send-Response {
    param($Context, [int]$StatusCode = 200, [string]$ContentType = "text/plain", [string]$Content = "", [byte[]]$Bytes = $null)
    try {
        $response = $Context.Response
        $response.StatusCode = $StatusCode
        $response.ContentType = "$ContentType; charset=utf-8"
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        # Cache-Control for static files
        if ($relativePath -match "\.(js|css|html)$") {
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Pragma", "no-cache")
            $response.Headers.Add("Expires", "0")
        }
        
        if ($Bytes) { 
            $buffer = $Bytes 
        } else { 
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($Content) 
        }
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    } catch {
        Write-Host "Send-Response error: $_" -ForegroundColor Red
    }
}

function Get-MimeType {
    param([string]$Extension)
    switch ($Extension.ToLower()) {
        ".html" { return "text/html" }
        ".css" { return "text/css" }
        ".js" { return "application/javascript" }
        ".json" { return "application/json" }
        ".webmanifest" { return "application/manifest+json" }
        ".manifest" { return "application/manifest+json" }
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif" { return "image/gif" }
        ".svg" { return "image/svg+xml" }
        ".ico" { return "image/x-icon" }
        default { return "application/octet-stream" }
    }
}

function Get-RequestBody {
    param($Context)
    try {
        $reader = New-Object System.IO.StreamReader($Context.Request.InputStream, $Context.Request.ContentEncoding)
        $body = $reader.ReadToEnd()
        $reader.Close()
        return $body
    } catch {
        return ""
    }
}

# ===== Start Server =====
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($baseUrl)

try {
    $listener.Start()
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $url = $request.Url.AbsolutePath
        $method = $request.HttpMethod
        $timestamp = (Get-Date).ToString("HH:mm:ss")
        
        # Don't log static file requests to reduce noise
        if ($url -notmatch '\.(css|js|svg|png|jpg|jpeg|gif|ico)$' -and $url -ne '/sw.js' -and $url -ne '/manifest.json') {
            Write-Host "[$timestamp] $method $url" -ForegroundColor Gray
        }
        
        try {
            # Handle CORS preflight
            if ($method -eq "OPTIONS") {
                Send-Response -Context $context -StatusCode 200 -Content ""
                continue
            }
            
            # ===== DEALS ROUTES (Phase 28) =====
            if ($url -eq "/api/deals" -or $url -match "^/api/deals/.+") {
                $path = Get-DataPath "deals"
                $deals = @(Read-JsonData $path)
                if ($method -eq "GET") {
                    $json = $deals | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                    continue
                }
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $new = [PSCustomObject]@{
                        id = New-UniqueId; title = $data.title; value = $data.value; stage = $data.stage
                        personId = $data.personId; probability = $data.probability; closeDate = $data.closeDate
                        notes = $data.notes; tags = @()
                        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
                        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
                    }
                    $deals += $new
                    Write-JsonData $path $deals
                    Send-Response -Context $context -ContentType "application/json" -Content ($new | ConvertTo-Json -Depth 10)
                    continue
                }
                if ($method -eq "PUT" -or $method -eq "DELETE") {
                    $id = ($url -split "/")[-1]
                    if ($method -eq "DELETE") {
                        $deals = $deals | Where-Object { # Local CRM Pro Server - Complete Clean Version
# All routes: CRUD + Search + Backup + Export/Import + Attachments + PWA

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\storage.ps1"
. "$PSScriptRoot\models.ps1"
. "$PSScriptRoot\backup.ps1"
. "$PSScriptRoot\notifications.ps1"

$port = 8088
$baseUrl = "http://localhost:$port/"
$publicPath = Join-Path $PSScriptRoot "..\public"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CRM Pro Server v4 (Complete Clean Build)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " URL: $baseUrl" -ForegroundColor Green
Write-Host " Public path: $publicPath" -ForegroundColor Gray
Write-Host " Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ===== Helper Functions =====
function Send-Response {
    param($Context, [int]$StatusCode = 200, [string]$ContentType = "text/plain", [string]$Content = "", [byte[]]$Bytes = $null)
    try {
        $response = $Context.Response
        $response.StatusCode = $StatusCode
        $response.ContentType = "$ContentType; charset=utf-8"
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        # Cache-Control for static files
        if ($relativePath -match "\.(js|css|html)$") {
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Pragma", "no-cache")
            $response.Headers.Add("Expires", "0")
        }
        
        if ($Bytes) { 
            $buffer = $Bytes 
        } else { 
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($Content) 
        }
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    } catch {
        Write-Host "Send-Response error: $_" -ForegroundColor Red
    }
}

function Get-MimeType {
    param([string]$Extension)
    switch ($Extension.ToLower()) {
        ".html" { return "text/html" }
        ".css" { return "text/css" }
        ".js" { return "application/javascript" }
        ".json" { return "application/json" }
        ".webmanifest" { return "application/manifest+json" }
        ".manifest" { return "application/manifest+json" }
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif" { return "image/gif" }
        ".svg" { return "image/svg+xml" }
        ".ico" { return "image/x-icon" }
        default { return "application/octet-stream" }
    }
}

function Get-RequestBody {
    param($Context)
    try {
        $reader = New-Object System.IO.StreamReader($Context.Request.InputStream, $Context.Request.ContentEncoding)
        $body = $reader.ReadToEnd()
        $reader.Close()
        return $body
    } catch {
        return ""
    }
}

# ===== Start Server =====
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($baseUrl)

try {
    $listener.Start()
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $url = $request.Url.AbsolutePath
        $method = $request.HttpMethod
        $timestamp = (Get-Date).ToString("HH:mm:ss")
        
        # Don't log static file requests to reduce noise
        if ($url -notmatch '\.(css|js|svg|png|jpg|jpeg|gif|ico)$' -and $url -ne '/sw.js' -and $url -ne '/manifest.json') {
            Write-Host "[$timestamp] $method $url" -ForegroundColor Gray
        }
        
        try {
            # Handle CORS preflight
            if ($method -eq "OPTIONS") {
                Send-Response -Context $context -StatusCode 200 -Content ""
                continue
            }
            # ===== NOTIFICATION ROUTES =====
            if ($url -eq "/api/notifications") {
                if ($method -eq "GET") {
                    $minutes = 30
                    if ($request.Url.Query -match '\?minutes=(\d+)') {
                        $minutes = [int]$Matches[1]
                    }
                    $reminders = Get-UpcomingReminders -MinutesAhead $minutes
                    $json = $reminders | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    # Mark notification as sent
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    if ($data.taskId) {
                        Mark-NotificationSent -TaskId $data.taskId
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 400 -Content '{"error":"Missing taskId"}'
                    }
                }
                continue
            }
            
            if ($url -eq "/api/recurring/process") {
                if ($method -eq "POST") {
                    $count = Process-RecurringTasks
                    $json = @{ success = $true; created = $count } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }


            # ===== SEARCH API =====
            if ($url -eq "/api/search") {
                $query = $request.Url.Query -replace '^\?q=', '' -replace '\+', ' '
                $query = [System.Uri]::UnescapeDataString($query)
                
                $results = @{
                    people = @(Search-JsonData "people" $query @('name', 'email', 'company', 'phone'))
                    tasks = @(Search-JsonData "tasks" $query @('title', 'description'))
                    ideas = @(Search-JsonData "ideas" $query @('title', 'description'))
                    notes = @(Search-JsonData "notes" $query @('title', 'content'))
                    projects = @(Search-JsonData "projects" $query @('name', 'description'))
                }
                
                $json = $results | ConvertTo-Json -Depth 10
                Send-Response -Context $context -ContentType "application/json" -Content $json
                continue
            }

            # ===== BACKUP ROUTES =====
            if ($url -eq "/api/backups") {
                if ($method -eq "GET") {
                    $backups = Get-Backups
                    $json = $backups | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = if ($body) { $body | ConvertFrom-Json } else { @{} }
                    $backupName = if ($data.name) { $data.name } else { "" }
                    $result = New-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)/restore$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "POST") {
                    $result = Restore-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "DELETE") {
                    $result = Remove-Backup -BackupName $backupName
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== EXPORT/IMPORT ROUTES =====
            if ($url -match "^/api/export/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "GET") {
                    $result = Export-Entity -EntityName $entityName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/import/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $mode = if ($data.mode) { $data.mode } else { "append" }
                    $items = if ($data.data) { @($data.data) } else { @() }
                    $result = Import-Entity -EntityName $entityName -Data $items -Mode $mode
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            # ===== ATTACHMENT ROUTES =====
            if ($url -eq "/api/upload") {
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $fileBytes = [Convert]::FromBase64String($data.fileData)
                    $result = Add-Attachment -EntityType $data.entityType -EntityId $data.entityId -FileName $data.fileName -FileData $fileBytes -MimeType $data.mimeType
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachments/([^/]+)/([^/]+)$") {
                $entityType = $Matches[1]
                $entityId = $Matches[2]
                if ($method -eq "GET") {
                    $attachments = Get-Attachments -EntityType $entityType -EntityId $entityId
                    $json = $attachments | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachment/([^/]+)$") {
                $fileId = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "GET") {
                    $result = Get-AttachmentFile -FileName $fileId
                    if ($result.success) {
                        $attachMetaPath = Join-Path $PSScriptRoot "..\..\data\attachments.json"
                        $mimeType = "application/octet-stream"
                        if (Test-Path $attachMetaPath) {
                            $allAttachments = Read-JsonData $attachMetaPath
                            $att = $allAttachments | Where-Object { $_.fileName -eq $fileId }
                            if ($att) { $mimeType = $att.mimeType }
                        }
                        Send-Response -Context $context -ContentType $mimeType -Bytes $result.bytes
                    } else {
                        Send-Response -Context $context -StatusCode 404 -Content "Not found"
                    }
                }
                elseif ($method -eq "DELETE") {
                    $result = Remove-Attachment -AttachmentId $fileId
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== STANDARD CRUD ROUTES =====
            if ($url -like "/api/*") {
                $parts = ($url -replace "^/api/", "") -split '/'
                $entity = $parts[0] -replace "/$", ""
                $itemId = if ($parts.Count -gt 1) { $parts[1] } else { $null }
                
                $validEntities = @('people', 'tasks', 'ideas', 'notes', 'projects', 'interactions', 'activity_logs', 'settings')
                if ($entity -notin $validEntities) {
                    Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Not found"}'
                    continue
                }
                
                # GET collection or single item
                if ($method -eq "GET") {
                    if ($itemId) {
                        $items = @(Read-JsonData (Get-DataPath $entity))
                        $item = $items | Where-Object { $_.id -eq $itemId }
                        if ($item) {
                            $json = $item | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        } else {
                            Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                        }
                    } else {
                        if ($entity -eq 'settings') {
                            $settingsPath = Get-DataPath "settings"
                            if (Test-Path $settingsPath) {
                                $json = Get-Content $settingsPath -Raw
                                Send-Response -Context $context -ContentType "application/json" -Content $json
                            } else {
                                Send-Response -Context $context -ContentType "application/json" -Content "{}"
                            }
                        } else {
                            $items = @(Read-JsonData (Get-DataPath $entity))
                            $json = $items | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        }
                    }
                }
                # POST create
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    
                    $result = $null
                    switch ($entity) {
                        "people" { $result = Add-Person -Name $data.name -Email $data.email -Phone $data.phone -Company $data.company -Notes $data.notes -Tags @($data.tags) }
                        "tasks" { 
    $reminderAt = if ($data.reminderAt) { $data.reminderAt } else { "" }
    $recurring = if ($data.recurring) { $data.recurring } else { "none" }
    $recurringInterval = if ($data.recurringInterval) { $data.recurringInterval } else { "" }
    $result = Add-Task -Title $data.title -Description $data.description -DueDate $data.dueDate -Priority $data.priority -Status $data.status -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) -ReminderAt $reminderAt -Recurring $recurring -RecurringInterval $recurringInterval 
}
                        "ideas" { $result = Add-Idea -Title $data.title -Description $data.description -Status $data.status -Tags @($data.tags) }
                        "notes" { $result = Add-Note -Title $data.title -Content $data.content -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) }
                        "projects" { $result = Add-Project -Name $data.name -Description $data.description -Status $data.status -StartDate $data.startDate -EndDate $data.endDate -Tags @($data.tags) }
                        "interactions" { $result = Add-Interaction -PersonId $data.personId -Type $data.type -Subject $data.subject -Content $data.content -Date $data.date }
                    }
                    
                    if ($result) {
                        $json = $result | ConvertTo-Json -Depth 10
                        Send-Response -Context $context -StatusCode 201 -ContentType "application/json" -Content $json
                    } else {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Failed to create"}'
                    }
                }
                # PUT update
                elseif ($method -eq "PUT") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $updates = @{}
                    $data.PSObject.Properties | ForEach-Object { $updates[$_.Name] = $_.Value }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Update-Person -Id $itemId -Updates $updates }
                        "tasks" { $success = Update-Task -Id $itemId -Updates $updates }
                        "ideas" { $success = Update-Idea -Id $itemId -Updates $updates }
                        "notes" { $success = Update-Note -Id $itemId -Updates $updates }
                        "projects" { $success = Update-Project -Id $itemId -Updates $updates }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                # DELETE
                elseif ($method -eq "DELETE") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Remove-Person -Id $itemId }
                        "tasks" { $success = Remove-Task -Id $itemId }
                        "ideas" { $success = Remove-Idea -Id $itemId }
                        "notes" { $success = Remove-Note -Id $itemId }
                        "projects" { $success = Remove-Project -Id $itemId }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                else {
                    Send-Response -Context $context -StatusCode 405 -ContentType "application/json" -Content '{"error":"Method not allowed"}'
                }
                continue
            }
            
            # ===== STATIC FILES =====
            $relativePath = $url -replace "^/", ""
            if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
            
            $filePath = Join-Path $publicPath $relativePath
            
            if (Test-Path $filePath -PathType Leaf) {
                $extension = [System.IO.Path]::GetExtension($filePath)
                $mimeType = Get-MimeType -Extension $extension
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                Send-Response -Context $context -ContentType $mimeType -Bytes $bytes
            } else {
                Send-Response -Context $context -StatusCode 404 -ContentType "text/plain" -Content "404 - File not found: $relativePath"
            }
        }
        catch {
            Write-Host "Error handling request: $_" -ForegroundColor Red
            Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
            try {
                Send-Response -Context $context -StatusCode 500 -ContentType "application/json" -Content "{`"error`":`"$($_.Exception.Message)`"}"
            } catch {}
        }
    }
}
catch {
    Write-Host "Server fatal error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
}
finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
    Write-Host "Server stopped." -ForegroundColor Yellow
}.id -ne $id }
                        Write-JsonData $path $deals
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        $body = Get-RequestBody -Context $context
                        $data = $body | ConvertFrom-Json
                        for ($i = 0; $i -lt $deals.Count; $i++) {
                            if ($deals[$i].id -eq $id) {
                                foreach ($prop in $data.PSObject.Properties) {
                                    $deals[$i] | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value -Force
                                }
                                $deals[$i] | Add-Member -MemberType NoteProperty -Name 'updatedAtUtc' -Value (Get-Date).ToUniversalTime().ToString('o') -Force
                                break
                            }
                        }
                        Write-JsonData $path $deals
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    }
                    continue
                }
            }
            # ===== NOTIFICATION ROUTES =====
            if ($url -eq "/api/notifications") {
                if ($method -eq "GET") {
                    $minutes = 30
                    if ($request.Url.Query -match '\?minutes=(\d+)') {
                        $minutes = [int]$Matches[1]
                    }
                    $reminders = Get-UpcomingReminders -MinutesAhead $minutes
                    $json = $reminders | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    # Mark notification as sent
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    if ($data.taskId) {
                        Mark-NotificationSent -TaskId $data.taskId
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 400 -Content '{"error":"Missing taskId"}'
                    }
                }
                continue
            }
            
            if ($url -eq "/api/recurring/process") {
                if ($method -eq "POST") {
                    $count = Process-RecurringTasks
                    $json = @{ success = $true; created = $count } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }


            # ===== SEARCH API =====
            if ($url -eq "/api/search") {
                $query = $request.Url.Query -replace '^\?q=', '' -replace '\+', ' '
                $query = [System.Uri]::UnescapeDataString($query)
                
                $results = @{
                    people = @(Search-JsonData "people" $query @('name', 'email', 'company', 'phone'))
                    tasks = @(Search-JsonData "tasks" $query @('title', 'description'))
                    ideas = @(Search-JsonData "ideas" $query @('title', 'description'))
                    notes = @(Search-JsonData "notes" $query @('title', 'content'))
                    projects = @(Search-JsonData "projects" $query @('name', 'description'))
                }
                
                $json = $results | ConvertTo-Json -Depth 10
                Send-Response -Context $context -ContentType "application/json" -Content $json
                continue
            }

            # ===== BACKUP ROUTES =====
            if ($url -eq "/api/backups") {
                if ($method -eq "GET") {
                    $backups = Get-Backups
                    $json = $backups | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = if ($body) { $body | ConvertFrom-Json } else { @{} }
                    $backupName = if ($data.name) { $data.name } else { "" }
                    $result = New-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)/restore$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "POST") {
                    $result = Restore-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "DELETE") {
                    $result = Remove-Backup -BackupName $backupName
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== EXPORT/IMPORT ROUTES =====
            if ($url -match "^/api/export/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "GET") {
                    $result = Export-Entity -EntityName $entityName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/import/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $mode = if ($data.mode) { $data.mode } else { "append" }
                    $items = if ($data.data) { @($data.data) } else { @() }
                    $result = Import-Entity -EntityName $entityName -Data $items -Mode $mode
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            # ===== ATTACHMENT ROUTES =====
            if ($url -eq "/api/upload") {
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $fileBytes = [Convert]::FromBase64String($data.fileData)
                    $result = Add-Attachment -EntityType $data.entityType -EntityId $data.entityId -FileName $data.fileName -FileData $fileBytes -MimeType $data.mimeType
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachments/([^/]+)/([^/]+)$") {
                $entityType = $Matches[1]
                $entityId = $Matches[2]
                if ($method -eq "GET") {
                    $attachments = Get-Attachments -EntityType $entityType -EntityId $entityId
                    $json = $attachments | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachment/([^/]+)$") {
                $fileId = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "GET") {
                    $result = Get-AttachmentFile -FileName $fileId
                    if ($result.success) {
                        $attachMetaPath = Join-Path $PSScriptRoot "..\..\data\attachments.json"
                        $mimeType = "application/octet-stream"
                        if (Test-Path $attachMetaPath) {
                            $allAttachments = Read-JsonData $attachMetaPath
                            $att = $allAttachments | Where-Object { $_.fileName -eq $fileId }
                            if ($att) { $mimeType = $att.mimeType }
                        }
                        Send-Response -Context $context -ContentType $mimeType -Bytes $result.bytes
                    } else {
                        Send-Response -Context $context -StatusCode 404 -Content "Not found"
                    }
                }
                elseif ($method -eq "DELETE") {
                    $result = Remove-Attachment -AttachmentId $fileId
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== STANDARD CRUD ROUTES =====
            if ($url -like "/api/*") {
                $parts = ($url -replace "^/api/", "") -split '/'
                $entity = $parts[0] -replace "/$", ""
                $itemId = if ($parts.Count -gt 1) { $parts[1] } else { $null }
                
                $validEntities = @('people', 'tasks', 'ideas', 'notes', 'projects', 'interactions', 'activity_logs', 'settings')
                if ($entity -notin $validEntities) {
                    Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Not found"}'
                    continue
                }
                
                # GET collection or single item
                if ($method -eq "GET") {
                    if ($itemId) {
                        $items = @(Read-JsonData (Get-DataPath $entity))
                        $item = $items | Where-Object { $_.id -eq $itemId }
                        if ($item) {
                            $json = $item | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        } else {
                            Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                        }
                    } else {
                        if ($entity -eq 'settings') {
                            $settingsPath = Get-DataPath "settings"
                            if (Test-Path $settingsPath) {
                                $json = Get-Content $settingsPath -Raw
                                Send-Response -Context $context -ContentType "application/json" -Content $json
                            } else {
                                Send-Response -Context $context -ContentType "application/json" -Content "{}"
                            }
                        } else {
                            $items = @(Read-JsonData (Get-DataPath $entity))
                            $json = $items | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        }
                    }
                }
                # POST create
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    
                    $result = $null
                    switch ($entity) {
                        "people" { $result = Add-Person -Name $data.name -Email $data.email -Phone $data.phone -Company $data.company -Notes $data.notes -Tags @($data.tags) }
                        "tasks" { 
    $reminderAt = if ($data.reminderAt) { $data.reminderAt } else { "" }
    $recurring = if ($data.recurring) { $data.recurring } else { "none" }
    $recurringInterval = if ($data.recurringInterval) { $data.recurringInterval } else { "" }
    $result = Add-Task -Title $data.title -Description $data.description -DueDate $data.dueDate -Priority $data.priority -Status $data.status -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) -ReminderAt $reminderAt -Recurring $recurring -RecurringInterval $recurringInterval 
}
                        "ideas" { $result = Add-Idea -Title $data.title -Description $data.description -Status $data.status -Tags @($data.tags) }
                        "notes" { $result = Add-Note -Title $data.title -Content $data.content -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) }
                        "projects" { $result = Add-Project -Name $data.name -Description $data.description -Status $data.status -StartDate $data.startDate -EndDate $data.endDate -Tags @($data.tags) }
                        "interactions" { $result = Add-Interaction -PersonId $data.personId -Type $data.type -Subject $data.subject -Content $data.content -Date $data.date }
                    }
                    
                    if ($result) {
                        $json = $result | ConvertTo-Json -Depth 10
                        Send-Response -Context $context -StatusCode 201 -ContentType "application/json" -Content $json
                    } else {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Failed to create"}'
                    }
                }
                # PUT update
                elseif ($method -eq "PUT") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $updates = @{}
                    $data.PSObject.Properties | ForEach-Object { $updates[$_.Name] = $_.Value }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Update-Person -Id $itemId -Updates $updates }
                        "tasks" { $success = Update-Task -Id $itemId -Updates $updates }
                        "ideas" { $success = Update-Idea -Id $itemId -Updates $updates }
                        "notes" { $success = Update-Note -Id $itemId -Updates $updates }
                        "projects" { $success = Update-Project -Id $itemId -Updates $updates }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                # DELETE
                elseif ($method -eq "DELETE") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Remove-Person -Id $itemId }
                        "tasks" { $success = Remove-Task -Id $itemId }
                        "ideas" { $success = Remove-Idea -Id $itemId }
                        "notes" { $success = Remove-Note -Id $itemId }
                        "projects" { $success = Remove-Project -Id $itemId }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                else {
                    Send-Response -Context $context -StatusCode 405 -ContentType "application/json" -Content '{"error":"Method not allowed"}'
                }
                continue
            }
            
            # ===== STATIC FILES =====
            $relativePath = $url -replace "^/", ""
            if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
            
            $filePath = Join-Path $publicPath $relativePath
            
            if (Test-Path $filePath -PathType Leaf) {
                $extension = [System.IO.Path]::GetExtension($filePath)
                $mimeType = Get-MimeType -Extension $extension
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                Send-Response -Context $context -ContentType $mimeType -Bytes $bytes
            } else {
                Send-Response -Context $context -StatusCode 404 -ContentType "text/plain" -Content "404 - File not found: $relativePath"
            }
        }
        catch {
            Write-Host "Error handling request: $_" -ForegroundColor Red
            Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
            try {
                Send-Response -Context $context -StatusCode 500 -ContentType "application/json" -Content "{`"error`":`"$($_.Exception.Message)`"}"
            } catch {}
        }
    }
}
catch {
    Write-Host "Server fatal error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
}
finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
    Write-Host "Server stopped." -ForegroundColor Yellow
}.id -ne $id }
                    } else {
                        $data = (Get-RequestBody -Context $context) | ConvertFrom-Json
                        for ($i = 0; $i -lt $comps.Count; $i++) {
                            if ($comps[$i].id -eq $id) {
                                foreach ($p in $data.PSObject.Properties) { $comps[$i] | Add-Member -MemberType NoteProperty -Name $p.Name -Value $p.Value -Force }
                                break
                            }
                        }
                    }
                    Write-JsonData $path $comps
                    Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    continue
                }
            }
            # ===== DEALS ROUTES (Phase 28) =====
            if ($url -eq "/api/deals" -or $url -match "^/api/deals/.+") {
                $path = Get-DataPath "deals"
                $deals = @(Read-JsonData $path)
                if ($method -eq "GET") {
                    $json = $deals | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                    continue
                }
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $new = [PSCustomObject]@{
                        id = New-UniqueId; title = $data.title; value = $data.value; stage = $data.stage
                        personId = $data.personId; probability = $data.probability; closeDate = $data.closeDate
                        notes = $data.notes; tags = @()
                        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
                        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
                    }
                    $deals += $new
                    Write-JsonData $path $deals
                    Send-Response -Context $context -ContentType "application/json" -Content ($new | ConvertTo-Json -Depth 10)
                    continue
                }
                if ($method -eq "PUT" -or $method -eq "DELETE") {
                    $id = ($url -split "/")[-1]
                    if ($method -eq "DELETE") {
                        $deals = $deals | Where-Object { # Local CRM Pro Server - Complete Clean Version
# All routes: CRUD + Search + Backup + Export/Import + Attachments + PWA

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\storage.ps1"
. "$PSScriptRoot\models.ps1"
. "$PSScriptRoot\backup.ps1"
. "$PSScriptRoot\notifications.ps1"

$port = 8088
$baseUrl = "http://localhost:$port/"
$publicPath = Join-Path $PSScriptRoot "..\public"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " CRM Pro Server v4 (Complete Clean Build)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " URL: $baseUrl" -ForegroundColor Green
Write-Host " Public path: $publicPath" -ForegroundColor Gray
Write-Host " Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ===== Helper Functions =====
function Send-Response {
    param($Context, [int]$StatusCode = 200, [string]$ContentType = "text/plain", [string]$Content = "", [byte[]]$Bytes = $null)
    try {
        $response = $Context.Response
        $response.StatusCode = $StatusCode
        $response.ContentType = "$ContentType; charset=utf-8"
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        # Cache-Control for static files
        if ($relativePath -match "\.(js|css|html)$") {
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Pragma", "no-cache")
            $response.Headers.Add("Expires", "0")
        }
        
        if ($Bytes) { 
            $buffer = $Bytes 
        } else { 
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($Content) 
        }
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    } catch {
        Write-Host "Send-Response error: $_" -ForegroundColor Red
    }
}

function Get-MimeType {
    param([string]$Extension)
    switch ($Extension.ToLower()) {
        ".html" { return "text/html" }
        ".css" { return "text/css" }
        ".js" { return "application/javascript" }
        ".json" { return "application/json" }
        ".webmanifest" { return "application/manifest+json" }
        ".manifest" { return "application/manifest+json" }
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif" { return "image/gif" }
        ".svg" { return "image/svg+xml" }
        ".ico" { return "image/x-icon" }
        default { return "application/octet-stream" }
    }
}

function Get-RequestBody {
    param($Context)
    try {
        $reader = New-Object System.IO.StreamReader($Context.Request.InputStream, $Context.Request.ContentEncoding)
        $body = $reader.ReadToEnd()
        $reader.Close()
        return $body
    } catch {
        return ""
    }
}

# ===== Start Server =====
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($baseUrl)

try {
    $listener.Start()
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $url = $request.Url.AbsolutePath
        $method = $request.HttpMethod
        $timestamp = (Get-Date).ToString("HH:mm:ss")
        
        # Don't log static file requests to reduce noise
        if ($url -notmatch '\.(css|js|svg|png|jpg|jpeg|gif|ico)$' -and $url -ne '/sw.js' -and $url -ne '/manifest.json') {
            Write-Host "[$timestamp] $method $url" -ForegroundColor Gray
        }
        
        try {
            # Handle CORS preflight
            if ($method -eq "OPTIONS") {
                Send-Response -Context $context -StatusCode 200 -Content ""
                continue
            }
            # ===== NOTIFICATION ROUTES =====
            if ($url -eq "/api/notifications") {
                if ($method -eq "GET") {
                    $minutes = 30
                    if ($request.Url.Query -match '\?minutes=(\d+)') {
                        $minutes = [int]$Matches[1]
                    }
                    $reminders = Get-UpcomingReminders -MinutesAhead $minutes
                    $json = $reminders | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    # Mark notification as sent
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    if ($data.taskId) {
                        Mark-NotificationSent -TaskId $data.taskId
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 400 -Content '{"error":"Missing taskId"}'
                    }
                }
                continue
            }
            
            if ($url -eq "/api/recurring/process") {
                if ($method -eq "POST") {
                    $count = Process-RecurringTasks
                    $json = @{ success = $true; created = $count } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }


            # ===== SEARCH API =====
            if ($url -eq "/api/search") {
                $query = $request.Url.Query -replace '^\?q=', '' -replace '\+', ' '
                $query = [System.Uri]::UnescapeDataString($query)
                
                $results = @{
                    people = @(Search-JsonData "people" $query @('name', 'email', 'company', 'phone'))
                    tasks = @(Search-JsonData "tasks" $query @('title', 'description'))
                    ideas = @(Search-JsonData "ideas" $query @('title', 'description'))
                    notes = @(Search-JsonData "notes" $query @('title', 'content'))
                    projects = @(Search-JsonData "projects" $query @('name', 'description'))
                }
                
                $json = $results | ConvertTo-Json -Depth 10
                Send-Response -Context $context -ContentType "application/json" -Content $json
                continue
            }

            # ===== BACKUP ROUTES =====
            if ($url -eq "/api/backups") {
                if ($method -eq "GET") {
                    $backups = Get-Backups
                    $json = $backups | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = if ($body) { $body | ConvertFrom-Json } else { @{} }
                    $backupName = if ($data.name) { $data.name } else { "" }
                    $result = New-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)/restore$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "POST") {
                    $result = Restore-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "DELETE") {
                    $result = Remove-Backup -BackupName $backupName
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== EXPORT/IMPORT ROUTES =====
            if ($url -match "^/api/export/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "GET") {
                    $result = Export-Entity -EntityName $entityName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/import/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $mode = if ($data.mode) { $data.mode } else { "append" }
                    $items = if ($data.data) { @($data.data) } else { @() }
                    $result = Import-Entity -EntityName $entityName -Data $items -Mode $mode
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            # ===== ATTACHMENT ROUTES =====
            if ($url -eq "/api/upload") {
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $fileBytes = [Convert]::FromBase64String($data.fileData)
                    $result = Add-Attachment -EntityType $data.entityType -EntityId $data.entityId -FileName $data.fileName -FileData $fileBytes -MimeType $data.mimeType
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachments/([^/]+)/([^/]+)$") {
                $entityType = $Matches[1]
                $entityId = $Matches[2]
                if ($method -eq "GET") {
                    $attachments = Get-Attachments -EntityType $entityType -EntityId $entityId
                    $json = $attachments | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachment/([^/]+)$") {
                $fileId = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "GET") {
                    $result = Get-AttachmentFile -FileName $fileId
                    if ($result.success) {
                        $attachMetaPath = Join-Path $PSScriptRoot "..\..\data\attachments.json"
                        $mimeType = "application/octet-stream"
                        if (Test-Path $attachMetaPath) {
                            $allAttachments = Read-JsonData $attachMetaPath
                            $att = $allAttachments | Where-Object { $_.fileName -eq $fileId }
                            if ($att) { $mimeType = $att.mimeType }
                        }
                        Send-Response -Context $context -ContentType $mimeType -Bytes $result.bytes
                    } else {
                        Send-Response -Context $context -StatusCode 404 -Content "Not found"
                    }
                }
                elseif ($method -eq "DELETE") {
                    $result = Remove-Attachment -AttachmentId $fileId
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== STANDARD CRUD ROUTES =====
            if ($url -like "/api/*") {
                $parts = ($url -replace "^/api/", "") -split '/'
                $entity = $parts[0] -replace "/$", ""
                $itemId = if ($parts.Count -gt 1) { $parts[1] } else { $null }
                
                $validEntities = @('people', 'tasks', 'ideas', 'notes', 'projects', 'interactions', 'activity_logs', 'settings')
                if ($entity -notin $validEntities) {
                    Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Not found"}'
                    continue
                }
                
                # GET collection or single item
                if ($method -eq "GET") {
                    if ($itemId) {
                        $items = @(Read-JsonData (Get-DataPath $entity))
                        $item = $items | Where-Object { $_.id -eq $itemId }
                        if ($item) {
                            $json = $item | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        } else {
                            Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                        }
                    } else {
                        if ($entity -eq 'settings') {
                            $settingsPath = Get-DataPath "settings"
                            if (Test-Path $settingsPath) {
                                $json = Get-Content $settingsPath -Raw
                                Send-Response -Context $context -ContentType "application/json" -Content $json
                            } else {
                                Send-Response -Context $context -ContentType "application/json" -Content "{}"
                            }
                        } else {
                            $items = @(Read-JsonData (Get-DataPath $entity))
                            $json = $items | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        }
                    }
                }
                # POST create
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    
                    $result = $null
                    switch ($entity) {
                        "people" { $result = Add-Person -Name $data.name -Email $data.email -Phone $data.phone -Company $data.company -Notes $data.notes -Tags @($data.tags) }
                        "tasks" { 
    $reminderAt = if ($data.reminderAt) { $data.reminderAt } else { "" }
    $recurring = if ($data.recurring) { $data.recurring } else { "none" }
    $recurringInterval = if ($data.recurringInterval) { $data.recurringInterval } else { "" }
    $result = Add-Task -Title $data.title -Description $data.description -DueDate $data.dueDate -Priority $data.priority -Status $data.status -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) -ReminderAt $reminderAt -Recurring $recurring -RecurringInterval $recurringInterval 
}
                        "ideas" { $result = Add-Idea -Title $data.title -Description $data.description -Status $data.status -Tags @($data.tags) }
                        "notes" { $result = Add-Note -Title $data.title -Content $data.content -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) }
                        "projects" { $result = Add-Project -Name $data.name -Description $data.description -Status $data.status -StartDate $data.startDate -EndDate $data.endDate -Tags @($data.tags) }
                        "interactions" { $result = Add-Interaction -PersonId $data.personId -Type $data.type -Subject $data.subject -Content $data.content -Date $data.date }
                    }
                    
                    if ($result) {
                        $json = $result | ConvertTo-Json -Depth 10
                        Send-Response -Context $context -StatusCode 201 -ContentType "application/json" -Content $json
                    } else {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Failed to create"}'
                    }
                }
                # PUT update
                elseif ($method -eq "PUT") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $updates = @{}
                    $data.PSObject.Properties | ForEach-Object { $updates[$_.Name] = $_.Value }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Update-Person -Id $itemId -Updates $updates }
                        "tasks" { $success = Update-Task -Id $itemId -Updates $updates }
                        "ideas" { $success = Update-Idea -Id $itemId -Updates $updates }
                        "notes" { $success = Update-Note -Id $itemId -Updates $updates }
                        "projects" { $success = Update-Project -Id $itemId -Updates $updates }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                # DELETE
                elseif ($method -eq "DELETE") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Remove-Person -Id $itemId }
                        "tasks" { $success = Remove-Task -Id $itemId }
                        "ideas" { $success = Remove-Idea -Id $itemId }
                        "notes" { $success = Remove-Note -Id $itemId }
                        "projects" { $success = Remove-Project -Id $itemId }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                else {
                    Send-Response -Context $context -StatusCode 405 -ContentType "application/json" -Content '{"error":"Method not allowed"}'
                }
                continue
            }
            
            # ===== STATIC FILES =====
            $relativePath = $url -replace "^/", ""
            if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
            
            $filePath = Join-Path $publicPath $relativePath
            
            if (Test-Path $filePath -PathType Leaf) {
                $extension = [System.IO.Path]::GetExtension($filePath)
                $mimeType = Get-MimeType -Extension $extension
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                Send-Response -Context $context -ContentType $mimeType -Bytes $bytes
            } else {
                Send-Response -Context $context -StatusCode 404 -ContentType "text/plain" -Content "404 - File not found: $relativePath"
            }
        }
        catch {
            Write-Host "Error handling request: $_" -ForegroundColor Red
            Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
            try {
                Send-Response -Context $context -StatusCode 500 -ContentType "application/json" -Content "{`"error`":`"$($_.Exception.Message)`"}"
            } catch {}
        }
    }
}
catch {
    Write-Host "Server fatal error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
}
finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
    Write-Host "Server stopped." -ForegroundColor Yellow
}.id -ne $id }
                        Write-JsonData $path $deals
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        $body = Get-RequestBody -Context $context
                        $data = $body | ConvertFrom-Json
                        for ($i = 0; $i -lt $deals.Count; $i++) {
                            if ($deals[$i].id -eq $id) {
                                foreach ($prop in $data.PSObject.Properties) {
                                    $deals[$i] | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value -Force
                                }
                                $deals[$i] | Add-Member -MemberType NoteProperty -Name 'updatedAtUtc' -Value (Get-Date).ToUniversalTime().ToString('o') -Force
                                break
                            }
                        }
                        Write-JsonData $path $deals
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    }
                    continue
                }
            }
            # ===== NOTIFICATION ROUTES =====
            if ($url -eq "/api/notifications") {
                if ($method -eq "GET") {
                    $minutes = 30
                    if ($request.Url.Query -match '\?minutes=(\d+)') {
                        $minutes = [int]$Matches[1]
                    }
                    $reminders = Get-UpcomingReminders -MinutesAhead $minutes
                    $json = $reminders | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    # Mark notification as sent
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    if ($data.taskId) {
                        Mark-NotificationSent -TaskId $data.taskId
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 400 -Content '{"error":"Missing taskId"}'
                    }
                }
                continue
            }
            
            if ($url -eq "/api/recurring/process") {
                if ($method -eq "POST") {
                    $count = Process-RecurringTasks
                    $json = @{ success = $true; created = $count } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }


            # ===== SEARCH API =====
            if ($url -eq "/api/search") {
                $query = $request.Url.Query -replace '^\?q=', '' -replace '\+', ' '
                $query = [System.Uri]::UnescapeDataString($query)
                
                $results = @{
                    people = @(Search-JsonData "people" $query @('name', 'email', 'company', 'phone'))
                    tasks = @(Search-JsonData "tasks" $query @('title', 'description'))
                    ideas = @(Search-JsonData "ideas" $query @('title', 'description'))
                    notes = @(Search-JsonData "notes" $query @('title', 'content'))
                    projects = @(Search-JsonData "projects" $query @('name', 'description'))
                }
                
                $json = $results | ConvertTo-Json -Depth 10
                Send-Response -Context $context -ContentType "application/json" -Content $json
                continue
            }

            # ===== BACKUP ROUTES =====
            if ($url -eq "/api/backups") {
                if ($method -eq "GET") {
                    $backups = Get-Backups
                    $json = $backups | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = if ($body) { $body | ConvertFrom-Json } else { @{} }
                    $backupName = if ($data.name) { $data.name } else { "" }
                    $result = New-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)/restore$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "POST") {
                    $result = Restore-Backup -BackupName $backupName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/backups/([^/]+)$") {
                $backupName = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "DELETE") {
                    $result = Remove-Backup -BackupName $backupName
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== EXPORT/IMPORT ROUTES =====
            if ($url -match "^/api/export/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "GET") {
                    $result = Export-Entity -EntityName $entityName
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/import/([^/]+)$") {
                $entityName = $Matches[1]
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $mode = if ($data.mode) { $data.mode } else { "append" }
                    $items = if ($data.data) { @($data.data) } else { @() }
                    $result = Import-Entity -EntityName $entityName -Data $items -Mode $mode
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            # ===== ATTACHMENT ROUTES =====
            if ($url -eq "/api/upload") {
                if ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $fileBytes = [Convert]::FromBase64String($data.fileData)
                    $result = Add-Attachment -EntityType $data.entityType -EntityId $data.entityId -FileName $data.fileName -FileData $fileBytes -MimeType $data.mimeType
                    $json = $result | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachments/([^/]+)/([^/]+)$") {
                $entityType = $Matches[1]
                $entityId = $Matches[2]
                if ($method -eq "GET") {
                    $attachments = Get-Attachments -EntityType $entityType -EntityId $entityId
                    $json = $attachments | ConvertTo-Json -Depth 10
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }
            
            if ($url -match "^/api/attachment/([^/]+)$") {
                $fileId = [System.Uri]::UnescapeDataString($Matches[1])
                if ($method -eq "GET") {
                    $result = Get-AttachmentFile -FileName $fileId
                    if ($result.success) {
                        $attachMetaPath = Join-Path $PSScriptRoot "..\..\data\attachments.json"
                        $mimeType = "application/octet-stream"
                        if (Test-Path $attachMetaPath) {
                            $allAttachments = Read-JsonData $attachMetaPath
                            $att = $allAttachments | Where-Object { $_.fileName -eq $fileId }
                            if ($att) { $mimeType = $att.mimeType }
                        }
                        Send-Response -Context $context -ContentType $mimeType -Bytes $result.bytes
                    } else {
                        Send-Response -Context $context -StatusCode 404 -Content "Not found"
                    }
                }
                elseif ($method -eq "DELETE") {
                    $result = Remove-Attachment -AttachmentId $fileId
                    $json = @{ success = $result } | ConvertTo-Json
                    Send-Response -Context $context -ContentType "application/json" -Content $json
                }
                continue
            }

            # ===== STANDARD CRUD ROUTES =====
            if ($url -like "/api/*") {
                $parts = ($url -replace "^/api/", "") -split '/'
                $entity = $parts[0] -replace "/$", ""
                $itemId = if ($parts.Count -gt 1) { $parts[1] } else { $null }
                
                $validEntities = @('people', 'tasks', 'ideas', 'notes', 'projects', 'interactions', 'activity_logs', 'settings')
                if ($entity -notin $validEntities) {
                    Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Not found"}'
                    continue
                }
                
                # GET collection or single item
                if ($method -eq "GET") {
                    if ($itemId) {
                        $items = @(Read-JsonData (Get-DataPath $entity))
                        $item = $items | Where-Object { $_.id -eq $itemId }
                        if ($item) {
                            $json = $item | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        } else {
                            Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                        }
                    } else {
                        if ($entity -eq 'settings') {
                            $settingsPath = Get-DataPath "settings"
                            if (Test-Path $settingsPath) {
                                $json = Get-Content $settingsPath -Raw
                                Send-Response -Context $context -ContentType "application/json" -Content $json
                            } else {
                                Send-Response -Context $context -ContentType "application/json" -Content "{}"
                            }
                        } else {
                            $items = @(Read-JsonData (Get-DataPath $entity))
                            $json = $items | ConvertTo-Json -Depth 10
                            Send-Response -Context $context -ContentType "application/json" -Content $json
                        }
                    }
                }
                # POST create
                elseif ($method -eq "POST") {
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    
                    $result = $null
                    switch ($entity) {
                        "people" { $result = Add-Person -Name $data.name -Email $data.email -Phone $data.phone -Company $data.company -Notes $data.notes -Tags @($data.tags) }
                        "tasks" { 
    $reminderAt = if ($data.reminderAt) { $data.reminderAt } else { "" }
    $recurring = if ($data.recurring) { $data.recurring } else { "none" }
    $recurringInterval = if ($data.recurringInterval) { $data.recurringInterval } else { "" }
    $result = Add-Task -Title $data.title -Description $data.description -DueDate $data.dueDate -Priority $data.priority -Status $data.status -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) -ReminderAt $reminderAt -Recurring $recurring -RecurringInterval $recurringInterval 
}
                        "ideas" { $result = Add-Idea -Title $data.title -Description $data.description -Status $data.status -Tags @($data.tags) }
                        "notes" { $result = Add-Note -Title $data.title -Content $data.content -PersonId $data.personId -ProjectId $data.projectId -Tags @($data.tags) }
                        "projects" { $result = Add-Project -Name $data.name -Description $data.description -Status $data.status -StartDate $data.startDate -EndDate $data.endDate -Tags @($data.tags) }
                        "interactions" { $result = Add-Interaction -PersonId $data.personId -Type $data.type -Subject $data.subject -Content $data.content -Date $data.date }
                    }
                    
                    if ($result) {
                        $json = $result | ConvertTo-Json -Depth 10
                        Send-Response -Context $context -StatusCode 201 -ContentType "application/json" -Content $json
                    } else {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Failed to create"}'
                    }
                }
                # PUT update
                elseif ($method -eq "PUT") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $body = Get-RequestBody -Context $context
                    $data = $body | ConvertFrom-Json
                    $updates = @{}
                    $data.PSObject.Properties | ForEach-Object { $updates[$_.Name] = $_.Value }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Update-Person -Id $itemId -Updates $updates }
                        "tasks" { $success = Update-Task -Id $itemId -Updates $updates }
                        "ideas" { $success = Update-Idea -Id $itemId -Updates $updates }
                        "notes" { $success = Update-Note -Id $itemId -Updates $updates }
                        "projects" { $success = Update-Project -Id $itemId -Updates $updates }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                # DELETE
                elseif ($method -eq "DELETE") {
                    if (-not $itemId) {
                        Send-Response -Context $context -StatusCode 400 -ContentType "application/json" -Content '{"error":"Missing item ID"}'
                        continue
                    }
                    
                    $success = $false
                    switch ($entity) {
                        "people" { $success = Remove-Person -Id $itemId }
                        "tasks" { $success = Remove-Task -Id $itemId }
                        "ideas" { $success = Remove-Idea -Id $itemId }
                        "notes" { $success = Remove-Note -Id $itemId }
                        "projects" { $success = Remove-Project -Id $itemId }
                    }
                    
                    if ($success) {
                        Send-Response -Context $context -ContentType "application/json" -Content '{"success":true}'
                    } else {
                        Send-Response -Context $context -StatusCode 404 -ContentType "application/json" -Content '{"error":"Item not found"}'
                    }
                }
                else {
                    Send-Response -Context $context -StatusCode 405 -ContentType "application/json" -Content '{"error":"Method not allowed"}'
                }
                continue
            }
            
            # ===== STATIC FILES =====
            $relativePath = $url -replace "^/", ""
            if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
            
            $filePath = Join-Path $publicPath $relativePath
            
            if (Test-Path $filePath -PathType Leaf) {
                $extension = [System.IO.Path]::GetExtension($filePath)
                $mimeType = Get-MimeType -Extension $extension
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                Send-Response -Context $context -ContentType $mimeType -Bytes $bytes
            } else {
                Send-Response -Context $context -StatusCode 404 -ContentType "text/plain" -Content "404 - File not found: $relativePath"
            }
        }
        catch {
            Write-Host "Error handling request: $_" -ForegroundColor Red
            Write-Host "Stack: $($_.ScriptStackTrace)" -ForegroundColor Red
            try {
                Send-Response -Context $context -StatusCode 500 -ContentType "application/json" -Content "{`"error`":`"$($_.Exception.Message)`"}"
            } catch {}
        }
    }
}
catch {
    Write-Host "Server fatal error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
}
finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
    Write-Host "Server stopped." -ForegroundColor Yellow
}