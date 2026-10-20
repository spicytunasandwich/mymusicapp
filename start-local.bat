@echo off
title Linear Music Player Launcher
echo ==================================================
echo   Starting Linear Music Platform on Windows 11
echo ==================================================
cd /d "%~dp0"

echo [1/2] Starting Backend API & Disk Stream Server (Port 5000)...
start "Linear Backend Server" cmd /k "cd backend && npm start"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Web Player (Port 3000)...
start "Linear Web Player" cmd /k "cd web && npm run dev"

timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ==================================================
echo   Application running at: http://localhost:3000
echo ==================================================
