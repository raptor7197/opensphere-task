import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },

  // Plan and Limits
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  monthlyLimit: {
    type: Number,
    default: 100
  },
  currentMonthUsage: {
    type: Number,
    default: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Settings
  allowedDomains: [{
    type: String
  }],
  webhookUrl: {
    type: String
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },

  // Statistics
  totalEvaluations: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },

  // Billing
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Metadata
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
partnerSchema.index({ apiKey: 1 });
partnerSchema.index({ email: 1 });
partnerSchema.index({ isActive: 1 });

// Virtual for usage percentage
partnerSchema.virtual('usagePercentage').get(function() {
  return this.monthlyLimit > 0 ? (this.currentMonthUsage / this.monthlyLimit) * 100 : 0;
});

// Method to check if partner can make requests
partnerSchema.methods.canMakeRequest = function() {
  return this.isActive && this.currentMonthUsage < this.monthlyLimit;
};

// Method to increment usage
partnerSchema.methods.incrementUsage = async function() {
  this.currentMonthUsage += 1;
  this.totalEvaluations += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Static method to reset monthly usage (to be called by cron job)
partnerSchema.statics.resetMonthlyUsage = async function() {
  return this.updateMany({}, { currentMonthUsage: 0 });
};

const Partner = mongoose.model('Partner', partnerSchema);

export default Partner;