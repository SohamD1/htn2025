# RBC InvestEase & InvestIQ - Unified Startup Script
Write-Host "🚀 Starting RBC InvestEase & InvestIQ Platform..." -ForegroundColor Green

# Function to cleanup background processes on script exit
function Cleanup {
    Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    exit
}

# Set up cleanup for Ctrl+C
$null = Register-ObjectEvent -InputObject ([Console]) -EventName CancelKeyPress -Action {
    Cleanup
}

try {
    # Start Node.js Backend (Authentication & Client Management)
    Write-Host "🔐 Starting Node.js Backend Server..." -ForegroundColor Cyan
    Set-Location backend
    npm install *>$null
    $backend = Start-Process npm -ArgumentList "start" -PassThru -WindowStyle Hidden
    Set-Location ..

    # Start Main React App (RBC InvestEase)
    Write-Host "📊 Starting RBC InvestEase (Main App)..." -ForegroundColor Cyan
    $mainApp = Start-Process npm -ArgumentList "start" -PassThru -WindowStyle Hidden

    # Start Trading API Backend
    Write-Host "💹 Starting Trading API Backend..." -ForegroundColor Cyan
    Set-Location "backend\trading-api"
    if (!(Test-Path "venv")) {
        Write-Host "Setting up Python virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
    & "venv\Scripts\Activate.ps1"
    pip install -r requirements.txt *>$null
    $tradingApi = Start-Process python -ArgumentList "app.py" -PassThru -WindowStyle Hidden
    Set-Location "..\..\"

    # Start InvestIQ Backend
    Write-Host "📈 Starting RBC InvestIQ Backend..." -ForegroundColor Cyan
    Set-Location "port-maker\backend"
    if (!(Test-Path "venv")) {
        Write-Host "Setting up Python virtual environment for InvestIQ..." -ForegroundColor Yellow
        python -m venv venv
    }
    & "venv\Scripts\Activate.ps1"
    pip install -r requirements.txt *>$null
    $investiqBackend = Start-Process python -ArgumentList "app.py" -PassThru -WindowStyle Hidden
    Set-Location "..\.."

    # Start InvestIQ Frontend
    Write-Host "🎯 Starting RBC InvestIQ Frontend..." -ForegroundColor Cyan
    Set-Location "port-maker"
    $investiq = Start-Process npm -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
    Set-Location ".."

    Write-Host ""
    Write-Host "✅ All services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access URLs:" -ForegroundColor White
    Write-Host "   • RBC InvestEase (Main App): http://localhost:3000" -ForegroundColor White
    Write-Host "   • Node.js Backend: http://localhost:3001" -ForegroundColor White
    Write-Host "   • RBC InvestIQ (Advanced): http://localhost:5173" -ForegroundColor White
    Write-Host "   • Trading API Backend: http://localhost:5001" -ForegroundColor White
    Write-Host "   • InvestIQ Backend: http://localhost:5002" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 How to use:" -ForegroundColor White
    Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "   2. Register/Login to access the platform" -ForegroundColor White
    Write-Host "   3. Select 'Launch InvestIQ' to access advanced trading features" -ForegroundColor White
    Write-Host "   4. Press Ctrl+C to stop all services" -ForegroundColor White
    Write-Host ""

    # Wait for user input to keep script running
    Write-Host "Press any key to stop all services..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

} finally {
    Cleanup
}