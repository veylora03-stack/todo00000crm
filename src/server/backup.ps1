# Backup & Restore Functions

function New-Backup {
    param(
        [string]$BackupName = ""
    )
    
    $backupDir = Join-Path $PSScriptRoot "..\..\backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    if (-not $BackupName) {
        $BackupName = "backup_$timestamp"
    }
    
    $zipName = "$BackupName.zip"
    $zipPath = Join-Path $backupDir $zipName
    
    # Create temp directory
    $tempDir = Join-Path $env:TEMP "crm-backup-$timestamp"
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Copy data files
    $dataDir = Join-Path $PSScriptRoot "..\..\data"
    Copy-Item -Path $dataDir -Destination $tempDir -Recurse -Force
    
    # Copy config
    $configDir = Join-Path $PSScriptRoot "..\..\config"
    if (Test-Path $configDir) {
        Copy-Item -Path $configDir -Destination $tempDir -Recurse -Force
    }
    
    # Create metadata
    $metadata = @{
        name = $BackupName
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        version = "1.0.0"
        items = @{
            people = (Get-Content (Join-Path $dataDir "people.json") -Raw | ConvertFrom-Json).Count
            tasks = (Get-Content (Join-Path $dataDir "tasks.json") -Raw | ConvertFrom-Json).Count
            ideas = (Get-Content (Join-Path $dataDir "ideas.json") -Raw | ConvertFrom-Json).Count
            notes = (Get-Content (Join-Path $dataDir "notes.json") -Raw | ConvertFrom-Json).Count
            projects = (Get-Content (Join-Path $dataDir "projects.json") -Raw | ConvertFrom-Json).Count
            activity_logs = (Get-Content (Join-Path $dataDir "activity_logs.json") -Raw | ConvertFrom-Json).Count
        }
    }
    
    $metadata | ConvertTo-Json -Depth 5 | Out-File (Join-Path $tempDir "backup-metadata.json") -Encoding UTF8
    
    # Create zip
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
        [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
        
        # Cleanup temp
        Remove-Item $tempDir -Recurse -Force
        
        $fileInfo = Get-Item $zipPath
        return @{
            success = $true
            name = $zipName
            path = $zipPath
            size = $fileInfo.Length
            createdAt = $metadata.createdAtUtc
            metadata = $metadata
        }
    } catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Get-Backups {
    $backupDir = Join-Path $PSScriptRoot "..\..\backups"
    if (-not (Test-Path $backupDir)) { return @() }
    
    $backups = @()
    Get-ChildItem $backupDir -Filter "*.zip" | ForEach-Object {
        $backup = @{
            name = $_.Name
            size = $_.Length
            createdAt = $_.CreationTime.ToUniversalTime().ToString('o')
            path = $_.FullName
        }
        
        # Try to read metadata
        try {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            $zip = [System.IO.Compression.ZipFile]::OpenRead($_.FullName)
            $metadataEntry = $zip.Entries | Where-Object { $_.Name -eq "backup-metadata.json" }
            if ($metadataEntry) {
                $reader = New-Object System.IO.StreamReader($metadataEntry.Open())
                $metadataJson = $reader.ReadToEnd()
                $reader.Close()
                $backup.metadata = $metadataJson | ConvertFrom-Json
            }
            $zip.Dispose()
        } catch {
            # Metadata not available
        }
        
        $backups += $backup
    }
    
    return $backups | Sort-Object { [datetime]$_.createdAt } -Descending
}

function Remove-Backup {
    param([string]$BackupName)
    
    $backupDir = Join-Path $PSScriptRoot "..\..\backups"
    $zipPath = Join-Path $backupDir $BackupName
    
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
        return $true
    }
    return $false
}

function Restore-Backup {
    param([string]$BackupName)
    
    $backupDir = Join-Path $PSScriptRoot "..\..\backups"
    $zipPath = Join-Path $backupDir $BackupName
    
    if (-not (Test-Path $zipPath)) {
        return @{ success = $false; error = "Backup not found" }
    }
    
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        
        # Create temp extraction directory
        $tempDir = Join-Path $env:TEMP "crm-restore-$(Get-Random)"
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $tempDir)
        
        # Verify backup has data folder
        $extractedData = Join-Path $tempDir "data"
        if (-not (Test-Path $extractedData)) {
            Remove-Item $tempDir -Recurse -Force
            return @{ success = $false; error = "Invalid backup structure" }
        }
        
        # Backup current data before restore
        $preRestoreBackup = New-Backup -BackupName "pre-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        
        # Copy data back
        $dataDir = Join-Path $PSScriptRoot "..\..\data"
        Get-ChildItem $extractedData | ForEach-Object {
            $destPath = Join-Path $dataDir $_.Name
            if (Test-Path $destPath) { Remove-Item $destPath -Force -Recurse }
            Copy-Item $_.FullName -Destination $dataDir -Force -Recurse
        }
        
        # Restore config if exists
        $extractedConfig = Join-Path $tempDir "config"
        if (Test-Path $extractedConfig) {
            $configDir = Join-Path $PSScriptRoot "..\..\config"
            Get-ChildItem $extractedConfig | ForEach-Object {
                $destPath = Join-Path $configDir $_.Name
                if (Test-Path $destPath) { Remove-Item $destPath -Force }
                Copy-Item $_.FullName -Destination $configDir -Force
            }
        }
        
        # Cleanup
        Remove-Item $tempDir -Recurse -Force
        
        return @{
            success = $true
            preRestoreBackup = $preRestoreBackup.name
            restoredAt = (Get-Date).ToUniversalTime().ToString('o')
        }
    } catch {
        return @{
            success = $false
            error = $_.Exception.Message
        }
    }
}

function Export-Entity {
    param([string]$EntityName)
    
    $validEntities = @('people', 'tasks', 'ideas', 'notes', 'projects', 'interactions', 'activity_logs')
    if ($EntityName -notin $validEntities) {
        return @{ success = $false; error = "Invalid entity" }
    }
    
    $path = Get-DataPath $EntityName
    if (-not (Test-Path $path)) {
        return @{ success = $false; error = "Entity file not found" }
    }
    
    $data = @(Read-JsonData $path)
    return @{
        success = $true
        entity = $EntityName
        count = $data.Count
        data = $data
        exportedAt = (Get-Date).ToUniversalTime().ToString('o')
    }
}

function Import-Entity {
    param(
        [string]$EntityName,
        [array]$Data,
        [string]$Mode = "append"  # append, replace
    )
    
    $validEntities = @('people', 'tasks', 'ideas', 'notes', 'projects', 'interactions', 'activity_logs')
    if ($EntityName -notin $validEntities) {
        return @{ success = $false; error = "Invalid entity" }
    }
    
    if ($null -eq $Data -or -not ($Data -is [array])) {
        return @{ success = $false; error = "Invalid data format" }
    }
    
    $path = Get-DataPath $EntityName
    $existing = @(Read-JsonData $path)
    
    if ($Mode -eq "replace") {
        $newData = $Data
    } else {
        # Append: avoid duplicates by id
        $existingIds = @($existing | ForEach-Object { $_.id })
        $newItems = @($Data | Where-Object { $_.id -notin $existingIds })
        $newData = @($existing + $newItems)
    }
    
    Write-JsonData $path $newData
    
    Add-ActivityLog "system" "import" "import" "Imported $($Data.Count) items to $EntityName" | Out-Null
    
    return @{
        success = $true
        entity = $EntityName
        imported = $Data.Count
        mode = $Mode
        totalAfter = $newData.Count
    }
}

# Attachment functions
function Add-Attachment {
    param(
        [string]$EntityType,
        [string]$EntityId,
        [string]$FileName,
        [byte[]]$FileData,
        [string]$MimeType
    )
    
    $attachDir = Join-Path $PSScriptRoot "..\..\data\attachments"
    if (-not (Test-Path $attachDir)) {
        New-Item -ItemType Directory -Path $attachDir -Force | Out-Null
    }
    
    # Generate unique file name
    $ext = [System.IO.Path]::GetExtension($FileName)
    $uniqueName = "$([guid]::NewGuid())$ext"
    $filePath = Join-Path $attachDir $uniqueName
    
    # Save file
    [System.IO.File]::WriteAllBytes($filePath, $FileData)
    
    # Create attachment record
    $attachment = @{
        id = [guid]::NewGuid().ToString()
        entityType = $EntityType
        entityId = $EntityId
        originalName = $FileName
        fileName = $uniqueName
        mimeType = $MimeType
        size = $FileData.Length
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    
    # Save to attachments.json
    $attachMetaPath = Join-Path $PSScriptRoot "..\..\data\attachments.json"
    $attachments = @()
    if (Test-Path $attachMetaPath) {
        $attachments = @(Read-JsonData $attachMetaPath)
    }
    $attachments += $attachment
    Write-JsonData $attachMetaPath $attachments
    
    return $attachment
}

function Get-Attachments {
    param(
        [string]$EntityType,
        [string]$EntityId
    )
    
    $attachMetaPath = Join-Path $PSScriptRoot "..\..\data\attachments.json"
    if (-not (Test-Path $attachMetaPath)) { return @() }
    
    $attachments = @(Read-JsonData $attachMetaPath)
    return @($attachments | Where-Object { $_.entityType -eq $EntityType -and $_.entityId -eq $EntityId })
}

function Get-AttachmentFile {
    param([string]$FileName)
    
    $filePath = Join-Path $PSScriptRoot "..\..\data\attachments\$FileName"
    if (Test-Path $filePath) {
        return @{
            success = $true
            path = $filePath
            bytes = [System.IO.File]::ReadAllBytes($filePath)
        }
    }
    return @{ success = $false; error = "File not found" }
}

function Remove-Attachment {
    param([string]$AttachmentId)
    
    $attachMetaPath = Join-Path $PSScriptRoot "..\..\data\attachments.json"
    if (-not (Test-Path $attachMetaPath)) { return $false }
    
    $attachments = @(Read-JsonData $attachMetaPath)
    $attachment = $attachments | Where-Object { $_.id -eq $AttachmentId }
    
    if ($attachment) {
        # Delete file
        $filePath = Join-Path $PSScriptRoot "..\..\data\attachments\$($attachment.fileName)"
        if (Test-Path $filePath) {
            Remove-Item $filePath -Force
        }
        
        # Remove from metadata
        $attachments = @($attachments | Where-Object { $_.id -ne $AttachmentId })
        Write-JsonData $attachMetaPath $attachments
        return $true
    }
    
    return $false
}