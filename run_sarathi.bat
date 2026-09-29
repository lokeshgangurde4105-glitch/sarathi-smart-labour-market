@echo off
title Launch SARATHI Full-Stack Platform
echo ============================================================
echo LAUNCHING SARATHI FULL-STACK PLATFORM
echo Smart Labour Market Intelligence & Career Guidance Platform
echo ============================================================
echo 1. Starting FastAPI Backend on http://127.0.0.1:8000
start "SARATHI Backend (FastAPI)" cmd /c "%~dp0run_backend.bat"

echo 2. Waiting 3 seconds for backend database initialization...
timeout /t 3 /nobreak >nul

echo 3. Starting React/Vite Frontend on http://localhost:5174
start "SARATHI Frontend (Vite)" cmd /c "%~dp0run_frontend.bat"

echo ============================================================
echo SARATHI is launching!
echo Web App: http://localhost:5174
echo Backend Docs: http://127.0.0.1:8000/docs
echo ============================================================
