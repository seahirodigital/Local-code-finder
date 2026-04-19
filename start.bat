@echo off
setlocal
chcp 65001 >nul
title PAN v2.0 Frontend

set "SOURCE_DIR=%~dp0"
if "%SOURCE_DIR:~-1%"=="\" set "SOURCE_DIR=%SOURCE_DIR:~0,-1%"
set "RUNTIME_ROOT=C:\node_modules_store\local-code-finder"
set "RUNTIME_DIR=%RUNTIME_ROOT%\app"
set "PAN_RUNTIME_DIR=%RUNTIME_DIR%"
set "PAN_CONFIG_PATH=%SOURCE_DIR%\pan-config.json"

echo ========================================
echo   PAN v2.0 Clean Startup
echo   Cleaning old backend processes...
echo ========================================
taskkill /F /FI "WINDOWTITLE eq PAN_Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PAN v2.0 Backend*" >nul 2>&1
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess ^| Sort-Object -Unique ^| ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo.
echo ========================================
echo   PAN v2.0 Starting
echo ========================================
echo.

cd /d "%SOURCE_DIR%"
call :resolve_node
if errorlevel 1 goto :end

for %%I in ("%NODE_EXE%") do set "NODE_DIR=%%~dpI"
set "PATH=%NODE_DIR%;%PATH%"

if not exist "%RUNTIME_ROOT%" mkdir "%RUNTIME_ROOT%"
if not exist "%RUNTIME_DIR%" mkdir "%RUNTIME_DIR%"

echo [1/4] Syncing source to local runtime...
robocopy "%SOURCE_DIR%" "%RUNTIME_DIR%" /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XD ".git" "dist" "node_modules" "node_modules_onedrive_old" >nul
set "ROBOCOPY_EXIT=%ERRORLEVEL%"
if %ROBOCOPY_EXIT% GEQ 8 (
    echo [ERROR] Failed to sync files to local runtime.
    pause
    exit /b 1
)

echo [2/4] Ensuring local dependencies...
if not exist "%RUNTIME_DIR%\node_modules\tsx\dist\cli.mjs" goto :install_deps
if not exist "%RUNTIME_DIR%\node_modules\vite\bin\vite.js" goto :install_deps
echo [2/4] Dependencies OK
goto :deps_ready

:install_deps
if not defined NPM_CMD (
    echo [ERROR] npm.cmd was not found.
    echo Reinstall Node.js LTS, then run start.bat again.
    pause
    exit /b 1
)
echo [2/4] Installing dependencies locally...
pushd "%RUNTIME_DIR%"
call "%NPM_CMD%" install
set "NPM_EXIT=%ERRORLEVEL%"
popd
if not "%NPM_EXIT%"=="0" (
    echo [ERROR] npm install failed in local runtime.
    pause
    exit /b 1
)

:deps_ready
if not exist "%RUNTIME_DIR%\node_modules\tsx\dist\cli.mjs" (
    echo [ERROR] Missing backend dependency after install.
    pause
    exit /b 1
)

if not exist "%RUNTIME_DIR%\node_modules\vite\bin\vite.js" (
    echo [ERROR] Missing frontend dependency after install.
    pause
    exit /b 1
)

echo [3/4] Starting backend server on port 3001...
start "PAN_Backend" /min "%SOURCE_DIR%\start-backend.bat"

echo [4/4] Opening browser in a few seconds...
start "PAN_OpenBrowser" /min powershell -NoProfile -Command "Start-Sleep -Seconds 8; Start-Process 'http://localhost:3000'"

echo.
echo ========================================
echo   PAN v2.0 Running
echo   Source:   %SOURCE_DIR%
echo   Runtime:  %RUNTIME_DIR%
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo ========================================
echo.

cd /d "%RUNTIME_DIR%"
"%NODE_EXE%" "%RUNTIME_DIR%\node_modules\vite\bin\vite.js" --port=3000 --host=0.0.0.0
goto :end

:resolve_node
set "NODE_EXE="
set "NPM_CMD="

for %%I in (node.exe) do if not defined NODE_EXE set "NODE_EXE=%%~$PATH:I"
for %%I in (npm.cmd) do if not defined NPM_CMD set "NPM_CMD=%%~$PATH:I"

if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NPM_CMD if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NPM_CMD if exist "%LocalAppData%\Programs\nodejs\npm.cmd" set "NPM_CMD=%LocalAppData%\Programs\nodejs\npm.cmd"

if not defined NODE_EXE (
    echo [ERROR] Node.js was not found.
    echo Install Node.js LTS, then run start.bat again.
    pause
    exit /b 1
)

exit /b 0

:end
endlocal
