const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yasenbehiri_db_user:SU6rGHPn0nFeLvEo@cluster0.03w3lwa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'rbc-investease-secret-key';

let isMongoConnected = false;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  isMongoConnected = true;
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Running in localStorage fallback mode');
  isMongoConnected = false;
});

// In-memory storage for fallback when MongoDB is not available
let inMemoryUsers = [];
let userIdCounter = 1;

// Routes

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { user_name, email, password, money } = req.body;

    // Validate input
    if (!user_name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    if (isMongoConnected) {
      // Use MongoDB
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already exists with this email' 
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate unique IDs
      const user_id = uuidv4();
      const client_id = uuidv4();

      // Create new user
      const newUser = new User({
        client_id,
        user_id,
        user_name,
        email,
        password: hashedPassword,
        money: money || 10000,
        txs: []
      });

      await newUser.save();

      // Generate JWT token
      const token = jwt.sign(
        { 
          user_id: newUser.user_id,
          client_id: newUser.client_id,
          email: newUser.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          user_id: newUser.user_id,
          client_id: newUser.client_id,
          user_name: newUser.user_name,
          email: newUser.email,
          money: newUser.money,
          txs: newUser.txs
        },
        token
      });
    } else {
      // Use in-memory storage as fallback
      // Check if user already exists
      const existingUser = inMemoryUsers.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already exists with this email' 
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate unique IDs
      const user_id = uuidv4();
      const client_id = uuidv4();

      // Create new user
      const newUser = {
        client_id,
        user_id,
        user_name,
        email,
        password: hashedPassword,
        money: money || 10000,
        txs: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      inMemoryUsers.push(newUser);

      // Generate JWT token
      const token = jwt.sign(
        { 
          user_id: newUser.user_id,
          client_id: newUser.client_id,
          email: newUser.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully (in-memory mode)',
        user: {
          user_id: newUser.user_id,
          client_id: newUser.client_id,
          user_name: newUser.user_name,
          email: newUser.email,
          money: newUser.money,
          txs: newUser.txs
        },
        token
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.user_id,
        client_id: user.client_id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        client_id: user.client_id,
        user_name: user.user_name,
        email: user.email,
        money: user.money,
        txs: user.txs
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    req.user = user;
    next();
  });
};

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        client_id: user.client_id,
        user_name: user.user_name,
        email: user.email,
        money: user.money,
        txs: user.txs
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

// Add transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { type, symbol, amount, price } = req.body;

    // Validate input
    if (!type || !symbol || !amount || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'All transaction fields are required' 
      });
    }

    const user = await User.findOne({ user_id: req.user.user_id });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const totalAmount = amount * price;

    // Update user money based on transaction type
    if (type === 'buy') {
      if (user.money < totalAmount) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient funds' 
        });
      }
      user.money -= totalAmount;
    } else if (type === 'sell') {
      user.money += totalAmount;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid transaction type. Must be buy or sell' 
      });
    }

    // Add transaction to user's transaction history
    user.txs.push({
      type,
      symbol: symbol.toUpperCase(),
      amount,
      price,
      timestamp: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Transaction added successfully',
      user: {
        user_id: user.user_id,
        client_id: user.client_id,
        user_name: user.user_name,
        email: user.email,
        money: user.money,
        txs: user.txs
      }
    });

  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Transaction failed. Please try again.' 
    });
  }
});

// Update RBC client ID
app.put('/api/auth/rbc-client', authenticateToken, async (req, res) => {
  try {
    const { rbc_client_id } = req.body;

    if (!rbc_client_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'RBC client ID is required' 
      });
    }

    if (isMongoConnected) {
      const user = await User.findOneAndUpdate(
        { user_id: req.user.user_id },
        { rbc_client_id, updated_at: Date.now() },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'RBC client ID updated successfully',
        user: {
          user_id: user.user_id,
          client_id: user.client_id,
          rbc_client_id: user.rbc_client_id,
          user_name: user.user_name,
          email: user.email,
          money: user.money,
          txs: user.txs
        }
      });
    } else {
      // In-memory storage
      const userIndex = inMemoryUsers.findIndex(u => u.user_id === req.user.user_id);
      
      if (userIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      inMemoryUsers[userIndex].rbc_client_id = rbc_client_id;
      inMemoryUsers[userIndex].updated_at = new Date();

      res.json({
        success: true,
        message: 'RBC client ID updated successfully',
        user: {
          user_id: inMemoryUsers[userIndex].user_id,
          client_id: inMemoryUsers[userIndex].client_id,
          rbc_client_id: inMemoryUsers[userIndex].rbc_client_id,
          user_name: inMemoryUsers[userIndex].user_name,
          email: inMemoryUsers[userIndex].email,
          money: inMemoryUsers[userIndex].money,
          txs: inMemoryUsers[userIndex].txs
        }
      });
    }

  } catch (error) {
    console.error('Update RBC client ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update RBC client ID' 
    });
  }
});

// Update user money
app.put('/api/auth/money', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    const user = await User.findOneAndUpdate(
      { user_id: req.user.user_id },
      { money: amount, updated_at: Date.now() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Money updated successfully',
      user: {
        user_id: user.user_id,
        client_id: user.client_id,
        user_name: user.user_name,
        email: user.email,
        money: user.money,
        txs: user.txs
      }
    });

  } catch (error) {
    console.error('Update money error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update money' 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'RBC InvestEase Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
