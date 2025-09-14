const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const User = require('./models/User');
const RBCClient = require('./models/RBCClient');
const RBCPortfolio = require('./models/RBCPortfolio');
const RBCSimulation = require('./models/RBCSimulation');

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

    if (isMongoConnected) {
      // Use MongoDB
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
          rbc_client_id: user.rbc_client_id,
          user_name: user.user_name,
          email: user.email,
          money: user.money,
          txs: user.txs,
          created_at: user.created_at
        },
        token
      });
    } else {
      // Use in-memory storage as fallback
      // Find user by email
      const user = inMemoryUsers.find(u => u.email === email);
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
        message: 'Login successful (in-memory mode)',
        user: {
          user_id: user.user_id,
          client_id: user.client_id,
          rbc_client_id: user.rbc_client_id,
          user_name: user.user_name,
          email: user.email,
          money: user.money,
          txs: user.txs,
          created_at: user.created_at
        },
        token
      });
    }

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
        {
          rbc_client_id,
          account_setup_completed: true,  // Mark setup as completed when RBC client ID is set
          updated_at: Date.now()
        },
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
          txs: user.txs,
          account_setup_completed: user.account_setup_completed
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
      inMemoryUsers[userIndex].account_setup_completed = true;
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
          txs: inMemoryUsers[userIndex].txs,
          account_setup_completed: inMemoryUsers[userIndex].account_setup_completed
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

// ===== RBC DATA ENDPOINTS =====

// Save RBC Client
app.post('/api/rbc/clients', authenticateToken, async (req, res) => {
  try {
    const { rbc_client_id, name, email, team_name, cash, rbc_created_at, rbc_updated_at } = req.body;
    
    if (!rbc_client_id || !name || !email || !team_name) {
      return res.status(400).json({
        success: false,
        message: 'RBC client ID, name, email, and team name are required'
      });
    }

    if (isMongoConnected) {
      // Check if RBC client already exists
      const existingClient = await RBCClient.findOne({ rbc_client_id });
      if (existingClient) {
        // Update existing client
        existingClient.name = name;
        existingClient.email = email;
        existingClient.team_name = team_name;
        existingClient.cash = cash || 0;
        existingClient.rbc_updated_at = rbc_updated_at;
        await existingClient.save();
        
        return res.json({
          success: true,
          message: 'RBC client updated successfully',
          client: existingClient
        });
      }

      // Create new RBC client
      const rbcClient = new RBCClient({
        user_id: req.user.user_id,
        rbc_client_id,
        name,
        email,
        team_name,
        cash: cash || 0,
        rbc_created_at,
        rbc_updated_at
      });

      await rbcClient.save();
      
      res.status(201).json({
        success: true,
        message: 'RBC client saved successfully',
        client: rbcClient
      });
    } else {
      // In-memory fallback - just return success for now
      res.status(201).json({
        success: true,
        message: 'RBC client saved (in-memory mode)',
        client: { rbc_client_id, name, email, team_name, cash }
      });
    }
  } catch (error) {
    console.error('Save RBC client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save RBC client'
    });
  }
});

// Get RBC Clients for user
app.get('/api/rbc/clients', authenticateToken, async (req, res) => {
  try {
    if (isMongoConnected) {
      const clients = await RBCClient.find({ user_id: req.user.user_id });
      res.json({
        success: true,
        clients: clients
      });
    } else {
      // In-memory fallback
      res.json({
        success: true,
        clients: []
      });
    }
  } catch (error) {
    console.error('Get RBC clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RBC clients'
    });
  }
});

// Save RBC Portfolio
app.post('/api/rbc/portfolios', authenticateToken, async (req, res) => {
  try {
    const {
      rbc_client_id,
      rbc_portfolio_id,
      team_name,
      type,
      invested_amount,
      current_value,
      total_months_simulated,
      transactions,
      growth_trend,
      rbc_created_at
    } = req.body;

    if (!rbc_client_id || !rbc_portfolio_id || !type) {
      return res.status(400).json({
        success: false,
        message: 'RBC client ID, portfolio ID, and type are required'
      });
    }

    if (isMongoConnected) {
      // Check if portfolio already exists
      const existingPortfolio = await RBCPortfolio.findOne({ rbc_portfolio_id });
      if (existingPortfolio) {
        // Update existing portfolio
        existingPortfolio.invested_amount = invested_amount || 0;
        existingPortfolio.current_value = current_value || 0;
        existingPortfolio.total_months_simulated = total_months_simulated || 0;
        existingPortfolio.transactions = transactions || [];
        existingPortfolio.growth_trend = growth_trend || [];
        await existingPortfolio.save();

        return res.json({
          success: true,
          message: 'RBC portfolio updated successfully',
          portfolio: existingPortfolio
        });
      }

      // Create new portfolio
      const rbcPortfolio = new RBCPortfolio({
        user_id: req.user.user_id,
        rbc_client_id,
        rbc_portfolio_id,
        team_name,
        type,
        invested_amount: invested_amount || 0,
        current_value: current_value || 0,
        total_months_simulated: total_months_simulated || 0,
        transactions: transactions || [],
        growth_trend: growth_trend || [],
        rbc_created_at
      });

      await rbcPortfolio.save();

      res.status(201).json({
        success: true,
        message: 'RBC portfolio saved successfully',
        portfolio: rbcPortfolio
      });
    } else {
      // In-memory fallback
      res.status(201).json({
        success: true,
        message: 'RBC portfolio saved (in-memory mode)',
        portfolio: { rbc_portfolio_id, type, invested_amount, current_value }
      });
    }
  } catch (error) {
    console.error('Save RBC portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save RBC portfolio'
    });
  }
});

// Get RBC Portfolios for user
app.get('/api/rbc/portfolios', authenticateToken, async (req, res) => {
  try {
    const { rbc_client_id } = req.query;

    if (isMongoConnected) {
      let query = { user_id: req.user.user_id };
      if (rbc_client_id) {
        query.rbc_client_id = rbc_client_id;
      }

      const portfolios = await RBCPortfolio.find(query);
      res.json({
        success: true,
        portfolios: portfolios
      });
    } else {
      // In-memory fallback
      res.json({
        success: true,
        portfolios: []
      });
    }
  } catch (error) {
    console.error('Get RBC portfolios error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RBC portfolios'
    });
  }
});

// Save RBC Simulation
app.post('/api/rbc/simulations', authenticateToken, async (req, res) => {
  try {
    const {
      rbc_client_id,
      simulation_type,
      months_requested,
      message,
      results
    } = req.body;

    if (!rbc_client_id || !months_requested || !results) {
      return res.status(400).json({
        success: false,
        message: 'RBC client ID, months requested, and results are required'
      });
    }

    if (isMongoConnected) {
      const rbcSimulation = new RBCSimulation({
        user_id: req.user.user_id,
        rbc_client_id,
        simulation_type: simulation_type || 'api',
        months_requested,
        message: message || 'Simulation completed',
        results: results || []
      });

      await rbcSimulation.save();

      res.status(201).json({
        success: true,
        message: 'RBC simulation saved successfully',
        simulation: rbcSimulation
      });
    } else {
      // In-memory fallback
      res.status(201).json({
        success: true,
        message: 'RBC simulation saved (in-memory mode)',
        simulation: { rbc_client_id, months_requested, results: results.length }
      });
    }
  } catch (error) {
    console.error('Save RBC simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save RBC simulation'
    });
  }
});

// Get RBC Simulations for user
app.get('/api/rbc/simulations', authenticateToken, async (req, res) => {
  try {
    const { rbc_client_id, limit = 10 } = req.query;

    if (isMongoConnected) {
      let query = { user_id: req.user.user_id };
      if (rbc_client_id) {
        query.rbc_client_id = rbc_client_id;
      }

      const simulations = await RBCSimulation.find(query)
        .sort({ created_at: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        simulations: simulations
      });
    } else {
      // In-memory fallback
      res.json({
        success: true,
        simulations: []
      });
    }
  } catch (error) {
    console.error('Get RBC simulations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get RBC simulations'
    });
  }
});

// Simple token counting function (approximate)
function estimateTokens(text) {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Chatbot endpoint
app.post('/api/chatbot/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get user data from MongoDB
    let userData = null;
    let portfolioData = null;

    if (isMongoConnected) {
      // Fetch user data
      const user = await User.findOne({ user_id: req.user.user_id });
      if (user) {
        userData = {
          user_name: user.user_name,
          money: user.money,
          transactions: user.txs,
          account_age_days: Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
        };
      }

      // Fetch portfolio data
      const portfolios = await RBCPortfolio.find({ user_id: req.user.user_id });
      if (portfolios.length > 0) {
        portfolioData = {
          total_portfolios: portfolios.length,
          total_invested: portfolios.reduce((sum, p) => sum + (p.invested_amount || 0), 0),
          total_current_value: portfolios.reduce((sum, p) => sum + (p.current_value || 0), 0),
          portfolio_types: portfolios.map(p => p.type),
          recent_transactions: portfolios.flatMap(p => p.transactions || []).slice(-5)
        };
      }
    }

    // Estimate tokens for routing decision
    const estimatedTokens = estimateTokens(message);
    const useHighModel = estimatedTokens > 50; // Use high model for complex queries

    // Create system prompt for student financial advice
    const systemPrompt = `You are Leo, a friendly and knowledgeable financial advisor specifically designed to help students with their investments and financial decisions. You represent InvestEase, a platform that helps students learn about investing.

Your personality:
- Friendly and approachable, like a wise mentor
- Patient and educational
- Focused on long-term financial success
- Encouraging but realistic about risks
- Use simple, clear language that students can understand

Your expertise:
- Student-focused investment strategies
- Risk management appropriate for young investors
- Diversification principles
- Long-term wealth building
- Educational content about financial markets
- Budget management for students

Guidelines:
- Always prioritize education over quick profits
- Emphasize the importance of starting early with investing
- Warn about risks appropriately
- Suggest diversified, low-cost investment options
- Keep responses concise but informative
- Use real examples when helpful
- Never give specific stock picks without proper risk warnings

Current user context:
${userData ? `
- User: ${userData.user_name}
- Available cash: $${userData.money.toLocaleString()}
- Number of transactions: ${userData.transactions.length}
- Account age: ${userData.account_age_days} days
` : ''}
${portfolioData ? `
- Total portfolios: ${portfolioData.total_portfolios}
- Total invested: $${portfolioData.total_invested.toLocaleString()}
- Current portfolio value: $${portfolioData.total_current_value.toLocaleString()}
- Portfolio types: ${portfolioData.portfolio_types.join(', ')}
` : ''}

Remember: You're here to educate and guide students toward smart, long-term financial decisions.`;

    let botResponse = '';
    let modelUsed = useHighModel ? 'high' : 'middle';

    try {
      // Make request to Martian API
      const martianResponse = await fetch('https://api.withmartian.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-38778e2ab3504c388f0a5c53b1c4485e',
        },
        body: JSON.stringify({
          model: useHighModel ? 'anthropic/claude-sonnet-4-20250514' : 'anthropic/claude-sonnet-4-20250514:cheap',
          max_tokens: 800,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
        }),
      });

      if (!martianResponse.ok) {
        const errorData = await martianResponse.text();
        console.error(`Martian API error: ${martianResponse.status} - ${errorData}`);
        
        // Try fallback to cheaper model if high model failed
        if (useHighModel) {
          console.log('Trying fallback to cheaper model...');
          const fallbackResponse = await fetch('https://api.withmartian.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer sk-38778e2ab3504c388f0a5c53b1c4485e',
            },
            body: JSON.stringify({
              model: 'anthropic/claude-sonnet-4-20250514:cheap',
              max_tokens: 800,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              temperature: 0.7,
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            botResponse = fallbackData.content[0]?.text || '';
            modelUsed = 'middle';
          }
        }
        
        if (!botResponse) {
          throw new Error(`Martian API error: ${martianResponse.status} - ${errorData}`);
        }
      } else {
        const martianData = await martianResponse.json();
        botResponse = martianData.content[0]?.text || '';
      }
    } catch (apiError) {
      console.error('Martian API completely failed, using fallback response:', apiError);
      
      // Fallback responses based on common financial questions
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
        botResponse = `Hi! I'm Leo, your financial advisor. For students starting to invest, I recommend:\n\n1. **Start with index funds** - They're diversified and low-cost\n2. **Dollar-cost averaging** - Invest a fixed amount regularly\n3. **Emergency fund first** - Save 3-6 months of expenses\n4. **Long-term thinking** - Time is your biggest advantage!\n\nWould you like me to explain any of these concepts in more detail?`;
      } else if (lowerMessage.includes('budget') || lowerMessage.includes('money')) {
        botResponse = `Great question about budgeting! As a student, here's a simple approach:\n\n**50/30/20 Rule:**\n- 50% Needs (tuition, rent, food)\n- 30% Wants (entertainment, dining out)\n- 20% Savings & investments\n\n**Student tips:**\n- Track expenses for a week\n- Use student discounts\n- Consider part-time work\n- Start investing even small amounts\n\nWhat specific budgeting challenge are you facing?`;
      } else if (lowerMessage.includes('risk') || lowerMessage.includes('diversif')) {
        botResponse = `Excellent question about risk management! Here's what students should know:\n\n**Diversification basics:**\n- Don't put all money in one stock\n- Mix different asset types (stocks, bonds)\n- Consider international exposure\n- Index funds provide instant diversification\n\n**Risk for students:**\n- You have time advantage (can recover from losses)\n- Start with moderate risk tolerance\n- Never invest money you need soon\n\nWhat's your current investment timeline?`;
      } else {
        botResponse = `Hi! I'm Leo, your financial advisor at InvestEase. I'm here to help students like you with investing, budgeting, and financial planning.\n\n**I can help you with:**\n• Investment strategies for students\n• Budgeting and money management\n• Understanding risk and diversification\n• Long-term financial planning\n• Specific questions about your portfolio\n\nWhat would you like to learn about today?`;
      }
      
      modelUsed = 'fallback';
    }

    res.json({
      success: true,
      response: botResponse,
      model_used: modelUsed,
      estimated_tokens: estimatedTokens
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chatbot response. Please try again.',
      error: error.message
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
