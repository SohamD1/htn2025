#!/bin/bash

# RBC InvestEase & InvestIQ - Unified Startup Script
echo "🚀 Starting RBC InvestEase & InvestIQ Platform..."

# Function to cleanup background processes on script exit
cleanup() {
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Start Node.js Backend (Authentication & Client Management)
echo "🔐 Starting Node.js Backend Server..."
cd backend
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
cd ..

# Start Main React App (RBC InvestEase)
echo "📊 Starting RBC InvestEase (Main App)..."
npm start &
MAIN_APP_PID=$!

# Start Trading API Backend
echo "💹 Starting Trading API Backend..."
cd backend/trading-api
if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python app.py &
TRADING_API_PID=$!
cd ../..

# Start InvestIQ Backend
echo "📈 Starting RBC InvestIQ Backend..."
cd port-maker/backend
if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment for InvestIQ..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python app.py &
INVESTIQ_BACKEND_PID=$!
cd ../..

# Start InvestIQ Frontend
echo "🎯 Starting RBC InvestIQ Frontend..."
cd port-maker
npm run dev &
INVESTIQ_PID=$!
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   • RBC InvestEase (Main App): http://localhost:3000"
echo "   • Node.js Backend: http://localhost:3001"
echo "   • RBC InvestIQ (Advanced): http://localhost:5173"
echo "   • Trading API Backend: http://localhost:5001"
echo "   • InvestIQ Backend: http://localhost:5002"
echo ""
echo "📝 How to use:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Register/Login to access the platform"
echo "   3. Select 'Launch InvestIQ' to access advanced trading features"
echo "   4. Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait
