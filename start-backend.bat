@echo off
chcp 65001 >nul
title PAN v2.0 Backend
cd /d "%~dp0"
node "%~dp0node_modules\tsx\dist\cli.mjs" watch server/index.ts
pause
