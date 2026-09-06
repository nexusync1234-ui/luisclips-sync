Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node scripts/auto_sync_daemon.js", 0, False
