Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting SARATHI FastAPI Backend on http://127.0.0.1:8000" -ForegroundColor Green
Write-Host " SQLite Database: kaushalya_setu.db (Auto-created & Seeded)" -ForegroundColor Green
Write-Host " OpenAPI Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\backend"
if (Test-Path ".\venv311\Scripts\uvicorn.exe") {
    & ".\venv311\Scripts\uvicorn.exe" app.main:app --host 127.0.0.1 --port 8000 --reload
} else {
    uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
}
