const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  educationLevel: {
    type: String,
    enum: ['High School', 'Bachelor', 'Master', 'PhD', 'Professional Certification'],
    required: true
  },
  experienceYears: {
    type: Number,
    required: true,
    min: 0
  },
  currentSalary: {
    type: Number,
    min: 0
  },
  languageProficiency: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'],
    default: 'Intermediate'
  },
  hasAwards: {
    type: Boolean,
    default: false
  },
  awards: [{
    title: String,
    organization: String,
    year: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);