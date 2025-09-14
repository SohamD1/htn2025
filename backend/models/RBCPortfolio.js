const mongoose = require('mongoose');

// RBC Transaction schema
const RBCTransactionSchema = new mongoose.Schema({
  rbc_transaction_id: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'growth'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance_after: {
    type: Number,
    required: true,
    min: 0
  }
});

// RBC Growth Data Point schema
const GrowthDataPointSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  }
});

// RBC Portfolio schema - stores RBC API portfolio data
const RBCPortfolioSchema = new mongoose.Schema({
  // Our internal user reference
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  
  // RBC Client reference
  rbc_client_id: {
    type: String,
    required: true,
    ref: 'RBCClient'
  },
  
  // RBC API portfolio data
  rbc_portfolio_id: {
    type: String,
    required: true,
    unique: true
  },
  team_name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['aggressive_growth', 'growth', 'balanced', 'conservative', 'very_conservative'],
    required: true
  },
  invested_amount: {
    type: Number,
    required: true,
    min: 0
  },
  current_value: {
    type: Number,
    required: true,
    min: 0
  },
  total_months_simulated: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Transaction history
  transactions: [RBCTransactionSchema],
  
  // Growth trend data
  growth_trend: [GrowthDataPointSchema],
  
  // Metadata
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  // RBC API timestamp
  rbc_created_at: {
    type: String,
    required: false
  }
});

// Update the updated_at field before saving
RBCPortfolioSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('RBCPortfolio', RBCPortfolioSchema);
