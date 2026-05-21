@echo off
REM Package imageResize Lambda (no npm on PATH required)
set "PATH=C:\Program Files\nodejs;%PATH%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package.ps1" %*
