@echo off
title SARATHI Backend API Server (FastAPI)
echo ============================================================
echo Starting SARATHI Backend API Server (FastAPI + SQLite)
echo Python 3.11 Runtime - http://127.0.0.1:8000
echo ============================================================
cd /d "%~dp0backend"

REM Check for virtual environment
if exist "venv\Scripts\python.exe" (
    set "PYTHON_EXE=venv\Scripts\python.exe"
) else if exist "venv311\Scripts\python.exe" (
    set "PYTHON_EXE=venv311\Scripts\python.exe"
) else if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python311\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo Using Python: %PYTHON_EXE%
%PYTHON_EXE% -c "import sys; print('Python Runtime:', sys.version)"

echo Starting Uvicorn on 127.0.0.1:8000...
%PYTHON_EXE% -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
