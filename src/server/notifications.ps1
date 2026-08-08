# Notification System

function Get-UpcomingReminders {
    param([int]$MinutesAhead = 30)
    
    $tasksPath = Get-DataPath "tasks"
    $tasks = @(Read-JsonData $tasksPath)
    $now = Get-Date
    $cutoff = $now.AddMinutes($MinutesAhead)
    
    $reminders = @()
    
    foreach ($task in $tasks) {
        # Skip completed tasks
        if ($task.status -eq 'done') { continue }
        
        # Check reminder
        if ($task.reminderAt) {
            try {
                $reminderTime = [datetime]::Parse($task.reminderAt)
                $lastNotified = if ($task.lastNotified) { [datetime]::Parse($task.lastNotified) } else { $null }
                
                # Only notify if within window and not already notified recently
                if ($reminderTime -ge $now -and $reminderTime -le $cutoff) {
                    if (-not $lastNotified -or ($now - $lastNotified).TotalHours -gt 1) {
                        $reminders += @{
                            id = $task.id
                            type = "reminder"
                            title = "⏰ یادآوری: $($task.title)"
                            message = $task.description
                            dueDate = $task.dueDate
                            reminderAt = $task.reminderAt
                            priority = $task.priority
                            entity = "task"
                        }
                    }
                }
            } catch {
                # Invalid date format, skip
            }
        }
        
        # Check overdue
        if ($task.dueDate -and -not $task.reminderAt) {
            try {
                $dueTime = [datetime]::Parse($task.dueDate)
                if ($dueTime -lt $now -and $task.status -ne 'done') {
                    $lastNotified = if ($task.lastNotified) { [datetime]::Parse($task.lastNotified) } else { $null }
                    if (-not $lastNotified -or ($now - $lastNotified).TotalHours -gt 24) {
                        $reminders += @{
                            id = $task.id
                            type = "overdue"
                            title = "⚠️ عقب‌افتاده: $($task.title)"
                            message = "این کار باید تا تاریخ $($task.dueDate) انجام می‌شد"
                            dueDate = $task.dueDate
                            priority = $task.priority
                            entity = "task"
                        }
                    }
                }
            } catch {}
        }
    }
    
    return $reminders
}

function Mark-NotificationSent {
    param([string]$TaskId)
    
    $tasksPath = Get-DataPath "tasks"
    $tasks = @(Read-JsonData $tasksPath)
    
    for ($i = 0; $i -lt $tasks.Count; $i++) {
        if ($tasks[$i].id -eq $TaskId) {
            $tasks[$i] | Add-Member -MemberType NoteProperty -Name 'lastNotified' -Value (Get-Date).ToUniversalTime().ToString('o') -Force
            break
        }
    }
    
    Write-JsonData $tasksPath $tasks
}

function Process-RecurringTasks {
    # Check for completed recurring tasks and create next instance
    $tasksPath = Get-DataPath "tasks"
    $tasks = @(Read-JsonData $tasksPath)
    $newTasks = @()
    
    foreach ($task in $tasks) {
        if ($task.recurring -and $task.recurring -ne 'none' -and $task.status -eq 'done' -and $task.dueDate) {
            try {
                $dueTime = [datetime]::Parse($task.dueDate)
                $nextDue = $dueTime
                
                switch ($task.recurring) {
                    'daily' { $nextDue = $dueTime.AddDays(1) }
                    'weekly' { $nextDue = $dueTime.AddDays(7) }
                    'monthly' { $nextDue = $dueTime.AddMonths(1) }
                    'yearly' { $nextDue = $dueTime.AddYears(1) }
                    'custom' { 
                        if ($task.recurringInterval -match '^\d+$') {
                            $nextDue = $dueTime.AddDays([int]$task.recurringInterval)
                        }
                    }
                }
                
                # Check if next instance already exists
                $exists = $false
                foreach ($t in $tasks) {
                    if ($t.title -eq $task.title -and $t.dueDate -eq $nextDue.ToString('o')) {
                        $exists = $true
                        break
                    }
                }
                
                if (-not $exists -and $task.recurring -ne 'none') {
                    $newTask = [PSCustomObject]@{
                        id = New-UniqueId
                        title = $task.title
                        description = $task.description
                        dueDate = $nextDue.ToString('o')
                        priority = $task.priority
                        status = 'pending'
                        personId = $task.personId
                        projectId = $task.projectId
                        tags = $task.tags
                        reminderAt = $task.reminderAt
                        recurring = $task.recurring
                        recurringInterval = $task.recurringInterval
                        lastNotified = ""
                        createdAtUtc = (Get-Date).ToUniversalTime().ToString('o')
                        updatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
                    }
                    $newTasks += $newTask
                }
            } catch {}
        }
    }
    
    if ($newTasks.Count -gt 0) {
        $tasks += $newTasks
        Write-JsonData $tasksPath $tasks
        foreach ($nt in $newTasks) {
            Add-ActivityLog "task" $nt.id "create" "Created recurring task: $($nt.title)" | Out-Null
        }
    }
    
    return $newTasks.Count
}