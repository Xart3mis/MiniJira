@echo off
REM From repo root — builds backend\lambda\imageResize\function.zip
cd /d "%~dp0backend\lambda\imageResize"
call package.cmd %*
