@echo off
title SARATHI Frontend Application (Vite + React)
echo ============================================================
echo Starting SARATHI Frontend Application (Vite + React)
echo Access via: http://localhost:5174
echo ============================================================
cd /d "%~dp0"
npm run dev -- --port 5174 --host
pause
