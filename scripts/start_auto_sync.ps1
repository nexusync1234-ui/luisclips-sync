$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$daemonPath = Join-Path $PSScriptRoot 'auto_sync_daemon.js'
$existing = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine.Contains($daemonPath)
}
if ($existing) {
    Write-Output "Auto-sync já está ativo (PID $($existing.ProcessId))."
    exit 0
}
$logDir = Join-Path $projectRoot '.sync'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$nodePath = (Get-Command node.exe).Source
$process = Start-Process -FilePath $nodePath -ArgumentList @('"' + $daemonPath + '"', '--delay-first') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'output.log') -RedirectStandardError (Join-Path $logDir 'error.log') -PassThru
Write-Output "Auto-sync iniciado (PID $($process.Id)). Logs: $logDir"
