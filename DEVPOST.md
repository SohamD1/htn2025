# 🏦 RBC InvestEase & InvestIQ Platform

## 🌟 Inspiration

As students, we often struggle with financial literacy and investment knowledge. Traditional banking platforms are intimidating and lack educational components. We wanted to create a comprehensive platform that not only manages investments but also educates users through gamification and AI-powered assistance. Our goal was to make investing accessible, educational, and engaging for the next generation.

## 🎯 What it does

**RBC InvestEase & InvestIQ** is a comprehensive dual-platform financial ecosystem designed specifically for students:

### 🎓 RBC InvestEase (Main Platform)
- **Student-Focused Portfolio Management**: Create and manage multiple investment portfolios with different risk levels
- **Real-Time Investment Simulation**: Run portfolio simulations to predict performance over time
- **Transaction Management**: Buy/sell stocks with complete transaction history tracking
- **Cash Management**: Deposit funds and manage available balance
- **Financial Goal Setting**: Set and track progress toward financial objectives
- **AI Financial Advisor**: Meet Leo 🦁, your personal AI financial advisor powered by Claude Sonnet

### 📈 RBC InvestIQ (Advanced Trading Platform)
- **Professional Trading Interface**: Advanced charting with TradingView integration
- **Terminal-Style Commands**: Draw technical analysis lines using natural language commands
- **Real-Time Market Data**: Live stock data with yfinance integration
- **Technical Analysis Tools**: Support/resistance lines, horizontal/vertical markers

### 🎮 The Crib Quest (Gamification)
- **Daily Financial Challenges**: Answer finance questions to earn points
- **Progressive House Upgrades**: Level up your virtual crib with 3D Sketchfab models
- **Streak System**: Maintain daily engagement with financial education
- **Interactive Learning**: Learn through play with immediate feedback

## 🛠️ How we built it

### **Frontend Architecture**
- **React 18 + TypeScript**: Modern component-based architecture with type safety
- **React Router**: Client-side routing for seamless navigation
- **Context API**: Global state management for authentication and user data
- **CSS3**: Custom styling with RBC branding and responsive design

### **Backend Services**
- **Node.js + Express**: RESTful API server for authentication and data management
- **MongoDB Atlas**: Cloud database for persistent user data and portfolio information
- **Python Flask**: Trading API backend using yfinance for real-time market data
- **JWT Authentication**: Secure token-based authentication system

### **AI & External Integrations**
- **Martian API**: AI chat completion using Claude Sonnet 4 for financial advice
- **RBC Portfolio API**: Official Hack the North 2025 Portfolio Simulation API
- **TradingView**: Advanced charting capabilities for technical analysis
- **Sketchfab**: 3D model integration for gamification elements
- **yfinance**: Real-time stock market data

### **Data Management**
- **Hybrid Storage**: localStorage for client-side caching + MongoDB for persistence
- **Real-time Sync**: Automatic synchronization between local and cloud data
- **Fallback Systems**: Graceful degradation when external APIs are unavailable

## 🚀 Challenges we ran into

### **API Integration Complexity**
- **Challenge**: Integrating multiple external APIs (RBC, Martian, TradingView) with different authentication methods
- **Solution**: Built a robust service layer with error handling and fallback mechanisms

### **Real-Time Data Synchronization**
- **Challenge**: Keeping portfolio data synchronized between localStorage and MongoDB while handling API rate limits
- **Solution**: Implemented a hybrid caching system with intelligent sync strategies

### **AI Cost Management**
- **Challenge**: Managing AI API costs while providing responsive chatbot experience
- **Solution**: Built smart token estimation and model routing (cheap vs. expensive models based on query complexity)

### **Cross-Platform State Management**
- **Challenge**: Managing authentication and user state across multiple applications
- **Solution**: Created a unified authentication context with JWT tokens and automatic refresh

### **Financial Data Accuracy**
- **Challenge**: Ensuring accurate financial calculations and portfolio valuations
- **Solution**: Implemented comprehensive validation and error checking throughout the transaction pipeline

## 🎉 Accomplishments that we're proud of

### **🏗️ Full-Stack Architecture**
Built a complete ecosystem with 4 interconnected services running seamlessly together

### **🤖 AI-Powered Education**
Created "Leo" - an intelligent financial advisor that provides personalized advice based on user portfolio data

### **🎮 Innovative Gamification**
Developed "The Crib Quest" - a unique 3D house upgrade system that makes financial learning engaging

### **📊 Professional Trading Tools**
Integrated advanced charting capabilities typically found in professional trading platforms

### **🔄 Robust Data Management**
Built a sophisticated data synchronization system handling both online and offline scenarios

### **🎨 Polished UI/UX**
Created a modern, responsive interface with RBC branding that works across all devices

## 📚 What we learned

### **Technical Skills**
- Advanced React patterns with TypeScript for type-safe development
- Multi-service architecture design and orchestration
- AI API integration and cost optimization strategies
- Financial data modeling and portfolio mathematics
- Real-time data synchronization patterns

### **Financial Domain Knowledge**
- Investment portfolio management principles
- Risk assessment and diversification strategies
- Financial simulation algorithms
- Student-focused financial education approaches

### **Product Development**
- User experience design for financial applications
- Gamification strategies for educational content
- API design for financial services
- Error handling and graceful degradation

## 🚀 What's next for RBC InvestEase & InvestIQ

### **Short-term Enhancements**
- **Social Features**: Friend connections, portfolio sharing, and investment competitions
- **Mobile App**: React Native mobile application for on-the-go portfolio management
- **Advanced Analytics**: More sophisticated portfolio analysis and risk metrics
- **Paper Trading**: Virtual trading with real market data for safe learning

### **Long-term Vision**
- **University Partnerships**: Integration with financial literacy curricula
- **Robo-Advisor**: AI-powered automatic portfolio rebalancing
- **Cryptocurrency**: Add crypto trading and education components
- **Real Brokerage Integration**: Partner with real brokerages for actual trading

### **Educational Expansion**
- **Course Integration**: Structured financial literacy courses with certifications
- **Mentor Network**: Connect students with financial professionals
- **Scholarship Program**: Reward top performers with educational scholarships
- **Workshop Platform**: Host virtual financial education workshops

## 🏗️ Technical Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│    │  InvestIQ Frontend│    │  Node.js Backend│
│   (Port 3000)   │    │   (Port 5173)     │    │   (Port 3001)   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
          ┌─────────────────────┬┴───────────────────────┐
          │                     │                        │
┌─────────▼───────┐    ┌────────▼────────┐    ┌─────────▼───────┐
│ Trading API     │    │   MongoDB Atlas │    │  External APIs  │
│ (Port 5001)     │    │   (Cloud DB)    │    │ • RBC Portfolio │
│ • yfinance      │    │   • User Data   │    │ • Martian AI    │
│ • Flask Server  │    │   • Portfolios  │    │ • TradingView   │
└─────────────────┘    └─────────────────┘    │ • Sketchfab     │
                                              └─────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB Atlas account (or local MongoDB)

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd htn2025

# Install dependencies
npm install
cd port-maker && npm install && cd ..

# Start all services
./start-all.sh
```

### Access URLs
- **RBC InvestEase**: http://localhost:3000
- **RBC InvestIQ**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Trading API**: http://localhost:5001

## 🏆 Built for Hack the North 2025

This project was built during Hack the North 2025, integrating with the official **Portfolio Simulation & Market Sandbox API** provided by RBC. Our platform demonstrates how modern web technologies can be used to create engaging, educational financial tools for the next generation of investors.

---

**Team Members**: [Add your team member names here]
**Technologies Used**: React, TypeScript, Node.js, MongoDB, Python, Flask, AI/ML APIs
**Category**: Financial Technology, Education, AI/ML
