@echo off
echo A parar auto-sync...
powershell.exe -NoProfile -File "%~dp0scripts\stop_auto_sync.ps1"
echo Parado com sucesso!
pause
