Set WshShell = CreateObject("WScript.Shell")
Set Fso = CreateObject("Scripting.FileSystemObject")
ProjectRoot = Fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "powershell.exe -NoProfile -File """ & ProjectRoot & "\scripts\start_auto_sync.ps1""", 0, False
