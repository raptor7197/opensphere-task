const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  hashedApiKey: {
    type: String,
    required: true
  },
  allowedCountries: [{
    type: String
  }],
  customScoreCap: {
    type: Number,
    min: 0,
    max: 100,
    default: 85
  },
  isActive: {
    type: Boolean,
    default: true
  },
  evaluationsCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash API key before saving
partnerSchema.pre('save', async function(next) {
  if (!this.isModified('apiKey')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.hashedApiKey = await bcrypt.hash(this.apiKey, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to validate API key
partnerSchema.methods.validateApiKey = async function(apiKey) {
  return await bcrypt.compare(apiKey, this.hashedApiKey);
};

module.exports = mongoose.model('Partner', partnerSchema);