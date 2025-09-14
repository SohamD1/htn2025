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
BACKEND_PID=$!
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
echo "   • RBC InvestEase (Main App): http://localhost:3001"
echo "   • RBC InvestIQ (Advanced): http://localhost:5173"
echo "   • Trading API Backend: http://localhost:5001"
echo ""
echo "📝 How to use:"
echo "   1. Open http://localhost:3001 in your browser"
echo "   2. Login and select 'RBC InvestIQ' to access advanced features"
echo "   3. Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait
