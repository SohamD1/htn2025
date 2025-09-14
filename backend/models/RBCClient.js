const mongoose = require('mongoose');

// RBC Client schema - stores RBC API client data
const RBCClientSchema = new mongoose.Schema({
  // Our internal user reference
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  
  // RBC API client data
  rbc_client_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  team_name: {
    type: String,
    required: true
  },
  cash: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  // Metadata
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  // RBC API timestamps
  rbc_created_at: {
    type: String,
    required: false
  },
  rbc_updated_at: {
    type: String,
    required: false
  }
});

// Update the updated_at field before saving
RBCClientSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('RBCClient', RBCClientSchema);
