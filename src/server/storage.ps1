# Storage Core Functions (v2 - with Update/Delete)

function Get-DataPath {
    param([string]$EntityName)
    return Join-Path $PSScriptRoot "..\..\data\$EntityName.json"
}

function Read-JsonData {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return @() }
    $content = Get-Content -Path $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($content)) { return @() }
    try {
        $data = ConvertFrom-Json -InputObject $content
        if ($null -eq $data) { return @() }
        return @($data)
    } catch {
        return @()
    }
}

function Write-JsonData {
    param([string]$Path, [object]$Data)
    if ($null -eq $Data) { $Data = @() }
    $Data = @($Data)
    $json = ConvertTo-Json -InputObject $Data -Depth 10
    [System.IO.File]::WriteAllText($Path, $json, [System.Text.UTF8Encoding]::new($false))
}

function New-UniqueId {
    return [guid]::NewGuid().ToString()
}

function Add-ActivityLog {
    param(
        [string]$EntityType,
        [string]$EntityId,
        [string]$Action,
        [string]$Details = ""
    )
    $logPath = Get-DataPath "activity_logs"
    $logs = @(Read-JsonData $logPath)
    $newLog = [PSCustomObject]@{
        id = New-UniqueId
        entityType = $EntityType
        entityId = $EntityId
        action = $Action
        details = $Details
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    $logs += $newLog
    Write-JsonData $logPath $logs
    return $newLog
}

function Update-JsonRecord {
    param(
        [string]$EntityName,
        [string]$Id,
        [hashtable]$Updates
    )
    $path = Get-DataPath $EntityName
    $items = @(Read-JsonData $path)
    $found = $false
    
    for ($i = 0; $i -lt $items.Count; $i++) {
        if ($items[$i].id -eq $Id) {
            foreach ($key in $Updates.Keys) {
                if ($key -ne 'id' -and $key -ne 'createdAtUtc') {
                    $items[$i] | Add-Member -MemberType NoteProperty -Name $key -Value $Updates[$key] -Force
                }
            }
            $items[$i] | Add-Member -MemberType NoteProperty -Name 'updatedAtUtc' -Value (Get-Date).ToUniversalTime().ToString('o') -Force
            $found = $true
            break
        }
    }
    
    if ($found) {
        Write-JsonData $path $items
        return $true
    }
    return $false
}

function Remove-JsonRecord {
    param(
        [string]$EntityName,
        [string]$Id
    )
    $path = Get-DataPath $EntityName
    $items = @(Read-JsonData $path)
    $newItems = @($items | Where-Object { $_.id -ne $Id })
    
    if ($newItems.Count -lt $items.Count) {
        Write-JsonData $path $newItems
        return $true
    }
    return $false
}

function Search-JsonData {
    param(
        [string]$EntityName,
        [string]$Query,
        [string[]]$Fields
    )
    $path = Get-DataPath $EntityName
    $items = @(Read-JsonData $path)
    $query = $Query.ToLower()
    
    return @($items | Where-Object {
        $item = $_
        $match = $false
        foreach ($field in $Fields) {
            $value = $item.$field
            if ($value -and $value.ToString().ToLower().Contains($query)) {
                $match = $true
                break
            }
        }
        $match
    })
}