@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package.ps1" %*
