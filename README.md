# RBC InvestEase & InvestIQ Platform

A comprehensive financial platform featuring two integrated applications:
- **RBC InvestEase**: Student portfolio management and investment simulation
- **RBC InvestIQ**: Advanced investment intelligence with real-time charting and market analysis

Integrating with the Hack the North 2025 Portfolio Simulation & Market Sandbox API.

## Features

✅ **User Authentication** - Secure login/signup with MongoDB storage  
✅ **Portfolio Management** - Create and manage investment portfolios  
✅ **Transaction Tracking** - Buy/sell transactions with complete history  
✅ **Investment Simulation** - Simulate portfolio performance over time  
✅ **Advanced Charting** - RBC InvestIQ with TradingView integration and terminal interface  
✅ **Real-time Market Data** - Live stock data through trading API backend  
✅ **Modern UI** - Clean, responsive design with RBC branding  
✅ **Real-time Data** - Integration with RBC API for live portfolio data  

## Quick Start

### 1. Installation

```bash
npm install
cd port-maker && npm install && cd ..
```

### 2. No Database Setup Required

This application uses **localStorage** for data persistence, so no database setup is needed! All user data and transactions are stored in your browser's local storage.

### 3. Start All Services (Recommended)

Use the unified startup script to run all services:

```bash
./start-all.sh
```

This will start:
- **RBC InvestEase** (Main App): http://localhost:3001
- **RBC InvestIQ** (Advanced): http://localhost:5173  
- **Trading API Backend**: http://localhost:5001

### 4. Manual Start (Alternative)

Or start services individually:

```bash
# Terminal 1 - Main React App
npm start

# Terminal 2 - Trading API Backend
cd backend/trading-api
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py

# Terminal 3 - InvestIQ Frontend
cd port-maker
npm run dev
```

## User Registration & Login

### Sign Up Process
1. Click "Sign Up" on the login page
2. Fill in your details:
   - **Full Name** - Your display name
   - **Email** - Used for login (must be unique)
   - **Password** - Minimum 6 characters
   - **Initial Money** - Starting amount (default: $10,000)
3. Account creates both local user and RBC API client
4. Automatic login after successful registration

### Login Process
1. Enter your email and password
2. System authenticates against MongoDB
3. JWT token stored for session management
4. Redirects to dashboard

## Data Storage Schema

### localStorage Structure
All user data is stored in browser localStorage with the following structure:

```typescript
// localStorage keys:
'rbc_users' = [          // Array of all registered users
  {
    client_id: string,     // RBC API client ID
    user_id: string,       // Unique user identifier
    user_name: string,     // Display name
    email: string,         // Login email (unique)
    password: string,      // Simple hashed password
    money: number,         // Available cash balance
    txs: [                 // Transaction history
      {
        type: 'buy' | 'sell',
        symbol: string,      // Stock symbol
        amount: number,      // Shares/quantity
        price: number,       // Price per share
        timestamp: Date
      }
    ],
    created_at: Date,
    updated_at: Date
  }
]

'rbc_current_user' = {   // Currently logged in user data
  user_id: string,
  client_id: string,
  user_name: string,
  email: string,
  money: number,
  txs: ITransaction[]
}
```

## API Integration

### RBC Portfolio API
- **Team Registration** - Creates team and JWT token
- **Client Management** - CRUD operations for investment clients
- **Portfolio Management** - Create and manage investment portfolios
- **Simulations** - Run portfolio performance simulations
- **Transactions** - Handle deposits, withdrawals, transfers

### Authentication Flow
1. User registers → Creates localStorage user + RBC client
2. Login → Validates against localStorage + sets RBC token
3. All portfolio operations use RBC API with stored tokens

## File Structure

```
src/
├── components/          # React components
├── pages/
│   ├── Login.tsx       # Login/Signup page
│   ├── Dashboard.tsx   # Main dashboard
│   └── ...
├── services/
│   ├── auth-service.ts # localStorage authentication
│   └── rbc-service.ts  # RBC API integration
├── config/
│   └── env.ts          # Environment configuration
└── styles/             # CSS styling
```

## Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

## Portfolio Types

- **Aggressive Growth** - High risk, high reward (12-15% annually)
- **Growth** - Medium-high risk (8-12% annually) 
- **Balanced** - Medium risk (6-10% annually)
- **Conservative** - Low-medium risk (4-7% annually)
- **Very Conservative** - Low risk (2-5% annually)

## Transaction Management

Users can:
- **Buy Stocks** - Purchase shares, deducts from cash balance
- **Sell Stocks** - Sell shares, adds to cash balance
- **View History** - Complete transaction log with timestamps
- **Track Performance** - Monitor gains/losses over time

## Security Features

- **Password Hashing** - Simple browser-compatible hash function
- **Token Management** - Base64 encoded tokens with expiration
- **Input Validation** - Client-side validation for all inputs
- **Error Handling** - Comprehensive error messages and logging

## Development Notes

### localStorage Storage
- All user data stored in browser localStorage
- No database setup required
- Data persists across browser sessions
- Automatic cleanup and management

### State Management
- React Context for authentication state
- localStorage for token persistence
- Real-time updates for user data

### Styling
- CSS custom properties for theming
- RBC brand colors and styling
- Responsive design for all devices
- Smooth animations and transitions

## Troubleshooting

### localStorage Issues
```javascript
// Clear all app data if needed
localStorage.removeItem('rbc_users');
localStorage.removeItem('rbc_current_user');
localStorage.removeItem('auth_token');

// Or clear all localStorage
localStorage.clear();
```

### Common Errors
- **"User already exists"** - Email must be unique across all users
- **"Insufficient funds"** - Check cash balance for transactions
- **"Invalid token"** - Clear localStorage and login again
- **Login issues** - Try refreshing page or clearing localStorage

## API Endpoints

### RBC API Base URL
```
https://2dcq63co40.execute-api.us-east-1.amazonaws.com/dev
```

### Key Endpoints Used
- `POST /teams/register` - Team registration
- `POST /clients` - Create investment client
- `GET /clients` - List all clients
- `POST /clients/{id}/portfolios` - Create portfolio
- `POST /client/{id}/simulate` - Run simulations

## Data Persistence

All RBC data is automatically saved to MongoDB for persistent storage:

### Backend RBC Endpoints:
- `POST /api/rbc/clients` - Save RBC client data
- `GET /api/rbc/clients` - Load user's RBC clients
- `POST /api/rbc/portfolios` - Save portfolio data
- `GET /api/rbc/portfolios` - Load user's portfolios
- `POST /api/rbc/simulations` - Save simulation results
- `GET /api/rbc/simulations` - Load simulation history

### Automatic Sync Features:
- **Login**: Loads cached RBC data from MongoDB
- **Logout**: Clears all cached data
- **Real-time Sync**: All RBC operations automatically sync to backend
- **Token Management**: Automatic RBC API token refresh when needed
- **Offline Cache**: localStorage fallback for offline access

### Manual Controls:
- **🔑 Refresh Token** button on Dashboard for manual token refresh
- **🔄 Refresh** button for reloading portfolio data
- Automatic fallback simulations when RBC API is unavailable

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is part of Hack the North 2025 hackathon submission.
