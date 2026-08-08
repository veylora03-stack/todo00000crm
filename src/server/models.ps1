# Model Functions (v2 - with Update/Delete)

. "$PSScriptRoot\storage.ps1"

# ===== People =====
function Add-Person {
    param([string]$Name, [string]$Email = "", [string]$Phone = "", [string]$Company = "", [string]$Notes = "", [string[]]$Tags = @())
    $path = Get-DataPath "people"
    $people = @(Read-JsonData $path)
    $new = [PSCustomObject]@{
        id = New-UniqueId; name = $Name; email = $Email; phone = $Phone; company = $Company; notes = $Notes; tags = $Tags
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    $people += $new
    Write-JsonData $path $people
    Add-ActivityLog "person" $new.id "create" "Created person: $Name" | Out-Null
    return $new
}

function Get-People { return @(Read-JsonData (Get-DataPath "people")) }

function Update-Person {
    param([string]$Id, [hashtable]$Updates)
    $result = Update-JsonRecord "people" $Id $Updates
    if ($result) { Add-ActivityLog "person" $Id "update" "Updated person" | Out-Null }
    return $result
}

function Remove-Person {
    param([string]$Id)
    $result = Remove-JsonRecord "people" $Id
    if ($result) { Add-ActivityLog "person" $Id "delete" "Deleted person" | Out-Null }
    return $result
}

# ===== Tasks =====
function Add-Task {
    param([string]$Title, [string]$Description = "", [string]$DueDate = "", [string]$Priority = "medium", [string]$Status = "pending", [string]$PersonId = "", [string]$ProjectId = "", [string[]]$Tags = @())
    $path = Get-DataPath "tasks"
    $tasks = @(Read-JsonData $path)
    $new = [PSCustomObject]@{
        id = New-UniqueId; title = $Title; description = $Description; dueDate = $DueDate; priority = $Priority; status = $Status; personId = $PersonId; projectId = $ProjectId; tags = $Tags
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    $tasks += $new
    Write-JsonData $path $tasks
    Add-ActivityLog "task" $new.id "create" "Created task: $Title" | Out-Null
    return $new
}

function Get-Tasks { return @(Read-JsonData (Get-DataPath "tasks")) }

function Update-Task {
    param([string]$Id, [hashtable]$Updates)
    $result = Update-JsonRecord "tasks" $Id $Updates
    if ($result) { Add-ActivityLog "task" $Id "update" "Updated task" | Out-Null }
    return $result
}

function Remove-Task {
    param([string]$Id)
    $result = Remove-JsonRecord "tasks" $Id
    if ($result) { Add-ActivityLog "task" $Id "delete" "Deleted task" | Out-Null }
    return $result
}

# ===== Ideas =====
function Add-Idea {
    param([string]$Title, [string]$Description = "", [string]$Status = "draft", [string[]]$Tags = @())
    $path = Get-DataPath "ideas"
    $ideas = @(Read-JsonData $path)
    $new = [PSCustomObject]@{
        id = New-UniqueId; title = $Title; description = $Description; status = $Status; tags = $Tags
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    $ideas += $new
    Write-JsonData $path $ideas
    Add-ActivityLog "idea" $new.id "create" "Created idea: $Title" | Out-Null
    return $new
}

function Get-Ideas { return @(Read-JsonData (Get-DataPath "ideas")) }

function Update-Idea {
    param([string]$Id, [hashtable]$Updates)
    $result = Update-JsonRecord "ideas" $Id $Updates
    if ($result) { Add-ActivityLog "idea" $Id "update" "Updated idea" | Out-Null }
    return $result
}

function Remove-Idea {
    param([string]$Id)
    $result = Remove-JsonRecord "ideas" $Id
    if ($result) { Add-ActivityLog "idea" $Id "delete" "Deleted idea" | Out-Null }
    return $result
}

# ===== Notes =====
function Add-Note {
    param([string]$Title, [string]$Content = "", [string]$PersonId = "", [string]$ProjectId = "", [string[]]$Tags = @())
    $path = Get-DataPath "notes"
    $notes = @(Read-JsonData $path)
    $new = [PSCustomObject]@{
        id = New-UniqueId; title = $Title; content = $Content; personId = $PersonId; projectId = $ProjectId; tags = $Tags
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    $notes += $new
    Write-JsonData $path $notes
    Add-ActivityLog "note" $new.id "create" "Created note: $Title" | Out-Null
    return $new
}

function Get-Notes { return @(Read-JsonData (Get-DataPath "notes")) }

function Update-Note {
    param([string]$Id, [hashtable]$Updates)
    $result = Update-JsonRecord "notes" $Id $Updates
    if ($result) { Add-ActivityLog "note" $Id "update" "Updated note" | Out-Null }
    return $result
}

function Remove-Note {
    param([string]$Id)
    $result = Remove-JsonRecord "notes" $Id
    if ($result) { Add-ActivityLog "note" $Id "delete" "Deleted note" | Out-Null }
    return $result
}

# ===== Projects =====
function Add-Project {
    param([string]$Name, [string]$Description = "", [string]$Status = "active", [string]$StartDate = "", [string]$EndDate = "", [string[]]$Tags = @())
    $path = Get-DataPath "projects"
    $projects = @(Read-JsonData $path)
    $new = [PSCustomObject]@{
        id = New-UniqueId; name = $Name; description = $Description; status = $Status; startDate = $StartDate; endDate = $EndDate; tags = $Tags
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    $projects += $new
    Write-JsonData $path $projects
    Add-ActivityLog "project" $new.id "create" "Created project: $Name" | Out-Null
    return $new
}

function Get-Projects { return @(Read-JsonData (Get-DataPath "projects")) }

function Update-Project {
    param([string]$Id, [hashtable]$Updates)
    $result = Update-JsonRecord "projects" $Id $Updates
    if ($result) { Add-ActivityLog "project" $Id "update" "Updated project" | Out-Null }
    return $result
}

function Remove-Project {
    param([string]$Id)
    $result = Remove-JsonRecord "projects" $Id
    if ($result) { Add-ActivityLog "project" $Id "delete" "Deleted project" | Out-Null }
    return $result
}

# ===== Interactions =====
function Add-Interaction {
    param([string]$PersonId, [string]$Type = "note", [string]$Subject = "", [string]$Content = "", [string]$Date = "")
    if ([string]::IsNullOrWhiteSpace($Date)) { $Date = (Get-Date).ToUniversalTime().ToString('o') }
    $path = Get-DataPath "interactions"
    $interactions = @(Read-JsonData $path)
    $new = [PSCustomObject]@{
        id = New-UniqueId; personId = $PersonId; type = $Type; subject = $Subject; content = $Content; date = $Date
        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    }
    $interactions += $new
    Write-JsonData $path $interactions
    Add-ActivityLog "interaction" $new.id "create" "Created interaction: $Type" | Out-Null
    return $new
}

function Get-Interactions { return @(Read-JsonData (Get-DataPath "interactions")) }