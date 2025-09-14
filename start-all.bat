@echo off
setlocal EnableDelayedExpansion

REM RBC InvestEase & InvestIQ - Unified Startup Script
echo 🚀 Starting RBC InvestEase & InvestIQ Platform...

REM Start Node.js Backend (Authentication & Client Management)
echo 🔐 Starting Node.js Backend Server...
cd backend
call npm install >nul 2>&1
start /b npm start
cd ..

REM Start Main React App (RBC InvestEase)
echo 📊 Starting RBC InvestEase (Main App)...
start /b npm start

REM Start Trading API Backend
echo 💹 Starting Trading API Backend...
cd backend\trading-api
if not exist "venv" (
    echo Setting up Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
start /b python app.py
cd ..\..

REM Start InvestIQ Backend
echo 📈 Starting RBC InvestIQ Backend...
cd port-maker\backend
if not exist "venv" (
    echo Setting up Python virtual environment for InvestIQ...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
start /b python app.py
cd ..\..

REM Start InvestIQ Frontend
echo 🎯 Starting RBC InvestIQ Frontend...
cd port-maker
start /b npm run dev
cd ..

echo.
echo ✅ All services started successfully!
echo.
echo 🌐 Access URLs:
echo    • RBC InvestEase (Main App): http://localhost:3000
echo    • Node.js Backend: http://localhost:3001
echo    • RBC InvestIQ (Advanced): http://localhost:5173
echo    • Trading API Backend: http://localhost:5001
echo    • InvestIQ Backend: http://localhost:5002
echo.
echo 📝 How to use:
echo    1. Open http://localhost:3000 in your browser
echo    2. Register/Login to access the platform
echo    3. Select 'Launch InvestIQ' to access advanced trading features
echo    4. Close this window to stop all services
echo.

REM Keep the window open
pause