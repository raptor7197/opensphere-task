const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  country: {
    type: String,
    required: true
  },
  visaType: {
    type: String,
    required: true
  },
  documents: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  scores: {
    education: {
      type: Number,
      max: 25,
      default: 0
    },
    experience: {
      type: Number,
      max: 20,
      default: 0
    },
    salary: {
      type: Number,
      max: 20,
      default: 0
    },
    documents: {
      type: Number,
      max: 15,
      default: 0
    },
    awards: {
      type: Number,
      max: 10,
      default: 0
    },
    language: {
      type: Number,
      max: 5,
      default: 0
    },
    employer: {
      type: Number,
      max: 5,
      default: 0
    }
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  cappedScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  summary: {
    type: String,
    required: true
  },
  recommendations: [{
    category: String,
    suggestion: String,
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    }
  }],
  likelihood: {
    type: String,
    enum: ['Very Low', 'Low', 'Fair', 'Good', 'Excellent'],
    required: true
  },
  partnerApiKey: {
    type: String,
    default: null
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for partner queries
evaluationSchema.index({ partnerApiKey: 1, createdAt: -1 });
evaluationSchema.index({ user: 1, createdAt: -1 });
evaluationSchema.index({ country: 1, visaType: 1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);