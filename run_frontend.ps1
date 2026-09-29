Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting SARATHI React / Vite Frontend" -ForegroundColor Green
Write-Host " Connected API URL: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host " App URL: http://localhost:5173 (or $PORT in preview)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot"
npm run dev
