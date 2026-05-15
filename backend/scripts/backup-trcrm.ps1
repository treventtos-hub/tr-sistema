$ErrorActionPreference = "Stop"

$pgDump = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
$backupDir = Join-Path $env:USERPROFILE "OneDrive\Backups TR Sistema"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $backupDir "trcrm-$timestamp.dump"
$logFile = Join-Path $backupDir "backup.log"
$localConfig = Join-Path $PSScriptRoot "backup-trcrm.local.ps1"

if (Test-Path $localConfig) {
  . $localConfig
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

if (-not $env:TR_BACKUP_DB_PASSWORD) {
  throw "Defina TR_BACKUP_DB_PASSWORD ou crie backend\scripts\backup-trcrm.local.ps1."
}

$env:PGPASSWORD = $env:TR_BACKUP_DB_PASSWORD

try {
  & $pgDump `
    --host "localhost" `
    --port "5432" `
    --username "postgres" `
    --format "custom" `
    --blobs `
    --file $backupFile `
    "trcrm"

  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump terminou com codigo $LASTEXITCODE."
  }

  Add-Content -Path $logFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') OK $backupFile"
}
catch {
  Add-Content -Path $logFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ERRO $($_.Exception.Message)"
  throw
}
finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
