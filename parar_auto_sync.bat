@echo off
echo A parar auto-sync...
wmic process where "commandline like '%%auto_sync_daemon.js%%'" call terminate 2>nul
echo Parado com sucesso!
pause
