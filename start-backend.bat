@echo off
setlocal
chcp 65001 >nul
title PAN v2.0 Backend

set "DEFAULT_RUNTIME_DIR=C:\node_modules_store\local-code-finder\app"
set "APP_DIR=%PAN_RUNTIME_DIR%"
if not defined APP_DIR if exist "%DEFAULT_RUNTIME_DIR%\node_modules\tsx\dist\cli.mjs" set "APP_DIR=%DEFAULT_RUNTIME_DIR%"
if not defined APP_DIR set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
cd /d "%APP_DIR%"

if not defined NODE_EXE for %%I in (node.exe) do if not defined NODE_EXE set "NODE_EXE=%%~$PATH:I"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"

if not defined NODE_EXE (
    echo [ERROR] Node.js was not found.
    pause
    exit /b 1
)

if not exist "%APP_DIR%\node_modules\tsx\dist\cli.mjs" (
    echo [ERROR] Missing backend dependency: node_modules\tsx\dist\cli.mjs
    echo Run start.bat again to rebuild the local runtime.
    pause
    exit /b 1
)

for %%I in ("%NODE_EXE%") do set "NODE_DIR=%%~dpI"
set "PATH=%NODE_DIR%;%PATH%"

"%NODE_EXE%" "%APP_DIR%\node_modules\tsx\dist\cli.mjs" watch server/index.ts
pause
endlocal
