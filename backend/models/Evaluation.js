import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  // User Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  // Visa Information
  country: {
    type: String,
    required: true
  },
  visaType: {
    type: String,
    required: true
  },

  // Personal Details
  educationLevel: {
    type: String,
    required: true,
    enum: ['High School', 'Professional Certification', 'Bachelor', 'Master', 'PhD']
  },
  experienceYears: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  currentSalary: {
    type: Number,
    required: true,
    min: 0
  },
  languageProficiency: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native']
  },
  hasAwards: {
    type: Boolean,
    default: false
  },
  awards: [{
    type: String
  }],
  hasRecognizedEmployer: {
    type: Boolean,
    default: false
  },

  // Documents
  uploadedDocuments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  }],

  // Evaluation Results
  evaluationScore: {
    type: Number,
    min: 0,
    max: 100
  },
  likelihood: {
    type: String,
    enum: ['Very Low', 'Low', 'Fair', 'Good', 'Excellent']
  },
  scores: {
    education: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    salary: { type: Number, default: 0 },
    documents: { type: Number, default: 0 },
    awards: { type: Number, default: 0 },
    language: { type: Number, default: 0 },
    employer: { type: Number, default: 0 }
  },
  summary: {
    type: String
  },
  recommendations: [{
    category: String,
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    suggestion: String
  }],

  // Partner Information
  partnerApiKey: {
    type: String
  },

  // AI Processing
  geminiResponse: {
    type: String
  },
  processingTime: {
    type: Number
  },

  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
evaluationSchema.index({ email: 1 });
evaluationSchema.index({ country: 1, visaType: 1 });
evaluationSchema.index({ partnerApiKey: 1 });
evaluationSchema.index({ submittedAt: -1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation;