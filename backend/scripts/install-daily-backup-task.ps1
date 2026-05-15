$ErrorActionPreference = "Stop"

$taskName = "TR Sistema Backup Diario"
$scriptPath = Join-Path $PSScriptRoot "backup-trcrm.ps1"

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At 20:00
$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Backup diario do banco trcrm para o OneDrive." `
  -Force | Out-Null

Write-Output "Tarefa '$taskName' instalada para executar todos os dias as 20:00."
