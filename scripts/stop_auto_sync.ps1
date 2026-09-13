$ErrorActionPreference = 'Stop'
$daemonPath = Join-Path $PSScriptRoot 'auto_sync_daemon.js'
Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine.Contains($daemonPath)
} | ForEach-Object { Stop-Process -Id $_.ProcessId }
Write-Output 'Auto-sync deste projeto parado.'
