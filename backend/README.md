# RBC InvestEase Backend API

Node.js/Express backend with MongoDB for user authentication and transaction management.

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start MongoDB
Make sure MongoDB is running locally:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Environment Variables
Create a `.env` file in the backend directory:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rbc-investease

# JWT Secret (change in production!)
JWT_SECRET=rbc-investease-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=5000
```

### 4. Start the Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires token)
- `PUT /api/auth/money` - Update user money (requires token)

### Transactions
- `POST /api/transactions` - Add transaction (requires token)

### Health Check
- `GET /api/health` - Health check endpoint

## Database Schema

### User Collection
```javascript
{
  client_id: String (unique),
  user_id: String (unique),
  user_name: String,
  email: String (unique),
  password: String (hashed),
  money: Number,
  txs: [
    {
      type: 'buy' | 'sell',
      symbol: String,
      amount: Number,
      price: Number,
      timestamp: Date
    }
  ],
  created_at: Date,
  updated_at: Date
}
```

## Usage with Frontend

The frontend React app connects to this backend API. Make sure both servers are running:

1. Backend: `http://localhost:5000`
2. Frontend: `http://localhost:3000`

The frontend will automatically connect to the backend for all authentication and transaction operations.
