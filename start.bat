@echo off
chcp 65001 >nul
title PAN v2.0 - Professional Asset Nexus

echo.
echo  ========================================
echo   PAN v2.0 - Professional Asset Nexus
echo   Starting...
echo  ========================================
echo.

cd /d "%~dp0"

:: node_modules check
if not exist "node_modules" (
    echo  [1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo  [1/3] Done
) else (
    echo  [1/3] Dependencies OK
)

:: Backend server (separate script)
echo  [2/3] Starting backend server (port 3001)...
start "PAN_Backend" /min "%~dp0start-backend.bat"

:: Wait for server
echo  [2/3] Waiting for server...
timeout /t 5 /nobreak >nul

:: Open browser
echo  [3/3] Opening browser...
start "" "http://localhost:3000"

echo.
echo  ========================================
echo   PAN v2.0 Running
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo   Close this window to stop
echo  ========================================
echo.

:: Frontend dev server (foreground)
node "%~dp0node_modules\vite\bin\vite.js" --port=3000 --host=0.0.0.0
