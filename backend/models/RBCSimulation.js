const mongoose = require('mongoose');

// Simulation Result schema
const SimulationResultSchema = new mongoose.Schema({
  rbc_portfolio_id: {
    type: String,
    required: true
  },
  strategy: {
    type: String,
    enum: ['aggressive_growth', 'growth', 'balanced', 'conservative', 'very_conservative'],
    required: true
  },
  months_simulated: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  days_simulated: {
    type: Number,
    required: true,
    min: 30
  },
  initial_value: {
    type: Number,
    required: true,
    min: 0
  },
  projected_value: {
    type: Number,
    required: true,
    min: 0
  },
  total_growth_points: {
    type: Number,
    required: true,
    min: 1
  },
  simulation_id: {
    type: String,
    required: true
  },
  growth_trend: [{
    date: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    }
  }]
});

// RBC Simulation schema - stores simulation results
const RBCSimulationSchema = new mongoose.Schema({
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
  
  // Simulation metadata
  simulation_type: {
    type: String,
    enum: ['api', 'fallback'],
    default: 'api'
  },
  months_requested: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  message: {
    type: String,
    required: true
  },
  
  // Simulation results
  results: [SimulationResultSchema],
  
  // Metadata
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RBCSimulation', RBCSimulationSchema);
